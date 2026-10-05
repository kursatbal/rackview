let sanDevices = [];

function h(tag, attrs, children) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  (children || []).forEach(c => e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return e;
}

function fetchWithTimeout(url, options, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, Object.assign({}, options, { signal: controller.signal }))
    .finally(() => clearTimeout(timer))
    .catch(err => {
      if (err.name === "AbortError") throw new Error(`Request timed out (>${timeoutMs / 1000}s): ${url}`);
      throw err;
    });
}

async function loadSanDevices() {
  sanDevices = await fetchWithTimeout("/api/san/devices").then(r => r.json());
  const select = document.getElementById("san-switch-select");
  select.innerHTML = "";
  sanDevices.forEach(d => {
    select.appendChild(h("option", { value: d.id }, [`${d.name} (${d.rack_name} · ${d.vendor} ${d.model})`]));
  });
  if (sanDevices.length) {
    applySelectedDeviceDefaults();
  } else {
    document.getElementById("san-body").innerHTML = "";
    document.getElementById("san-body").appendChild(
      h("div", { class: "san-empty" }, ["No SAN switch is placed in any rack yet — add one from the catalog first."])
    );
  }
}

function applySelectedDeviceDefaults() {
  const id = Number(document.getElementById("san-switch-select").value);
  const dev = sanDevices.find(d => d.id === id);
  const cfg = dev && dev.san_config;
  document.getElementById("san-ip").value = (cfg && cfg.ip) || "";
  document.getElementById("san-vendor").value = (cfg && cfg.vendor) || "brocade";
  document.getElementById("san-port").value = (cfg && cfg.port) || "";
  loadLastSnapshot(id);
}

async function loadLastSnapshot(deviceId) {
  const hint = document.getElementById("san-last-pulled");
  const body = document.getElementById("san-body");
  hint.textContent = "";
  const snap = await fetchWithTimeout(`/api/san/snapshot/${deviceId}`).then(r => r.json()).catch(() => null);
  if (!snap) {
    body.innerHTML = "";
    body.appendChild(h("div", { class: "san-empty" }, ["No pull recorded yet for this switch."]));
    return;
  }
  hint.textContent = `Last pulled: ${new Date(snap.timestamp).toLocaleString()}`;
  renderFabric(snap.fabric);
  loadDiffPanel(deviceId);
}

function fieldRow(field, from, to) {
  return h("div", { class: "san-diff-field" }, [
    h("span", { class: "san-diff-field-name" }, [field]),
    h("span", { class: "san-diff-from" }, [from == null || from === "" ? "–" : String(from)]),
    h("span", {}, ["→"]),
    h("span", { class: "san-diff-to" }, [to == null || to === "" ? "–" : String(to)]),
  ]);
}

async function loadDiffPanel(deviceId, against) {
  const existing = document.getElementById("san-diff-panel");
  if (existing) existing.remove();
  const url = against ? `/api/san/diff/${deviceId}?against=${against}` : `/api/san/diff/${deviceId}`;
  const diff = await fetchWithTimeout(url).then(r => r.ok ? r.json() : null).catch(() => null);
  const body = document.getElementById("san-body");
  const panel = h("div", { id: "san-diff-panel", class: "san-block" });
  panel.appendChild(h("div", { class: "san-h4" }, ["What changed since last pull"]));

  if (!diff || diff.error) {
    panel.appendChild(h("div", { class: "san-empty" }, ["Only one pull recorded so far — nothing to compare yet."]));
    body.appendChild(panel);
    return;
  }

  if (diff.available_snapshots && diff.available_snapshots.length > 2) {
    const row = h("div", { class: "san-diff-picker" });
    row.appendChild(h("span", {}, ["Compare against:"]));
    const sel = h("select", { id: "san-diff-against" });
    diff.available_snapshots.slice(1).forEach(s => {
      sel.appendChild(h("option", { value: s.id }, [new Date(s.timestamp).toLocaleString()]));
    });
    sel.value = diff.available_snapshots.find(s => s.timestamp === diff.old_timestamp).id;
    sel.onchange = () => loadDiffPanel(deviceId, sel.value);
    row.appendChild(sel);
    panel.appendChild(row);
  }

  const nothingChanged = !diff.added.length && !diff.removed.length && !diff.changed.length && !diff.top_level.length;
  if (nothingChanged) {
    panel.appendChild(h("div", { class: "san-empty" }, [`No changes vs. ${new Date(diff.old_timestamp).toLocaleString()}.`]));
    body.appendChild(panel);
    return;
  }

  if (diff.top_level.length) {
    const list = h("div", { class: "san-diff-list" });
    diff.top_level.forEach(f => list.appendChild(fieldRow(f.field, f.from, f.to)));
    panel.appendChild(list);
  }
  if (diff.added.length) {
    panel.appendChild(h("div", { class: "san-diff-subhead added" }, [`Added (${diff.added.length})`]));
    const list = h("div", { class: "san-diff-list" });
    diff.added.forEach(p => list.appendChild(h("div", { class: "san-diff-row" }, [`Port ${p.port || "?"}`])));
    panel.appendChild(list);
  }
  if (diff.removed.length) {
    panel.appendChild(h("div", { class: "san-diff-subhead removed" }, [`Removed (${diff.removed.length})`]));
    const list = h("div", { class: "san-diff-list" });
    diff.removed.forEach(p => list.appendChild(h("div", { class: "san-diff-row" }, [`Port ${p.port || "?"}`])));
    panel.appendChild(list);
  }
  if (diff.changed.length) {
    panel.appendChild(h("div", { class: "san-diff-subhead changed" }, [`Changed (${diff.changed.length})`]));
    const list = h("div", { class: "san-diff-list" });
    diff.changed.forEach(c => {
      list.appendChild(h("div", { class: "san-diff-row" }, [`Port ${c.port.port || "?"}`]));
      c.fields.forEach(f => list.appendChild(fieldRow(f.field, f.from, f.to)));
    });
    panel.appendChild(list);
  }
  body.appendChild(panel);
}

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("online") || s === "up" || s.includes("trunking")) return "san-dot-ok";
  if (!s) return "san-dot-unknown";
  return "san-dot-warn";
}

function buildPortCard(p) {
  const online = statusClass(p.status) === "san-dot-ok";
  const card = h("div", { class: "san-portcard" + (online ? "" : " off") });
  const top = h("div", { class: "san-pn" }, [
    h("span", {}, [h("span", { class: "san-dot " + statusClass(p.status) }), `Port ${p.port || "?"}`]),
  ]);
  if (p.type) top.appendChild(h("span", { class: "san-pill" }, [p.type]));
  card.appendChild(top);
  card.appendChild(h("div", { class: "san-pmeta" }, [
    h("span", {}, [p.status || "-"]), h("span", {}, [p.speed ? p.speed + " Gb" : ""]),
  ]));
  if (p.connected_device) {
    card.appendChild(h("div", { class: "san-pdest" }, [
      `→ ${p.connected_device.name}${p.connected_device.port ? " · " + p.connected_device.port : ""}`,
    ]));
  }
  if (p.connected_wwn) card.appendChild(h("div", { class: "san-pwwn" }, [p.connected_wwn]));
  // "matched" is the common/expected case and isn't called out — only conflict/new are,
  // since those are what a tech actually needs to notice.
  if (p.drift_status === "conflict") {
    card.appendChild(h("span", { class: "san-drift-pill conflict" }, ["Documented, not logged in"]));
  } else if (p.drift_status === "new") {
    card.appendChild(h("span", { class: "san-drift-pill new" }, ["Not documented"]));
  }
  return card;
}

function buildDriftSummaryLine(summary) {
  if (!summary) return null;
  const parts = [];
  if (summary.conflict) parts.push(`${summary.conflict} conflict`);
  if (summary.new) parts.push(`${summary.new} new`);
  if (summary.removed) parts.push(`${summary.removed} removed`);
  if (!parts.length) return h("div", { class: "san-drift-summary" }, [h("b", {}, ["No drift"]), " vs. documented cabling"]);
  return h("div", { class: "san-drift-summary" }, [h("b", {}, [parts.join(" · ")]), " vs. documented cabling"]);
}

function buildZoneCard(zone, key) {
  const card = h("div", { class: "san-zonecard" });
  card.appendChild(h("div", { class: "san-zn" }, [zone.name || "?"]));
  card.appendChild(h("div", { class: "san-zc" }, [`${(zone.members || []).length} members · expand`]));
  const members = h("div", { class: "san-zmembers" });
  (zone.members || []).forEach(w => members.appendChild(h("div", {}, [w])));
  if (!(zone.members || []).length) members.appendChild(h("div", {}, ["No members"]));
  card.appendChild(members);
  card.onclick = () => card.classList.toggle("expanded");
  return card;
}

function renderFabric(fab) {
  const body = document.getElementById("san-body");
  body.innerHTML = "";
  if (!fab) {
    body.appendChild(h("div", { class: "san-empty" }, ["No data."]));
    return;
  }
  const block = h("div", { class: "san-block" });
  const head = h("div", { class: "san-head" }, [
    h("b", {}, [`\u{1F517} ${fab.switch || "?"}`]),
    h("span", { class: "san-pill san-pill-ip" }, [fab.ip || ""]),
    h("span", { class: "san-sub" }, [
      [(fab.vendor || "").toUpperCase(), fab.model, fab.firmware, fab.wwn].filter(Boolean).join(" · "),
    ]),
  ]);
  block.appendChild(head);
  const driftLine = buildDriftSummaryLine(fab.drift_summary);
  if (driftLine) block.appendChild(driftLine);

  block.appendChild(h("div", { class: "san-h4" }, [`Ports (${(fab.ports || []).length})`]));
  const portGrid = h("div", { class: "san-portgrid" });
  (fab.ports || []).forEach(p => portGrid.appendChild(buildPortCard(p)));
  if (!(fab.ports || []).length) portGrid.appendChild(h("div", { class: "san-empty" }, ["No port data."]));
  block.appendChild(portGrid);

  block.appendChild(h("div", { class: "san-h4" }, [`Zoning (${(fab.zones || []).length})`]));
  const zoneGrid = h("div", { class: "san-zonegrid" });
  (fab.zones || []).forEach((z, i) => zoneGrid.appendChild(buildZoneCard(z, i)));
  if (!(fab.zones || []).length) zoneGrid.appendChild(h("div", { class: "san-empty" }, ["No zoning data."]));
  block.appendChild(zoneGrid);

  body.appendChild(block);
}

async function collectSan() {
  const errEl = document.getElementById("san-error");
  errEl.textContent = "";
  const deviceId = Number(document.getElementById("san-switch-select").value);
  const ip = document.getElementById("san-ip").value.trim();
  const vendor = document.getElementById("san-vendor").value;
  const port = document.getElementById("san-port").value.trim();
  const username = document.getElementById("san-user").value;
  const password = document.getElementById("san-pass").value;

  if (!deviceId) { errEl.textContent = "Select a SAN switch first."; return; }
  if (!ip) { errEl.textContent = "IP address is required."; return; }
  if (!username || !password) { errEl.textContent = "Username and password are required."; return; }

  const btn = document.getElementById("btn-san-collect");
  btn.disabled = true;
  btn.textContent = "Pulling…";
  try {
    const res = await fetchWithTimeout("/api/san/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, ip, vendor, port: port || null, username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.error || `Request failed (${res.status})`;
      return;
    }
    document.getElementById("san-pass").value = "";
    document.getElementById("san-last-pulled").textContent = `Last pulled: ${new Date(data.timestamp).toLocaleString()}`;
    renderFabric(data.fabric);
    sanDevices = await fetchWithTimeout("/api/san/devices").then(r => r.json());
  } catch (err) {
    errEl.textContent = err.message || String(err);
  } finally {
    btn.disabled = false;
    btn.textContent = "Pull SAN info";
  }
}

async function main() {
  await loadSanDevices();
  document.getElementById("san-switch-select").onchange = applySelectedDeviceDefaults;
  document.getElementById("btn-san-collect").onclick = collectSan;
}

function showFatalError(err) {
  console.error(err);
  const container = document.querySelector(".san-page") || document.body;
  const box = document.createElement("div");
  box.style.cssText = "margin:20px;padding:14px;background:#3a1414;border:1px solid #f85149;"
    + "color:#ffb4ab;font-family:monospace;font-size:12px;white-space:pre-wrap;";
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
