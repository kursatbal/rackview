const RACK_W = 110;
const RACK_GAP = 40;
const RACK_STRIP_H = 460;
const ROW_GAP = 70;
const HEADER_H = 15;
const TOP_MARGIN = 40;
const LEFT_MARGIN = 40;
const FLOOR_CHANNEL_Y = 20;

let floorRacks = [];
let floorCables = [];
let floorPositions = {}; // rack_id -> {x, y, w, h}
let showAllCables = false;

function fetchWithTimeout(url, options, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, Object.assign({}, options, { signal: controller.signal }))
    .finally(() => clearTimeout(timer))
    .catch(err => {
      if (err.name === "AbortError") throw new Error(`Request timed out (>${timeoutMs / 1000}s): ${url}`);
      throw err;
    });
}

function rackRoleColor(category) {
  return RV_ROLE_COLORS[category] || RV_ROLE_COLORS.other;
}

function layoutRacks(racks) {
  const rows = {};
  racks.forEach(r => { (rows[r.row] = rows[r.row] || []).push(r); });
  const sortedRowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);

  const positions = {};
  sortedRowKeys.forEach((rowKey, rowIdx) => {
    const rowRacks = rows[rowKey].slice().sort((a, b) => a.col - b.col);
    const y = TOP_MARGIN + rowIdx * (RACK_STRIP_H + ROW_GAP + HEADER_H) + HEADER_H;
    rowRacks.forEach((r, colIdx) => {
      const x = LEFT_MARGIN + colIdx * (RACK_W + RACK_GAP);
      positions[r.id] = { x, y, w: RACK_W, h: RACK_STRIP_H };
    });
  });
  return positions;
}

function drawRackStrip(g, rack, pos) {
  const { x, y, w, h } = pos;
  const rackH = rack.u_height;
  const uH = (h - 20) / rackH;

  el("rect", { x: x - 6, y: y - 8, width: w + 12, height: h + 16, rx: 4,
    fill: "#EDEBE4", stroke: "#C4C2B8", "stroke-width": 1 }, g);

  const hdr = el("rect", { x: x - 6, y: y - 8, width: w + 12, height: HEADER_H, rx: 4,
    fill: "#2C2C2A", style: "cursor:pointer" }, g);
  hdr.addEventListener("click", () => enterRack(rack.id));
  const t = el("text", { x: x + w / 2, y: y + 2, "font-size": 8,
    "font-family": "monospace", fill: "#E6E4DC", "text-anchor": "middle",
    "font-weight": "600", style: "cursor:pointer" }, g);
  t.textContent = rack.name;
  t.addEventListener("click", () => enterRack(rack.id));

  el("rect", { x, y: y + 10, width: 5, height: h - 14, fill: "#CFCDC4" }, g);
  el("rect", { x: x + w - 5, y: y + 10, width: 5, height: h - 14, fill: "#CFCDC4" }, g);

  (rack.devices || []).forEach(d => {
    const uHeight = d.device_type.u_height;
    const dy = y + 10 + (rackH - d.position_u - uHeight + 1) * uH;
    const dh = uHeight * uH - 1;
    const color = rackRoleColor(d.device_type.category);
    const rect = el("rect", { x: x + 5, y: dy, width: w - 10, height: dh, rx: 1.2,
      fill: color, "fill-opacity": 0.14, stroke: color, "stroke-width": 0.7, style: "cursor:pointer" }, g);
    el("rect", { x: x + 5, y: dy, width: 3, height: dh, rx: 0.8, fill: color }, g);
    rect.addEventListener("mouseenter", ev => showFloorTooltip(ev, d));
    rect.addEventListener("mousemove", ev => moveFloorTooltip(ev));
    rect.addEventListener("mouseleave", hideFloorTooltip);
    rect.addEventListener("click", () => enterRack(rack.id, d.id));
  });

  const occupied = (rack.devices || []).reduce((sum, d) => sum + d.device_type.u_height, 0);
  const pct = Math.round((occupied / rackH) * 100);
  hdr.addEventListener("mouseenter", ev => showFloorTooltip(ev, null, `${rack.name}<br>${(rack.devices||[]).length} devices · ${pct}% full`));
  hdr.addEventListener("mousemove", ev => moveFloorTooltip(ev));
  hdr.addEventListener("mouseleave", hideFloorTooltip);
}

function deviceAttachPoint(device, rack, pos, side) {
  const rackH = rack.u_height;
  const uH = (pos.h - 20) / rackH;
  const uHeight = device.device_type.u_height;
  const dy = pos.y + 10 + (rackH - device.position_u - uHeight + 1) * uH + (uHeight * uH - 1) / 2;
  const x = side === "right" ? pos.x + pos.w : pos.x;
  return { x, y: dy };
}

function routeInterRackCable(aPoint, bPoint) {
  const chY = FLOOR_CHANNEL_Y + 7;
  return `M${aPoint.x},${aPoint.y} `
       + `C${aPoint.x + (aPoint.side === "right" ? 20 : -20)},${aPoint.y} ${aPoint.x + (aPoint.side === "right" ? 20 : -20)},${chY} ${(aPoint.x + bPoint.x) / 2},${chY} `
       + `C${bPoint.x + (bPoint.side === "right" ? 20 : -20)},${chY} ${bPoint.x + (bPoint.side === "right" ? 20 : -20)},${bPoint.y} ${bPoint.x},${bPoint.y}`;
}

function drawInterRackCables(g) {
  const relevantCables = floorCables.filter(c => c.inter_rack);
  relevantCables.forEach(c => {
    const posA = floorPositions[c.a_rack_id];
    const posB = floorPositions[c.b_rack_id];
    if (!posA || !posB) return;
    const rackA = floorRacks.find(r => r.id === c.a_rack_id);
    const rackB = floorRacks.find(r => r.id === c.b_rack_id);
    const devA = rackA.devices.find(d => d.id === c.a_device_id);
    const devB = rackB.devices.find(d => d.id === c.b_device_id);
    if (!devA || !devB) return;

    const sideA = posA.x <= posB.x ? "right" : "left";
    const sideB = posB.x <= posA.x ? "right" : "left";
    const aPoint = Object.assign(deviceAttachPoint(devA, rackA, posA, sideA), { side: sideA });
    const bPoint = Object.assign(deviceAttachPoint(devB, rackB, posB, sideB), { side: sideB });

    const isFocused = focusedRackId && (c.a_rack_id === focusedRackId || c.b_rack_id === focusedRackId);
    const opacity = showAllCables ? 0.85 : (isFocused ? 0.95 : 0.3);
    const style = CABLE_MEDIUM_COLORS[c.medium] || "#5F5E5A";

    const path = el("path", {
      d: routeInterRackCable(aPoint, bPoint),
      stroke: style, "stroke-width": 1.6, fill: "none", opacity,
      "stroke-linecap": "round",
    }, g);
    path.addEventListener("mouseenter", ev => showFloorTooltip(ev, null,
      `${devA.name} (${rackA.name}) ↔ ${devB.name} (${rackB.name})<br>${c.label || c.medium}`));
    path.addEventListener("mousemove", ev => moveFloorTooltip(ev));
    path.addEventListener("mouseleave", hideFloorTooltip);
  });
}

const CABLE_MEDIUM_COLORS = { fiber: "#1D9E75", dac: "#2C2C2A", cat6a: "#5B7FBF", sas: "#534AB7" };

let focusedRackId = null;

function showFloorTooltip(ev, device, htmlOverride) {
  const tip = document.getElementById("rv-tooltip");
  if (htmlOverride) {
    tip.innerHTML = htmlOverride;
  } else if (device) {
    tip.innerHTML = `<strong>${device.name}</strong><br>${device.device_type.vendor} ${device.device_type.model}<br>U${device.position_u}`;
  }
  tip.style.display = "block";
  moveFloorTooltip(ev);
}
function moveFloorTooltip(ev) {
  const tip = document.getElementById("rv-tooltip");
  tip.style.left = (ev.clientX + 14) + "px";
  tip.style.top = (ev.clientY + 14) + "px";
}
function hideFloorTooltip() {
  document.getElementById("rv-tooltip").style.display = "none";
}

function enterRack(rackId, deviceId) {
  const url = deviceId ? `index.html?rack=${rackId}&device=${deviceId}` : `index.html?rack=${rackId}`;
  location.href = url;
}

function renderFloor() {
  const svg = document.getElementById("floor-svg");
  svg.innerHTML = "";
  const emptyEl = document.getElementById("floor-empty");

  if (!floorRacks.length) {
    emptyEl.style.display = "block";
    svg.setAttribute("width", 0);
    svg.setAttribute("height", 0);
    return;
  }
  emptyEl.style.display = "none";

  floorPositions = layoutRacks(floorRacks);
  const maxX = Math.max(...Object.values(floorPositions).map(p => p.x + p.w)) + LEFT_MARGIN;
  const maxY = Math.max(...Object.values(floorPositions).map(p => p.y + p.h)) + TOP_MARGIN;
  svg.setAttribute("viewBox", `0 0 ${maxX} ${maxY}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", maxY);

  const g = el("g", {}, svg);
  floorRacks.forEach(r => drawRackStrip(g, r, floorPositions[r.id]));
  drawInterRackCables(g);
}

async function loadCustomers() {
  const customers = await fetchWithTimeout("/api/customers").then(r => r.json());
  const select = document.getElementById("customer-select");
  select.innerHTML = "";
  customers.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.customer;
    opt.textContent = `${c.customer} (${c.rack_count} rack, ${c.device_count} device)`;
    select.appendChild(opt);
  });
  return customers;
}

async function loadCustomerFloor(customer) {
  floorRacks = await fetchWithTimeout(`/api/customers/${encodeURIComponent(customer)}/racks`).then(r => r.json());
  floorCables = await fetchWithTimeout(`/api/floor/${encodeURIComponent(customer)}/cables`).then(r => r.json());
  const totalDevices = floorRacks.reduce((sum, r) => sum + r.devices.length, 0);
  document.getElementById("customer-summary").textContent = `${floorRacks.length} rack · ${totalDevices} device`;
  renderFloor();
}

async function main() {
  const customers = await loadCustomers();
  const urlCustomer = new URLSearchParams(location.search).get("customer");
  const initial = (urlCustomer && customers.some(c => c.customer === urlCustomer))
    ? urlCustomer
    : (customers[0] && customers[0].customer);

  if (initial) {
    document.getElementById("customer-select").value = initial;
    await loadCustomerFloor(initial);
  }

  document.getElementById("customer-select").onchange = e => loadCustomerFloor(e.target.value);
  document.getElementById("chk-show-all-cables").onchange = e => {
    showAllCables = e.target.checked;
    renderFloor();
  };
}

function showFatalError(err) {
  console.error(err);
  const container = document.querySelector(".floor-container") || document.body;
  const box = document.createElement("div");
  box.style.cssText = "margin:20px;padding:14px;background:#FCE8E6;border:1px solid #A32D2D;"
    + "color:#A32D2D;font-family:monospace;font-size:12px;white-space:pre-wrap;";
  box.textContent = "Page failed to load (connection issue):\n" + (err && err.message ? err.message : err);
  const retryBtn = document.createElement("button");
  retryBtn.textContent = "Retry";
  retryBtn.style.cssText = "margin-top:8px;font-family:monospace;font-size:12px;padding:5px 12px;cursor:pointer;";
  retryBtn.onclick = () => location.reload();
  box.appendChild(document.createElement("br"));
  box.appendChild(retryBtn);
  container.prepend(box);
}

main().catch(showFatalError);
