"""
esxi.py — ESXi physical NIC adapter (vSphere API, not SSH).

SSH is disabled by default on ESXi and the two real hosts tested against
here had it off — but the management HTTPS port (443) is always available,
and the vSphere API (pyVmomi) is the actually-correct way to talk to ESXi
programmatically: read-only, no service to enable, and structured data
instead of parsing esxcli text tables. Confirmed against two real ESXi 6.7
hosts (standalone, no vCenter) — physical NIC link status/speed/MAC and
vSwitch-to-pnic mapping both came back clean. CDP/LLDP neighbor info
(HostNetworkSystem.QueryNetworkHint) is also pulled per NIC, but came back
empty on both test hosts — likely because the connected switch ports don't
have CDP/LLDP enabled, not a code issue — so it degrades to "no neighbor
data" rather than erroring.

collect_from_vcenter() is the same vSphere API against a vCenter instead of
a host directly — one login enumerates every host vCenter manages, instead
of connecting to each host's own IP one at a time. RackView only ever cares
about hosts that are actually placed in a rack, so the caller (app.py)
matches each returned host against Device.mgmt_ip / name and only saves a
snapshot for hosts that match — a vCenter can easily manage hosts that
aren't racked here at all, or that aren't RackView's to track.
"""
from __future__ import annotations
import re
import ssl


class ESXiError(Exception):
    pass


def _mgmt_ips(h):
    # A host's vCenter-visible "name" is sometimes an IP, sometimes a hostname/FQDN — collect
    # every IP-shaped identifier (that name, plus each VMkernel adapter's IP) so the caller can
    # match against a device's mgmt_ip however that device happens to be identified.
    ips = set()
    if h.name and re.fullmatch(r"\d+\.\d+\.\d+\.\d+", h.name):
        ips.add(h.name)
    for vnic in (h.config.network.vnic or []):
        ip = getattr(getattr(vnic.spec, "ip", None), "ipAddress", None)
        if ip:
            ips.add(ip)
    return sorted(ips)


def _collect_host(h, content):
    pnic_to_vswitch = {}
    for vs in h.config.network.vswitch or []:
        for key in (vs.pnic or []):
            # key looks like "key-vim.host.PhysicalNic-vmnic0"
            name = key.rsplit("-", 1)[-1] if "-" in key else key
            pnic_to_vswitch[name] = vs.name

    pnic_names = [p.device for p in h.config.network.pnic]
    try:
        hints = {hint.device: hint for hint in h.configManager.networkSystem.QueryNetworkHint(pnic_names)}
    except Exception:  # noqa: BLE001
        hints = {}

    nics = []
    for pnic in h.config.network.pnic:
        hint = hints.get(pnic.device)
        neighbor = None
        if hint is not None and getattr(hint, "connectedSwitchPort", None):
            csp = hint.connectedSwitchPort
            neighbor = {"device": getattr(csp, "devId", None), "port": getattr(csp, "portId", None)}
        nics.append({
            "name": pnic.device,
            "link_status": "Up" if pnic.linkSpeed else "Down",
            "speed": pnic.linkSpeed.speedMb if pnic.linkSpeed else None,
            "mac": pnic.mac,
            "driver": getattr(pnic, "driver", None),
            "vswitch": pnic_to_vswitch.get(pnic.device),
            "neighbor": neighbor,
        })

    return {
        "host": h.name,
        "product": content.about.fullName,
        "mgmt_ips": _mgmt_ips(h),
        "nics": nics,
    }


def collect_one(host, user, pwd, port=None):
    """Returns (result_dict, error); never raises."""
    from pyVim.connect import SmartConnect, Disconnect
    from pyVmomi import vim

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    si = None
    try:
        try:
            si = SmartConnect(host=host, user=user, pwd=pwd, port=int(port or 443), sslContext=ctx)
        except Exception as exc:  # noqa: BLE001
            return None, f"vSphere API connection failed: {exc}"

        content = si.RetrieveContent()
        view = content.viewManager.CreateContainerView(content.rootFolder, [vim.HostSystem], True)
        hosts = view.view
        if not hosts:
            return None, "No ESXi host object found at this address"
        return _collect_host(hosts[0], content), None
    except Exception as exc:  # noqa: BLE001
        return None, f"Unexpected error: {exc}"
    finally:
        if si is not None:
            try:
                Disconnect(si)
            except Exception:  # noqa: BLE001
                pass


def collect_from_vcenter(host, user, pwd, port=None):
    """Returns (list_of_host_dicts, error); never raises. One host's collection failing doesn't
    abort the batch -- that host comes back with an "error" key instead."""
    from pyVim.connect import SmartConnect, Disconnect
    from pyVmomi import vim

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    si = None
    try:
        try:
            si = SmartConnect(host=host, user=user, pwd=pwd, port=int(port or 443), sslContext=ctx)
        except Exception as exc:  # noqa: BLE001
            return None, f"vSphere API connection failed: {exc}"

        content = si.RetrieveContent()
        view = content.viewManager.CreateContainerView(content.rootFolder, [vim.HostSystem], True)
        results = []
        for h in view.view:
            try:
                results.append(_collect_host(h, content))
            except Exception as exc:  # noqa: BLE001
                results.append({"host": h.name, "error": str(exc)})
        return results, None
    except Exception as exc:  # noqa: BLE001
        return None, f"Unexpected error: {exc}"
    finally:
        if si is not None:
            try:
                Disconnect(si)
            except Exception:  # noqa: BLE001
                pass
