from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class DeviceType(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vendor = db.Column(db.String, nullable=False)
    model = db.Column(db.String, nullable=False)
    u_height = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String, nullable=False)
    stencil = db.Column(db.String, nullable=False)
    front_ports = db.Column(db.JSON, nullable=False, default=list)
    rear_ports = db.Column(db.JSON, nullable=False, default=list)

    def to_dict(self):
        return {
            "id": self.id,
            "vendor": self.vendor,
            "model": self.model,
            "u_height": self.u_height,
            "category": self.category,
            "stencil": self.stencil,
            "front_ports": self.front_ports,
            "rear_ports": self.rear_ports,
        }


class Rack(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    site = db.Column(db.String, nullable=False)
    u_height = db.Column(db.Integer, nullable=False, default=42)
    customer = db.Column(db.String, nullable=True)
    row = db.Column(db.Integer, nullable=False, default=1)
    col = db.Column(db.Integer, nullable=False, default=1)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "site": self.site,
            "u_height": self.u_height,
            "customer": self.customer,
            "row": self.row,
            "col": self.col,
        }


class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rack_id = db.Column(db.Integer, db.ForeignKey("rack.id"), nullable=False)
    device_type_id = db.Column(db.Integer, db.ForeignKey("device_type.id"), nullable=False)
    name = db.Column(db.String, nullable=False)
    position_u = db.Column(db.Integer, nullable=False)
    serial = db.Column(db.String, nullable=True)
    mgmt_ip = db.Column(db.String, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    owner_team = db.Column(db.String, nullable=True)
    warranty_end = db.Column(db.String, nullable=True)
    role_label = db.Column(db.String, nullable=True)
    line_cards = db.Column(db.JSON, nullable=True)
    metadata_json = db.Column(db.JSON, nullable=True)

    rack = db.relationship("Rack", backref="devices")
    device_type = db.relationship("DeviceType")

    def to_dict(self):
        return {
            "id": self.id,
            "rack_id": self.rack_id,
            "device_type_id": self.device_type_id,
            "name": self.name,
            "position_u": self.position_u,
            "serial": self.serial,
            "mgmt_ip": self.mgmt_ip,
            "notes": self.notes,
            "owner_team": self.owner_team,
            "warranty_end": self.warranty_end,
            "role_label": self.role_label,
            "line_cards": self.line_cards,
            "metadata_json": self.metadata_json,
            "device_type": self.device_type.to_dict(),
        }


class Cable(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    a_device_id = db.Column(db.Integer, db.ForeignKey("device.id"), nullable=False)
    a_port = db.Column(db.String, nullable=False)
    b_device_id = db.Column(db.Integer, db.ForeignKey("device.id"), nullable=False)
    b_port = db.Column(db.String, nullable=False)
    medium = db.Column(db.String, nullable=False)
    label = db.Column(db.String, nullable=True)
    color = db.Column(db.String, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "a_device_id": self.a_device_id,
            "a_port": self.a_port,
            "b_device_id": self.b_device_id,
            "b_port": self.b_port,
            "medium": self.medium,
            "label": self.label,
            "color": self.color,
        }


class ArpEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey("device.id"), nullable=False)
    ip = db.Column(db.String, nullable=False)
    mac = db.Column(db.String, nullable=False)
    port = db.Column(db.String, nullable=False)
    vlan = db.Column(db.String, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "device_id": self.device_id,
            "ip": self.ip,
            "mac": self.mac,
            "port": self.port,
            "vlan": self.vlan,
        }
