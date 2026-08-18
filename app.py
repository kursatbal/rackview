import os
import re
import sys
from datetime import datetime, timezone
from io import BytesIO

from flask import Flask, jsonify, request, send_from_directory, Response
from openpyxl import Workbook
from openpyxl.styles import Font

from models import db, DeviceType, Rack, Device, Cable, ArpEntry, LldpDiscovery, SanSnapshot, ActivityLog, StorageSnapshot, EsxiSnapshot, IdracSnapshot
from san import collect_one as san_collect_one
from storage import collect_one as storage_collect_one
from esxi import collect_one as esxi_collect_one
from idrac_ilo import collect_one as idrac_collect_one


def _data_dir():
    # Packaged (PyInstaller) runs extract to a temp/read-only bundle dir, so the
    # database must live somewhere stable and writable outside of it instead.
    if getattr(sys, "frozen", False):
        base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        d = os.path.join(base, "RackView")
    else:
        d = os.path.join(os.path.dirname(os.path.abspath(__file__)), "instance")
    os.makedirs(d, exist_ok=True)
    return d


DB_PATH = os.path.join(_data_dir(), "rackview.db")

app = Flask(__name__, static_folder="static", static_url_path="")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
db.init_app(app)

JS_DIR = os.path.join(os.path.dirname(__file__), "static", "js")

INDEX_BUNDLE_FILES = [
    "rv-defs.js", "rv-primitives.js", "rv-stencils-dell.js", "rv-stencils-misc.js",
    "rv-device-catalog.js", "rack.js", "panel.js", "cables.js", "catalog.js", "search.js", "main.js",
]
FLOOR_BUNDLE_FILES = ["rv-defs.js", "rv-primitives.js", "floor.js"]


def _bundle(filenames):
    parts = []
    for name in filenames:
        with open(os.path.join(JS_DIR, name), encoding="utf-8") as f:
            parts.append(f"// ---- {name} ----\n" + f.read())
    return Response("\n;\n".join(parts), mimetype="text/javascript")


@app.route("/js/bundle-index.js")
def bundle_index():
    return _bundle(INDEX_BUNDLE_FILES)


@app.route("/js/bundle-floor.js")
def bundle_floor():
    return _bundle(FLOOR_BUNDLE_FILES)


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/racks")
def list_racks():
    racks = Rack.query.all()
    return jsonify([r.to_dict() for r in racks])


@app.route("/api/racks/<int:rack_id>")
def get_rack(rack_id):
    rack = Rack.query.get_or_404(rack_id)
    devices = Device.query.filter_by(rack_id=rack.id).all()
    data = rack.to_dict()
    data["devices"] = [d.to_dict() for d in devices]
    return jsonify(data)


@app.route("/api/racks/<int:rack_id>/cables")
def get_rack_cables(rack_id):
    device_ids = [d.id for d in Device.query.filter_by(rack_id=rack_id).all()]
    cables = Cable.query.filter(
        db.or_(Cable.a_device_id.in_(device_ids), Cable.b_device_id.in_(device_ids))
    ).all()
    return jsonify([c.to_dict() for c in cables])


@app.route("/api/racks/<int:rack_id>/devices")
def get_rack_devices(rack_id):
    Rack.query.get_or_404(rack_id)
    devices = Device.query.filter_by(rack_id=rack_id).all()
    return jsonify([d.to_dict() for d in devices])


CABLE_EXPORT_HEADERS = [
    "Source device", "Source port", "Target device", "Target port",
    "Medium", "Label", "Source rack", "Target rack",
]


def _cable_export_row(cable, devices_by_id):
    a = devices_by_id.get(cable.a_device_id)
    b = devices_by_id.get(cable.b_device_id)
    return [
        a.name if a else "?", cable.a_port,
        b.name if b else "?", cable.b_port,
        cable.medium, cable.label or "",
        a.rack.name if a else "", b.rack.name if b else "",
    ]


def _xlsx_response(sheet_title, headers, rows, filename):
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_title
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)
    for row in rows:
        ws.append(row)
    for col in ws.columns:
        width = max((len(str(c.value)) for c in col if c.value is not None), default=8)
        ws.column_dimensions[col[0].column_letter].width = min(width + 2, 50)

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(
        buf.read(),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.route("/api/racks/<int:rack_id>/export.xlsx")
def export_rack_cables(rack_id):
    rack = Rack.query.get_or_404(rack_id)
    device_ids = [d.id for d in Device.query.filter_by(rack_id=rack_id).all()]
    cables = Cable.query.filter(
        db.or_(Cable.a_device_id.in_(device_ids), Cable.b_device_id.in_(device_ids))
    ).all()
    all_ids = {c.a_device_id for c in cables} | {c.b_device_id for c in cables}
    devices_by_id = {d.id: d for d in Device.query.filter(Device.id.in_(all_ids)).all()}
    rows = [_cable_export_row(c, devices_by_id) for c in cables]
    safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", rack.name)
    return _xlsx_response("Cables", CABLE_EXPORT_HEADERS, rows, f"{safe_name}_cables.xlsx")


@app.route("/api/devices/<int:device_id>/export.xlsx")
def export_device_connections(device_id):
    device = Device.query.get_or_404(device_id)
    cables = Cable.query.filter(
        db.or_(Cable.a_device_id == device_id, Cable.b_device_id == device_id)
    ).all()
    all_ids = {c.a_device_id for c in cables} | {c.b_device_id for c in cables}
    devices_by_id = {d.id: d for d in Device.query.filter(Device.id.in_(all_ids)).all()}
    rows = [_cable_export_row(c, devices_by_id) for c in cables]
    safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", device.name)
    return _xlsx_response("Connections", CABLE_EXPORT_HEADERS, rows, f"{safe_name}_connections.xlsx")


@app.route("/api/racks", methods=["POST"])
def create_rack():
    payload = request.get_json()
    rack = Rack(
        name=payload["name"],
        site=payload.get("site", ""),
        u_height=payload.get("u_height", 42),
        customer=payload.get("customer"),
        row=payload.get("row", 1),
        col=payload.get("col", 1),
    )
    db.session.add(rack)
    db.session.commit()
    return jsonify(rack.to_dict()), 201


@app.route("/api/racks/<int:rack_id>", methods=["PUT"])
def update_rack(rack_id):
    rack = Rack.query.get_or_404(rack_id)
    payload = request.get_json()
    rack.name = payload.get("name", rack.name)
    rack.site = payload.get("site", rack.site)
    rack.u_height = payload.get("u_height", rack.u_height)
    rack.customer = payload.get("customer", rack.customer)
    rack.row = payload.get("row", rack.row)
    rack.col = payload.get("col", rack.col)
    db.session.commit()
    return jsonify(rack.to_dict())


@app.route("/api/customers")
def list_customers():
    racks = Rack.query.all()
    by_customer = {}
    for r in racks:
        key = r.customer or "(no customer)"
        by_customer.setdefault(key, {"customer": key, "rack_count": 0, "device_count": 0})
        by_customer[key]["rack_count"] += 1
        by_customer[key]["device_count"] += Device.query.filter_by(rack_id=r.id).count()
    return jsonify(sorted(by_customer.values(), key=lambda c: c["customer"]))


@app.route("/api/customers/<string:customer>/racks")
def customer_racks(customer):
    racks = Rack.query.filter_by(customer=customer).all()
    out = []
    for r in racks:
        data = r.to_dict()
        data["devices"] = [d.to_dict() for d in Device.query.filter_by(rack_id=r.id).all()]
        out.append(data)
    return jsonify(out)


@app.route("/api/floor/<string:customer>/cables")
def floor_cables(customer):
    rack_ids = [r.id for r in Rack.query.filter_by(customer=customer).all()]
    device_rows = Device.query.filter(Device.rack_id.in_(rack_ids)).all()
    rack_by_device = {d.id: d.rack_id for d in device_rows}
    device_ids = list(rack_by_device.keys())
    cables = Cable.query.filter(
        db.or_(Cable.a_device_id.in_(device_ids), Cable.b_device_id.in_(device_ids))
    ).all()
    out = []
    for c in cables:
        data = c.to_dict()
        data["a_rack_id"] = rack_by_device.get(c.a_device_id)
        data["b_rack_id"] = rack_by_device.get(c.b_device_id)
        data["inter_rack"] = data["a_rack_id"] != data["b_rack_id"]
        out.append(data)
    return jsonify(out)


@app.route("/api/devices/<int:device_id>")
def get_device(device_id):
    device = Device.query.get_or_404(device_id)
    data = device.to_dict()
    arp = ArpEntry.query.filter_by(device_id=device_id).all()
    data["arp"] = [a.to_dict() for a in arp]
    return jsonify(data)


@app.route("/api/device-types")
def list_device_types():
    types = DeviceType.query.all()
    return jsonify([t.to_dict() for t in types])


def _check_u_overlap(rack, position_u, u_height, exclude_device_id=None):
    if position_u < 1 or position_u + u_height - 1 > rack.u_height:
        return "out of rack bounds", 400

    new_lo, new_hi = position_u, position_u + u_height - 1
    query = Device.query.filter_by(rack_id=rack.id)
    if exclude_device_id is not None:
        query = query.filter(Device.id != exclude_device_id)

    for other in query.all():
        other_lo = other.position_u
        other_hi = other.position_u + other.device_type.u_height - 1
        if new_lo <= other_hi and other_lo <= new_hi:
            return f"overlaps with device {other.name}", 409

    return None, None


def _cable_label(cable):
    a = Device.query.get(cable.a_device_id)
    b = Device.query.get(cable.b_device_id)
    a_label = f"{a.name}:{cable.a_port}" if a else f"?:{cable.a_port}"
    b_label = f"{b.name}:{cable.b_port}" if b else f"?:{cable.b_port}"
    return f"{a_label} ↔ {b_label}"


def _log_activity(entity_type, entity_id, entity_name, action, changes=None, rack_id=None, rack_name=None):
    # Caller commits — this only adds to the session so it lands in the same transaction as the
    # change it's describing (a log entry for a change that then fails to commit shouldn't persist).
    db.session.add(ActivityLog(
        timestamp=datetime.now(timezone.utc), entity_type=entity_type, entity_id=entity_id,
        entity_name=entity_name, action=action, changes=changes or None,
        rack_id=rack_id, rack_name=rack_name,
    ))


@app.route("/api/devices", methods=["POST"])
def create_device():
    payload = request.get_json()
    rack = Rack.query.get_or_404(payload["rack_id"])
    device_type = DeviceType.query.get_or_404(payload["device_type_id"])

    error, status = _check_u_overlap(rack, payload["position_u"], device_type.u_height)
    if error:
        return jsonify({"error": error}), status

    device = Device(
        rack_id=rack.id,
        device_type_id=device_type.id,
        name=payload["name"],
        position_u=payload["position_u"],
        serial=payload.get("serial"),
        mgmt_ip=payload.get("mgmt_ip"),
        notes=payload.get("notes"),
        metadata_json=payload.get("metadata_json"),
    )
    db.session.add(device)
    db.session.flush()
    _log_activity("device", device.id, device.name, "created", rack_id=rack.id, rack_name=rack.name)
    db.session.commit()
    return jsonify(device.to_dict()), 201


_DEVICE_TRACKED_FIELDS = [
    "position_u", "device_type_id", "name", "serial", "mgmt_ip",
    "notes", "owner_team", "warranty_end", "role_label",
]


@app.route("/api/devices/<int:device_id>", methods=["PUT"])
def update_device(device_id):
    device = Device.query.get_or_404(device_id)
    payload = request.get_json()
    before = {f: getattr(device, f) for f in _DEVICE_TRACKED_FIELDS}

    new_position_u = payload.get("position_u", device.position_u)
    new_type_id = payload.get("device_type_id", device.device_type_id)
    device_type = DeviceType.query.get_or_404(new_type_id)

    if "position_u" in payload or "device_type_id" in payload:
        error, status = _check_u_overlap(
            device.rack, new_position_u, device_type.u_height, exclude_device_id=device.id
        )
        if error:
            return jsonify({"error": error}), status

    new_name = payload.get("name", device.name)
    if new_name != device.name:
        dup = Device.query.filter(
            Device.rack_id == device.rack_id,
            Device.id != device.id,
            Device.name == new_name,
        ).first()
        if dup:
            return jsonify({"error": f"device name '{new_name}' already used in this rack"}), 409

    device.position_u = new_position_u
    device.device_type_id = new_type_id
    device.name = new_name
    device.serial = payload.get("serial", device.serial)
    device.mgmt_ip = payload.get("mgmt_ip", device.mgmt_ip)
    device.notes = payload.get("notes", device.notes)
    device.owner_team = payload.get("owner_team", device.owner_team)
    device.warranty_end = payload.get("warranty_end", device.warranty_end)
    device.role_label = payload.get("role_label", device.role_label)
    device.line_cards = payload.get("line_cards", device.line_cards)

    known_keys = {
        "position_u", "device_type_id", "name", "serial", "mgmt_ip", "notes",
        "owner_team", "warranty_end", "role_label", "line_cards", "metadata_json",
    }
    extra = {k: v for k, v in payload.items() if k not in known_keys}
    if extra or "metadata_json" in payload:
        merged = dict(device.metadata_json or {})
        incoming = dict(payload.get("metadata_json") or {})
        incoming.update(extra)
        for k, v in incoming.items():
            if isinstance(v, dict) and isinstance(merged.get(k), dict):
                merged[k] = {**merged[k], **v}
            else:
                merged[k] = v
        device.metadata_json = merged

    changes = {
        f: {"from": before[f], "to": getattr(device, f)}
        for f in _DEVICE_TRACKED_FIELDS if before[f] != getattr(device, f)
    }
    if changes:
        _log_activity("device", device.id, device.name, "updated", changes=changes,
                       rack_id=device.rack_id, rack_name=device.rack.name)

    db.session.commit()
    return jsonify(device.to_dict())


@app.route("/api/devices/<int:device_id>/ip-conflicts")
def device_ip_conflicts(device_id):
    # Purely a static check against what's already recorded in RackView — no live polling of any
    # device. Scoped to the same customer, since different customers legitimately reuse the same
    # private ranges across their own separate racks.
    device = Device.query.get_or_404(device_id)
    if not device.mgmt_ip:
        return jsonify([])
    others = Device.query.filter(
        Device.rack_id.in_(_customer_rack_ids(device)),
        Device.id != device.id,
        Device.mgmt_ip == device.mgmt_ip,
    ).all()
    return jsonify([
        {"id": d.id, "name": d.name, "rack_id": d.rack_id, "rack_name": d.rack.name}
        for d in others
    ])


@app.route("/api/devices/<int:device_id>", methods=["DELETE"])
def delete_device(device_id):
    device = Device.query.get_or_404(device_id)
    orphaned_cables = Cable.query.filter(
        db.or_(Cable.a_device_id == device_id, Cable.b_device_id == device_id)
    ).all()
    for c in orphaned_cables:
        _log_activity("cable", c.id, _cable_label(c), "deleted",
                       rack_id=device.rack_id, rack_name=device.rack.name)
        db.session.delete(c)
    _log_activity("device", device.id, device.name, "deleted",
                   rack_id=device.rack_id, rack_name=device.rack.name)
    db.session.delete(device)
    db.session.commit()
    return "", 204


_CABLE_TRACKED_FIELDS = ["a_device_id", "a_port", "b_device_id", "b_port", "medium", "label"]


@app.route("/api/cables", methods=["POST"])
def create_cable():
    payload = request.get_json()
    cable = Cable(
        a_device_id=payload["a_device_id"],
        a_port=payload["a_port"],
        b_device_id=payload["b_device_id"],
        b_port=payload["b_port"],
        medium=payload["medium"],
        label=payload.get("label"),
        color=payload.get("color"),
    )
    db.session.add(cable)
    db.session.flush()
    a = Device.query.get(cable.a_device_id)
    _log_activity("cable", cable.id, _cable_label(cable), "created",
                   rack_id=a.rack_id if a else None, rack_name=a.rack.name if a else None)
    db.session.commit()
    return jsonify(cable.to_dict()), 201


@app.route("/api/cables/<int:cable_id>", methods=["PUT"])
def update_cable(cable_id):
    cable = Cable.query.get_or_404(cable_id)
    payload = request.get_json()
    before = {f: getattr(cable, f) for f in _CABLE_TRACKED_FIELDS}
    cable.a_device_id = payload.get("a_device_id", cable.a_device_id)
    cable.a_port = payload.get("a_port", cable.a_port)
    cable.b_device_id = payload.get("b_device_id", cable.b_device_id)
    cable.b_port = payload.get("b_port", cable.b_port)
    cable.medium = payload.get("medium", cable.medium)
    cable.label = payload.get("label", cable.label)
    cable.color = payload.get("color", cable.color)
    if "waypoints" in payload:
        cable.waypoints = payload["waypoints"]

    # Manual routing drags send frequent waypoints-only PUTs — excluded from tracked fields above
    # so dragging a cable's bend point doesn't spam the log with "updated" entries.
    changes = {
        f: {"from": before[f], "to": getattr(cable, f)}
        for f in _CABLE_TRACKED_FIELDS if before[f] != getattr(cable, f)
    }
    if changes:
        a = Device.query.get(cable.a_device_id)
        _log_activity("cable", cable.id, _cable_label(cable), "updated", changes=changes,
                       rack_id=a.rack_id if a else None, rack_name=a.rack.name if a else None)

    db.session.commit()
    return jsonify(cable.to_dict())


@app.route("/api/cables/<int:cable_id>", methods=["DELETE"])
def delete_cable(cable_id):
    cable = Cable.query.get_or_404(cable_id)
    a = Device.query.get(cable.a_device_id)
    _log_activity("cable", cable.id, _cable_label(cable), "deleted",
                   rack_id=a.rack_id if a else None, rack_name=a.rack.name if a else None)
    db.session.delete(cable)
    db.session.commit()
    return "", 204


def _latest_firmware(device):
    # Firmware/version lives in different places depending on how it was learned: a live pull
    # (SAN/Storage/ESXi mapping) takes priority over the manually-typed metadata_json.sw_version
    # field used by the generic switch/firewall/router System tab, since a live pull is verified
    # against the real device and the manual field can go stale.
    category = device.device_type.category
    snap = None
    if category == "san-switch":
        snap = SanSnapshot.query.filter_by(device_id=device.id).order_by(SanSnapshot.timestamp.desc()).first()
        if snap:
            return (snap.fabric or {}).get("firmware")
    elif category == "server":
        # iDRAC/iLO's BIOS/BMC firmware is what a vendor advisory actually refers to as "firmware" —
        # preferred over the ESXi hypervisor build, which is really an OS version, not firmware.
        idrac_snap = IdracSnapshot.query.filter_by(device_id=device.id).order_by(IdracSnapshot.timestamp.desc()).first()
        if idrac_snap:
            d = idrac_snap.data or {}
            bios, bmc = d.get("bios_version"), d.get("bmc_firmware")
            if bios or bmc:
                return " / ".join(p for p in [f"BIOS {bios}" if bios else None, f"BMC {bmc}" if bmc else None] if p)
        snap = EsxiSnapshot.query.filter_by(device_id=device.id).order_by(EsxiSnapshot.timestamp.desc()).first()
        if snap:
            return (snap.data or {}).get("product")
    elif category == "storage":
        snap = StorageSnapshot.query.filter_by(device_id=device.id).order_by(StorageSnapshot.timestamp.desc()).first()
        if snap:
            fw = (snap.data or {}).get("firmware")
            if fw:
                return fw
    return (device.metadata_json or {}).get("sw_version")


@app.route("/api/devices/all")
def all_devices():
    devices = Device.query.join(Device.device_type).join(Device.rack).all()
    return jsonify([
        {
            "id": d.id, "name": d.name, "category": d.device_type.category,
            "vendor": d.device_type.vendor, "model": d.device_type.model,
            "rack_id": d.rack_id, "rack_name": d.rack.name, "customer": d.rack.customer,
            "position_u": d.position_u, "mgmt_ip": d.mgmt_ip, "serial": d.serial,
            "owner_team": d.owner_team, "firmware": _latest_firmware(d),
        }
        for d in devices
    ])


@app.route("/api/devices/<int:device_id>/free-ports")
def get_free_ports(device_id):
    device = Device.query.get_or_404(device_id)
    device_type = device.device_type
    all_ports = list(device_type.front_ports or []) + list(device_type.rear_ports or [])

    used = set()
    cables = Cable.query.filter(
        db.or_(Cable.a_device_id == device_id, Cable.b_device_id == device_id)
    ).all()
    for c in cables:
        if c.a_device_id == device_id:
            used.add(c.a_port)
        if c.b_device_id == device_id:
            used.add(c.b_port)

    free = [p for p in all_ports if p["name"] not in used]
    return jsonify(free)


def _normalize_mac(s):
    hexonly = re.sub(r"[^0-9a-fA-F]", "", s or "")
    if len(hexonly) != 12:
        return None
    return ":".join(hexonly[i:i + 2] for i in range(0, 12, 2)).lower()


def _detect_query_type(q):
    s = q.strip()
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", s):
        return "ip"
    if re.match(r"^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$", s, re.I):
        return "mac"
    if re.match(r"^([0-9a-f]{4}\.){2}[0-9a-f]{4}$", s, re.I):
        return "mac"
    if re.match(r"^([0-9a-f]{2}:){7}[0-9a-f]{2}$", s, re.I):
        return "wwpn"
    if re.match(r"^(eth|gi|te|xe|fc|port)\s*[\d/]+$", s, re.I):
        return "port"
    if re.match(r"^vlan\s*\d+$", s, re.I) or re.match(r"^\d{1,4}$", s):
        return "vlan"
    return "text"


@app.route("/api/search")
def search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"query": q, "detected_type": "text", "results": []})

    qtype = _detect_query_type(q)
    ql = q.lower()
    mac_norm = _normalize_mac(q) if qtype == "mac" else None

    customer = request.args.get("customer")
    device_query = Device.query
    if customer:
        rack_ids = [r.id for r in Rack.query.filter_by(customer=customer).all()]
        device_query = device_query.filter(Device.rack_id.in_(rack_ids))
    devices = device_query.all()
    dev_by_id = {d.id: d for d in devices}
    scored = []

    def add(device, context, reason, score):
        scored.append((score, {
            "device_id": device.id,
            "device_name": device.name,
            "rack": device.rack.name,
            "rack_id": device.rack_id,
            "position": f"U{device.position_u}",
            "model": f"{device.device_type.vendor} {device.device_type.model}",
            "context": context,
            "match_reason": reason,
        }))

    for d in devices:
        if ql and ql in d.name.lower():
            add(d, "", f"Device name matches '{q}'", 100 if d.name.lower() == ql else 60)
        if d.serial and ql in d.serial.lower():
            add(d, "", f"Serial matches: {d.serial}", 100 if d.serial.lower() == ql else 70)
        if d.mgmt_ip and (d.mgmt_ip == q or (qtype == "ip" and ql in d.mgmt_ip.lower())):
            add(d, "Mgmt IP", f"IP matched: {d.mgmt_ip}", 100 if d.mgmt_ip == q else 60)

        meta = d.metadata_json or {}
        for key in ("oob_ip", "vmotion_ip", "cluster_ip"):
            val = meta.get(key)
            if val and (str(val) == q or (qtype == "ip" and ql in str(val).lower())):
                add(d, key, f"IP matched: {val}", 100 if str(val) == q else 60)
        for k, v in (meta.get("ctrl_ips") or {}).items():
            if v and (str(v) == q or (qtype == "ip" and ql in str(v).lower())):
                add(d, f"{k} IP", f"IP matched: {v}", 100 if str(v) == q else 60)

    for a in ArpEntry.query.all():
        d = dev_by_id.get(a.device_id)
        if not d:
            continue
        if a.ip and (a.ip == q or (qtype == "ip" and ql in a.ip.lower())):
            add(d, f"ARP on {a.port}", f"ARP: IP matched {a.ip}", 90)
        mac_field_norm = _normalize_mac(a.mac) if a.mac else None
        if mac_norm and mac_field_norm == mac_norm:
            add(d, f"ARP on {a.port}", f"ARP: MAC matched {a.mac}", 90)

    for c in Cable.query.all():
        for side_dev_id, side_port in ((c.a_device_id, c.a_port), (c.b_device_id, c.b_port)):
            d = dev_by_id.get(side_dev_id)
            if not d or not side_port:
                continue
            if qtype == "port" and side_port.lower() == ql:
                add(d, side_port, f"Port matches: {side_port}", 95)
            elif qtype in ("port", "text") and ql in side_port.lower():
                add(d, side_port, f"Port contains: {side_port}", 50)
        if qtype == "vlan" and c.label:
            vlan_q = re.sub(r"^vlan\s*", "", ql, flags=re.I)
            if vlan_q and vlan_q in c.label.lower():
                for side_dev_id, side_port in ((c.a_device_id, c.a_port), (c.b_device_id, c.b_port)):
                    d = dev_by_id.get(side_dev_id)
                    if d:
                        add(d, side_port, f"VLAN {vlan_q} in config: {c.label}", 55)

    best = {}
    for score, r in scored:
        key = (r["device_id"], r["context"], r["match_reason"])
        if key not in best or best[key][0] < score:
            best[key] = (score, r)
    ranked = sorted(best.values(), key=lambda x: -x[0])
    return jsonify({
        "query": q,
        "detected_type": qtype,
        "results": [r for _, r in ranked][:30],
    })


def _classify_purpose(cable):
    if cable.medium == "power":
        return "power"
    if cable.medium in ("fiber", "sas"):
        return "storage"
    label = (cable.label or "").lower()
    if "mgmt" in label or "idrac" in label or "ilo" in label:
        return "mgmt"
    if cable.medium == "cat6a":
        return "mgmt"
    return "data"


_PURPOSE_LABELS = {"data": "data path", "mgmt": "management", "storage": "storage path", "power": "power feed"}


def _cable_port_for(cable, device_id):
    return cable.a_port if cable.a_device_id == device_id else cable.b_port


def _find_alternates(peer_id, purpose, down_device_id, all_cables):
    alts = []
    for c in all_cables:
        if c.a_device_id != peer_id and c.b_device_id != peer_id:
            continue
        other = c.b_device_id if c.a_device_id == peer_id else c.a_device_id
        if other == down_device_id:
            continue
        if _classify_purpose(c) == purpose:
            alts.append(c)
    return alts


@app.route("/api/devices/<int:device_id>/impact")
def device_impact(device_id):
    device = Device.query.get_or_404(device_id)
    customer = device.rack.customer
    if customer:
        customer_rack_ids = [r.id for r in Rack.query.filter_by(customer=customer).all()]
    else:
        customer_rack_ids = [device.rack_id]
    rack_device_ids = [d.id for d in Device.query.filter(Device.rack_id.in_(customer_rack_ids)).all()]
    all_devices = Device.query.filter(Device.id.in_(rack_device_ids)).all()
    dev_by_id = {d.id: d for d in all_devices}
    all_cables = Cable.query.filter(
        db.or_(Cable.a_device_id.in_(rack_device_ids), Cable.b_device_id.in_(rack_device_ids))
    ).all()

    affected = [c for c in all_cables if c.a_device_id == device_id or c.b_device_id == device_id]
    by_peer = {}
    for c in affected:
        peer = c.b_device_id if c.a_device_id == device_id else c.a_device_id
        by_peer.setdefault(peer, []).append(c)

    critical, degraded = [], []
    for peer_id, cables in by_peer.items():
        peer = dev_by_id.get(peer_id)
        if not peer:
            continue
        for cable in cables:
            purpose = _classify_purpose(cable)
            alternates = _find_alternates(peer_id, purpose, device_id, all_cables)
            port_label = _cable_port_for(cable, peer_id)
            if not alternates:
                critical.append({
                    "device_id": peer.id, "device_name": peer.name,
                    "rack_id": peer.rack_id, "rack_name": peer.rack.name,
                    "reason": f"{_PURPOSE_LABELS[purpose]} access lost",
                    "detail": f"{port_label} · only path",
                })
            else:
                alt_labels = ", ".join(_cable_port_for(a, peer_id) for a in alternates)
                degraded.append({
                    "device_id": peer.id, "device_name": peer.name,
                    "rack_id": peer.rack_id, "rack_name": peer.rack.name,
                    "reason": f"{_PURPOSE_LABELS[purpose]} drops to one leg",
                    "detail": f"{port_label} lost, {alt_labels} stays up",
                })

    safe = [
        {"device_id": d.id, "device_name": d.name, "rack_id": d.rack_id, "rack_name": d.rack.name, "reason": "no connection"}
        for d in all_devices if d.id != device_id and d.id not in by_peer
    ]

    severity = "critical" if critical else ("degraded" if degraded else "safe")
    return jsonify({
        "severity": severity,
        "counts": {"critical": len(critical), "degraded": len(degraded), "safe": len(safe)},
        "critical": critical,
        "degraded": degraded,
        "safe": safe,
    })


def _parse_lldp_cisco(lines):
    out = []
    started = False
    for line in lines:
        s = line.strip()
        if not s:
            continue
        if re.match(r"^Device\s+ID", s, re.I):
            started = True
            continue
        if not started:
            continue
        parts = s.split()
        if len(parts) < 5:
            continue
        device_id, local_intf, _holdtime, capability = parts[0], parts[1], parts[2], parts[3]
        port_id = " ".join(parts[4:])
        out.append({
            "localPort": local_intf,
            "remoteSystem": device_id,
            "remotePort": port_id,
            "remoteChassisId": None,
            "capabilities": capability.split(","),
        })
    return out


def _parse_lldp_dell(lines):
    out = []
    cur = {}

    def flush(rec):
        if rec.get("localPort") or rec.get("remoteSystem"):
            out.append({
                "localPort": rec.get("localPort"),
                "remoteSystem": rec.get("remoteSystem"),
                "remotePort": rec.get("remotePort"),
                "remoteChassisId": rec.get("remoteChassisId"),
                "capabilities": [],
            })

    for line in lines:
        s = line.strip()
        if not s:
            if cur:
                flush(cur)
                cur = {}
            continue
        m = re.match(r"^Remote Chassis ID:\s*(.+)$", s, re.I)
        if m:
            if cur.get("localPort") or cur.get("remoteSystem"):
                flush(cur)
                cur = {}
            cur["remoteChassisId"] = m.group(1).strip()
            continue
        m = re.match(r"^Remote Port ID:\s*(.+)$", s, re.I)
        if m:
            cur["remotePort"] = m.group(1).strip()
            continue
        m = re.match(r"^Remote System Name:\s*(.+)$", s, re.I)
        if m:
            cur["remoteSystem"] = m.group(1).strip()
            continue
        m = re.match(r"^Local Port ID:\s*(.+)$", s, re.I)
        if m:
            cur["localPort"] = m.group(1).strip()
            continue
    if cur:
        flush(cur)
    return out


def _parse_lldp_aruba(lines):
    out = []
    started = False
    for line in lines:
        s = line.strip()
        if not s:
            continue
        if re.match(r"^LocalPort", s, re.I):
            started = True
            continue
        if not started:
            continue
        parts = s.split()
        if len(parts) < 4:
            continue
        local_port, chassis_id, port_id = parts[0], parts[1], parts[2]
        sys_name = " ".join(parts[3:])
        out.append({
            "localPort": local_port,
            "remoteSystem": sys_name,
            "remotePort": port_id,
            "remoteChassisId": chassis_id,
            "capabilities": [],
        })
    return out


def _parse_lldp(text):
    lines = text.splitlines()
    non_empty = [l for l in lines if l.strip()]
    if not non_empty:
        return []
    if any(l.strip().lower().startswith("remote chassis id:") for l in non_empty):
        return _parse_lldp_dell(lines)
    if any(re.match(r"^device\s+id\s+local\s+intf", l.strip(), re.I) for l in non_empty):
        return _parse_lldp_cisco(lines)
    if any(re.match(r"^localport\s+chassisid", l.strip(), re.I) for l in non_empty):
        return _parse_lldp_aruba(lines)
    return []


@app.route("/api/lldp/parse", methods=["POST"])
def lldp_parse():
    payload = request.get_json()
    text = payload.get("text", "")
    neighbors = _parse_lldp(text)
    return jsonify({"neighbors": neighbors})


def _port_aliases(device, physical_port):
    aliases = {(physical_port or "").lower()}
    meta = (device and device.metadata_json) or {}
    for vnic, phys in (meta.get("vmnic_map") or {}).items():
        if phys == physical_port:
            aliases.add(vnic.lower())
    return aliases


@app.route("/api/lldp/match", methods=["POST"])
def lldp_match():
    payload = request.get_json()
    neighbors = payload.get("neighbors", [])
    switch_id = payload.get("switch_id")
    switch = Device.query.get_or_404(switch_id)

    customer_rack_ids = _customer_rack_ids(switch)
    devices_by_name = {d.name.lower(): d for d in Device.query.filter(Device.rack_id.in_(customer_rack_ids)).all()}
    cables = Cable.query.filter(
        db.or_(Cable.a_device_id == switch_id, Cable.b_device_id == switch_id)
    ).all()
    cable_by_local_port = {}
    for c in cables:
        if c.a_device_id == switch_id:
            cable_by_local_port[c.a_port] = c
        if c.b_device_id == switch_id:
            cable_by_local_port[c.b_port] = c

    results = []
    seen_local_ports = set()
    for n in neighbors:
        local_port = n.get("localPort")
        seen_local_ports.add(local_port)
        remote_system = (n.get("remoteSystem") or "").strip()
        remote_port = n.get("remotePort")
        cable = cable_by_local_port.get(local_port)
        remote_device = devices_by_name.get(remote_system.lower())

        if cable:
            other_id = cable.b_device_id if cable.a_device_id == switch_id else cable.a_device_id
            other_port = cable.b_port if cable.a_device_id == switch_id else cable.a_port
            other_device = Device.query.get(other_id)
            same_device = bool(other_device) and other_device.name.lower() == remote_system.lower()
            same_port = (remote_port or "").lower() in _port_aliases(other_device, other_port)
            status = "matched" if (same_device and same_port) else "conflict"
            results.append({
                "localPort": local_port, "remoteSystem": remote_system, "remotePort": remote_port,
                "remoteChassisId": n.get("remoteChassisId"), "status": status,
                "cable_id": cable.id,
                "recorded": {"device_name": other_device.name if other_device else None, "port": other_port},
                "device_known": remote_device is not None,
                "remote_device_id": remote_device.id if remote_device else None,
            })
        else:
            results.append({
                "localPort": local_port, "remoteSystem": remote_system, "remotePort": remote_port,
                "remoteChassisId": n.get("remoteChassisId"), "status": "new",
                "cable_id": None, "recorded": None,
                "device_known": remote_device is not None,
                "remote_device_id": remote_device.id if remote_device else None,
            })

    # Recorded cables on this switch that no incoming LLDP neighbor accounts for — likely unplugged.
    for local_port, cable in cable_by_local_port.items():
        if local_port in seen_local_ports:
            continue
        other_id = cable.b_device_id if cable.a_device_id == switch_id else cable.a_device_id
        other_port = cable.b_port if cable.a_device_id == switch_id else cable.a_port
        other_device = Device.query.get(other_id)
        results.append({
            "localPort": local_port, "remoteSystem": None, "remotePort": None,
            "remoteChassisId": None, "status": "removed",
            "cable_id": cable.id,
            "recorded": {"device_name": other_device.name if other_device else None, "port": other_port},
            "device_known": other_device is not None,
            "remote_device_id": other_device.id if other_device else None,
        })

    saved_notes = ((switch.metadata_json or {}).get("lldp_ports")) or {}
    for r in results:
        note = saved_notes.get(r["localPort"])
        r["noted"] = bool(
            note and note.get("remoteSystem") == r.get("remoteSystem") and note.get("remotePort") == r.get("remotePort")
        )

    summary = {
        "changed": sum(1 for r in results if r["status"] == "conflict"),
        "added": sum(1 for r in results if r["status"] == "new"),
        "removed": sum(1 for r in results if r["status"] == "removed"),
        "mode": payload.get("mode") or "discovery",
    }
    discovery = LldpDiscovery(
        timestamp=datetime.now(timezone.utc),
        switch_id=switch_id, switch_name=switch.name,
        raw_lldp=payload.get("raw_lldp"),
        results=results, summary=summary,
    )
    db.session.add(discovery)
    db.session.commit()

    return jsonify({"switch_id": switch_id, "results": results, "history_id": discovery.id})


def _customer_rack_ids(switch):
    customer = switch.rack.customer
    if customer:
        return [r.id for r in Rack.query.filter_by(customer=customer).all()]
    return [switch.rack_id]


@app.route("/api/lldp/candidate-devices")
def lldp_candidate_devices():
    # Feeds the "pick an existing device" dropdown for LLDP neighbors whose reported hostname
    # didn't exactly match any Device.name (typo, FQDN vs short name, case, etc).
    switch_id = request.args.get("switch_id", type=int)
    switch = Device.query.get_or_404(switch_id)
    devices = Device.query.filter(Device.rack_id.in_(_customer_rack_ids(switch))).order_by(Device.name).all()
    return jsonify([
        {"id": d.id, "name": d.name, "rack_id": d.rack_id, "rack_name": d.rack.name,
         "vendor": d.device_type.vendor, "model": d.device_type.model}
        for d in devices if d.id != switch_id
    ])


@app.route("/api/lldp/apply", methods=["POST"])
def lldp_apply():
    payload = request.get_json()
    switch_id = payload.get("switch_id")
    records = payload.get("records", [])
    created, skipped = [], []

    switch = Device.query.get_or_404(switch_id)
    customer_rack_ids = _customer_rack_ids(switch)

    for r in records:
        local_port = r.get("localPort")
        remote_system = (r.get("remoteSystem") or "").strip()
        remote_port = r.get("remotePort")
        medium = r.get("medium") or "cat6a"
        action = r.get("action", "create")

        existing = Cable.query.filter(
            db.or_(
                db.and_(Cable.a_device_id == switch_id, Cable.a_port == local_port),
                db.and_(Cable.b_device_id == switch_id, Cable.b_port == local_port),
            )
        ).first()

        if action == "remove":
            if existing:
                db.session.delete(existing)
                created.append({"localPort": local_port, "removed": True})
            else:
                skipped.append({"localPort": local_port, "reason": "no cable on this port to remove"})
            continue

        # An explicit remote_device_id (from the "pick an existing device" dropdown) always wins
        # over the hostname lookup — the user has already resolved the ambiguity by hand.
        remote_device_id = r.get("remote_device_id")
        if remote_device_id:
            remote_device = Device.query.filter(
                Device.id == remote_device_id, Device.rack_id.in_(customer_rack_ids),
            ).first()
        else:
            remote_device = Device.query.filter(
                db.func.lower(Device.name) == remote_system.lower(),
                Device.rack_id.in_(customer_rack_ids),
            ).first()
        if not remote_device:
            skipped.append({"localPort": local_port, "reason": f"unknown device '{remote_system}'"})
            continue

        if existing:
            if action == "update":
                if existing.a_device_id == switch_id:
                    existing.b_device_id = remote_device.id
                    existing.b_port = remote_port or "?"
                else:
                    existing.a_device_id = remote_device.id
                    existing.a_port = remote_port or "?"
                if "(updated via LLDP)" not in (existing.label or ""):
                    existing.label = ((existing.label or "").strip() + " (updated via LLDP)").strip()
                db.session.flush()
                created.append(existing.to_dict())
            else:
                skipped.append({"localPort": local_port, "reason": "cable already exists on this port"})
            continue

        cable = Cable(
            a_device_id=switch_id, a_port=local_port,
            b_device_id=remote_device.id, b_port=remote_port or "?",
            medium=medium, label="via LLDP discovery",
        )
        db.session.add(cable)
        db.session.flush()
        created.append(cable.to_dict())

    db.session.commit()
    return jsonify({"created": created, "skipped": skipped})


@app.route("/api/lldp/annotate", methods=["POST"])
def lldp_annotate():
    # Discovery-mode write path: records what LLDP saw on each of the switch's own ports as an
    # informational note (surfaced in the device panel), without touching the Cable table at all —
    # kept deliberately separate from lldp_apply(), which is the auto-cabling write path.
    payload = request.get_json()
    switch_id = payload.get("switch_id")
    records = payload.get("records", [])
    switch = Device.query.get_or_404(switch_id)

    notes = dict((switch.metadata_json or {}).get("lldp_ports") or {})
    saved, cleared = [], []
    now = datetime.now(timezone.utc).isoformat()

    for r in records:
        local_port = r.get("localPort")
        action = r.get("action", "save")
        if action == "clear":
            if local_port in notes:
                del notes[local_port]
                cleared.append(local_port)
            continue
        remote_system = (r.get("remoteSystem") or "").strip()
        if not remote_system:
            continue
        notes[local_port] = {
            "remoteSystem": remote_system,
            "remotePort": r.get("remotePort"),
            "remoteChassisId": r.get("remoteChassisId"),
            "seenAt": now,
        }
        saved.append(local_port)

    merged = dict(switch.metadata_json or {})
    merged["lldp_ports"] = notes
    switch.metadata_json = merged
    db.session.commit()

    return jsonify({"saved": saved, "cleared": cleared, "lldp_ports": notes})


@app.route("/api/lldp/history")
def lldp_history():
    rows = LldpDiscovery.query.order_by(LldpDiscovery.timestamp.desc()).limit(50).all()
    return jsonify([r.to_dict(include_results=False) for r in rows])


@app.route("/api/lldp/history/<int:history_id>")
def lldp_history_detail(history_id):
    row = LldpDiscovery.query.get_or_404(history_id)
    return jsonify(row.to_dict())


@app.route("/api/lldp/history/<int:history_id>/apply", methods=["POST"])
def lldp_history_apply(history_id):
    row = LldpDiscovery.query.get_or_404(history_id)
    row.applied = True
    row.applied_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(row.to_dict(include_results=False))


@app.route("/api/lldp/history/<int:history_id>", methods=["DELETE"])
def lldp_history_delete(history_id):
    row = LldpDiscovery.query.get_or_404(history_id)
    db.session.delete(row)
    db.session.commit()
    return "", 204


def _port_number(name):
    m = re.search(r"(\d+)\s*$", str(name or ""))
    return int(m.group(1)) if m else None


def _attach_cable_destinations(device, ports):
    # RackView already knows the physical cabling for this switch (if it's been cabled in the
    # app) — cross-reference by port number so each port card can show where the cable actually
    # goes, without needing any external host/WWN inventory. Vendor CLI port numbering is 0-based
    # (Brocade "0".."23") while every port stencil in this app numbers from 1 ("FC 1".."FC 24"),
    # so only the +1 offset is tried — NOT also a direct/exact match, since trying both would let
    # two different real switch ports (e.g. "0" and "1") both resolve to the same RackView port
    # ("FC 1"), producing a false duplicate destination on the wrong port.
    cables = Cable.query.filter(
        db.or_(Cable.a_device_id == device.id, Cable.b_device_id == device.id)
    ).all()
    by_number = {}
    for c in cables:
        mine_port = c.a_port if c.a_device_id == device.id else c.b_port
        other_id = c.b_device_id if c.a_device_id == device.id else c.a_device_id
        other_port = c.b_port if c.a_device_id == device.id else c.a_port
        n = _port_number(mine_port)
        if n is None:
            continue
        other = Device.query.get(other_id)
        by_number[n] = {
            "name": other.name if other else "?",
            "port": other_port,
            "rack_name": other.rack.name if other else None,
        }
    for p in ports:
        n = _port_number(p.get("port"))
        if n is None:
            continue
        match = by_number.get(n + 1)
        if match:
            p["connected_device"] = match
    return ports


@app.route("/api/san/devices")
def san_devices():
    devices = Device.query.join(Device.device_type).filter(DeviceType.category == "san-switch").all()
    return jsonify([
        {"id": d.id, "name": d.name, "rack_id": d.rack_id, "rack_name": d.rack.name,
         "vendor": d.device_type.vendor, "model": d.device_type.model,
         "san_config": (d.metadata_json or {}).get("san_config")}
        for d in devices
    ])


@app.route("/api/san/collect", methods=["POST"])
def san_collect():
    payload = request.get_json()
    device_id = payload.get("device_id")
    ip = (payload.get("ip") or "").strip()
    vendor = (payload.get("vendor") or "").strip().lower()
    port = payload.get("port")
    username = payload.get("username")
    password = payload.get("password")

    device = Device.query.get_or_404(device_id)
    if not ip or vendor not in ("brocade", "cisco"):
        return jsonify({"error": "ip and vendor (brocade/cisco) are required"}), 400

    fabric, error = san_collect_one(vendor, ip, username, password, port)
    if error:
        return jsonify({"error": error}), 502

    fabric["ip"] = ip
    fabric["device_id"] = device_id
    fabric["ports"] = _attach_cable_destinations(device, fabric.get("ports") or [])

    # Only the connection endpoint is kept — username/password are never written to disk.
    merged = dict(device.metadata_json or {})
    merged["san_config"] = {"ip": ip, "vendor": vendor, "port": port}
    device.metadata_json = merged

    snapshot = SanSnapshot(
        timestamp=datetime.now(timezone.utc), device_id=device_id,
        ip=ip, vendor=vendor, fabric=fabric,
    )
    db.session.add(snapshot)
    db.session.commit()

    return jsonify(snapshot.to_dict())


@app.route("/api/san/snapshot/<int:device_id>")
def san_snapshot(device_id):
    Device.query.get_or_404(device_id)
    row = SanSnapshot.query.filter_by(device_id=device_id).order_by(SanSnapshot.timestamp.desc()).first()
    return jsonify(row.to_dict() if row else None)


def _attach_storage_cable_destinations(device, ports):
    # Same purpose as _attach_cable_destinations (SAN) but a different naming scheme: the array's
    # own port ids ("A0", "B1", ...) are 0-indexed and map straight across — no +1 offset — to the
    # dell-me5-2u stencil's rear port names ("CtrlA P0", "CtrlB P1", ...), so this matches by exact
    # constructed name instead of by numeric index.
    cables = Cable.query.filter(
        db.or_(Cable.a_device_id == device.id, Cable.b_device_id == device.id)
    ).all()
    by_port_name = {}
    for c in cables:
        mine_port = c.a_port if c.a_device_id == device.id else c.b_port
        other_id = c.b_device_id if c.a_device_id == device.id else c.a_device_id
        other_port = c.b_port if c.a_device_id == device.id else c.a_port
        other = Device.query.get(other_id)
        by_port_name[mine_port] = {
            "name": other.name if other else "?",
            "port": other_port,
            "rack_name": other.rack.name if other else None,
        }
    for p in ports:
        controller = p.get("controller")
        num = re.sub(r"\D", "", p.get("port") or "")
        if not controller or not num:
            continue
        match = by_port_name.get(f"Ctrl{controller} P{num}")
        if match:
            p["connected_device"] = match
    return ports


@app.route("/api/storage/devices")
def storage_devices():
    devices = Device.query.join(Device.device_type).filter(DeviceType.category == "storage").all()
    return jsonify([
        {"id": d.id, "name": d.name, "rack_id": d.rack_id, "rack_name": d.rack.name,
         "vendor": d.device_type.vendor, "model": d.device_type.model,
         "storage_config": (d.metadata_json or {}).get("storage_config")}
        for d in devices
    ])


@app.route("/api/storage/collect", methods=["POST"])
def storage_collect():
    payload = request.get_json()
    device_id = payload.get("device_id")
    ip = (payload.get("ip") or "").strip()
    port = payload.get("port")
    username = payload.get("username")
    password = payload.get("password")

    device = Device.query.get_or_404(device_id)
    if not ip:
        return jsonify({"error": "ip is required"}), 400

    data, error = storage_collect_one(ip, username, password, port)
    if error:
        return jsonify({"error": error}), 502

    data["ip"] = ip
    data["device_id"] = device_id
    data["ports"] = _attach_storage_cable_destinations(device, data.get("ports") or [])

    merged = dict(device.metadata_json or {})
    merged["storage_config"] = {"ip": ip, "port": port}
    device.metadata_json = merged

    snapshot = StorageSnapshot(timestamp=datetime.now(timezone.utc), device_id=device_id, ip=ip, data=data)
    db.session.add(snapshot)
    db.session.commit()

    return jsonify(snapshot.to_dict())


@app.route("/api/storage/snapshot/<int:device_id>")
def storage_snapshot(device_id):
    Device.query.get_or_404(device_id)
    row = StorageSnapshot.query.filter_by(device_id=device_id).order_by(StorageSnapshot.timestamp.desc()).first()
    return jsonify(row.to_dict() if row else None)


def _attach_esxi_cable_destinations(device, nics):
    # vmnic names (vmnic0, vmnic1, ...) aren't the physical port labels rendered on the device —
    # metadata_json.vmnic_map (already used by LLDP matching, see _port_aliases) is the existing
    # translation table from vmnic name to the port label a Cable actually references.
    vmnic_map = (device.metadata_json or {}).get("vmnic_map") or {}
    cables = Cable.query.filter(
        db.or_(Cable.a_device_id == device.id, Cable.b_device_id == device.id)
    ).all()
    by_port_name = {}
    for c in cables:
        mine_port = c.a_port if c.a_device_id == device.id else c.b_port
        other_id = c.b_device_id if c.a_device_id == device.id else c.a_device_id
        other_port = c.b_port if c.a_device_id == device.id else c.a_port
        other = Device.query.get(other_id)
        by_port_name[mine_port] = {
            "name": other.name if other else "?",
            "port": other_port,
            "rack_name": other.rack.name if other else None,
        }
    for n in nics:
        physical_port = vmnic_map.get(n["name"], n["name"])
        n["physical_port"] = physical_port
        match = by_port_name.get(physical_port)
        if match:
            n["connected_device"] = match
    return nics


@app.route("/api/esxi/devices")
def esxi_devices():
    devices = Device.query.join(Device.device_type).filter(DeviceType.category == "server").all()
    return jsonify([
        {"id": d.id, "name": d.name, "rack_id": d.rack_id, "rack_name": d.rack.name,
         "vendor": d.device_type.vendor, "model": d.device_type.model,
         "esxi_config": (d.metadata_json or {}).get("esxi_config")}
        for d in devices
    ])


@app.route("/api/esxi/collect", methods=["POST"])
def esxi_collect():
    payload = request.get_json()
    device_id = payload.get("device_id")
    ip = (payload.get("ip") or "").strip()
    port = payload.get("port")
    username = payload.get("username")
    password = payload.get("password")

    device = Device.query.get_or_404(device_id)
    if not ip:
        return jsonify({"error": "ip is required"}), 400

    data, error = esxi_collect_one(ip, username, password, port)
    if error:
        return jsonify({"error": error}), 502

    data["ip"] = ip
    data["device_id"] = device_id
    data["nics"] = _attach_esxi_cable_destinations(device, data.get("nics") or [])

    merged = dict(device.metadata_json or {})
    merged["esxi_config"] = {"ip": ip, "port": port}
    device.metadata_json = merged

    snapshot = EsxiSnapshot(timestamp=datetime.now(timezone.utc), device_id=device_id, ip=ip, data=data)
    db.session.add(snapshot)
    db.session.commit()

    return jsonify(snapshot.to_dict())


@app.route("/api/esxi/snapshot/<int:device_id>")
def esxi_snapshot(device_id):
    Device.query.get_or_404(device_id)
    row = EsxiSnapshot.query.filter_by(device_id=device_id).order_by(EsxiSnapshot.timestamp.desc()).first()
    return jsonify(row.to_dict() if row else None)


@app.route("/api/idrac/devices")
def idrac_devices():
    # Same pool of devices as ESXi NIC Verification — this is the out-of-band BMC side of the
    # same physical server, not a different device.
    devices = Device.query.join(Device.device_type).filter(DeviceType.category == "server").all()
    return jsonify([
        {"id": d.id, "name": d.name, "rack_id": d.rack_id, "rack_name": d.rack.name,
         "vendor": d.device_type.vendor, "model": d.device_type.model,
         "idrac_config": (d.metadata_json or {}).get("idrac_config")}
        for d in devices
    ])


@app.route("/api/idrac/collect", methods=["POST"])
def idrac_collect():
    payload = request.get_json()
    device_id = payload.get("device_id")
    ip = (payload.get("ip") or "").strip()
    vendor = (payload.get("vendor") or "").strip().lower()
    port = payload.get("port")
    username = payload.get("username")
    password = payload.get("password")

    device = Device.query.get_or_404(device_id)
    if not ip or vendor not in ("dell", "hpe"):
        return jsonify({"error": "ip and vendor (dell/hpe) are required"}), 400

    data, error = idrac_collect_one(vendor, ip, username, password, port)
    if error:
        return jsonify({"error": error}), 502

    data["ip"] = ip
    data["device_id"] = device_id

    merged = dict(device.metadata_json or {})
    merged["idrac_config"] = {"ip": ip, "vendor": vendor, "port": port}
    device.metadata_json = merged

    snapshot = IdracSnapshot(timestamp=datetime.now(timezone.utc), device_id=device_id, ip=ip, data=data)
    db.session.add(snapshot)
    db.session.commit()

    return jsonify(snapshot.to_dict())


@app.route("/api/idrac/snapshot/<int:device_id>")
def idrac_snapshot(device_id):
    Device.query.get_or_404(device_id)
    row = IdracSnapshot.query.filter_by(device_id=device_id).order_by(IdracSnapshot.timestamp.desc()).first()
    return jsonify(row.to_dict() if row else None)


@app.route("/api/activity-log")
def activity_log():
    query = ActivityLog.query
    rack_id = request.args.get("rack_id", type=int)
    if rack_id:
        query = query.filter_by(rack_id=rack_id)
    entity_type = request.args.get("entity_type")
    if entity_type:
        query = query.filter_by(entity_type=entity_type)
    rows = query.order_by(ActivityLog.timestamp.desc()).limit(200).all()
    return jsonify([r.to_dict() for r in rows])


def _ensure_db_columns():
    # create_all() only adds missing TABLES, never columns on a table that already exists — an
    # existing dev/user DB predating a model change (e.g. Cable.waypoints) needs an explicit
    # ALTER TABLE or the new column is silently missing and every read/write 500s.
    with db.engine.connect() as conn:
        existing = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(cable)")}
        if "waypoints" not in existing:
            conn.exec_driver_sql("ALTER TABLE cable ADD COLUMN waypoints JSON")
            conn.commit()


def _ensure_db():
    first_run = not os.path.exists(DB_PATH)
    with app.app_context():
        if first_run:
            from seed import seed
            seed()
        else:
            db.create_all()  # safety net if a newer build adds a column/table
            _ensure_db_columns()


if __name__ == "__main__":
    if getattr(sys, "frozen", False):
        import threading
        import time
        import webbrowser

        _ensure_db()

        def _open_browser():
            time.sleep(1.2)
            webbrowser.open("http://127.0.0.1:5000")

        threading.Thread(target=_open_browser, daemon=True).start()
        app.run(host="127.0.0.1", debug=False, use_reloader=False, threaded=True)
    else:
        # Dev mode never runs seed.py automatically, but new tables (e.g. a fresh model added
        # to models.py) still need creating on an existing dev DB — create_all() only adds
        # what's missing, it never touches existing tables/rows.
        with app.app_context():
            db.create_all()
            _ensure_db_columns()
        app.run(host="127.0.0.1", debug=True, use_reloader=False, threaded=True)
