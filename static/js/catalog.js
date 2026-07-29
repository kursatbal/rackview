let deviceTypes = [];
let catalogCategory = "all";
let catalogVendor = "all";
let catalogSearch = "";
let draggingTypeId = null;

const CATEGORY_LABELS = {
  switch: "Switch", server: "Server", storage: "Storage", firewall: "Firewall", router: "Router",
  pdu: "PDU", panel: "Panel", "patch-panel": "Patch Panel", passthrough: "Passthrough",
};

async function loadDeviceTypes() {
  deviceTypes = await fetch("/api/device-types").then(r => r.json());
}

function filteredDeviceTypes() {
  return deviceTypes.filter(t => {
    if (catalogCategory !== "all" && t.category !== catalogCategory) return false;
    if (catalogVendor !== "all" && t.vendor !== catalogVendor) return false;
    if (catalogSearch) {
      const hay = `${t.vendor} ${t.model}`.toLowerCase();
      if (!hay.includes(catalogSearch.toLowerCase())) return false;
    }
    return true;
  });
}

function vendorsForCategory() {
  const pool = catalogCategory === "all" ? deviceTypes : deviceTypes.filter(t => t.category === catalogCategory);
  return [...new Set(pool.map(t => t.vendor))].sort();
}

function renderCatalog() {
  const root = document.getElementById("catalog");
  if (!editMode) {
    root.style.display = "none";
    return;
  }
  root.style.display = "flex";
  root.innerHTML = "";

  const search = h("input", { type: "text", placeholder: "Search: vendor / model...", class: "catalog-search", value: catalogSearch });
  search.oninput = e => { catalogSearch = e.target.value; renderCatalog(); };
  root.appendChild(search);

  const catRow = h("div", { class: "catalog-chips" });
  ["all", "switch", "server", "storage", "firewall", "router", "pdu", "patch-panel", "panel", "passthrough"].forEach(cat => {
    const btn = h("button", { class: "chip" + (catalogCategory === cat ? " active" : "") }, [cat === "all" ? "All" : CATEGORY_LABELS[cat]]);
    btn.onclick = () => { catalogCategory = cat; catalogVendor = "all"; renderCatalog(); };
    catRow.appendChild(btn);
  });
  root.appendChild(catRow);

  const vendorRow = h("div", { class: "catalog-chips" });
  const allVendorsBtn = h("button", { class: "chip" + (catalogVendor === "all" ? " active" : "") }, ["All vendors"]);
  allVendorsBtn.onclick = () => { catalogVendor = "all"; renderCatalog(); };
  vendorRow.appendChild(allVendorsBtn);
  vendorsForCategory().forEach(v => {
    const btn = h("button", { class: "chip" + (catalogVendor === v ? " active" : "") }, [v]);
    btn.onclick = () => { catalogVendor = v; renderCatalog(); };
    vendorRow.appendChild(btn);
  });
  root.appendChild(vendorRow);

  const list = h("div", { class: "catalog-list" });
  const matches = filteredDeviceTypes();
  if (matches.length === 0) {
    list.appendChild(h("div", { class: "catalog-empty" }, ["No results."]));
  }
  matches.forEach(t => {
    const card = h("div", { class: "catalog-card", draggable: "true" });
    card.appendChild(h("div", { class: "catalog-card-title" }, [`${t.vendor} ${t.model}`]));
    card.appendChild(h("div", { class: "catalog-card-meta" }, [`${CATEGORY_LABELS[t.category] || t.category} · ${t.u_height}U`]));
    card.ondragstart = e => {
      draggingTypeId = t.id;
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text/plain", String(t.id));
    };
    card.ondragend = () => {
      draggingTypeId = null;
      clearDropGhost();
    };
    list.appendChild(card);
  });
  root.appendChild(list);
}

function checkOverlapClient(positionU, uHeight) {
  if (!currentRack) return false;
  if (positionU < 1 || positionU + uHeight - 1 > currentRack.u_height) return false;
  return !currentRack.devices.some(d => {
    const lo = d.position_u, hi = d.position_u + d.device_type.u_height - 1;
    return positionU <= hi && lo <= positionU + uHeight - 1;
  });
}

function positionUFromSvgY(svgY, uHeight) {
  const raw = Math.round(currentRack.u_height - (svgY - Y0) / U);
  return Math.max(1, Math.min(currentRack.u_height - uHeight + 1, raw));
}

function clearDropGhost() {
  const g = document.getElementById("drop-ghost");
  if (g) g.remove();
}

function showDropGhost(svgEl, positionU, uHeight, valid) {
  clearDropGhost();
  const rootG = svgEl.firstChild;
  if (!rootG) return;
  const y = uToY(positionU, uHeight, currentRack.u_height);
  rootG.appendChild(el("rect", {
    id: "drop-ghost", x: X0, y, width: W, height: uHeight * U,
    fill: valid ? "#9FE1CB" : "#FAC775", "fill-opacity": "0.5",
    stroke: valid ? "#0F6E56" : "#854F0B", "stroke-width": "3",
    "pointer-events": "none",
  }));
}

async function placeDevice(deviceTypeId, positionU) {
  const type = deviceTypes.find(t => t.id === deviceTypeId);
  const defaultName = `${type.vendor}-${type.model}`.replace(/\s+/g, "-").toUpperCase();
  const name = window.prompt("Device name:", defaultName);
  if (!name) return;
  const res = await fetch("/api/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rack_id: currentRack.id, device_type_id: deviceTypeId, position_u: positionU, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(`Could not add: ${err.error || res.status}`);
    return;
  }
  await reloadData();
}

function setupCatalogDropZone() {
  const svgEl = document.getElementById("rack-svg");

  svgEl.addEventListener("dragover", e => {
    if (!editMode || !draggingTypeId) return;
    e.preventDefault();
    const type = deviceTypes.find(t => t.id === draggingTypeId);
    if (!type) return;
    const pt = clientToSvg(svgEl, e.clientX, e.clientY);
    const positionU = positionUFromSvgY(pt.y, type.u_height);
    showDropGhost(svgEl, positionU, type.u_height, checkOverlapClient(positionU, type.u_height));
  });

  svgEl.addEventListener("dragleave", e => {
    if (e.target === svgEl) clearDropGhost();
  });

  svgEl.addEventListener("drop", async e => {
    e.preventDefault();
    clearDropGhost();
    if (!editMode || !draggingTypeId) return;
    const type = deviceTypes.find(t => t.id === draggingTypeId);
    draggingTypeId = null;
    if (!type) return;
    const pt = clientToSvg(svgEl, e.clientX, e.clientY);
    const positionU = positionUFromSvgY(pt.y, type.u_height);
    await placeDevice(type.id, positionU);
  });
}
