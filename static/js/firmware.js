let fwRows = [];
let fwStatusFilter = "";

function h(tag, attrs, children) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  (children || []).forEach(c => e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return e;
}

function fetchWithTimeout(url, options, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, Object.assign({}, options, { signal: controller.signal }))
    .finally(() => clearTimeout(timer))
    .catch(err => {
      if (err.name === "AbortError") throw new Error(`Request timed out (>${timeoutMs / 1000}s): ${url}`);
      throw err;
    });
}

const CATEGORY_LABELS = {
  switch: "Switch", "san-switch": "SAN Switch", server: "Server", storage: "Storage",
  firewall: "Firewall", router: "Router", pdu: "PDU", panel: "Panel",
  "patch-panel": "Patch Panel", passthrough: "Passthrough",
};

const STATUS_ORDER = ["outdated", "unknown_latest", "no_data", "up_to_date"];
const STATUS_LABELS = {
  outdated: "Outdated", unknown_latest: "Latest unknown",
  up_to_date: "Up to date", no_data: "No firmware data",
};

async function loadRows() {
  fwRows = await fetchWithTimeout("/api/firmware/status").then(r => r.json());
  renderSummary();
  render();
}

function renderSummary() {
  const bar = document.getElementById("fw-summary");
  bar.innerHTML = "";
  const allChip = h("div", { class: "fw-summary-chip" + (fwStatusFilter === "" ? " active" : "") }, [`All (${fwRows.length})`]);
  allChip.onclick = () => { fwStatusFilter = ""; renderSummary(); render(); };
  bar.appendChild(allChip);
  STATUS_ORDER.forEach(status => {
    const count = fwRows.filter(r => r.status === status).length;
    const chip = h("div", { class: "fw-summary-chip" + (fwStatusFilter === status ? " active" : "") }, [
      h("span", { class: "fw-chip-dot fw-chip-dot-" + status }),
      h("b", {}, [String(count)]),
      " " + STATUS_LABELS[status],
    ]);
    chip.onclick = () => { fwStatusFilter = fwStatusFilter === status ? "" : status; renderSummary(); render(); };
    bar.appendChild(chip);
  });
}

function filtered() {
  const q = document.getElementById("fw-search").value.trim().toLowerCase();
  return fwRows.filter(r => {
    if (fwStatusFilter && r.status !== fwStatusFilter) return false;
    if (q && !`${r.vendor} ${r.model}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function render() {
  const rows = filtered();
  const tbody = document.getElementById("fw-tbody");
  tbody.innerHTML = "";
  document.getElementById("fw-count").textContent = `${rows.length} model${rows.length === 1 ? "" : "s"}`;
  if (!rows.length) {
    tbody.appendChild(h("tr", {}, [h("td", { colspan: "6", class: "devices-empty" }, ["No matching models."])]));
    return;
  }
  rows.forEach(r => tbody.appendChild(buildRow(r)));
}

function buildRow(r) {
  const tr = h("tr", { class: `fw-row fw-row-${r.status}` });

  const label = r.model.toLowerCase().startsWith(r.vendor.toLowerCase()) ? r.model : `${r.vendor} ${r.model}`;
  tr.appendChild(h("td", { class: "dv-name" }, [label]));
  tr.appendChild(h("td", {}, [CATEGORY_LABELS[r.category] || r.category]));

  const deviceNames = r.devices.map(d => `${d.name} (${d.rack_name})`).join(", ");
  tr.appendChild(h("td", { class: "fw-devices" }, [`${r.device_count} — ${deviceNames}`]));

  tr.appendChild(h("td", { class: "fw-versions" }, [r.current_versions.length ? r.current_versions.join(", ") : "-"]));

  const historyText = (r.versions || []).map(v => v.date ? `${v.version} | ${v.date}` : v.version).join("\n");
  const versionsArea = h("textarea", { name: "versions", rows: "4", placeholder: "9.4.2 | 2026-05\n9.4.1 | 2026-02\n9.4.0 | 2025-11" }, [historyText]);
  const notesInput = h("input", { name: "notes", type: "text", placeholder: "notes (optional)", value: r.notes || "" });
  const saveBtn = h("button", {}, ["Save"]);
  saveBtn.onclick = () => saveReference(r, versionsArea.value, notesInput.value.trim(), saveBtn);
  const editRow = h("div", { class: "fw-edit-row" }, [
    versionsArea,
    h("div", { class: "fw-edit-bottom-row" }, [notesInput, saveBtn]),
  ]);
  tr.appendChild(h("td", {}, [editRow]));

  const badge = h("span", { class: `fw-badge fw-badge-${r.status}` }, [h("span", { class: "fw-dot" }), STATUS_LABELS[r.status] || r.status]);
  tr.appendChild(h("td", {}, [badge]));

  return tr;
}

function parseVersionsText(text) {
  return text.split("\n").map(line => line.trim()).filter(Boolean).map(line => {
    const [version, date] = line.split("|").map(p => p.trim());
    return { version, date: date || null };
  });
}

async function saveReference(r, versionsText, notes, btn) {
  const versions = parseVersionsText(versionsText);
  if (!versions.length) {
    alert("Enter at least one version — one per line, e.g. \"9.4.2 | 2026-05\".");
    return;
  }
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    const res = await fetchWithTimeout("/api/firmware/reference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor: r.vendor, model: r.model, versions, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || `Save failed (${res.status})`);
      return;
    }
    await loadRows();
  } catch (err) {
    alert(err.message || String(err));
  } finally {
    btn.disabled = false;
    btn.textContent = "Save";
  }
}

async function main() {
  await loadRows();
  document.getElementById("fw-search").addEventListener("input", render);
}

function showFatalError(err) {
  console.error(err);
  const container = document.querySelector(".devices-page") || document.body;
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
