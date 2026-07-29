# RackView

A data-center rack elevation and cable-management tool. Visualize racks, devices, and cabling as realistic SVG diagrams — no build step, no framework, just Python/Flask and vanilla JS.

## Download

Just want to try it? Grab the Windows desktop build — no Python or install needed:

**[⬇ Download RackView.zip](https://github.com/kursatbal/rackview/releases/latest)** — unzip, run `RackView.exe`, it opens in your browser automatically with demo data.

(Unsigned `.exe` — Windows SmartScreen may warn "Unknown publisher" on first run; click **More info → Run anyway**.)

## Why

Tracking what's plugged into what in a data center usually means a spreadsheet, a Visio file nobody updates, or a trip to the DC. RackView keeps rack elevations, cabling, and device details in one place, browsable and searchable.

## Features

- **Realistic rack elevations** — 220+ real device models (Dell, HPE, Cisco, Arista, …), front/rear views, drag-and-drop placement, and empty U's auto-collapse so long gaps don't eat the screen
- **Smart cabling** — automatic front/rear port matching, medium-aware color/dash styles (fiber, DAC, Cat6a, power, SAS), routes that never cross over other ports
- **Configurable server rear panels** — pick FC/NIC port counts and speeds, LOM, and iDRAC per device instead of a fixed template; warns before deleting cables on ports you remove
- **Right-click actions** — jump to a cable's other end or delete it, show only one device's cabling, delete a device, rename a port/device/group label, drag labels out of the way
- **Search** (Ctrl+K) — find devices by IP, MAC, serial, port, or VLAN across every rack
- **Impact analysis** — "what breaks if this device goes down," including redundancy loss, across the whole customer's infrastructure
- **LLDP discovery** — paste switch LLDP output, match it against existing cabling, bulk-apply new/updated links
- **Multi-rack / floor view** — customer-isolated racks, a hall-level view, inter-rack cabling
- **Excel export** — download a rack's or a device's cabling as `.xlsx`

## Screenshots

<!-- Add screenshots to docs/ and reference them here, e.g.: -->
<!-- ![Rack view](docs/screenshot-rack.png) -->
<!-- ![Floor view](docs/screenshot-floor.png) -->

## Getting started

Requires Python 3.11+.

```bash
git clone https://github.com/kursatbal/rackview.git
cd rackview
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python seed.py                # first run only — creates and seeds the demo database
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

## Project structure

```
app.py           Flask app + REST API
models.py        SQLAlchemy models (Rack, Device, Cable, ...)
seed.py          Demo data generator
static/          Frontend — HTML/CSS + vanilla JS, rendered as inline SVG
```

## Tech stack

- Backend: Python, Flask, SQLAlchemy, SQLite
- Frontend: vanilla JavaScript + inline SVG — no React/Vue, no build step
- Export: openpyxl

## License

MIT — see [LICENSE](LICENSE).
