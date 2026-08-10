const CABLE_STYLE = {
  fiber: { stroke: "#22D3B8", width: 3, boot: "#0F6E56", accent: "#B8FDEE", connector: "lc", dash: null, name: "Fiber (LC)" },
  dac: { stroke: "#2C2C2A", width: 5.5, boot: "#5F5E5A", accent: "#888780", connector: "rj", dash: null, name: "DAC (copper, high-speed)" },
  cat6a: { stroke: "#5B7FBF", width: 4.5, boot: "#2C3E5F", accent: "#AFC3E8", connector: "rj", dash: "9 5", name: "Cat6a (copper Ethernet)" },
  power: { stroke: "#A32D2D", width: 6, boot: "#501313", accent: "#D3D1C7", connector: "iec", dash: "1.5 5", name: "Power" },
  sas: { stroke: "#534AB7", width: 5, boot: "#26215C", accent: "#9F97E8", connector: "rj", dash: "11 3 2 3", name: "SAS" },
};

const CABLING_MODE_LABELS = { selected: "Selected", create: "Create cabling" };

let cablingOn = false;
let cablingMode = null;
let pendingCablePort = null;
let selectedCableId = null;
let followLine = null;

function showCablingHint(text) {
  const hint = document.getElementById("cabling-hint");
  if (!hint) return;
  if (text) { hint.textContent = text; hint.style.display = "block"; }
  else { hint.style.display = "none"; }
}

function highlightCablableDevices(sourceDeviceId) {
  Object.entries(registry).forEach(([id, rec]) => {
    if (!rec.group) return;
    rec.group.style.opacity = Number(id) === sourceDeviceId ? "0.4" : "";
  });
}

function clearCablableHighlight() {
  Object.values(registry).forEach(rec => { if (rec.group) rec.group.style.opacity = ""; });
}

// The cable end "sticks" to the cursor between the two clicks, instead of nothing visibly
// happening after the first click (RACKVIEW_KABLO_EKLEME.md).
//
// This lives in its own layer appended directly to the <svg> root (a sibling of the main
// content group, not inside #cable-layer) specifically so refreshCabling() rebuilding
// #cable-layer on every click can never rip it out from under itself.
function startFollowLine(sourcePt) {
  stopFollowLine();
  const svgEl = document.getElementById("rack-svg");
  if (!svgEl) return;
  const layer = el("g", { id: "follow-line-layer" });
  svgEl.appendChild(layer);
  const line = el("path", {
    stroke: "#1D9E75", fill: "none", "stroke-width": 2.5,
    "stroke-dasharray": "4 3", "stroke-linecap": "round", "pointer-events": "none",
  });
  // Seed a visible (zero-length) line immediately so it isn't blank until the first mousemove.
  line.setAttribute("d", `M ${sourcePt.x},${sourcePt.y} L ${sourcePt.x},${sourcePt.y}`);
  layer.appendChild(line);
  const onMove = ev => {
    const p = clientToSvg(svgEl, ev.clientX, ev.clientY);
    line.setAttribute("d", `M ${sourcePt.x},${sourcePt.y} Q ${(sourcePt.x + p.x) / 2},${sourcePt.y - 20} ${p.x},${p.y}`);
  };
  document.addEventListener("mousemove", onMove);
  followLine = { line, layer, onMove };
}

function stopFollowLine() {
  if (!followLine) return;
  document.removeEventListener("mousemove", followLine.onMove);
  if (followLine.layer && followLine.layer.remove) followLine.layer.remove();
  followLine = null;
}

function showToast(title, detail) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast toast-success";
  const titleEl = document.createElement("div");
  titleEl.className = "toast-title";
  titleEl.textContent = title;
  toast.appendChild(titleEl);
  if (detail) {
    const detailEl = document.createElement("div");
    detailEl.className = "toast-detail";
    detailEl.textContent = detail;
    toast.appendChild(detailEl);
  }
  toast.addEventListener("click", () => toast.remove());
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// A user-given port name (metadata_json.port_labels) overrides the raw stencil port name for display.
// The raw name is never lost — it stays the lookup key for ports/cables, only the label shown changes.
function portDisplayName(deviceId, portName) {
  const dev = currentRack && currentRack.devices.find(d => d.id === deviceId);
  const labels = dev && dev.metadata_json && dev.metadata_json.port_labels;
  const custom = labels && labels[portName];
  return custom || portName;
}

function hideCableContextMenu() {
  const existing = document.getElementById("cable-ctx-menu");
  if (existing) existing.remove();
}

function showCableContextMenu(ev, aDev, aPort, bDev, bPort, cableId) {
  hideCableContextMenu();
  const menu = document.createElement("div");
  menu.id = "cable-ctx-menu";
  menu.className = "cable-ctx-menu";
  menu.style.left = ev.clientX + "px";
  menu.style.top = ev.clientY + "px";

  const makeOption = (dev, port) => {
    const btn = document.createElement("button");
    btn.textContent = `Go to ${dev ? dev.name : "?"} (${dev ? portDisplayName(dev.id, port) : port})`;
    btn.disabled = !dev;
    btn.onclick = () => {
      hideCableContextMenu();
      if (dev && typeof focusDevice === "function") focusDevice(dev.id);
    };
    return btn;
  };

  menu.appendChild(makeOption(aDev, aPort));
  menu.appendChild(makeOption(bDev, bPort));

  const cable = cableId != null ? (currentCables || []).find(c => c.id === cableId) : null;
  if (cable && Array.isArray(cable.waypoints) && cable.waypoints.length > 0) {
    const reset = document.createElement("button");
    reset.textContent = "Reset routing (auto)";
    reset.onclick = () => {
      hideCableContextMenu();
      persistCableWaypoints(cableId, []);
      refreshCabling();
    };
    menu.appendChild(reset);
  }

  if (cableId != null) {
    const del = document.createElement("button");
    del.textContent = "Delete cable";
    del.className = "cable-ctx-danger";
    del.onclick = () => {
      hideCableContextMenu();
      if (!window.confirm("Delete this cable?")) return;
      fetch(`/api/cables/${cableId}`, { method: "DELETE" }).then(() => {
        if (selectedCableId === cableId) selectedCableId = null;
        currentCables = (currentCables || []).filter(c => c.id !== cableId);
        refreshCabling();
      });
    };
    menu.appendChild(del);
  }

  document.body.appendChild(menu);

  setTimeout(() => document.addEventListener("click", hideCableContextMenu, { once: true }), 0);
}

function hidePortContextMenu() {
  const existing = document.getElementById("port-ctx-menu");
  if (existing) existing.remove();
}

function showPortContextMenu(ev, deviceId, portName) {
  hideCableContextMenu();
  if (typeof hideDeviceContextMenu === "function") hideDeviceContextMenu();
  hidePortContextMenu();

  const menu = document.createElement("div");
  menu.id = "port-ctx-menu";
  menu.className = "cable-ctx-menu";
  menu.style.left = ev.clientX + "px";
  menu.style.top = ev.clientY + "px";

  const btn = document.createElement("button");
  btn.textContent = "Rename port…";
  btn.onclick = () => {
    hidePortContextMenu();
    const current = portDisplayName(deviceId, portName);
    const next = window.prompt(`Display name for port "${portName}" (leave blank to reset):`, current === portName ? "" : current);
    if (next === null) return;
    const dev = currentRack && currentRack.devices.find(d => d.id === deviceId);
    if (!dev) return;
    fetch(`/api/devices/${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata_json: { port_labels: { [portName]: next.trim() || null } } }),
    }).then(r => r.json()).then(updated => {
      dev.metadata_json = updated.metadata_json;
      refreshCabling();
    });
  };
  menu.appendChild(btn);
  document.body.appendChild(menu);

  setTimeout(() => document.addEventListener("click", hidePortContextMenu, { once: true }), 0);
}
window.showPortContextMenu = showPortContextMenu;

function hideDeviceContextMenu() {
  const existing = document.getElementById("device-ctx-menu");
  if (existing) existing.remove();
}

function showDeviceContextMenu(ev, deviceId) {
  hideCableContextMenu();
  hideDeviceContextMenu();
  const menu = document.createElement("div");
  menu.id = "device-ctx-menu";
  menu.className = "cable-ctx-menu";
  menu.style.left = ev.clientX + "px";
  menu.style.top = ev.clientY + "px";

  const btn = document.createElement("button");
  btn.textContent = "Show cabling";
  btn.onclick = () => {
    hideDeviceContextMenu();
    selectedId = deviceId;
    selectedPort = null;
    selectedCableId = null;
    cablingMode = "selected";
    cablingOn = true;
    cablingFaceOverride = null;
    pendingCablePort = null;

    const cabBtn = document.getElementById("btn-cabling");
    if (cabBtn) {
      cabBtn.textContent = `Cabling: ${CABLING_MODE_LABELS[cablingMode]}`;
      cabBtn.classList.add("active");
    }
    renderRack(document.getElementById("rack-svg"), currentRack, currentCables);
    refreshCabling();
  };
  menu.appendChild(btn);

  const del = document.createElement("button");
  del.textContent = "Delete device";
  del.className = "cable-ctx-danger";
  del.onclick = async () => {
    hideDeviceContextMenu();
    const device = currentRack && currentRack.devices.find(d => d.id === deviceId);
    if (!device) return;
    const cableCount = (currentCables || []).filter(c => c.a_device_id === deviceId || c.b_device_id === deviceId).length;
    const warning = cableCount
      ? `Delete "${device.name}"? This will also remove ${cableCount} connected cable(s). This cannot be undone.`
      : `Delete "${device.name}"? This cannot be undone.`;
    if (!window.confirm(warning)) return;
    const res = await fetch(`/api/devices/${deviceId}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      window.alert(`Could not delete: ${err.error || res.status}`);
      return;
    }
    if (typeof resetSelection === "function") resetSelection();
    if (typeof reloadData === "function") await reloadData();
  };
  menu.appendChild(del);

  document.body.appendChild(menu);

  setTimeout(() => document.addEventListener("click", hideDeviceContextMenu, { once: true }), 0);
}
window.showDeviceContextMenu = showDeviceContextMenu;

const TOP_Y = Y0 - 23;

// Each port exits toward whichever margin (left/right) it's physically closer to. The cable
// leaves/enters a port straight up or down (matching whichever row-clearing strip it's using —
// top strip means it descends into the port from above, bottom strip means it rises into the
// port from below), never sideways into it: RACKVIEW_KABLO_YOLU.md.
const LANE_GAP = 6;     // distance from the rail to the first lane
// Widest cable stroke is 6px (power); lanes need to clear half-width + half-width of two
// adjacent cables plus a visible gap, or parallel cables visually touch/overlap in a busy rack.
const LANE_STEP = 12;   // spacing between parallel lanes on the same side
const TRACK_GAP = 46;   // extra separation between the fiber sub-range and the copper sub-range
const STRIP_OFFSET = 7; // how far below a port's mouth the horizontal strip runs

function trackForMedium(medium) {
  return medium === "fiber" ? 0 : 1;
}

function nearSide(x) {
  return x < X0 + W / 2 ? "left" : "right";
}

// A port's "near side" is decided against the rack's absolute center, independently of where the
// other end sits — fine for most devices, but a wide multi-port device (e.g. a 24-port SAN switch
// spanning most of the rack width) routinely has some ports fall on the rack's right half even
// when the device they're cabled to sits directly below on the left, forcing every one of those
// cables through the expensive "opposite margins" bridge over the top of the rack even though the
// two ends are practically stacked. Estimate the cost of forcing both ends through a single side
// against the natural (possibly bridged) pairing, and prefer whichever is actually shorter.
function estimateSideCost(ax, ay, bx, by, sideA, sideB) {
  const horiz = Math.abs(ax - laneXFor(sideA, 0, 0)) + Math.abs(bx - laneXFor(sideB, 0, 0));
  if (sideA === sideB) return horiz;
  // Opposite sides bridge via the channel above the rack — that round trip up to TOP_Y and back
  // down dwarfs everything else unless both ports already sit close to the top of the rack.
  const bridgeVert = 2 * Math.max(0, Math.min(ay, by) - TOP_Y);
  return horiz + bridgeVert;
}

function chooseSides(a, b) {
  const naturalA = nearSide(a.x), naturalB = nearSide(b.x);
  if (naturalA === naturalB) return [naturalA, naturalB];
  const costNatural = estimateSideCost(a.x, a.y, b.x, b.y, naturalA, naturalB);
  const costLeft = estimateSideCost(a.x, a.y, b.x, b.y, "left", "left");
  const costRight = estimateSideCost(a.x, a.y, b.x, b.y, "right", "right");
  if (costLeft <= costNatural && costLeft <= costRight) return ["left", "left"];
  if (costRight <= costNatural && costRight <= costLeft) return ["right", "right"];
  return [naturalA, naturalB];
}

function laneXFor(side, laneIndex, track) {
  const offset = LANE_GAP + laneIndex * LANE_STEP + track * TRACK_GAP;
  return side === "left" ? X0 - offset : X0 + W + offset;
}

// Fiber always rides a strip below (larger y) copper's strip, so same-row FC/MGMT ports never touch.
const TRACK_STRIP_BIAS = [14, 4];

function stripYFor(port, rec, laneIndex, track) {
  if (rec && rec.belowEmpty && rec.bounds) {
    return rec.bounds.y + rec.bounds.h + U / 2 + (laneIndex % 3) * 8;
  }
  const fan = (laneIndex % 4) * 8 + (TRACK_STRIP_BIAS[track] || 0);
  if (rec && rec.bounds) {
    // Dodging a small fixed offset off the PORT's own y isn't enough on a device with several
    // port rows (e.g. a 48-port switch, two rows) — that offset can land right in the gap
    // between rows and still skim across every port on the way to the lane. Clear the device's
    // *whole* bounding box instead — above or below it, whichever side the port is closer to —
    // so the sweep can never cross a sibling port no matter how many rows the stencil has.
    const distTop = Math.abs(port.y - rec.bounds.y);
    const distBottom = Math.abs(rec.bounds.y + rec.bounds.h - port.y);
    const useTop = distTop <= distBottom;
    const raw = useTop
      ? rec.bounds.y - STRIP_OFFSET - fan
      : rec.bounds.y + rec.bounds.h + STRIP_OFFSET + fan;
    // Rack units are routinely stacked with zero U of gap (RACK-01 has none between most devices).
    // With no gap, overshooting past this device's own box means the strip lands inside whatever
    // device sits flush above/below, and the long haul out to the side lane sweeps straight across
    // its ports. Never leave this device's own footprint — clamp to its own top/bottom edge.
    return useTop
      ? Math.max(raw, rec.bounds.y)
      : Math.min(raw, rec.bounds.y + rec.bounds.h);
  }
  return port.y + STRIP_OFFSET + fan;
}

function computeCablePath(a, b, aRec, bRec, idxA, idxB, track, sideA, sideB) {
  const stripA = stripYFor(a, aRec, idxA, track);
  const stripB = stripYFor(b, bRec, idxB, track);
  const laneA = laneXFor(sideA, idxA, track);

  // Straight up/down at the port's own x — this can never cross a sibling port on the same row,
  // no matter how densely packed the row is, since every other port sits at a different x.
  const exit = `L ${a.x},${stripA}`;
  const entry = `L ${b.x},${stripB} L ${b.x},${b.y}`;

  if (sideA === sideB) {
    // Same margin: both ends share one lane column.
    return `M ${a.x},${a.y} ${exit} L ${laneA},${stripA} L ${laneA},${stripB} ${entry}`;
  }

  // Opposite margins: bridge the two side lanes via the channel above the rack.
  const laneB = laneXFor(sideB, idxB, track);
  const r = 8;
  return `M ${a.x},${a.y} ${exit} `
       + `L ${laneA},${stripA} L ${laneA},${TOP_Y + r} Q ${laneA},${TOP_Y} ${laneA + (sideA === "left" ? r : -r)},${TOP_Y} `
       + `L ${laneB - (sideB === "left" ? r : -r)},${TOP_Y} Q ${laneB},${TOP_Y} ${laneB},${TOP_Y + r} `
       + `L ${laneB},${stripB} ${entry}`;
}

// The user can grab any point along a selected cable and drag it to override the auto-routed
// path with their own bend points (stored as [{x,y}, ...] in SVG coordinates on the cable record).
// The whole point is letting the user route it by hand when the auto result doesn't look right —
// but a cable is still a cable, never a diagonal wire: every segment stays purely horizontal or
// vertical, like an orthogonal connector in a diagramming tool. The user only places anchor
// points; a right-angle corner is inserted automatically between any two that aren't aligned.
// The first and last segments (into/out of the ports themselves) always exit/enter vertically —
// matching the boot artwork and the auto-router's own vertical entry rule — everything in
// between picks whichever axis has the larger distance to travel first.
//
// Corners are computed at render time only, never stored — the DB keeps just the user's actual
// anchor picks (`rawSeg` below tags each rendered point with which raw anchor pair it came from,
// so a click anywhere on the bent path can still be mapped back to "insert after anchor N").
function orthogonalizeWithTags(points) {
  const out = [{ p: points[0], rawSeg: -1 }];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i], p2 = points[i + 1];
    if (p1.x === p2.x || p1.y === p2.y) { out.push({ p: p2, rawSeg: i }); continue; }
    let corner;
    if (i === 0) corner = { x: p1.x, y: p2.y };
    else if (i === points.length - 2) corner = { x: p2.x, y: p1.y };
    else {
      const dx = Math.abs(p2.x - p1.x), dy = Math.abs(p2.y - p1.y);
      corner = dx >= dy ? { x: p2.x, y: p1.y } : { x: p1.x, y: p2.y };
    }
    out.push({ p: corner, rawSeg: i }, { p: p2, rawSeg: i });
  }
  return out;
}

function manualPathFor(a, b, waypoints) {
  const tagged = orthogonalizeWithTags([a, ...waypoints, b]);
  return tagged.map((e, i) => `${i === 0 ? "M" : "L"} ${e.p.x},${e.p.y}`).join(" ");
}

function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// Picks which RAW anchor pair the user grabbed, working against the actual rendered (orthogonal,
// corners included) path rather than straight lines between raw anchors — so the insert point
// lands wherever the user visually clicked, even though that click landed on an auto-inserted
// corner segment rather than a straight line between two of their own points.
function nearestRawSegment(a, b, waypoints, p) {
  const tagged = orthogonalizeWithTags([a, ...waypoints, b]);
  let best = 0, bestDist = Infinity;
  for (let j = 0; j < tagged.length - 1; j++) {
    const d = distToSegment(p, tagged[j].p, tagged[j + 1].p);
    if (d < bestDist) { bestDist = d; best = tagged[j + 1].rawSeg; }
  }
  return best;
}

const SNAP_THRESHOLD = 6; // fallback SVG-unit radius when a screen CTM isn't available
const SNAP_THRESHOLD_PX = 14; // desired on-screen catch radius — converted to SVG units per-drag via the CTM

// The rack SVG is scaled to fit the viewport and can be zoomed independently, so a fixed SVG-unit
// snap radius shrinks on screen as you zoom out and never seems to "catch". Convert the desired
// on-screen radius into SVG units using the live screen-to-SVG scale instead.
function svgSnapThreshold(svgEl) {
  const ctm = svgEl && svgEl.getScreenCTM && svgEl.getScreenCTM();
  return ctm && ctm.a ? SNAP_THRESHOLD_PX / ctm.a : SNAP_THRESHOLD;
}

// Every corner of every currently-drawn cable path (auto-routed lane/strip bends as well as
// manual waypoints) — repopulated each drawCables() pass — so a dragged point can snap to any
// cable already on the rack, not just ones that happen to have manual waypoints of their own.
let renderedCableCorners = [];

function extractPathCorners(d) {
  const pts = [];
  const re = /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(d))) pts.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) });
  return pts;
}

// Gathers the x/y of every other cable's rendered corners so a dragged point can snap into
// visual alignment with cables that are already routed the way the user wants — purely a
// convenience, never blocks the drag (the point still follows the cursor past the threshold).
function collectSnapCandidates(excludeCableId) {
  const xs = [];
  const ys = [];
  renderedCableCorners.forEach(entry => {
    if (entry.cableId === excludeCableId) return;
    entry.points.forEach(p => { xs.push(p.x); ys.push(p.y); });
  });
  return { xs, ys };
}

// threshold is in SVG units, not screen px — the rack SVG is scaled to fit the viewport and can
// be zoomed, so a fixed SVG-unit radius shrinks on screen as you zoom out, making it feel like it
// never catches. Callers should convert their desired on-screen px radius via svgSnapThreshold().
function snapPoint(p, candidates, threshold) {
  const t = threshold != null ? threshold : SNAP_THRESHOLD;
  let x = p.x, y = p.y, snappedX = false, snappedY = false;
  for (const cx of candidates.xs) {
    if (Math.abs(p.x - cx) <= t) { x = cx; snappedX = true; break; }
  }
  for (const cy of candidates.ys) {
    if (Math.abs(p.y - cy) <= t) { y = cy; snappedY = true; break; }
  }
  return { x, y, snappedX, snappedY };
}

// Small floating readout that follows the cursor during a manual-routing drag — purely
// informational (current position, or a note when a snap kicked in), never modal, never in the
// way of the actual drag. Created fresh per drag and torn down on mouseup.
function createDragIndicator() {
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;z-index:4000;pointer-events:none;background:#2C2C2A;"
    + "color:#E6E4DC;padding:4px 8px;border-radius:5px;font-size:10px;font-family:monospace;"
    + "opacity:0.9;white-space:nowrap;";
  document.body.appendChild(el);
  return {
    update(clientX, clientY, p, snapped) {
      el.textContent = snapped ? `x:${Math.round(p.x)} y:${Math.round(p.y)} ⤾ snap` : `x:${Math.round(p.x)} y:${Math.round(p.y)}`;
      el.style.left = (clientX + 14) + "px";
      el.style.top = (clientY + 14) + "px";
    },
    remove() { el.remove(); },
  };
}

function persistCableWaypoints(cableId, waypoints) {
  const stored = waypoints.length ? waypoints : null;
  const cable = (currentCables || []).find(x => x.id === cableId);
  if (cable) cable.waypoints = stored;
  fetch(`/api/cables/${cableId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ waypoints: stored }),
  }).catch(() => {});
}

function drawCableStrand(g, d, style) {
  const shadow = el("path", {
    d, stroke: "#00000035", "stroke-width": style.width + 1,
    fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round",
    transform: "translate(0.7,0.7)",
  });
  const main = el("path", {
    d, stroke: style.stroke, "stroke-width": style.width,
    fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round",
  });
  const accent = el("path", {
    d, stroke: style.accent, "stroke-width": Math.max(style.width * 0.3, 0.5),
    fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-opacity": "0.55",
    transform: "translate(-0.4,-0.4)",
  });
  if (style.dash) {
    shadow.setAttribute("stroke-dasharray", style.dash);
    main.setAttribute("stroke-dasharray", style.dash);
    accent.setAttribute("stroke-dasharray", style.dash);
  }
  g.appendChild(shadow);
  g.appendChild(main);
  g.appendChild(accent);
  return { shadow, main, accent };
}

function drawRjBoot(g, x, y, w, h, style, grooveAxis) {
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 2.5, fill: style.boot, stroke: "#00000040", "stroke-width": 0.6 }));
  if (grooveAxis === "x") {
    const g1 = x + w * 0.35, g2 = x + w * 0.65;
    g.appendChild(el("line", { x1: g1, y1: y + 2, x2: g1, y2: y + h - 2, stroke: "#00000055", "stroke-width": 0.8 }));
    g.appendChild(el("line", { x1: g2, y1: y + 2, x2: g2, y2: y + h - 2, stroke: "#00000055", "stroke-width": 0.8 }));
  } else {
    const g1 = y + h * 0.35, g2 = y + h * 0.65;
    g.appendChild(el("line", { x1: x + 2, y1: g1, x2: x + w - 2, y2: g1, stroke: "#00000055", "stroke-width": 0.8 }));
    g.appendChild(el("line", { x1: x + 2, y1: g2, x2: x + w - 2, y2: g2, stroke: "#00000055", "stroke-width": 0.8 }));
  }
}

function drawLcBoot(g, x, y, w, h, style, holeAxis) {
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 2, fill: style.accent, stroke: style.boot, "stroke-width": 1 }));
  const r = Math.min(w, h) * 0.18;
  if (holeAxis === "x") {
    g.appendChild(el("circle", { cx: x + w * 0.32, cy: y + h / 2, r, fill: style.boot }));
    g.appendChild(el("circle", { cx: x + w * 0.68, cy: y + h / 2, r, fill: style.boot }));
  } else {
    g.appendChild(el("circle", { cx: x + w / 2, cy: y + h * 0.32, r, fill: style.boot }));
    g.appendChild(el("circle", { cx: x + w / 2, cy: y + h * 0.68, r, fill: style.boot }));
  }
}

function drawIecBoot(g, x, y, w, h, style) {
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 1, fill: style.boot, stroke: "#00000040", "stroke-width": 0.6 }));
  g.appendChild(el("circle", { cx: x + w / 2, cy: y + h / 2, r: Math.min(w, h) * 0.22, fill: "none", stroke: style.accent, "stroke-width": 0.8 }));
}

function drawBoot(g, pt, style) {
  // Every cable now plugs into its port vertically (top-row ports from above, bottom-row from
  // below) — RACKVIEW_KABLO_YOLU.md.
  const w = 15, h = style.width + 6;
  if (style.connector === "lc") {
    // The LC housing itself is a small flat clip — real duplex LC modules never sit rotated
    // 90° on their side no matter which direction the fiber approaches from, so its boot always
    // renders horizontal even though the cable still enters the port vertically.
    const x = pt.x - w / 2, y = pt.y - h / 2;
    drawLcBoot(g, x, y, w, h, style, "x");
    return;
  }
  const x = pt.x - h / 2, y = pt.y - w / 2;
  if (style.connector === "iec") drawIecBoot(g, x, y, h, w, style);
  else drawRjBoot(g, x, y, h, w, style, "y");
}

function activeCablesFor(cablesList) {
  if (cablingMode === "create") return cablesList;
  if (cablingMode === "selected") {
    if (selectedPort) {
      return cablesList.filter(c =>
        (c.a_device_id === selectedPort.deviceId && c.a_port === selectedPort.portName) ||
        (c.b_device_id === selectedPort.deviceId && c.b_port === selectedPort.portName)
      );
    }
    if (selectedId) {
      return cablesList.filter(c => c.a_device_id === selectedId || c.b_device_id === selectedId);
    }
    return [];
  }
  return [];
}

function selectCable(id) {
  selectedCableId = selectedCableId === id ? null : id;
  refreshCabling();
}

function drawCables(g, cablesList) {
  const active = activeCablesFor(cablesList);
  const leftIdx = [0, 0], rightIdx = [0, 0];
  renderedCableCorners = [];
  active.forEach(c => {
    const aRec = registry[c.a_device_id];
    const bRec = registry[c.b_device_id];
    if (!aRec || !bRec) return;
    const a = aRec.ports[c.a_port];
    const b = bRec.ports[c.b_port];
    if (!a || !b) return;
    const style = CABLE_STYLE[c.medium] || CABLE_STYLE.cat6a;
    const track = trackForMedium(c.medium);
    const [sideA, sideB] = chooseSides(a, b);
    const idxA = sideA === "left" ? leftIdx[track]++ : rightIdx[track]++;
    const idxB = sideA === sideB ? idxA : (sideB === "left" ? leftIdx[track]++ : rightIdx[track]++);
    const hasManualRoute = Array.isArray(c.waypoints) && c.waypoints.length > 0;
    const d = hasManualRoute
      ? manualPathFor(a, b, c.waypoints)
      : computeCablePath(a, b, aRec, bRec, idxA, idxB, track, sideA, sideB);
    renderedCableCorners.push({ cableId: c.id, points: extractPathCorners(d) });

    const isSelected = c.id === selectedCableId;
    const distance = Math.abs(a.y - b.y);
    const isLongRun = distance > 12 * U;
    let cableOpacity;
    if (selectedCableId) {
      cableOpacity = isSelected ? 1 : 0.12;
    } else {
      cableOpacity = isLongRun && !selectedId ? 0.25 : 0.95;
    }
    const cg = el("g", { opacity: cableOpacity });
    g.appendChild(cg);

    let glow = null;
    if (isSelected) {
      glow = el("path", {
        d, stroke: "#FFFFFF", "stroke-width": style.width + 6,
        fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-opacity": "0.9",
      });
      cg.appendChild(glow);
      cg.appendChild(el("circle", { cx: a.x, cy: a.y, r: 8, fill: "none", stroke: "#FFFFFF", "stroke-width": 2.2 }));
      cg.appendChild(el("circle", { cx: b.x, cy: b.y, r: 8, fill: "none", stroke: "#FFFFFF", "stroke-width": 2.2 }));
    }

    const strandEls = drawCableStrand(cg, d, style);
    drawBoot(cg, a, style);
    drawBoot(cg, b, style);

    const hit = el("path", {
      d, stroke: "transparent", "stroke-width": style.width + 14, fill: "none",
      "stroke-linecap": "round", "stroke-linejoin": "round", "pointer-events": "stroke",
      cursor: isSelected ? "grab" : "pointer",
    });

    // Live-updates every rendered stroke of this one cable during a drag, instead of a full
    // refreshCabling() per mousemove — refreshCabling() tears down and rebuilds #cable-layer for
    // every cable in the rack, which is fine on click but visibly janky at drag-move frequency.
    const pathEls = [glow, strandEls.shadow, strandEls.main, strandEls.accent, hit].filter(Boolean);
    const setPathD = newD => pathEls.forEach(p => p.setAttribute("d", newD));

    let suppressClick = false;
    hit.addEventListener("click", ev => {
      ev.stopPropagation();
      if (suppressClick) { suppressClick = false; return; }
      selectCable(c.id);
    });
    hit.addEventListener("contextmenu", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const aDev = currentRack && currentRack.devices.find(dv => dv.id === c.a_device_id);
      const bDev = currentRack && currentRack.devices.find(dv => dv.id === c.b_device_id);
      showCableContextMenu(ev, aDev, c.a_port, bDev, c.b_port, c.id);
    });
    hit.addEventListener("mouseenter", ev => {
      const tip = document.getElementById("rv-tooltip");
      if (!tip) return;
      const aDev = currentRack && currentRack.devices.find(dv => dv.id === c.a_device_id);
      const bDev = currentRack && currentRack.devices.find(dv => dv.id === c.b_device_id);
      const aLabel = `${aDev ? aDev.name : "?"} ${portDisplayName(c.a_device_id, c.a_port)}`;
      const bLabel = `${bDev ? bDev.name : "?"} ${portDisplayName(c.b_device_id, c.b_port)}`;
      tip.innerHTML = `${style.name || c.medium} · ${aLabel} → ${bLabel}`;
      tip.style.display = "block";
    });
    hit.addEventListener("mousemove", ev => {
      const tip = document.getElementById("rv-tooltip");
      if (!tip) return;
      tip.style.left = (ev.clientX + 14) + "px";
      tip.style.top = (ev.clientY + 14) + "px";
    });
    hit.addEventListener("mouseleave", () => {
      const tip = document.getElementById("rv-tooltip");
      if (tip) tip.style.display = "none";
    });

    // Grab anywhere along an already-selected cable and drag to bend it there — the user's manual
    // override for when the auto-routed path doesn't look right to them.
    if (isSelected) {
      hit.addEventListener("mousedown", ev => {
        if (ev.button !== 0) return;
        ev.preventDefault();
        ev.stopPropagation();
        const svgEl = document.getElementById("rack-svg");
        const startClient = { x: ev.clientX, y: ev.clientY };
        let dragging = false;
        let working = (c.waypoints || []).slice();
        let insertAt = -1;
        let indicator = null;
        const candidates = collectSnapCandidates(c.id);
        const threshold = svgSnapThreshold(svgEl);

        const onMove = mev => {
          if (!dragging) {
            const moved = Math.hypot(mev.clientX - startClient.x, mev.clientY - startClient.y);
            if (moved < 4) return;
            dragging = true;
            suppressClick = true;
            const startPt = clientToSvg(svgEl, startClient.x, startClient.y);
            insertAt = nearestRawSegment(a, b, working, startPt);
            working.splice(insertAt, 0, startPt);
            indicator = createDragIndicator();
          }
          const snapped = snapPoint(clientToSvg(svgEl, mev.clientX, mev.clientY), candidates, threshold);
          working[insertAt] = { x: snapped.x, y: snapped.y };
          setPathD(manualPathFor(a, b, working));
          indicator.update(mev.clientX, mev.clientY, snapped, snapped.snappedX || snapped.snappedY);
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          if (indicator) indicator.remove();
          if (dragging) {
            persistCableWaypoints(c.id, working);
            refreshCabling();
          }
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    }

    cg.appendChild(hit);

    if (isSelected && Array.isArray(c.waypoints)) {
      c.waypoints.forEach((wp, wi) => {
        const handle = el("circle", {
          cx: wp.x, cy: wp.y, r: 5, fill: "#FFFFFF", stroke: style.stroke, "stroke-width": 2, cursor: "move",
        });
        handle.addEventListener("mousedown", ev => {
          if (ev.button !== 0) return;
          ev.preventDefault();
          ev.stopPropagation();
          const svgEl = document.getElementById("rack-svg");
          const working = c.waypoints.slice();
          const candidates = collectSnapCandidates(c.id);
          const threshold = svgSnapThreshold(svgEl);
          const indicator = createDragIndicator();
          const onMove = mev => {
            const snapped = snapPoint(clientToSvg(svgEl, mev.clientX, mev.clientY), candidates, threshold);
            working[wi] = { x: snapped.x, y: snapped.y };
            handle.setAttribute("cx", snapped.x);
            handle.setAttribute("cy", snapped.y);
            setPathD(manualPathFor(a, b, working));
            indicator.update(mev.clientX, mev.clientY, snapped, snapped.snappedX || snapped.snappedY);
          };
          const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            indicator.remove();
            persistCableWaypoints(c.id, working);
            refreshCabling();
          };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        });
        // Right-click a bend point to remove just that one, without resetting the whole route.
        handle.addEventListener("contextmenu", ev => {
          ev.preventDefault();
          ev.stopPropagation();
          const working = c.waypoints.slice();
          working.splice(wi, 1);
          persistCableWaypoints(c.id, working);
          refreshCabling();
        });
        cg.appendChild(handle);
      });
    }
  });
}

function updateCableInfo(cablesList) {
  const infoEl = document.getElementById("cable-info");
  if (!infoEl) return;
  const c = selectedCableId ? cablesList.find(x => x.id === selectedCableId) : null;
  if (!c || !currentRack) {
    infoEl.style.display = "none";
    return;
  }
  const aDev = currentRack.devices.find(d => d.id === c.a_device_id);
  const bDev = currentRack.devices.find(d => d.id === c.b_device_id);
  const style = CABLE_STYLE[c.medium] || CABLE_STYLE.cat6a;
  infoEl.innerHTML = `
    <div class="cable-info-end"><span class="cable-info-dev">${aDev ? aDev.name : "?"}</span><span class="cable-info-port">${portDisplayName(c.a_device_id, c.a_port)}</span></div>
    <div class="cable-info-mid"><span class="legend-swatch" style="background:${style.stroke}"></span>${style.name || c.medium}${c.label ? " · " + c.label : ""}</div>
    <div class="cable-info-end"><span class="cable-info-dev">${bDev ? bDev.name : "?"}</span><span class="cable-info-port">${portDisplayName(c.b_device_id, c.b_port)}</span></div>
  `;
  infoEl.style.display = "flex";
}

function drawPendingMarker(g) {
  if (cablingMode !== "create" || !pendingCablePort) return;
  const rec = registry[pendingCablePort.deviceId];
  const pt = rec && rec.ports[pendingCablePort.portName];
  if (!pt) return;
  g.appendChild(el("circle", {
    cx: pt.x, cy: pt.y, r: 9.5, fill: "none",
    stroke: "#0F6E56", "stroke-width": 3, "stroke-dasharray": "4,3",
  }));
}

function buildLegend(container) {
  container.innerHTML = "";
  Object.keys(CABLE_STYLE).filter(medium => medium !== "power").forEach(medium => {
    const style = CABLE_STYLE[medium];
    const span = document.createElement("span");
    span.className = "legend-item";
    const dashAttr = style.dash ? ` stroke-dasharray="${style.dash}"` : "";
    span.innerHTML = `<svg class="legend-swatch" width="16" height="4" viewBox="0 0 16 4">`
      + `<line x1="0" y1="2" x2="16" y2="2" stroke="${style.stroke}" stroke-width="${Math.min(style.width, 3.4)}"${dashAttr} stroke-linecap="round"/>`
      + `</svg>${style.name || medium}`;
    container.appendChild(span);
  });
}

function refreshCabling() {
  const legend = document.getElementById("cable-legend");
  const existing = document.getElementById("cable-layer");
  if (existing) existing.remove();
  legend.style.display = "none";

  if (!cablingOn) {
    selectedCableId = null;
    updateCableInfo(currentCables || []);
    return;
  }

  const svgEl = document.getElementById("rack-svg");
  const rootG = svgEl.firstChild;
  if (!rootG) return;
  const g = el("g", { id: "cable-layer" });
  rootG.appendChild(g);
  drawCables(g, currentCables);
  drawPendingMarker(g);
  ["rail-numbers-layer", "device-label-layer"].forEach(id => {
    const layer = document.getElementById(id);
    if (layer) rootG.appendChild(layer);
  });
  legend.style.display = "flex";
  buildLegend(legend);
  updateCableInfo(currentCables);
}

function setCablingMode(mode) {
  cablingMode = cablingMode === mode ? null : mode;
  cablingOn = cablingMode !== null;
  cablingFaceOverride = null;
  pendingCablePort = null;
  selectedPort = null;
  selectedCableId = null;
  stopFollowLine();
  clearCablableHighlight();
  showCablingHint(cablingMode === "create" ? "Select source port · ESC to cancel" : null);

  const btn = document.getElementById("btn-cabling");
  btn.textContent = cablingOn ? `Cabling: ${CABLING_MODE_LABELS[cablingMode]}` : "Cabling";
  btn.classList.toggle("active", cablingOn);

  renderRack(document.getElementById("rack-svg"), currentRack, currentCables);
  refreshCabling();
}

function turnOffCabling() {
  cablingMode = null;
  cablingOn = false;
  cablingFaceOverride = null;
  pendingCablePort = null;
  selectedPort = null;
  selectedCableId = null;
  stopFollowLine();
  clearCablableHighlight();
  showCablingHint(null);

  const btn = document.getElementById("btn-cabling");
  btn.textContent = "Cabling";
  btn.classList.toggle("active", false);

  renderRack(document.getElementById("rack-svg"), currentRack, currentCables);
  refreshCabling();
}

function cancelPendingCable() {
  pendingCablePort = null;
  stopFollowLine();
  clearCablableHighlight();
  showCablingHint(cablingMode === "create" ? "Select source port · ESC to cancel" : null);
  refreshCabling();
}

document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && cablingMode === "create") cancelPendingCable();
});

function promptForMedium() {
  const options = Object.keys(CABLE_STYLE);
  const input = window.prompt(`Cable type (${options.join(" / ")}):`, "dac");
  if (!input) return null;
  const medium = input.trim().toLowerCase();
  return options.includes(medium) ? medium : null;
}

async function createCable(a, b, medium) {
  const res = await fetch("/api/cables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      a_device_id: a.deviceId, a_port: a.portName,
      b_device_id: b.deviceId, b_port: b.portName,
      medium,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(`Could not add cable: ${err.error || res.status}`);
    return;
  }
  const aDev = currentRack && currentRack.devices.find(d => d.id === a.deviceId);
  const bDev = currentRack && currentRack.devices.find(d => d.id === b.deviceId);
  const style = CABLE_STYLE[medium];
  showToast("✓ Cable added",
    `${aDev ? aDev.name : "?"} ${portDisplayName(a.deviceId, a.portName)} → ${bDev ? bDev.name : "?"} ${portDisplayName(b.deviceId, b.portName)} · ${(style && style.name) || medium}`);
  await reloadData();
}

function handleCreateCableClick(deviceId, portName) {
  if (!portName) {
    alert("Click a port.");
    return;
  }
  if (!pendingCablePort) {
    pendingCablePort = { deviceId, portName };
    highlightCablableDevices(deviceId);
    showCablingHint("Select target port · ESC to cancel");
    // refreshCabling() tears down and rebuilds #cable-layer — the follow-line has to be
    // attached AFTER that, or it gets removed as part of the layer it was just added to.
    refreshCabling();
    const rec = registry[deviceId];
    const pt = rec && rec.ports[portName];
    if (pt) startFollowLine(pt);
    return;
  }
  if (pendingCablePort.deviceId === deviceId && pendingCablePort.portName === portName) {
    cancelPendingCable();
    return;
  }
  if (pendingCablePort.deviceId === deviceId) {
    return; // same device as source — not a valid target, ignore the click
  }
  const medium = promptForMedium();
  if (!medium) {
    cancelPendingCable();
    return;
  }
  const a = pendingCablePort;
  pendingCablePort = null;
  stopFollowLine();
  clearCablableHighlight();
  showCablingHint("Select source port · ESC to cancel");
  createCable(a, { deviceId, portName }, medium);
  refreshCabling();
}

window.onCreateCableClick = handleCreateCableClick;
window.onCancelPendingCable = cancelPendingCable;
