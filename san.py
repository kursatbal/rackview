"""
san.py — SAN fabric switch adapters (Brocade FOS SSH/CLI, Cisco MDS SSH/CLI).

Read-only commands only — nothing here ever changes switch configuration.
Both vendors are collected over SSH/CLI (not REST) since NX-API is disabled
on most MDS switches by default and Brocade's REST API only exists on
FOS 8.2.1+, so plain CLI is the one path that works across the widest range
of firmware in the field.

Ported from a sibling project (Topogy)'s Brocade adapter; the Cisco MDS
adapter is new here (Topogy's used NX-API/REST) and its text parsing is
based on standard NX-OS `show` output formats — flag any real-world
mismatches so the regexes can be adjusted against actual device output.
"""
from __future__ import annotations
import re

HTTP_TIMEOUT = 20


def normalize_wwn(w):
    """Normalize a WWN for comparison: strip colons/dashes, lowercase."""
    if not w:
        return ""
    return str(w).replace(":", "").replace("-", "").strip().lower()


class SANError(Exception):
    pass


_WWN_RE = re.compile(r"[0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){7}")


class _SSHAdapterBase:
    def __init__(self, host, user, pwd, port=22):
        self.host, self.port = host, int(port or 22)
        self.user, self.pwd = user, pwd
        self._client = None

    def _connect(self):
        import paramiko
        self._client = paramiko.SSHClient()
        self._client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            self._client.connect(self.host, port=self.port, username=self.user,
                                  password=self.pwd, timeout=15,
                                  look_for_keys=False, allow_agent=False)
        except Exception as exc:  # noqa: BLE001
            raise SANError(f"SSH connection failed: {exc}") from exc

    def _run(self, cmd):
        stdin, stdout, stderr = self._client.exec_command(cmd, timeout=15)
        # exec_command's timeout only bounds starting the command; reading the output
        # (.read()) is a separate socket op that can hang if the device never sends EOF —
        # a channel-level timeout guards against that too.
        stdout.channel.settimeout(15)
        return stdout.read().decode("utf-8", errors="replace")

    def _close(self):
        try:
            self._client.close()
        except Exception:  # noqa: BLE001
            pass


# ============================================================== Brocade FOS (SSH/CLI)
class BrocadeAdapter(_SSHAdapterBase):
    def collect(self):
        self._connect()
        try:
            sw_out = self._run("switchshow")
            info, ports = self._parse_switchshow(sw_out)
            zone_out = self._run("zoneshow")
            zones = self._parse_zoneshow(zone_out)
            # Older FOS releases (confirmed on a real Brocade 300, FOS 7.4.2h) don't print a
            # "Fabric OS:" line in switchshow at all — the version has to come from `version`.
            firmware = info.get("firmware") or self._extract_firmware(self._run("version"))
            return {
                "switch": info.get("name") or self.host,
                "vendor": "brocade",
                "wwn": info.get("wwn"),
                "model": info.get("model"),
                "firmware": firmware,
                "domain_id": info.get("domain_id"),
                "fabric_name": info.get("active_cfg"),
                "ports": ports,
                "zones": zones,
            }
        finally:
            self._close()

    @staticmethod
    def _extract_firmware(text):
        for line in text.splitlines():
            if line.strip().lower().startswith("fabric os:"):
                return line.split(":", 1)[1].strip()
        return None

    @staticmethod
    def _parse_switchshow(text):
        """
        Example output:
          switchName:	SWITCH1
          switchType:	71.2
          switchWwn:	10:00:00:00:00:00:00:01
          zoning:		ON (SAMPLECONFIG)
          ...
          Index Port Address Media Speed       State   Proto
          ==================================================
             1   1   010100   id    N8	   Online      FC  F-Port  50:00:00:00:00:00:00:01
        """
        info = {}
        ports = []
        for raw in text.splitlines():
            line = raw.rstrip()
            if line.startswith("switchName:"):
                info["name"] = line.split(":", 1)[1].strip()
            elif line.startswith("switchWwn:"):
                info["wwn"] = line.split(":", 1)[1].strip()
            elif line.startswith("switchType:"):
                info["model"] = f"Brocade (type {line.split(':', 1)[1].strip()})"
            elif line.startswith("Fabric OS:"):
                info["firmware"] = line.split(":", 1)[1].strip()
            elif line.startswith("switchDomain:"):
                info["domain_id"] = line.split(":", 1)[1].strip()
            elif line.startswith("zoning:"):
                m = re.search(r"\(([^)]+)\)", line)
                if m:
                    info["active_cfg"] = m.group(1)
            parts = line.split()
            # port row: first two fields (Index, Port) are digits, at least 6 columns
            if len(parts) >= 6 and parts[0].isdigit() and parts[1].isdigit():
                port, state = parts[1], parts[5]
                wwn = next((p for p in parts if _WWN_RE.fullmatch(p)), None)
                ptype = next((p for p in parts if p in ("F-Port", "E-Port", "N-Port", "U-Port")), None)
                ports.append({
                    "port": port, "status": state, "speed": parts[4],
                    "type": ptype, "connected_wwn": wwn,
                })
        return info, ports

    @staticmethod
    def _parse_zoneshow(text):
        """
        Parses the 'Effective configuration' section — the currently active zoning:
          Effective configuration:
           cfg:	SAMPLECONFIG
           zone:	zone1
          		50:00:00:00:00:00:00:01
          		50:00:00:00:00:00:00:02
        """
        zones, in_eff, cur = [], False, None
        for raw in text.splitlines():
            line = raw.strip()
            if line.startswith("Effective configuration"):
                in_eff = True
                continue
            if not in_eff:
                continue
            if line.startswith("cfg:"):
                continue
            if line.startswith("zone:"):
                cur = {"name": line.split(":", 1)[1].strip(), "members": []}
                zones.append(cur)
                continue
            if cur is not None:
                members = [w.strip() for w in line.split(";") if _WWN_RE.fullmatch(w.strip())]
                cur["members"].extend(members)
        return zones


# ============================================================== Cisco MDS (SSH/CLI)
class CiscoMDSAdapter(_SSHAdapterBase):
    def collect(self):
        self._connect()
        try:
            name_out = self._run("show switchname")
            ver_out = self._run("show version")
            ports = self._parse_interface_brief(self._run("show interface brief"))
            flogi = self._parse_flogi(self._run("show flogi database"))
            by_port = {f["port"]: f for f in flogi if f.get("port")}
            for p in ports:
                fl = by_port.get(p["port"])
                if fl:
                    p["connected_wwn"] = fl.get("wwn")
            zones = self._parse_zoneset(self._run("show zoneset active"))
            return {
                "switch": name_out.strip() or self.host,
                "vendor": "cisco",
                "wwn": None,
                "model": self._extract(ver_out, r"cisco\s+(MDS\s+\S+)"),
                "firmware": self._extract(ver_out, r"system:\s*version\s+(\S+)") or self._extract(ver_out, r"NXOS:\s*version\s+(\S+)"),
                "domain_id": None,
                "fabric_name": None,
                "ports": ports,
                "zones": zones,
            }
        finally:
            self._close()

    @staticmethod
    def _extract(text, pattern):
        m = re.search(pattern, text, re.IGNORECASE)
        return m.group(1) if m else None

    @staticmethod
    def _parse_interface_brief(text):
        """
        Example 'show interface brief' output (columns vary by NX-OS version, so this
        matches loosely: interface name, then scans the rest of the line for a known
        status keyword and a trailing speed number):
          Interface  Vsan   Admin  Admin   Status          SFP    Oper  Oper   Port
                     Mode   Trunk                                 Mode  Speed  Channel
                            Mode                                        (Gbps)
          fc1/1      1      F      on      up               swl    F       8    --
        """
        ports = []
        status_words = ("up", "down", "sfpAbsent", "notConnected", "trunking", "initializing")
        for raw in text.splitlines():
            line = raw.strip()
            if not line.startswith("fc"):
                continue
            parts = line.split()
            iface = parts[0]
            status = next((s for s in parts[1:] if s.lower() in [w.lower() for w in status_words]), None)
            speed = next((p for p in reversed(parts) if p.isdigit()), None)
            ptype = next((p for p in parts if p in ("F", "E", "FL", "TE", "NP")), None)
            ports.append({"port": iface, "status": status, "speed": speed, "type": ptype, "connected_wwn": None})
        return ports

    @staticmethod
    def _parse_flogi(text):
        """
        Example 'show flogi database' output:
          --------------------------------------------------------------------------------
          INTERFACE        VSAN    FCID           PORT NAME               NODE NAME
          --------------------------------------------------------------------------------
          fc1/1             1    0x650000  21:00:00:24:ff:5e:90:ab 20:00:00:24:ff:5e:90:ab
        """
        out = []
        for raw in text.splitlines():
            line = raw.strip()
            if not line.startswith("fc"):
                continue
            parts = line.split()
            wwns = [p for p in parts if _WWN_RE.fullmatch(p)]
            if wwns:
                out.append({"port": parts[0], "wwn": wwns[0]})
        return out

    @staticmethod
    def _parse_zoneset(text):
        """
        Example 'show zoneset active' output:
          zoneset name SAMPLECONFIG vsan 1
            zone name zone1 vsan 1
              pwwn 50:00:00:00:00:00:00:01
              pwwn 50:00:00:00:00:00:00:02
        """
        zones, cur = [], None
        for raw in text.splitlines():
            line = raw.strip()
            m = re.match(r"zone name (\S+)", line)
            if m:
                cur = {"name": m.group(1), "members": []}
                zones.append(cur)
                continue
            m = re.match(r"pwwn\s+([0-9a-fA-F:]+)", line)
            if m and cur is not None:
                cur["members"].append(m.group(1))
        return zones


def collect_one(vendor, host, user, pwd, port=None):
    """Returns (fabric_dict, error); never raises. port=None uses each adapter's SSH default (22)."""
    try:
        if vendor == "brocade":
            adapter = BrocadeAdapter(host, user, pwd, port or 22)
        elif vendor == "cisco":
            adapter = CiscoMDSAdapter(host, user, pwd, port or 22)
        else:
            return None, f"Unknown switch vendor: {vendor}"
        return adapter.collect(), None
    except SANError as exc:
        return None, str(exc)
    except Exception as exc:  # noqa: BLE001
        return None, f"Unexpected error: {exc}"
