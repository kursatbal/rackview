let rack = null;
let cables = [];
const currentRackId = Number(new URLSearchParams(location.search).get("rack")) || 1;

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

async function loadData() {
  rack = await fetchWithTimeout(`/api/racks/${currentRackId}`).then(r => r.json());
  const allCables = await fetchWithTimeout(`/api/racks/${currentRackId}/cables`).then(r => r.json());
  cables = allCables.filter(c => c.medium !== "power");

  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.textContent = `RackView — ${rack.name} · ${rack.site}`;
  const backBtn = document.getElementById("btn-back-floor");
  if (backBtn) {
    if (rack.customer) {
      backBtn.style.display = "inline-block";
      backBtn.href = `floor.html?customer=${encodeURIComponent(rack.customer)}`;
    } else {
      backBtn.style.display = "none";
    }
  }
}

async function reloadData() {
  await loadData();
  renderRack(document.getElementById("rack-svg"), rack, cables);
  refreshCabling();
}

async function main() {
  const svgEl = document.getElementById("rack-svg");
  await loadData();
  await loadDeviceTypes();

  renderRack(svgEl, rack, cables);
  refreshCabling();
  renderCatalog();
  setupCatalogDropZone();
  if (typeof setupSearch === "function") setupSearch();
  else console.error("search.js did not load — search box disabled, everything else still works.");

  const initialDeviceId = Number(new URLSearchParams(location.search).get("device"));
  if (initialDeviceId && typeof focusDevice === "function") {
    focusDevice(initialDeviceId);
    if (window.onSelectionChange) window.onSelectionChange(initialDeviceId);
  }

  // Coming from an LLDP compare (lldp.js's goToPortOnRack) — draw thin colored borders on the
  // ports that differ, one-shot (cleared from storage so a later visit doesn't show stale markers).
  try {
    const raw = sessionStorage.getItem("rackview_lldp_markers");
    if (raw) {
      sessionStorage.removeItem("rackview_lldp_markers");
      const markers = JSON.parse(raw);
      if (markers.deviceId === initialDeviceId && typeof applyLldpMarkers === "function") {
        applyLldpMarkers(markers.deviceId, markers.items);
      }
    }
  } catch (e) { /* sessionStorage/JSON issue — just skip the overlay */ }

  // Coming from LLDP Auto-Cabling's "Create device →" shortcut — jump straight into edit mode with
  // the catalog panel open, and hint at the name the neighbor was reported under so the user can
  // reuse it verbatim when they drop a device type onto the rack and get asked to name it.
  if (new URLSearchParams(location.search).get("edit") === "1") {
    if (!editMode) document.getElementById("btn-edit").click();
    let suggestedName = null;
    try { suggestedName = sessionStorage.getItem("rackview_lldp_suggest_name"); } catch (e) { /* unavailable */ }
    if (suggestedName && typeof showToast === "function") {
      showToast("Add the neighbor device", `Drag the matching device type onto the rack, then name it "${suggestedName}" when prompted.`);
    }
  }

  document.getElementById("btn-front").onclick = () => {
    setFace("front");
    setActiveFaceButton("front");
    refreshCabling();
  };
  document.getElementById("btn-rear").onclick = () => {
    setFace("rear");
    setActiveFaceButton("rear");
    refreshCabling();
  };
  document.getElementById("btn-reset").onclick = () => resetSelection();
  document.getElementById("btn-export-cables").onclick = () => {
    window.location.href = `/api/racks/${currentRackId}/export.xlsx`;
  };

  const helpOverlay = document.getElementById("help-overlay");
  const openHelp = () => helpOverlay.classList.add("open");
  const closeHelp = () => {
    helpOverlay.classList.remove("open");
    localStorage.setItem("rackview_help_seen", "1");
  };
  document.getElementById("btn-help").onclick = openHelp;
  document.getElementById("help-close").onclick = closeHelp;
  helpOverlay.addEventListener("click", e => { if (e.target === helpOverlay) closeHelp(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && helpOverlay.classList.contains("open")) closeHelp();
  });
  if (!localStorage.getItem("rackview_help_seen")) openHelp();

  const cablingMenu = document.getElementById("cabling-menu");
  document.getElementById("btn-cabling").onclick = e => {
    e.stopPropagation();
    cablingMenu.classList.toggle("open");
  };
  document.addEventListener("click", () => cablingMenu.classList.remove("open"));
  cablingMenu.querySelectorAll("button[data-mode]").forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.mode === "off") turnOffCabling();
      else setCablingMode(btn.dataset.mode);
      cablingMenu.classList.remove("open");
    };
  });

  const toolsMenu = document.getElementById("tools-menu");
  document.getElementById("btn-tools").onclick = e => {
    e.stopPropagation();
    toolsMenu.classList.toggle("open");
  };
  document.addEventListener("click", () => toolsMenu.classList.remove("open"));

  document.getElementById("btn-edit").onclick = () => {
    setEditMode(!editMode);
    document.getElementById("btn-edit").classList.toggle("active", editMode);
    refreshCabling();
    renderCatalog();
  };

  window.onSelectionChange = id => {
    renderPanel(document.getElementById("panel"), id, rack, cables);
    refreshCabling();
  };

  window.onDeviceMove = async (id, newPositionU) => {
    const res = await fetch(`/api/devices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position_u: newPositionU }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(`Could not move: ${err.error || res.status}`);
    }
    await reloadData();
  };
}

function setActiveFaceButton(face) {
  document.getElementById("btn-front").classList.toggle("active", face === "front");
  document.getElementById("btn-rear").classList.toggle("active", face === "rear");
}

function showFatalError(err) {
  console.error(err);
  const container = document.querySelector(".rack-container") || document.body;
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
