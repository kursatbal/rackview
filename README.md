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
- **LLDP discovery & change detection** — paste switch LLDP output, match it against existing cabling; changed/new/removed/matched links are called out and can be marked on the rack itself
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

## Changelog

**UX & readability**
- Contrast pass on faint text (rail U-numbers, device labels, secondary text) to meet WCAG AA
- Long runs of empty U's collapse into a single "N U empty (click to expand)" row instead of eating the whole screen
- Blank panel fields (Owner team, Warranty, etc.) are hidden instead of shown as `-`
- Tighter side-panel and general spacing

**Configurable server rear panels**
- Server rear ports are now per-device configurable instead of a fixed template: FC (0/2/4/6 ports, 16/32/64Gb), NIC (0/2/4/6, 10/25/100GbE), LOM, and iDRAC can each be set independently
- The three port types are visually distinct (FC green, NIC dark, LOM copper) and each gets the right cable medium automatically
- Devices left on the model default render exactly as before — nothing already placed changes

**LLDP-based cable change detection**
- Comparing pasted LLDP output against recorded cabling now reports four states: changed (red), new (green), removed (yellow), and matched (silent)
- Changed ports are marked on the rack itself with a thin colored outline — not a big circle, so dense/two-row port layouts stay readable
- A summary panel lists every difference with an action (update/ignore/delete) per item
- Every comparison is saved to a **discovery history**: pick a past run from the list to see its results again without re-pasting, and each entry tracks whether its changes were applied or are still pending

**Cable-creation flow**
- Port click targets are slightly larger so an edge click still registers, without overlapping neighboring ports
- After the first click, the cable end follows the cursor to the second port instead of giving no feedback
- Step-by-step hints, dimmed invalid targets, ESC to cancel, and a confirmation toast on success

**Cable routing rewrite**
- Cables now enter/exit every port vertically (from above for the top row, from below for the bottom row) instead of cutting across the row
- Fixed a routing bug where a cable to a dense multi-row switch could sweep straight across every other port on the way to its target
- Fixed a routing bug where rack units stacked with zero U of gap between them (the common case) could cause a cable to sweep across the neighboring device
- Parallel cables get more breathing room in the side lanes so they no longer visually overlap
- Fiber/LC connector artwork always renders horizontal, even though the cable itself still enters the port vertically

**Manual cable routing**
- Grab any point along a selected cable and drag to override its auto-routed path with your own bend point
- Existing bend points can be dragged again to fine-tune, or right-clicked to remove just that one
- "Reset routing" in the cable's right-click menu discards the manual override and returns to the auto-routed path
- Dragging snaps to nearby corners of any other cable (auto-routed or manually routed), with a small on-screen readout of the current position — a soft magnet only, never blocks the drag
- Manual routes are always orthogonal — every segment is purely horizontal or vertical, an automatic right-angle corner is inserted between any two points that aren't aligned, so a cable can never render as a diagonal line

**FortiGate port artwork**
- Copper (RJ45) and fiber (SFP/SFP+/SFP28) ports now render with a clearly different tone — dark gray with a gold pin for copper, dark navy with a blue accent for fiber — instead of looking identical
- QSFP ports (on 2U models, and the 1000F's QSFP+ uplinks) render visibly larger than SFP, in the same fiber tone
- 1U models split their copper ports into two rows (top/bottom) instead of one long strip, matching real hardware and roughly halving the device's apparent width
- Port counts per model now match vendor datasheets (previously approximate placeholders) — e.g. the 3500F is fiber-heavy (2 copper + 32 SFP28 + 6 QSFP28) while the 1000F carries 2 QSFP+ uplinks alongside its RJ45/SFP28 ports

**Exact-match firewall front panels**
- All 10 FortiGate models (90G through 3500F) and the Palo Alto PA-1400/PA-3400 series now render a hand-matched replica of their real front panel — exact port grouping, position, and labeling (e.g. `x1`-`x8`, `ha1`/`ha2`, `mgmt1`/`mgmt2`) taken directly from each vendor's official datasheet, down to details like FortiGate's odd-top/even-bottom port numbering and the 90G's shared copper/SFP+ media ports
- Corrected the FortiGate 1000F's rack height (it's a 2U chassis, not 1U as previously listed) and its port counts, which were off from the real hardware
- Port counts for Cisco Firepower/Secure Firewall, Juniper SRX, and Check Point Quantum models were corrected against their datasheets (no dedicated front-panel diagram was available for these, so they stay on the parametric layout for now)
- Fixed a bug in the parametric firewall templates where a model with legitimately zero of a port type (e.g. Check Point 16600 has no SFP ports) would silently fall back to a default count instead of drawing none
- A dense layout (e.g. the 2600F's 18 copper + 16 SFP + 4 QSFP in 2U) scales down proportionally if needed so ports never overlap or run into the LCD/management panel

## License

MIT — see [LICENSE](LICENSE).
