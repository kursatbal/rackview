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
  document.body.appendChild(menu);

  setTimeout(() => document.addEventListener("click", hideDeviceContextMenu, { once: true }), 0);
}
window.showDeviceContextMenu = showDeviceContextMenu;

const TOP_Y = Y0 - 23;

// Each port exits toward whichever margin (left/right) it's physically closer to, and plugs into
// its port horizontally (a real jack inserts sideways, not straight down into the socket).
const LEAD = 9;         // short horizontal lead-in/out right at the port, matches the plug's own axis
const LANE_GAP = 6;     // distance from the rail to the first lane
const LANE_STEP = 6;    // spacing between parallel lanes on the same side
const TRACK_GAP = 46;   // extra separation between the fiber sub-range and the copper sub-range
const STRIP_OFFSET = 7; // how far below a port's mouth the horizontal strip runs

function trackForMedium(medium) {
  return medium === "fiber" ? 0 : 1;
}

function nearSide(x) {
  return x < X0 + W / 2 ? "left" : "right";
}

function laneXFor(side, laneIndex, track) {
  const offset = LANE_GAP + laneIndex * LANE_STEP + track * TRACK_GAP;
  return side === "left" ? X0 - offset : X0 + W + offset;
}

// Fiber always rides a strip below (larger y) copper's strip, so same-row FC/MGMT ports never touch.
const TRACK_STRIP_BIAS = [14, 4];

function stripYFor(port, rec, laneIndex, track) {
  if (rec && rec.belowEmpty && rec.bounds) {
    return rec.bounds.y + rec.bounds.h + U / 2 + (laneIndex % 3) * 3;
  }
  return port.y + STRIP_OFFSET + (laneIndex % 4) * 2.5 + (TRACK_STRIP_BIAS[track] || 0);
}

// Exiting a port: horizontal lead-out first, then drop/rise onto the strip (matches the plug's own axis).
function exitStub(pt, side, stripY) {
  const leadX = side === "left" ? pt.x - LEAD : pt.x + LEAD;
  return `L ${leadX},${pt.y} L ${leadX},${stripY}`;
}

// Entering a port: rise/drop off the strip first, then a final horizontal approach straight into the port.
function entryStub(pt, side, stripY) {
  const leadX = side === "left" ? pt.x - LEAD : pt.x + LEAD;
  return `L ${leadX},${stripY} L ${leadX},${pt.y} L ${pt.x},${pt.y}`;
}

function computeCablePath(a, b, aRec, bRec, idxA, idxB, track) {
  const sideA = nearSide(a.x);
  const sideB = nearSide(b.x);
  const stripA = stripYFor(a, aRec, idxA, track);
  const stripB = stripYFor(b, bRec, idxB, track);
  const laneA = laneXFor(sideA, idxA, track);

  if (sideA === sideB) {
    // Same margin: both ends share one lane column.
    return `M ${a.x},${a.y} ${exitStub(a, sideA, stripA)} `
         + `L ${laneA},${stripA} L ${laneA},${stripB} `
         + `${entryStub(b, sideB, stripB)}`;
  }

  // Opposite margins: bridge the two side lanes via the channel above the rack.
  const laneB = laneXFor(sideB, idxB, track);
  const r = 8;
  return `M ${a.x},${a.y} ${exitStub(a, sideA, stripA)} `
       + `L ${laneA},${stripA} L ${laneA},${TOP_Y + r} Q ${laneA},${TOP_Y} ${laneA + (sideA === "left" ? r : -r)},${TOP_Y} `
       + `L ${laneB - (sideB === "left" ? r : -r)},${TOP_Y} Q ${laneB},${TOP_Y} ${laneB},${TOP_Y + r} `
       + `L ${laneB},${stripB} ${entryStub(b, sideB, stripB)}`;
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
  // Every cable now plugs into its port horizontally, matching a real jack's insertion axis.
  const w = 15, h = style.width + 6;
  const x = pt.x - w / 2, y = pt.y - h / 2;
  if (style.connector === "lc") drawLcBoot(g, x, y, w, h, style, "x");
  else if (style.connector === "iec") drawIecBoot(g, x, y, w, h, style);
  else drawRjBoot(g, x, y, w, h, style, "x");
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
  active.forEach(c => {
    const aRec = registry[c.a_device_id];
    const bRec = registry[c.b_device_id];
    if (!aRec || !bRec) return;
    const a = aRec.ports[c.a_port];
    const b = bRec.ports[c.b_port];
    if (!a || !b) return;
    const style = CABLE_STYLE[c.medium] || CABLE_STYLE.cat6a;
    const track = trackForMedium(c.medium);
    const sideA = nearSide(a.x);
    const sideB = nearSide(b.x);
    const idxA = sideA === "left" ? leftIdx[track]++ : rightIdx[track]++;
    const idxB = sideA === sideB ? idxA : (sideB === "left" ? leftIdx[track]++ : rightIdx[track]++);
    const d = computeCablePath(a, b, aRec, bRec, idxA, idxB, track);

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

    if (isSelected) {
      cg.appendChild(el("path", {
        d, stroke: "#FFFFFF", "stroke-width": style.width + 6,
        fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-opacity": "0.9",
      }));
      cg.appendChild(el("circle", { cx: a.x, cy: a.y, r: 8, fill: "none", stroke: "#FFFFFF", "stroke-width": 2.2 }));
      cg.appendChild(el("circle", { cx: b.x, cy: b.y, r: 8, fill: "none", stroke: "#FFFFFF", "stroke-width": 2.2 }));
    }

    drawCableStrand(cg, d, style);
    drawBoot(cg, a, style);
    drawBoot(cg, b, style);

    const hit = el("path", {
      d, stroke: "transparent", "stroke-width": style.width + 14, fill: "none",
      "stroke-linecap": "round", "stroke-linejoin": "round", "pointer-events": "stroke", cursor: "pointer",
    });
    hit.addEventListener("click", ev => {
      ev.stopPropagation();
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
    cg.appendChild(hit);
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

  const btn = document.getElementById("btn-cabling");
  btn.textContent = "Cabling";
  btn.classList.toggle("active", false);

  renderRack(document.getElementById("rack-svg"), currentRack, currentCables);
  refreshCabling();
}

function cancelPendingCable() {
  pendingCablePort = null;
  refreshCabling();
}

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
  await reloadData();
}

function handleCreateCableClick(deviceId, portName) {
  if (!portName) {
    alert("Click a port.");
    return;
  }
  if (!pendingCablePort) {
    pendingCablePort = { deviceId, portName };
    refreshCabling();
    return;
  }
  if (pendingCablePort.deviceId === deviceId && pendingCablePort.portName === portName) {
    cancelPendingCable();
    return;
  }
  const medium = promptForMedium();
  if (!medium) {
    cancelPendingCable();
    return;
  }
  const a = pendingCablePort;
  pendingCablePort = null;
  createCable(a, { deviceId, portName }, medium);
  refreshCabling();
}

window.onCreateCableClick = handleCreateCableClick;
window.onCancelPendingCable = cancelPendingCable;
