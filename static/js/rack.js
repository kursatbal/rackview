const U = RV_U;
const X0 = 90;
const W = 680;
const Y0 = 95;
const RAIL_W = 42;
const LABEL_RIGHT = X0 - 130;
const LABEL_VIEW_BUFFER = 320;

const ROLE_COLORS = {
  switch: "#2E5E8E",
  server: "#1D7A5E",
  storage: "#8E5A1F",
  firewall: "#A83232",
  router: "#2F6FA8",
  pdu: "#8E3030",
  panel: "#6E6D68",
  "patch-panel": "#5A4A9E",
  passthrough: "#6E6D68",
};

function roleColor(category) {
  return ROLE_COLORS[category] || "#6E6D68";
}

function uToY(positionU, uHeight, rackHeight) {
  return Y0 + (rackHeight - positionU - uHeight + 1) * U;
}

// Empty-U compaction only ever applies outside Edit mode. Every drag/drop placement path
// (startDrag/onDragMove, catalog.js's positionUFromSvgY/showDropGhost) assumes uniform per-U
// spacing and only runs while editMode is true — so keeping Edit mode on the original uToY
// layout means none of that math has to change; compaction never overlaps with it.
const EMPTY_COLLAPSE_THRESHOLD = 4;
const EMPTY_THIN_H = U / 2;
const EMPTY_COLLAPSE_H = 34;

function computeLayout(rack, compact) {
  const occupied = new Map();
  rack.devices.forEach(d => {
    for (let u = d.position_u; u < d.position_u + d.device_type.u_height; u++) occupied.set(u, d);
  });

  const segments = [];
  const placedDevice = new Set();
  let u = rack.u_height;
  while (u >= 1) {
    const dev = occupied.get(u);
    if (dev) {
      if (!placedDevice.has(dev.id)) {
        segments.push({ kind: "device", device: dev, height: dev.device_type.u_height * U });
        placedDevice.add(dev.id);
      }
      u -= 1;
      continue;
    }
    const runTop = u;
    let runBottom = u;
    while (runBottom > 1 && !occupied.has(runBottom - 1)) runBottom -= 1;
    const count = runTop - runBottom + 1;
    if (compact && count >= EMPTY_COLLAPSE_THRESHOLD) {
      segments.push({ kind: "collapsed", fromU: runBottom, toU: runTop, count, height: EMPTY_COLLAPSE_H });
    } else {
      for (let uu = runTop; uu >= runBottom; uu--) {
        segments.push({ kind: "empty", u: uu, height: compact ? EMPTY_THIN_H : U });
      }
    }
    u = runBottom - 1;
  }

  let y = Y0;
  segments.forEach(seg => { seg.y = y; y += seg.height; });

  const deviceY = new Map();
  segments.forEach(seg => { if (seg.kind === "device") deviceY.set(seg.device.id, seg.y); });

  return { segments, deviceY, totalHeight: y - Y0 };
}

let cablingFaceOverride = null;

function faceForDevice(type) {
  if (!cablingOn) return currentFace;
  const isRearCabled = type.category === "server" || type.category === "storage";
  if (isRearCabled) return "rear";
  return cablingFaceOverride || "front";
}

let selectedId = null;
let selectedPort = null;
let currentFace = "front";
let registry = {};
let adjacency = {};
let currentRack = null;
let currentCables = [];
let editMode = false;
let dragState = null;
let lastDragMoved = false;
let baseViewBox = null;
let zoomScale = 1;
let zoomOffsetX = 0;
let zoomOffsetY = 0;
let panState = null;
let lastPanMoved = false;

function buildAdjacency(cables) {
  const m = {};
  cables.forEach(c => {
    (m[c.a_device_id] = m[c.a_device_id] || new Set()).add(c.b_device_id);
    (m[c.b_device_id] = m[c.b_device_id] || new Set()).add(c.a_device_id);
  });
  return m;
}

function injectFrameDefs(g) {
  const defs = el("defs", {});
  const frameGrad = el("linearGradient", { id: "frameSheen", x1: "0", y1: "0", x2: "1", y2: "0" });
  frameGrad.appendChild(el("stop", { offset: "0%", "stop-color": "#9C9A92" }));
  frameGrad.appendChild(el("stop", { offset: "8%", "stop-color": "#D3D1C7" }));
  frameGrad.appendChild(el("stop", { offset: "50%", "stop-color": "#B4B2A9" }));
  frameGrad.appendChild(el("stop", { offset: "92%", "stop-color": "#D3D1C7" }));
  frameGrad.appendChild(el("stop", { offset: "100%", "stop-color": "#9C9A92" }));
  defs.appendChild(frameGrad);

  const shadow = el("filter", { id: "deviceShadow", x: "-10%", y: "-40%", width: "120%", height: "220%" });
  shadow.appendChild(el("feDropShadow", { dx: "0", dy: "2", stdDeviation: "1.6", "flood-color": "#000000", "flood-opacity": "0.4" }));
  defs.appendChild(shadow);

  g.appendChild(defs);
}

function drawFrame(g, layout) {
  injectFrameDefs(g);
  rvInjectDefs(g);
  const railLeftX = X0 - RAIL_W;
  const railRightX = X0 + W;
  const channelY = Y0 - 46;
  const eqBottom = Y0 + layout.totalHeight;
  const innerLeft = railLeftX, innerRight = railRightX + RAIL_W;
  const innerTop = channelY, innerBottom = eqBottom;
  const margin = 150;
  const outerX = innerLeft - margin, outerY = innerTop - margin;
  const outerW = innerRight - innerLeft + margin * 2;
  const outerH = innerBottom - innerTop + margin * 2;

  g.appendChild(el("rect", { x: outerX, y: outerY, width: outerW, height: outerH, fill: "url(#frameSheen)" }));
  g.appendChild(el("rect", { x: innerLeft, y: innerTop, width: innerRight - innerLeft, height: innerBottom - innerTop, fill: "#F1EFE8" }));

  const barCount = 14;
  const barW = (W / barCount) * 0.5;
  for (let i = 0; i < barCount; i++) {
    g.appendChild(el("rect", {
      x: X0 + i * (W / barCount) + (W / barCount - barW) / 2, y: channelY + 8,
      width: barW, height: 30, fill: "#D3D1C7",
    }));
  }

  g.appendChild(el("rect", { x: railLeftX, y: channelY, width: RAIL_W, height: eqBottom - channelY, fill: "#D3D1C7" }));
  g.appendChild(el("rect", { x: railRightX, y: channelY, width: RAIL_W, height: eqBottom - channelY, fill: "#D3D1C7" }));

  const railNumG = el("g", { id: "rail-numbers-layer" });
  layout.segments.forEach(seg => {
    if (seg.kind === "collapsed") {
      const label = el("g", { style: "cursor:pointer" });
      label.appendChild(el("rect", {
        x: railLeftX, y: seg.y + 3, width: RAIL_W * 2 + W, height: seg.height - 6, rx: 3,
        fill: "#E4E2D8", stroke: "#B4B2A9", "stroke-width": 0.8, "stroke-dasharray": "3 2",
      }));
      const t = el("text", {
        x: X0 + W / 2, y: seg.y + seg.height / 2 + 3.5, "font-size": 12, "font-family": "monospace", "font-weight": "700",
        fill: "#2C2C2A", stroke: "#E4E2D8", "stroke-width": 3, "paint-order": "stroke fill", "text-anchor": "middle",
      });
      t.textContent = `U${seg.fromU}–U${seg.toU} · ${seg.count}U empty (click to expand)`;
      label.appendChild(t);
      label.addEventListener("click", ev => { ev.stopPropagation(); setEditMode(true); });
      railNumG.appendChild(label);
      return;
    }
    if (seg.kind !== "empty") return;
    const cy = seg.y + seg.height / 2;
    [railLeftX, railRightX].forEach(rx => {
      [8, 20, 32].forEach(off => {
        g.appendChild(el("rect", { x: rx + off, y: cy - 2.5, width: 7, height: 5, fill: "#5F5E5A" }));
      });
    });
    if (seg.u % 2 === 1) {
      const t = el("text", { x: railLeftX - 5, y: cy + 3.5, "font-size": 7.5, "font-family": "monospace", fill: "#565550", "text-anchor": "end" });
      t.textContent = "U" + seg.u;
      railNumG.appendChild(t);
    }
  });
  g.appendChild(railNumG);

  drawLegend(g, X0, outerY + outerH + 24);

  return { outerX, outerY, outerW, outerH };
}

function drawLegend(g, x, y) {
  let cx = x;
  Object.entries(ROLE_COLORS).forEach(([role, color]) => {
    g.appendChild(el("rect", { x: cx, y, width: 7, height: 7, rx: 1.4, fill: color }));
    const t = el("text", { x: cx + 11, y: y + 6, "font-size": 6.4, "font-family": "monospace", fill: "#5F5E5A" });
    t.textContent = role;
    g.appendChild(t);
    cx += 60;
  });
}

function renameDevice(device) {
  const next = window.prompt("Rename device:", device.name);
  if (next === null || !next.trim() || next.trim() === device.name) return;
  fetch(`/api/devices/${device.id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: next.trim() }),
  }).then(r => r.json()).then(updated => {
    if (updated.error) { window.alert(updated.error); return; }
    device.name = updated.name;
    renderRack(document.getElementById("rack-svg"), currentRack, currentCables);
    refreshCabling();
  });
}

function drawDeviceLabels(parentG, rack, layout) {
  const g = el("g", { id: "device-label-layer" });
  parentG.appendChild(g);
  const railLeftX = X0 - RAIL_W;
  rack.devices.forEach(device => {
    const type = device.device_type;
    const y = layout.deviceY.get(device.id);
    const h = type.u_height * U;
    const centerY = y + h / 2;
    const color = roleColor(type.category);
    const isMultiU = type.u_height > 1;

    const offKey = "device-name-label";
    const savedOff = (device.metadata_json && device.metadata_json.label_offsets && device.metadata_json.label_offsets[offKey]) || { dx: 0, dy: 0 };

    const labelG = el("g", { transform: `translate(${savedOff.dx},${savedOff.dy})`, style: "cursor:move" });
    g.appendChild(labelG);

    const name = el("text", {
      x: LABEL_RIGHT, y: isMultiU ? centerY - 3 : centerY + 4.5,
      "font-size": 17, "font-family": "monospace", "font-weight": "800",
      "text-anchor": "end", fill: "#1A1A18", class: "rv-label-name",
      stroke: "#F1EFE8", "stroke-width": 3, "paint-order": "stroke fill",
    });
    name.textContent = device.name;
    labelG.appendChild(name);

    if (isMultiU) {
      const model = el("text", {
        x: LABEL_RIGHT, y: centerY + 14,
        "font-size": 14, "font-family": "monospace", "font-weight": "700",
        "text-anchor": "end", fill: "#33322E", class: "rv-label-model",
        stroke: "#F1EFE8", "stroke-width": 3, "paint-order": "stroke fill",
      });
      model.textContent = `${type.vendor} ${type.model}`;
      labelG.appendChild(model);
    }

    labelG.appendChild(el("line", {
      x1: LABEL_RIGHT + 8, y1: centerY, x2: railLeftX - 14, y2: centerY,
      stroke: color, "stroke-width": 0.9, opacity: 0.42,
      "stroke-dasharray": "2 2", "pointer-events": "none",
    }));
    labelG.appendChild(el("circle", {
      cx: railLeftX - 13, cy: centerY, r: 1.9, fill: color, "pointer-events": "none",
    }));

    // Drag the whole label block (name + model + leader line) to declutter; right-click renames the device.
    let dragging = false, start = null, startOff = null;
    labelG.addEventListener("mousedown", ev => {
      ev.stopPropagation();
      dragging = true;
      const svgEl = document.getElementById("rack-svg");
      start = clientToSvg(svgEl, ev.clientX, ev.clientY);
      startOff = savedOff;
      const onMove = mv => {
        if (!dragging) return;
        const p = clientToSvg(svgEl, mv.clientX, mv.clientY);
        labelG.setAttribute("transform", `translate(${startOff.dx + (p.x - start.x)},${startOff.dy + (p.y - start.y)})`);
      };
      const onUp = up => {
        dragging = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        const p = clientToSvg(svgEl, up.clientX, up.clientY);
        const ndx = startOff.dx + (p.x - start.x), ndy = startOff.dy + (p.y - start.y);
        device.metadata_json = device.metadata_json || {};
        device.metadata_json.label_offsets = Object.assign({}, device.metadata_json.label_offsets, { [offKey]: { dx: ndx, dy: ndy } });
        fetch(`/api/devices/${device.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata_json: { label_offsets: { [offKey]: { dx: ndx, dy: ndy } } } }),
        });
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    labelG.addEventListener("contextmenu", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      renameDevice(device);
    });

    if (registry[device.id]) registry[device.id].labelGroup = labelG;
  });
}

function onPortClick(deviceId, portName) {
  if (cablingMode === "create") {
    if (window.onCreateCableClick) window.onCreateCableClick(deviceId, portName);
    return;
  }
  const same = selectedId === deviceId && selectedPort && selectedPort.portName === portName;
  if (same) {
    selectedId = null;
    selectedPort = null;
  } else {
    selectedId = deviceId;
    selectedPort = { deviceId, portName };
  }
  selectedCableId = null;
  applyHighlight();
}

function drawDevice(rootG, device, y) {
  const type = device.device_type;
  const h = type.u_height * U;

  registry[device.id] = { ports: {}, group: null, body: null, origFill: null, origStroke: null };

  const hooks = {
    registerPort: (name, px, py) => { registry[device.id].ports[name] = { x: px, y: py }; },
    onPortClick: portName => onPortClick(device.id, portName),
    onPortContextMenu: (portName, ev) => {
      if (window.showPortContextMenu) window.showPortContextMenu(ev, device.id, portName);
    },
    getLabelOffset: key => {
      const offsets = device.metadata_json && device.metadata_json.label_offsets;
      return (offsets && offsets[key]) || { dx: 0, dy: 0 };
    },
    onLabelDrag: (key, dx, dy) => {
      device.metadata_json = device.metadata_json || {};
      device.metadata_json.label_offsets = Object.assign({}, device.metadata_json.label_offsets, { [key]: { dx, dy } });
      fetch(`/api/devices/${device.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata_json: { label_offsets: { [key]: { dx, dy } } } }),
      });
      renderRack(document.getElementById("rack-svg"), currentRack, currentCables);
      refreshCabling();
    },
    toSvgPoint: (clientX, clientY) => clientToSvg(document.getElementById("rack-svg"), clientX, clientY),
    rearConfig: (device.metadata_json && device.metadata_json.rear_config) || null,
    getLabelText: (key, fallback) => {
      const texts = device.metadata_json && device.metadata_json.group_labels;
      return (texts && texts[key]) || fallback;
    },
    onLabelRename: (key, currentText) => {
      const next = window.prompt("Label text:", currentText);
      if (next === null || !next.trim() || next.trim() === currentText) return;
      const newText = next.trim();
      device.metadata_json = device.metadata_json || {};
      device.metadata_json.group_labels = Object.assign({}, device.metadata_json.group_labels, { [key]: newText });
      fetch(`/api/devices/${device.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata_json: { group_labels: { [key]: newText } } }),
      });

      // Any cable whose config/label text mentions the old wording gets it swapped too,
      // so e.g. renaming "16Gb FC" -> "32Gb FC" also updates the HBA cables' own config text.
      const affected = (currentCables || []).filter(c =>
        (c.a_device_id === device.id || c.b_device_id === device.id) && c.label && c.label.includes(currentText)
      );
      affected.forEach(c => {
        const newLabel = c.label.split(currentText).join(newText);
        c.label = newLabel;
        fetch(`/api/cables/${c.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: newLabel }),
        });
      });

      renderRack(document.getElementById("rack-svg"), currentRack, currentCables);
      refreshCabling();
    },
  };

  const face = faceForDevice(type);
  const g = rvRender(rootG, type.model, face, X0, y, W, hooks);
  g.setAttribute("class", "device");
  g.setAttribute("data-id", device.id);
  g.setAttribute("style", `cursor:${editMode ? "grab" : "pointer"}`);
  g.setAttribute("filter", "url(#deviceShadow)");
  registry[device.id].group = g;

  const body = g.querySelector(".rv-chassis > rect");
  if (body) {
    registry[device.id].body = body;
    registry[device.id].origFill = body.getAttribute("fill");
    registry[device.id].origStroke = body.getAttribute("stroke");
  }
  registry[device.id].bounds = { x: X0, y, w: W, h };

  g.appendChild(el("rect", {
    x: X0, y: y + 0.7, width: 4, height: h - 1.4, rx: 1.1,
    fill: roleColor(type.category), "pointer-events": "none",
  }));

  attachTooltip(g, device, type);
}

// Shared with rvHit's per-port hover handlers below: the device tooltip's own text stays put,
// a port's name gets appended on top of it while the cursor is over that specific port — most
// useful while a cable end is following the cursor, so you can see exactly what it'll land on.
let tooltipBaseHTML = "";
let tooltipPortName = null;

function renderTooltip() {
  const tip = document.getElementById("rv-tooltip");
  if (!tip) return;
  tip.innerHTML = tooltipBaseHTML + (tooltipPortName ? `<br><strong>Port: ${tooltipPortName}</strong>` : "");
}

function setTooltipPort(portName) {
  tooltipPortName = portName;
  renderTooltip();
}

function attachTooltip(deviceGroup, device, type) {
  const tip = document.getElementById("rv-tooltip");
  if (!tip) return;
  deviceGroup.addEventListener("mouseenter", () => {
    const uTop = device.position_u + type.u_height - 1;
    tooltipBaseHTML = `<strong>${device.name}</strong><br>${type.vendor} ${type.model}<br>`
      + `U${device.position_u}–U${uTop} · ${type.u_height}U`;
    tooltipPortName = null;
    renderTooltip();
    tip.style.display = "block";
  });
  deviceGroup.addEventListener("mousemove", ev => {
    tip.style.left = (ev.clientX + 14) + "px";
    tip.style.top = (ev.clientY + 14) + "px";
  });
  deviceGroup.addEventListener("mouseleave", () => {
    tip.style.display = "none";
    tooltipPortName = null;
  });
}

function applyHighlightVisuals() {
  Object.keys(registry).forEach(idStr => {
    const id = Number(idStr);
    const rec = registry[id];
    if (!rec.body) return;
    const setLabelOpacity = op => { if (rec.labelGroup) rec.labelGroup.setAttribute("opacity", op); };
    if (!selectedId) {
      rec.group.setAttribute("opacity", "1");
      rec.body.setAttribute("fill", rec.origFill);
      rec.body.setAttribute("stroke", rec.origStroke);
      rec.body.setAttribute("stroke-width", "0.9");
      setLabelOpacity(1);
      return;
    }
    if (id === selectedId) {
      rec.group.setAttribute("opacity", "1");
      rec.body.setAttribute("fill", "#9FE1CB");
      rec.body.setAttribute("stroke", "#0F6E56");
      rec.body.setAttribute("stroke-width", "2");
      setLabelOpacity(1);
    } else if (adjacency[selectedId] && adjacency[selectedId].has(id)) {
      rec.group.setAttribute("opacity", "1");
      rec.body.setAttribute("fill", "#FDE2AE");
      rec.body.setAttribute("stroke", "#B8791A");
      rec.body.setAttribute("stroke-width", "1.5");
      setLabelOpacity(1);
    } else {
      rec.group.setAttribute("opacity", "0.55");
      rec.body.setAttribute("fill", rec.origFill);
      rec.body.setAttribute("stroke", rec.origStroke);
      rec.body.setAttribute("stroke-width", "0.9");
      setLabelOpacity(0.55);
    }
  });
}

function applyHighlight() {
  applyHighlightVisuals();
  if (window.onSelectionChange) window.onSelectionChange(selectedId);
}

function selectDevice(id) {
  selectedId = selectedId === id ? null : id;
  if (!selectedId) selectedPort = null;
  selectedCableId = null;
  applyHighlight();
}

function focusDevice(id) {
  if (!currentRack || !registry[id] || !baseViewBox) return;
  selectedId = id;
  selectedPort = null;
  selectedCableId = null;
  applyHighlight();

  const b = registry[id].bounds;
  if (b) {
    const svgEl = document.getElementById("rack-svg");
    const targetScale = Math.max(zoomScale, 2);
    const centerX = b.x + b.w / 2;
    const centerY = b.y + b.h / 2;
    const vw = baseViewBox.w / targetScale;
    const vh = baseViewBox.h / targetScale;
    zoomScale = targetScale;
    zoomOffsetX = centerX - vw / 2 - baseViewBox.x;
    zoomOffsetY = centerY - vh / 2 - baseViewBox.y;
    applyZoom(svgEl);
  }
}

// Thin colored port borders after an LLDP compare (RACKVIEW_KABLO_TAKIP.md) — deliberately not a big
// circle, since ports sit dense and two rows deep; a circle would swallow the neighboring ports.
const LLDP_MARKER_COLORS = { conflict: "#A32D2D", new: "#0F6E56", removed: "#B8791A" };

function applyLldpMarkers(deviceId, items) {
  clearLldpMarkers();
  const rec = registry[deviceId];
  if (!rec || !rec.group) return;
  const layer = el("g", { id: "lldp-marker-layer" });
  (items || []).forEach(item => {
    const color = LLDP_MARKER_COLORS[item.status];
    const pos = rec.ports[item.port];
    if (!color || !pos) return;
    layer.appendChild(el("rect", {
      x: pos.x - 8, y: pos.y - 6, width: 16, height: 12, rx: 1.5,
      fill: "none", stroke: color, "stroke-width": 2, "pointer-events": "none",
    }));
  });
  rec.group.appendChild(layer);
}

function clearLldpMarkers() {
  document.querySelectorAll("#lldp-marker-layer").forEach(e => e.remove());
}

function applyImpactHighlight(data) {
  Object.values(registry).forEach(rec => {
    if (!rec.body) return;
    rec.body.setAttribute("fill", rec.origFill);
    rec.body.setAttribute("stroke", rec.origStroke);
    if (rec.group) rec.group.setAttribute("opacity", "0.5");
  });
  const paint = (list, fill, stroke) => {
    (list || []).forEach(item => {
      const rec = registry[item.device_id];
      if (!rec || !rec.body) return;
      rec.body.setAttribute("fill", fill);
      rec.body.setAttribute("stroke", stroke);
      if (rec.group) rec.group.setAttribute("opacity", "1");
    });
  };
  paint(data.critical, "#F3B4B0", "#A32D2D");
  paint(data.degraded, "#FBEDD4", "#B8791A");
  if (registry[selectedId] && registry[selectedId].group) {
    registry[selectedId].group.setAttribute("opacity", "1");
  }
}

function clearImpactHighlight() {
  Object.values(registry).forEach(rec => {
    if (!rec.body) return;
    rec.body.setAttribute("fill", rec.origFill);
    rec.body.setAttribute("stroke", rec.origStroke);
    if (rec.group) rec.group.setAttribute("opacity", "1");
  });
  applyHighlightVisuals();
}

function resetSelection() {
  selectedId = null;
  selectedPort = null;
  selectedCableId = null;
  applyHighlight();
}

function setFace(face) {
  currentFace = face;
  if (cablingOn) cablingFaceOverride = face;
  if (currentRack) renderRack(document.getElementById("rack-svg"), currentRack, currentCables);
}

function setEditMode(on) {
  editMode = on;
  if (currentRack) renderRack(document.getElementById("rack-svg"), currentRack, currentCables);
}

function clientToSvg(svgEl, clientX, clientY) {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(svgEl.getScreenCTM().inverse());
}

function applyZoom(svgEl) {
  if (!baseViewBox) return;
  const w = baseViewBox.w / zoomScale;
  const h = baseViewBox.h / zoomScale;
  svgEl.setAttribute("viewBox", `${baseViewBox.x + zoomOffsetX} ${baseViewBox.y + zoomOffsetY} ${w} ${h}`);
  updateLabelScale();
}

function updateLabelScale() {
  const nameSize = zoomScale > 1.5 ? 12 : 17;
  const modelSize = zoomScale > 1.5 ? 10 : 14;
  document.querySelectorAll(".rv-label-name").forEach(e => e.setAttribute("font-size", nameSize));
  document.querySelectorAll(".rv-label-model").forEach(e => e.setAttribute("font-size", modelSize));
}

function zoomAt(svgEl, clientX, clientY, factor) {
  if (!baseViewBox) return;
  const pt = clientToSvg(svgEl, clientX, clientY);
  const newScale = Math.min(6, Math.max(0.5, zoomScale * factor));
  const vx = baseViewBox.x + zoomOffsetX;
  const vy = baseViewBox.y + zoomOffsetY;
  const ratio = zoomScale / newScale;
  zoomOffsetX = pt.x - (pt.x - vx) * ratio - baseViewBox.x;
  zoomOffsetY = pt.y - (pt.y - vy) * ratio - baseViewBox.y;
  zoomScale = newScale;
  applyZoom(svgEl);
}

function startPan(svgEl, e) {
  if (!baseViewBox) return;
  const rect = svgEl.getBoundingClientRect();
  const vw = baseViewBox.w / zoomScale;
  const vh = baseViewBox.h / zoomScale;
  panState = {
    startClientX: e.clientX,
    startClientY: e.clientY,
    startOffsetX: zoomOffsetX,
    startOffsetY: zoomOffsetY,
    unitsPerPxX: vw / rect.width,
    unitsPerPxY: vh / rect.height,
    moved: false,
  };
  svgEl.style.cursor = "grabbing";
  const onMove = ev => onPanMove(svgEl, ev);
  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    svgEl.style.cursor = "";
    lastPanMoved = !!(panState && panState.moved);
    panState = null;
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function onPanMove(svgEl, e) {
  if (!panState) return;
  const dxClient = e.clientX - panState.startClientX;
  const dyClient = e.clientY - panState.startClientY;
  if (Math.abs(dxClient) > 2 || Math.abs(dyClient) > 2) panState.moved = true;
  if (!panState.moved) return;
  zoomOffsetX = panState.startOffsetX - dxClient * panState.unitsPerPxX;
  zoomOffsetY = panState.startOffsetY - dyClient * panState.unitsPerPxY;
  applyZoom(svgEl);
}

function startDrag(svgEl, groupEl, e) {
  e.preventDefault();
  document.body.style.cursor = "grabbing";
  const id = Number(groupEl.getAttribute("data-id"));
  const device = currentRack.devices.find(d => d.id === id);
  const type = device.device_type;
  const startSvg = clientToSvg(svgEl, e.clientX, e.clientY);
  dragState = {
    id, type, groupEl,
    origPositionU: device.position_u,
    newPositionU: device.position_u,
    startSvgY: startSvg.y,
    moved: false,
  };
  const onMove = ev => onDragMove(svgEl, ev);
  const onUp = ev => {
    onDragEnd(ev);
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function onDragMove(svgEl, e) {
  if (!dragState) return;
  const pt = clientToSvg(svgEl, e.clientX, e.clientY);
  const deltaSvgY = pt.y - dragState.startSvgY;
  if (Math.abs(deltaSvgY) > 2) dragState.moved = true;
  if (!dragState.moved) return;
  const deltaU = Math.round(deltaSvgY / U);
  const maxU = currentRack.u_height - dragState.type.u_height + 1;
  const newPositionU = Math.max(1, Math.min(maxU, dragState.origPositionU - deltaU));
  dragState.newPositionU = newPositionU;
  const visualDeltaU = dragState.origPositionU - newPositionU;
  dragState.groupEl.setAttribute("transform", `translate(0, ${visualDeltaU * U})`);
}

function onDragEnd() {
  document.body.style.cursor = "";
  if (!dragState) return;
  const { id, moved, newPositionU, origPositionU, groupEl } = dragState;
  groupEl.removeAttribute("transform");
  lastDragMoved = moved;
  dragState = null;
  if (moved && newPositionU !== origPositionU && window.onDeviceMove) {
    window.onDeviceMove(id, newPositionU);
  }
}

function renderRack(svgEl, rack, cables) {
  currentRack = rack;
  currentCables = cables;
  registry = {};
  adjacency = buildAdjacency(cables);
  svgEl.innerHTML = "";
  const g = el("g", {});
  svgEl.appendChild(g);
  const layout = computeLayout(rack, !editMode);
  const dims = drawFrame(g, layout);
  const viewLeft = LABEL_RIGHT - LABEL_VIEW_BUFFER;
  baseViewBox = {
    x: viewLeft - 10, y: 0,
    w: dims.outerX + dims.outerW + 20 - (viewLeft - 10),
    h: dims.outerY + dims.outerH + 60,
  };
  applyZoom(svgEl);

  rack.devices.forEach(d => drawDevice(g, d, layout.deviceY.get(d.id)));
  rack.devices.forEach(d => {
    const belowU = d.position_u - 1;
    registry[d.id].belowEmpty = belowU >= 1 && !rack.devices.some(o =>
      o.id !== d.id && belowU >= o.position_u && belowU < o.position_u + o.device_type.u_height);
  });
  drawDeviceLabels(g, rack, layout);

  svgEl.onwheel = e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    zoomAt(svgEl, e.clientX, e.clientY, factor);
  };

  svgEl.onclick = e => {
    if (lastDragMoved) {
      lastDragMoved = false;
      return;
    }
    if (lastPanMoved) {
      lastPanMoved = false;
      return;
    }
    const target = e.target.closest("g.device");
    if (!target) {
      if (cablingMode === "create" && window.onCancelPendingCable) window.onCancelPendingCable();
      resetSelection();
      return;
    }
    if (cablingMode === "create") return;
    const deviceId = Number(target.getAttribute("data-id"));
    selectedPort = null;
    selectDevice(deviceId);
  };

  svgEl.oncontextmenu = e => {
    const target = e.target.closest("g.device");
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    const deviceId = Number(target.getAttribute("data-id"));
    if (window.showDeviceContextMenu) window.showDeviceContextMenu(e, deviceId);
  };

  svgEl.onmousedown = e => {
    if (e.button !== 0) return;
    const target = e.target.closest("g.device");
    if (target) {
      if (editMode) startDrag(svgEl, target, e);
      return;
    }
    startPan(svgEl, e);
  };

  applyHighlight();
}
