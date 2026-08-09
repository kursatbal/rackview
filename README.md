# RackView

A data-center rack elevation and cable-management tool. Visualize racks, devices, and cabling as realistic SVG diagrams — no build step, no framework, just Python/Flask and vanilla JS.

## Download

Just want to try it? Grab the Windows desktop build — no Python or install needed:

**[⬇ Download RackView.zip](https://github.com/kursatbal/rackview/releases/latest)** — unzip, run `RackView.exe`, it opens in your browser automatically with demo data.

(Unsigned `.exe` — Windows SmartScreen may warn "Unknown publisher" on first run; click **More info → Run anyway**.)

## Why

Tracking what's plugged into what in a data center usually means a spreadsheet, a Visio file nobody updates, or a trip to the DC. RackView keeps rack elevations, cabling, and device details in one place, browsable and searchable.

## Features

- **Realistic rack elevations** — 220+ real device models (Dell, HPE, Cisco, Arista, Juniper, Fortinet, Palo Alto, Brocade, …) across switch, SAN switch, router, firewall, server, and storage categories, front/rear views, drag-and-drop placement, and empty U's auto-collapse so long gaps don't eat the screen
- **Smart cabling** — automatic front/rear port matching, medium-aware color/dash styles (fiber, DAC, Cat6a, power, SAS), routes that never cross over other ports
- **Configurable server rear panels** — pick FC/NIC port counts and speeds, LOM, and iDRAC per device instead of a fixed template; warns before deleting cables on ports you remove
- **Right-click actions** — jump to a cable's other end or delete it, show only one device's cabling, delete a device, rename a port/device/group label, drag labels out of the way
- **Search** (Ctrl+K) — find devices by IP, MAC, serial, port, or VLAN across every rack
- **Impact analysis** — "what breaks if this device goes down," including redundancy loss, across the whole customer's infrastructure
- **LLDP Discovery** — paste switch LLDP output; it's saved as an informational note on each port (surfaced in the device panel) without ever touching cabling
- **LLDP Auto-Cabling** — a separate tool that matches LLDP neighbors against existing cabling and creates/updates/removes cables, with a review step per link and a picker/shortcut for neighbors that aren't in the rack yet
- **SAN Switch Mapping** — pick a SAN switch already placed in a rack, enter its IP and login, and pull live port/zoning info over SSH (Brocade FOS or Cisco MDS); the username/password are used once and never saved
- **Storage Mapping** — same idea for Dell PowerVault/ME storage arrays: pulls live FC port status and WWNs over SSH, each port cross-referenced against RackView's own cabling
- **Activity Log** — every device/cable create, update, and delete is timestamped with a before/after diff, filterable by rack
- **Mgmt IP conflict check** — flags a device whose management IP is already recorded on another device in the same customer's racks
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

**Storage Mapping**
- New page, same pattern as SAN Switch Mapping: pick a storage array already placed in a rack, enter its IP and login, and pull its live FC port status/WWNs over SSH — verified against a real Dell ME4024, whose CLI replies with structured XML per command rather than a text table, parsed directly instead of guessing at column widths
- Each port shows where it's cabled to, cross-referenced against RackView's own cabling for that array (same idea as the SAN switch cross-reference, but a different port-naming scheme: the array's own port ids ("A0", "B1", ...) map straight across with no offset to the rear stencil's port names, unlike the switch side's +1 offset)
- Credentials are never saved — same rule as SAN Switch Mapping

**Activity Log**
- Every device and cable create/update/delete is now recorded with a timestamp and a before/after diff of what changed, filterable by rack or by device/cable
- There's no login system in RackView, so this tracks *what* changed and *when*, not *who* — in the same spirit as NetBox's change log, scaled to what actually fits a tool with no auth
- Manual cable-routing drags don't spam the log — only the port/medium/label fields are tracked, not waypoints

**Brocade firmware version fix**
- Verified SAN Switch Mapping against a real Brocade 300 — port/zone parsing matched exactly, but the firmware version came back empty because that particular FOS release (7.4.2h) doesn't print a "Fabric OS:" line in `switchshow` at all; now falls back to reading it from `version` instead

**Mgmt IP conflict warning**
- A device's General tab now flags it if its management IP is also recorded on another device in the same customer's racks — a static check against RackView's own data, nothing is polled live

**SAN Switch Mapping**
- New page: select a SAN switch that's already placed in a rack, enter its IP and SSH login, and pull its live port list and active zoning over SSH (Brocade FOS `switchshow`/`zoneshow`, or Cisco MDS `show interface brief`/`show flogi database`/`show zoneset active`) — read-only commands only, nothing on the switch is ever changed
- The username and password are used for that one pull and never written to disk; only the IP/vendor/port and the switch's own reported state are kept, so the last pull is still there to view next time without re-entering credentials
- Each pull is timestamped and kept as a snapshot, similar to LLDP Discovery's history
- Each port also shows where its cable actually goes, cross-referenced against RackView's own cabling for that switch (not an external host inventory) — alongside the raw connected WWN

**LLDP Discovery / Auto-Cabling split**
- LLDP Discovery no longer touches cabling at all — it only saves what LLDP reports on each port as an informational note, shown in the device panel next to any ports without a recorded cable
- A new, separate **LLDP Auto-Cabling** page is the one that actually creates/updates/removes cables from LLDP output, with a per-link review step before anything is applied
- Neighbors whose reported hostname doesn't match any device in the rack (typo, FQDN vs. short name, case) can now be resolved by hand from a dropdown of existing devices, or via a "Create device →" shortcut that jumps into edit mode with the neighbor's name pre-filled for the add-device prompt

**SAN switch category & Brocade datasheet accuracy**
- Storage-fabric switches (Cisco MDS, Brocade) now have their own **SAN Switch** category instead of being lumped in with Ethernet switches, with a matching color and a filter chip in the catalog
- The Brocade 300 (previously catalogued under an invented model name with a guessed port layout) now has a dedicated, datasheet-accurate panel: 24 FC SFP+ ports in three groups of 8, with console/mgmt/USB and the power inlet on the port side and only fans on the non-port side — a real deviation from the generic switch template that the other SAN switches use
- Corrected the Brocade G620: 48 SFP+ ports plus 4 QSFP Q-Flex uplinks (previously recorded with 0 uplinks), and its dual PSUs have integrated cooling fans rather than a separate fan tray

**Router port fidelity**
- Port counts, NIM/module slot counts, and chassis heights corrected against real datasheets for the Cisco ISR 4000, ASR 1000, and Catalyst 8200/8300/8500 series, and the Juniper MX204/MX10003
- Fixed a template bug where a router's onboard "gig" ports always rendered as SFP even on models that are wired for RJ45 (several ISR/Catalyst models), and one where a legitimately-zero NIM slot count silently fell back to a nonzero default
- Fixed a rendering bug where an odd NIM slot count (e.g. 5) produced a fractional slot label instead of a clean grid
- Fixed the 2U router template ignoring the model's actual configured gig/10-gig port counts and always drawing 4+4 regardless of the real config

**Switch family port fidelity**
- Corrected chassis specs against Cisco/Arista datasheets: Nexus 9508 (6→8 power supplies), Nexus 9516 (20→21 rack units, 8→10 power supplies), Arista 7508R3 (6→8 power supplies)
- Corrected Dell PowerSwitch S5248F-ON's uplink count (4→6, matching its real 4×100GbE + 2×100GbE QSFP28-DD config)
- Verified against datasheets and left unchanged where already correct: the Nexus 9300 EX/FX family, Nexus 9504, Catalyst 9200/9300/9500/9400/9600 series, Cisco MDS 9148T, Dell PowerSwitch S5200/Z9432F/Z9664F, and Arista 7050X3/7280R3/7504R3

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
