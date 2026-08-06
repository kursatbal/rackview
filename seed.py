import json
import os

from app import app
from models import db, DeviceType, Rack, Device, Cable, ArpEntry

with open(os.path.join(os.path.dirname(__file__), "device_ports.json"), encoding="utf-8") as f:
    DEVICE_PORTS = json.load(f)

RV_DEVICE_CATALOG = [
    ('Dell', 'PowerEdge R470', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R670', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R6715', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R6725', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R4715', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R660', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R660xs', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R6615', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R6625', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R360', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R260', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R650', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R650xs', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R6515', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R6525', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R450', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R350', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R250', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R640', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R440', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R340', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R240', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R6415', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge XR5610', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R770', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R770AP', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R570', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R7715', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R7725', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R7725xd', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R5715', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R760', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R760xs', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R760xa', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R760xd2', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R860', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R7615', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R7625', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R750', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R750xs', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R750xa', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R550', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R7515', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R7525', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R740', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R740xd', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R540', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R840', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R7415', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge R7425', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge XR7620', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge HS5620', 2, 'server', 'dell-rack-2u'),
    ('Dell', 'PowerEdge HS5610', 1, 'server', 'dell-rack-1u'),
    ('Dell', 'PowerEdge R940', 3, 'server', 'dell-rack-4u'),
    ('Dell', 'PowerEdge R960', 4, 'server', 'dell-rack-4u'),
    ('Dell', 'PowerEdge R940xa', 4, 'server', 'dell-rack-4u'),
    ('Dell', 'PowerEdge XE8640', 4, 'server', 'dell-rack-4u'),
    ('Dell', 'PowerEdge XE9680', 6, 'server', 'dell-rack-4u'),
    ('HPE', 'ProLiant DL320 Gen12', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL360 Gen12', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL325 Gen12', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL320 Gen11', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL360 Gen11', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL325 Gen11', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL365 Gen11', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant RL300 Gen11', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL360 Gen10 Plus', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL325 Gen10 Plus v2', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL365 Gen10 Plus', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL20 Gen10 Plus', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL360 Gen10', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL325 Gen10', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL160 Gen10', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL20 Gen10', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL360 Gen9', 1, 'server', 'hpe-rack-1u'),
    ('HPE', 'ProLiant DL340 Gen12', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL380 Gen12', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL345 Gen12', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL380 Gen11', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL345 Gen11', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL385 Gen11', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL560 Gen11', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL380 Gen10 Plus', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL345 Gen10 Plus', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL385 Gen10 Plus v2', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL380 Gen10', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL385 Gen10', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL560 Gen10', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL180 Gen10', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL380 Gen9', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL560 Gen9', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'Apollo 4200 Gen10 Plus', 2, 'server', 'hpe-rack-2u'),
    ('HPE', 'ProLiant DL380a Gen12', 4, 'server', 'dell-rack-4u'),
    ('HPE', 'ProLiant DL380a Gen11', 4, 'server', 'dell-rack-4u'),
    ('HPE', 'ProLiant DL580 Gen10', 4, 'server', 'dell-rack-4u'),
    ('HPE', 'ProLiant DL580 Gen9', 4, 'server', 'dell-rack-4u'),
    ('Cisco', 'Catalyst 9300-48P', 1, 'switch', 'switch-1u-rj45'),
    ('Cisco', 'Catalyst 9300-24P', 1, 'switch', 'switch-1u-rj45'),
    ('Cisco', 'Catalyst 9300X-48HX', 1, 'switch', 'switch-1u-rj45'),
    ('Cisco', 'Catalyst 9200-48T', 1, 'switch', 'switch-1u-rj45'),
    ('Cisco', 'Catalyst 9200L-24P', 1, 'switch', 'switch-1u-rj45'),
    ('Cisco', 'Catalyst 9500-48Y4C', 1, 'switch', 'switch-1u-sfp'),
    ('Cisco', 'Nexus 93180YC-FX', 1, 'switch', 'switch-1u-sfp'),
    ('Cisco', 'Nexus 93180YC-EX', 1, 'switch', 'switch-1u-sfp'),
    ('Cisco', 'Nexus 93108TC-EX', 1, 'switch', 'switch-1u-rj45'),
    ('Cisco', 'Nexus 92300YC', 1, 'switch', 'switch-1u-sfp'),
    ('Cisco', 'Nexus 92348GC-FX3', 1, 'switch', 'switch-1u-rj45'),
    ('Cisco', 'Nexus 9336C-FX2', 1, 'switch', 'switch-1u-sfp'),
    ('Cisco', 'MDS 9148T', 1, 'san-switch', 'switch-1u-sfp'),
    ('Dell', 'PowerSwitch S5248F-ON', 1, 'switch', 'switch-1u-sfp'),
    ('Dell', 'PowerSwitch S5224F-ON', 1, 'switch', 'switch-1u-sfp'),
    ('Dell', 'PowerSwitch S4148F-ON', 1, 'switch', 'switch-1u-sfp'),
    ('Dell', 'PowerSwitch S4148T-ON', 1, 'switch', 'switch-1u-rj45'),
    ('Dell', 'PowerSwitch S4128F-ON', 1, 'switch', 'switch-1u-sfp'),
    ('Dell', 'PowerSwitch N3248TE-ON', 1, 'switch', 'switch-1u-rj45'),
    ('Aruba', 'Aruba CX 6300M 48G', 1, 'switch', 'switch-1u-rj45'),
    ('Aruba', 'Aruba CX 6200F 48G', 1, 'switch', 'switch-1u-rj45'),
    ('Aruba', 'Aruba CX 8325-48Y8C', 1, 'switch', 'switch-1u-sfp'),
    ('Aruba', 'Aruba 2930F 48G', 1, 'switch', 'switch-1u-rj45'),
    ('Broadcom', 'Brocade G620', 1, 'san-switch', 'switch-1u-sfp'),
    ('Broadcom', 'Brocade G610', 1, 'san-switch', 'switch-1u-sfp'),
    ('Brocade', 'Brocade 300B', 1, 'san-switch', 'switch-1u-sfp'),
    ('Pure Storage', 'FlashArray//X R4', 3, 'storage', 'pure-flasharray'),
    ('Pure Storage', 'FlashArray//X R5', 3, 'storage', 'pure-flasharray'),
    ('Pure Storage', 'FlashArray//C R4', 3, 'storage', 'pure-flasharray'),
    ('Pure Storage', 'FlashArray//C R5', 3, 'storage', 'pure-flasharray'),
    ('Pure Storage', 'FlashArray//XL 130', 5, 'storage', 'pure-flasharray'),
    ('Pure Storage', 'FlashArray//XL 170', 5, 'storage', 'pure-flasharray'),
    ('Pure Storage', 'FlashArray//E', 3, 'storage', 'pure-flasharray'),
    ('Dell', 'PowerVault ME5024', 2, 'storage', 'dell-me5-2u'),
    ('Dell', 'PowerVault ME5012', 2, 'storage', 'dell-me5-2u'),
    ('Dell', 'PowerVault ME5084', 5, 'storage', 'dell-me5-2u'),
    ('Dell', 'PowerVault ME4024', 2, 'storage', 'dell-me5-2u'),
    ('Dell', 'PowerVault ME4012', 2, 'storage', 'dell-me5-2u'),
    ('Dell', 'PowerStore 500T', 2, 'storage', 'dell-me5-2u'),
    ('Dell', 'PowerStore 1200T', 2, 'storage', 'dell-me5-2u'),
    ('Dell', 'PowerStore 3200T', 2, 'storage', 'dell-me5-2u'),
    ('Dell', 'Unity XT 380F', 2, 'storage', 'dell-me5-2u'),
    ('Dell', 'Unity XT 480F', 2, 'storage', 'dell-me5-2u'),
    ('APC', 'AP8659 PDU', 1, 'pdu', 'pdu-1u-horizontal'),
    ('APC', 'AP7921B PDU', 1, 'pdu', 'pdu-1u-horizontal'),
    ('Generic', 'Fiber Patch Panel 24× LC', 1, 'patch-panel', 'patch-panel-lc'),
    ('Generic', 'Fiber Patch Panel 12× LC', 1, 'patch-panel', 'patch-panel-lc'),
    ('Generic', 'Copper Patch Panel 24× RJ45', 1, 'patch-panel', 'patch-panel-cat'),
    ('Generic', 'Blank Filler 1U', 1, 'panel', 'blank-filler'),
    ('Generic', 'Blank Filler 2U', 2, 'panel', 'blank-filler'),
    ('Generic', 'Brush Panel 1U', 1, 'passthrough', 'brush-panel'),
    ('Generic', 'Brush Panel 2U', 2, 'passthrough', 'brush-panel'),
    ('Generic', 'Cable Manager 1U', 1, 'passthrough', 'cable-manager'),
    ('Generic', 'Cable Manager 2U', 2, 'passthrough', 'cable-manager'),
    ('Fortinet', 'FortiGate 200G', 1, 'firewall', 'firewall-1u'),
    ('Fortinet', 'FortiGate 400F', 1, 'firewall', 'firewall-1u'),
    ('Fortinet', 'FortiGate 600F', 1, 'firewall', 'firewall-1u'),
    ('Fortinet', 'FortiGate 900G', 1, 'firewall', 'firewall-1u'),
    ('Fortinet', 'FortiGate 1000F', 1, 'firewall', 'firewall-1u'),
    ('Fortinet', 'FortiGate 1800F', 2, 'firewall', 'firewall-2u'),
    ('Fortinet', 'FortiGate 2600F', 2, 'firewall', 'firewall-2u'),
    ('Fortinet', 'FortiGate 3500F', 2, 'firewall', 'firewall-2u'),
    ('Fortinet', 'FortiGate 90G', 1, 'firewall', 'firewall-1u'),
    ('Fortinet', 'FortiGate 120G', 1, 'firewall', 'firewall-1u'),
    ('Palo Alto', 'PA-3410', 1, 'firewall', 'firewall-1u'),
    ('Palo Alto', 'PA-3420', 1, 'firewall', 'firewall-1u'),
    ('Palo Alto', 'PA-3440', 1, 'firewall', 'firewall-1u'),
    ('Palo Alto', 'PA-5410', 2, 'firewall', 'firewall-2u'),
    ('Palo Alto', 'PA-5420', 2, 'firewall', 'firewall-2u'),
    ('Palo Alto', 'PA-5430', 2, 'firewall', 'firewall-2u'),
    ('Palo Alto', 'PA-5440', 2, 'firewall', 'firewall-2u'),
    ('Palo Alto', 'PA-1410', 1, 'firewall', 'firewall-1u'),
    ('Palo Alto', 'PA-1420', 1, 'firewall', 'firewall-1u'),
    ('Cisco', 'Firepower 1140', 1, 'firewall', 'firewall-1u'),
    ('Cisco', 'Firepower 2130', 1, 'firewall', 'firewall-1u'),
    ('Cisco', 'Firepower 2140', 1, 'firewall', 'firewall-1u'),
    ('Cisco', 'Secure Firewall 3120', 1, 'firewall', 'firewall-1u'),
    ('Cisco', 'Secure Firewall 3140', 1, 'firewall', 'firewall-1u'),
    ('Cisco', 'Firepower 4115', 2, 'firewall', 'firewall-2u'),
    ('Cisco', 'Firepower 4125', 2, 'firewall', 'firewall-2u'),
    ('Cisco', 'Firepower 9300', 2, 'firewall', 'firewall-2u'),
    ('Juniper', 'SRX1500', 1, 'firewall', 'firewall-1u'),
    ('Juniper', 'SRX4100', 1, 'firewall', 'firewall-1u'),
    ('Juniper', 'SRX4200', 1, 'firewall', 'firewall-1u'),
    ('SonicWall', 'SonicWall NSa 4700', 1, 'firewall', 'firewall-1u'),
    ('SonicWall', 'SonicWall NSa 6700', 1, 'firewall', 'firewall-1u'),
    ('Check Point', 'Check Point 6600', 1, 'firewall', 'firewall-1u'),
    ('Check Point', 'Check Point 16600', 2, 'firewall', 'firewall-2u'),
    ('Cisco', 'ISR 4321', 1, 'router', 'router-1u'),
    ('Cisco', 'ISR 4331', 1, 'router', 'router-1u'),
    ('Cisco', 'ISR 4351', 1, 'router', 'router-1u'),
    ('Cisco', 'ISR 4431', 1, 'router', 'router-1u'),
    ('Cisco', 'ISR 4451-X', 2, 'router', 'router-2u'),
    ('Cisco', 'ASR 1001-X', 1, 'router', 'router-1u'),
    ('Cisco', 'ASR 1001-HX', 1, 'router', 'router-1u'),
    ('Cisco', 'ASR 1002-HX', 2, 'router', 'router-2u'),
    ('Cisco', 'Catalyst 8200L', 1, 'router', 'router-1u'),
    ('Cisco', 'Catalyst 8300-1N1S', 1, 'router', 'router-1u'),
    ('Cisco', 'Catalyst 8300-2N2S', 2, 'router', 'router-2u'),
    ('Cisco', 'Catalyst 8500-12X', 2, 'router', 'router-2u'),
    ('Juniper', 'MX204', 1, 'router', 'router-1u'),
    ('Juniper', 'MX10003', 2, 'router', 'router-2u'),
    ('Juniper', 'ACX7100-32C', 1, 'switch', 'spine-switch'),
    ('Cisco', 'Nexus 9364C', 2, 'switch', 'spine-switch'),
    ('Cisco', 'Nexus 9332C', 1, 'switch', 'spine-switch'),
    ('Cisco', 'Nexus 9316D-GX', 1, 'switch', 'spine-switch'),
    ('Cisco', 'Nexus 9348D-GX2A', 2, 'switch', 'spine-switch'),
    ('Cisco', 'Nexus 9408', 4, 'switch', 'spine-switch'),
    ('Dell', 'PowerSwitch Z9432F-ON', 1, 'switch', 'spine-switch'),
    ('Dell', 'PowerSwitch Z9664F-ON', 2, 'switch', 'spine-switch'),
    ('Dell', 'PowerSwitch Z9332F-ON', 1, 'switch', 'spine-switch'),
    ('Arista', 'Arista 7050CX3-32S', 1, 'switch', 'spine-switch'),
    ('Arista', 'Arista 7060CX-32S', 1, 'switch', 'spine-switch'),
    ('Arista', 'Arista 7280CR3-32P4', 1, 'switch', 'spine-switch'),
    ('Aruba', 'Aruba CX 8360-32Y4C', 1, 'switch', 'spine-switch'),
    ('Aruba', 'Aruba CX 9300-32D', 1, 'switch', 'spine-switch'),
    ('Cisco', 'Nexus 9504', 7, 'switch', 'modular-chassis'),
    ('Cisco', 'Nexus 9508', 13, 'switch', 'modular-chassis'),
    ('Cisco', 'Nexus 9516', 21, 'switch', 'modular-chassis'),
    ('Cisco', 'Catalyst 9606R', 6, 'switch', 'modular-chassis'),
    ('Cisco', 'Catalyst 9410R', 13, 'switch', 'modular-chassis'),
    ('Juniper', 'MX480', 8, 'switch', 'modular-chassis'),
    ('Juniper', 'MX960', 16, 'switch', 'modular-chassis'),
    ('Arista', 'Arista 7504R3', 7, 'switch', 'modular-chassis'),
    ('Arista', 'Arista 7508R3', 13, 'switch', 'modular-chassis'),
]


def seed():
    db.drop_all()
    db.create_all()

    types_by_model = {}
    device_types = []
    for vendor, model, u_height, category, stencil in RV_DEVICE_CATALOG:
        ports = DEVICE_PORTS.get(model, {"front": [], "rear": []})
        t = DeviceType(vendor=vendor, model=model, u_height=u_height, category=category,
                        stencil=stencil, front_ports=ports["front"], rear_ports=ports["rear"])
        device_types.append(t)
        types_by_model[model] = t
    db.session.add_all(device_types)
    db.session.commit()

    rack = Rack(name="RACK-01", site="DC-IST", u_height=42, customer="DEMO", row=1, col=1)
    db.session.add(rack)
    db.session.commit()

    rack2 = Rack(name="RACK-02", site="DC-IST", u_height=42, customer="DEMO", row=1, col=2)
    rack3 = Rack(name="RACK-03", site="DC-AMS", u_height=42, customer="ACME", row=1, col=1)
    db.session.add_all([rack2, rack3])
    db.session.commit()

    def place(name, model, position_u, target_rack=None, **kw):
        t = types_by_model[model]
        d = Device(rack_id=(target_rack or rack).id, device_type_id=t.id, name=name, position_u=position_u, **kw)
        db.session.add(d)
        db.session.flush()
        return d

    pp_01 = place("PP-01", "Fiber Patch Panel 24× LC", 42)
    sw_core_01 = place("SW-CORE-01", "Nexus 93180YC-FX", 41,
                        serial="FDO2542X0AB", mgmt_ip="10.10.0.1",
                        metadata_json={
                            "config": (
                                "interface Vlan10\n"
                                " description mgmt\n"
                                " ip address 10.10.0.1/24\n"
                                "interface Eth1/1\n"
                                " switchport mode trunk\n"
                                " switchport trunk allowed vlan 100,200,300\n"
                            )
                        })
    sw_core_02 = place("SW-CORE-02", "PowerSwitch S5248F-ON", 40,
                        serial="CN12345ABCDE", mgmt_ip="10.10.0.2",
                        metadata_json={
                            "config": (
                                "interface vlan10\n"
                                " ip address 10.10.0.2/24\n"
                                "interface ethernet1/1/1\n"
                                " switchport mode trunk\n"
                                " switchport trunk allowed vlan 100,200,300\n"
                            )
                        })
    esx_01 = place("ESX-01", "PowerEdge R750", 38,
                    serial="SVC1PLR75001", mgmt_ip="10.10.1.11",
                    metadata_json={
                        "esxi_build": "ESXi 8.0 U3 build 24022510",
                        "vmnic_map": {"vmnic0": "LOM Gb1", "vmnic1": "LOM Gb2"},
                        "vmotion_ip": "10.10.2.11",
                        "oob_ip": "10.10.0.21",
                    })
    esx_02 = place("ESX-02", "PowerEdge R750", 36,
                    serial="SVC1PLR75002", mgmt_ip="10.10.1.12",
                    metadata_json={
                        "esxi_build": "ESXi 8.0 U3 build 24022510",
                        "vmnic_map": {"vmnic0": "LOM Gb1", "vmnic1": "LOM Gb2"},
                        "vmotion_ip": "10.10.2.12",
                        "oob_ip": "10.10.0.22",
                    })
    esx_03 = place("ESX-03", "ProLiant DL380 Gen11", 34,
                    serial="CZ2431ABCD", mgmt_ip="10.10.1.13",
                    metadata_json={
                        "esxi_build": "ESXi 8.0 U3 build 24022510",
                        "vmnic_map": {"vmnic0": "OCP1 P1", "vmnic1": "OCP1 P2"},
                        "vmotion_ip": "10.10.2.13",
                        "oob_ip": "10.10.0.23",
                    })
    san_01 = place("SAN-01", "PowerVault ME5024", 32,
                    serial="MVE5024S001", mgmt_ip="10.10.3.5",
                    metadata_json={
                        "disk_count": 24,
                        "disk_type": "2.5in SAS SSD",
                        "cluster_ip": "10.10.3.10",
                        "ctrl_ips": {"CtrlA": "10.10.3.5", "CtrlB": "10.10.3.6"},
                        "raid_group": "RAID6 DG1",
                        "volume_mapping": {"DG1-VOL1": ["ESX-01", "ESX-02", "ESX-03"]},
                    })
    pdu_a = place("PDU-A", "AP8659 PDU", 1, serial="5A1234E12345", mgmt_ip="10.10.9.1")
    pdu_b = place("PDU-B", "AP8659 PDU", 2, serial="5A1234E67890", mgmt_ip="10.10.9.2")

    db.session.commit()

    cable_defs = [
        (esx_01, "LOM Gb1", sw_core_01, "Eth1/1", "cat6a",
         "interface Ethernet1/1\n description ESX-01 LOM Gb1\n switchport mode access\n"
         " switchport access vlan 100\n spanning-tree port type edge"),
        (esx_01, "LOM Gb2", sw_core_02, "Te1/0/1", "cat6a",
         "interface ethernet1/1/1\n description ESX-01 LOM Gb2\n switchport mode access\n"
         " switchport access vlan 100\n spanning-tree port type edge"),
        (esx_01, "iDRAC", sw_core_01, "Eth1/25", "cat6a",
         "interface Ethernet1/25\n description ESX-01 iDRAC\n switchport mode access\n switchport access vlan 10"),
        (esx_01, "FC1 Port 1", san_01, "CtrlA P0", "fiber",
         "Direct-attach 16Gb FC\nSingle-initiator zoning · no switch fabric"),

        (esx_02, "LOM Gb1", sw_core_01, "Eth1/2", "cat6a",
         "interface Ethernet1/2\n description ESX-02 LOM Gb1\n switchport mode access\n"
         " switchport access vlan 100\n spanning-tree port type edge"),
        (esx_02, "LOM Gb2", sw_core_02, "Te1/0/2", "cat6a",
         "interface ethernet1/1/2\n description ESX-02 LOM Gb2\n switchport mode access\n"
         " switchport access vlan 100\n spanning-tree port type edge"),
        (esx_02, "iDRAC", sw_core_01, "Eth1/26", "cat6a",
         "interface Ethernet1/26\n description ESX-02 iDRAC\n switchport mode access\n switchport access vlan 10"),
        (esx_02, "FC1 Port 1", san_01, "CtrlA P1", "fiber",
         "Direct-attach 16Gb FC\nSingle-initiator zoning · no switch fabric"),

        (esx_03, "OCP1 P1", sw_core_01, "Eth1/3", "dac",
         "interface Ethernet1/3\n description ESX-03 OCP1 P1 (trunk)\n switchport mode trunk\n"
         " switchport trunk allowed vlan 100,200,300\n spanning-tree port type edge trunk"),
        (esx_03, "OCP1 P2", sw_core_02, "Te1/0/3", "dac",
         "interface ethernet1/1/3\n description ESX-03 OCP1 P2 (trunk)\n switchport mode trunk\n"
         " switchport trunk allowed vlan 100,200,300\n spanning-tree port type edge trunk"),
        (esx_03, "iDRAC", sw_core_01, "Eth1/27", "cat6a",
         "interface Ethernet1/27\n description ESX-03 iDRAC\n switchport mode access\n switchport access vlan 10"),

        (san_01, "CtrlA mgmt", sw_core_01, "Eth1/28", "cat6a",
         "interface Ethernet1/28\n description SAN-01 CtrlA mgmt\n switchport mode access\n switchport access vlan 10"),
        (san_01, "CtrlB mgmt", sw_core_02, "Te1/0/4", "cat6a",
         "interface ethernet1/1/4\n description SAN-01 CtrlB mgmt\n switchport mode access\n switchport access vlan 10"),

        (sw_core_01, "Eth1/50", pp_01, "LC 1", "fiber",
         "interface Ethernet1/50\n description Uplink to DC-2 (PP-01 LC1)\n switchport mode trunk\n"
         " switchport trunk allowed vlan 100,200,300,900"),
    ]
    for a_dev, a_port, b_dev, b_port, medium, label in cable_defs:
        db.session.add(Cable(a_device_id=a_dev.id, a_port=a_port, b_device_id=b_dev.id, b_port=b_port,
                              medium=medium, label=label))

    # RACK-02 — same customer (DEMO) as RACK-01, exercises inter-rack cabling
    sw_edge_01 = place("SW-EDGE-01", "Arista 7050CX3-32S", 41, target_rack=rack2,
                        serial="ARI7050X001", mgmt_ip="10.20.0.1",
                        metadata_json={"sw_version": "EOS 4.31.2F"})
    esx_11 = place("ESX-11", "PowerEdge R660xs", 38, target_rack=rack2,
                    serial="SVC1PLR66011", mgmt_ip="10.20.1.11",
                    metadata_json={
                        "esxi_build": "ESXi 8.0 U3 build 24022510",
                        "vmnic_map": {"vmnic0": "OCP1 P1"},
                        "oob_ip": "10.20.0.21",
                    })
    db.session.add(Cable(
        a_device_id=esx_11.id, a_port="OCP1 P1", b_device_id=sw_edge_01.id, b_port="Et1",
        medium="dac", label="access 100 data",
    ))
    db.session.add(Cable(
        a_device_id=sw_edge_01.id, a_port="Et32", b_device_id=sw_core_01.id, b_port="Eth1/49",
        medium="dac", label="inter-rack uplink RACK-02 -> RACK-01, trunk 100,200,300",
    ))

    # RACK-03 — different customer (ACME), exercises data isolation
    acme_sw_01 = place("ACME-SW-01", "Nexus 93180YC-FX", 41, target_rack=rack3,
                        serial="ACME0001SW", mgmt_ip="10.99.0.1",
                        metadata_json={"config": "interface Vlan10\n ip address 10.99.0.1/24\n"})
    acme_esx_01 = place("ACME-ESX-01", "PowerEdge R750", 38, target_rack=rack3,
                         serial="ACME0001SRV", mgmt_ip="10.99.1.11",
                         metadata_json={"esxi_build": "ESXi 8.0 U2 build 22380479"})
    db.session.add(Cable(
        a_device_id=acme_esx_01.id, a_port="LOM Gb1", b_device_id=acme_sw_01.id, b_port="Eth1/1",
        medium="cat6a", label="access 100 data",
    ))

    arp_entries = [
        ArpEntry(device_id=sw_core_01.id, ip="10.10.1.11", mac="0050.56a1.3f21", port="Eth1/1", vlan="100"),
        ArpEntry(device_id=sw_core_01.id, ip="10.10.1.12", mac="0050.56a1.3f22", port="Eth1/2", vlan="100"),
        ArpEntry(device_id=sw_core_01.id, ip="10.10.1.13", mac="0050.56a1.3f23", port="Eth1/3", vlan="100"),
        ArpEntry(device_id=sw_core_01.id, ip="10.10.0.2", mac="0050.56a1.3f01", port="mgmt0", vlan="10"),
        ArpEntry(device_id=sw_core_02.id, ip="10.10.1.11", mac="0050.56a1.4f21", port="Te1/0/1", vlan="100"),
        ArpEntry(device_id=sw_core_02.id, ip="10.10.1.12", mac="0050.56a1.4f22", port="Te1/0/2", vlan="100"),
        ArpEntry(device_id=sw_core_02.id, ip="10.10.1.13", mac="0050.56a1.4f23", port="Te1/0/3", vlan="100"),
        ArpEntry(device_id=sw_core_02.id, ip="10.10.3.5", mac="0050.56a1.4f30", port="Te1/0/4", vlan="10"),
        ArpEntry(device_id=sw_core_02.id, ip="10.10.0.1", mac="0050.56a1.4f01", port="mgmt0", vlan="10"),
    ]
    db.session.add_all(arp_entries)

    db.session.commit()
    print("seeded rack", rack.id)


if __name__ == "__main__":
    with app.app_context():
        seed()
