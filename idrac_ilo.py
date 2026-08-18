"""
idrac_ilo.py — Dell iDRAC / HPE iLO out-of-band BMC adapter (Redfish REST, HTTPS).

Ported from a sibling project (Topogy)'s redfish_hw.py/idrac.py/ilo.py — same DMTF Redfish
schema (Systems/Chassis/Managers/UpdateService), vendor difference is just the base paths.
Kept deliberately scoped down from Topogy's full hardware inventory (which also pulls disks,
RAID volumes, memory modules, temperatures) to what actually answers "what firmware is this
server on, and is anything unhealthy" — matching the lighter tier used for SAN/Storage/ESXi
here, not a full hardware monitoring tool.

iDRAC/iLO almost always negotiate TLS with an old cipher set that OpenSSL 3.x's default
security level (SECLEVEL=2) rejects outright (SSLEOFError / UNEXPECTED_EOF_WHILE_READING) —
_legacy_tls_session() lowers that to SECLEVEL=1 so the handshake actually completes.
"""
from __future__ import annotations
import ssl
import requests
import urllib3
from requests.adapters import HTTPAdapter

urllib3.disable_warnings()
HTTP_TIMEOUT = 20
_HEALTH = {"ok": "OK", "warning": "WARN", "critical": "FAIL"}


class BMCError(Exception):
    pass


class _LegacyTLSAdapter(HTTPAdapter):
    def _ctx(self):
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        try:
            ctx.set_ciphers("DEFAULT:@SECLEVEL=1")
        except ssl.SSLError:
            pass
        ctx.options |= getattr(ssl, "OP_LEGACY_SERVER_CONNECT", 0)
        return ctx

    def init_poolmanager(self, *a, **kw):
        kw["ssl_context"] = self._ctx()
        super().init_poolmanager(*a, **kw)

    def proxy_manager_for(self, *a, **kw):
        kw["ssl_context"] = self._ctx()
        return super().proxy_manager_for(*a, **kw)


def _legacy_tls_session():
    s = requests.Session()
    s.verify = False
    s.mount("https://", _LegacyTLSAdapter())
    return s


def _health(status):
    if not status:
        return "UNKNOWN"
    hv = status.get("HealthRollup") or status.get("Health")
    return _HEALTH.get(str(hv).lower(), "UNKNOWN") if hv else "UNKNOWN"


class _RedfishBMC:
    vendor = "generic"
    SYS = "/redfish/v1/Systems/1"
    CHASSIS = "/redfish/v1/Chassis/1"
    MGR = "/redfish/v1/Managers/1"

    def __init__(self, host, user, pwd, port=443):
        self.host, self.port = host, int(port or 443)
        self.base_url = f"https://{self.host}:{self.port}"
        self.session = _legacy_tls_session()
        self.session.auth = (user, pwd)
        self.session.headers.update({"Accept": "application/json"})

    def _get(self, path):
        try:
            r = self.session.get(self.base_url + path, timeout=HTTP_TIMEOUT)
        except requests.exceptions.RequestException as exc:
            raise BMCError(f"Connection failed: {exc}") from exc
        if r.status_code == 401:
            raise BMCError(f"{self.vendor}: 401 — wrong username/password")
        if r.status_code >= 400:
            raise BMCError(f"Redfish {path} -> HTTP {r.status_code}")
        return r.json()

    def _try(self, path):
        try:
            return self._get(path)
        except Exception:  # noqa: BLE001
            return None

    def _service_tag(self, sysj):
        return sysj.get("SKU") or sysj.get("SerialNumber") or sysj.get("AssetTag")

    def collect(self):
        sysj = self._get(self.SYS)  # auth/connectivity check — never swallowed
        mgr = self._try(self.MGR) or {}
        chassis = self._try(self.CHASSIS) or {}
        power = self._try(self.CHASSIS + "/Power") or {}
        thermal = self._try(self.CHASSIS + "/Thermal") or {}

        psus = [{
            "name": p.get("Name"), "model": p.get("Model"),
            "capacity_watts": p.get("PowerCapacityWatts"),
            "output_watts": p.get("LastPowerOutputWatts"),
            "health": _health(p.get("Status")),
        } for p in power.get("PowerSupplies", [])]
        fans = [{
            "name": f.get("Name") or f.get("FanName"),
            "reading": f.get("Reading"), "units": f.get("ReadingUnits") or "RPM",
            "health": _health(f.get("Status")),
        } for f in thermal.get("Fans", [])]

        cpu = sysj.get("ProcessorSummary") or {}
        mem = sysj.get("MemorySummary") or {}
        return {
            "host": self.host, "vendor": self.vendor,
            "model": sysj.get("Model"), "manufacturer": sysj.get("Manufacturer"),
            "service_tag": self._service_tag(sysj),
            "serial": sysj.get("SerialNumber"),
            "host_name": sysj.get("HostName"),
            "bios_version": sysj.get("BiosVersion"),
            "bmc_firmware": mgr.get("FirmwareVersion"),
            "power_state": sysj.get("PowerState"),
            "health": _health(sysj.get("Status") or chassis.get("Status")),
            "cpu_model": (cpu.get("Model") or "").strip() or None,
            "cpu_count": cpu.get("Count"),
            "memory_gb": mem.get("TotalSystemMemoryGiB"),
            "power_supplies": psus,
            "fans": fans,
        }


class IdracAdapter(_RedfishBMC):
    vendor = "dell"
    SYS = "/redfish/v1/Systems/System.Embedded.1"
    CHASSIS = "/redfish/v1/Chassis/System.Embedded.1"
    MGR = "/redfish/v1/Managers/iDRAC.Embedded.1"

    def _service_tag(self, sysj):
        return sysj.get("SKU") or sysj.get("AssetTag")


class IloAdapter(_RedfishBMC):
    vendor = "hpe"
    SYS = "/redfish/v1/Systems/1"
    CHASSIS = "/redfish/v1/Chassis/1"
    MGR = "/redfish/v1/Managers/1"

    def _service_tag(self, sysj):
        return sysj.get("SerialNumber") or sysj.get("SKU")


def collect_one(vendor, host, user, pwd, port=None):
    """Returns (result_dict, error); never raises."""
    try:
        if vendor == "dell":
            adapter = IdracAdapter(host, user, pwd, port or 443)
        elif vendor == "hpe":
            adapter = IloAdapter(host, user, pwd, port or 443)
        else:
            return None, f"Unknown BMC vendor: {vendor}"
        return adapter.collect(), None
    except BMCError as exc:
        return None, str(exc)
    except Exception as exc:  # noqa: BLE001
        return None, f"Unexpected error: {exc}"
