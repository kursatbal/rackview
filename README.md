# RackView

A data-center rack elevation and cable-management tool. Visualize racks, devices, and cabling as realistic SVG diagrams — no build step, no framework, just Python/Flask and vanilla JS.

## Why

Tracking what's plugged into what in a data center usually means a spreadsheet, a Visio file nobody updates, or a trip to the DC. RackView keeps rack elevations, cabling, and device details in one place, browsable and searchable.

## Features

- **Realistic rack elevations** — 220+ real device models (Dell, HPE, Cisco, Arista, …), front/rear views, drag-and-drop placement
- **Smart cabling** — automatic front/rear port matching, medium-aware color/dash styles (fiber, DAC, Cat6a, power, SAS), routes that never cross over other ports
- **Right-click actions** — jump to a cable's other end, show only one device's cabling, rename a port or a device label, drag labels out of the way
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
git clone https://github.com/<your-username>/rackview.git
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
