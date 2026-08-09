"""
storage.py — Dell PowerVault/ME-series storage array adapter (SSH/CLI, XML output).

Read-only ('show system', 'show ports'). Confirmed on a real Dell ME4024 (ME4024) —
the array's CLI over SSH replies with a well-formed XML document per command (Dell's
"SC-API"/SMC CLI format, shared across the ME/MD/PowerVault line), which is far more
reliable to parse than a fixed-width text table.
"""
from __future__ import annotations
import re
import xml.etree.ElementTree as ET


class StorageError(Exception):
    pass


class DellMEAdapter:
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
            raise StorageError(f"SSH connection failed: {exc}") from exc

    def _run_xml(self, cmd):
        stdin, stdout, stderr = self._client.exec_command(cmd, timeout=15)
        stdout.channel.settimeout(15)
        text = stdout.read().decode("utf-8", errors="replace")
        # The SSH shell echoes the command and the next prompt around the actual XML body —
        # trim to the <?xml ...> ... </RESPONSE> span rather than assuming exact line counts.
        start = text.find("<?xml")
        end = text.rfind("</RESPONSE>")
        if start == -1 or end == -1:
            raise StorageError(f"'{cmd}' did not return the expected XML response")
        try:
            return ET.fromstring(text[start:end + len("</RESPONSE>")])
        except ET.ParseError as exc:
            raise StorageError(f"'{cmd}' returned malformed XML: {exc}") from exc

    def collect(self):
        self._connect()
        try:
            sys_root = self._run_xml("show system")
            sys_obj = sys_root.find(".//OBJECT[@basetype='system']")
            sys_props = {p.get("name"): p.text for p in sys_obj.findall("PROPERTY")} if sys_obj is not None else {}

            ports_root = self._run_xml("show ports")
            ports = []
            for obj in ports_root.findall(".//OBJECT[@basetype='port']"):
                p = {x.get("name"): x.text for x in obj.findall("PROPERTY")}
                ports.append({
                    "port": p.get("port"),
                    "controller": p.get("controller"),
                    "type": p.get("port-type"),
                    "wwn": self._format_wwn(p.get("target-id")),
                    "status": p.get("status"),
                    "speed": p.get("actual-speed"),
                })

            return {
                "system": sys_props.get("system-name") or self.host,
                "vendor": sys_props.get("vendor-name"),
                "model": sys_props.get("product-id"),
                "serial": sys_props.get("midplane-serial-number"),
                "health": sys_props.get("health"),
                "ports": ports,
            }
        finally:
            try:
                self._client.close()
            except Exception:  # noqa: BLE001
                pass

    @staticmethod
    def _format_wwn(raw):
        # target-id comes back as an unbroken hex string (e.g. "207000c0ff5e90ab") —
        # reformat to the colon-separated form used everywhere else in RackView (SAN zoning,
        # LLDP) so a WWN looks the same regardless of which tool reported it.
        if not raw or not re.fullmatch(r"[0-9a-fA-F]{16}", raw):
            return raw
        return ":".join(raw[i:i + 2] for i in range(0, 16, 2))


def collect_one(host, user, pwd, port=None):
    """Returns (result_dict, error); never raises."""
    try:
        adapter = DellMEAdapter(host, user, pwd, port or 22)
        return adapter.collect(), None
    except StorageError as exc:
        return None, str(exc)
    except Exception as exc:  # noqa: BLE001
        return None, f"Unexpected error: {exc}"
