let stDevices = [];

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

async function loadStDevices() {
  stDevices = await fetchWithTimeout("/api/storage/devices").then(r => r.json());
  const select = document.getElementById("st-switch-select");
  select.innerHTML = "";
  stDevices.forEach(d => {
    select.appendChild(h("option", { value: d.id }, [`${d.name} (${d.rack_name} · ${d.vendor} ${d.model})`]));
  });
  if (stDevices.length) {
    applySelectedDefaults();
  } else {
    document.getElementById("st-body").innerHTML = "";
    document.getElementById("st-body").appendChild(
      h("div", { class: "san-empty" }, ["No storage array is placed in any rack yet — add one from the catalog first."])
    );
  }
}

function applySelectedDefaults() {
  const id = Number(document.getElementById("st-switch-select").value);
  const dev = stDevices.find(d => d.id === id);
  const cfg = dev && dev.storage_config;
  document.getElementById("st-ip").value = (cfg && cfg.ip) || "";
  document.getElementById("st-port").value = (cfg && cfg.port) || "";
  loadLastSnapshot(id);
}

async function loadLastSnapshot(deviceId) {
  const hint = document.getElementById("st-last-pulled");
  const body = document.getElementById("st-body");
  hint.textContent = "";
  const snap = await fetchWithTimeout(`/api/storage/snapshot/${deviceId}`).then(r => r.json()).catch(() => null);
  if (!snap) {
    body.innerHTML = "";
    body.appendChild(h("div", { class: "san-empty" }, ["No pull recorded yet for this array."]));
    return;
  }
  hint.textContent = `Last pulled: ${new Date(snap.timestamp).toLocaleString()}`;
  renderData(snap.data);
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

function portLabel(p) {
  return p.controller ? `Ctrl${p.controller} ${p.port}` : (p.port || "?");
}

async function loadDiffPanel(deviceId, against) {
  const existing = document.getElementById("st-diff-panel");
  if (existing) existing.remove();
  const url = against ? `/api/storage/diff/${deviceId}?against=${against}` : `/api/storage/diff/${deviceId}`;
  const diff = await fetchWithTimeout(url).then(r => r.ok ? r.json() : null).catch(() => null);
  const body = document.getElementById("st-body");
  const panel = h("div", { id: "st-diff-panel", class: "san-block" });
  panel.appendChild(h("div", { class: "san-h4" }, ["What changed since last pull"]));

  if (!diff || diff.error) {
    panel.appendChild(h("div", { class: "san-empty" }, ["Only one pull recorded so far — nothing to compare yet."]));
    body.appendChild(panel);
    return;
  }

  if (diff.available_snapshots && diff.available_snapshots.length > 2) {
    const row = h("div", { class: "san-diff-picker" });
    row.appendChild(h("span", {}, ["Compare against:"]));
    const sel = h("select", { id: "st-diff-against" });
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
    diff.added.forEach(p => list.appendChild(h("div", { class: "san-diff-row" }, [portLabel(p)])));
    panel.appendChild(list);
  }
  if (diff.removed.length) {
    panel.appendChild(h("div", { class: "san-diff-subhead removed" }, [`Removed (${diff.removed.length})`]));
    const list = h("div", { class: "san-diff-list" });
    diff.removed.forEach(p => list.appendChild(h("div", { class: "san-diff-row" }, [portLabel(p)])));
    panel.appendChild(list);
  }
  if (diff.changed.length) {
    panel.appendChild(h("div", { class: "san-diff-subhead changed" }, [`Changed (${diff.changed.length})`]));
    const list = h("div", { class: "san-diff-list" });
    diff.changed.forEach(c => {
      list.appendChild(h("div", { class: "san-diff-row" }, [portLabel(c.port)]));
      c.fields.forEach(f => list.appendChild(fieldRow(f.field, f.from, f.to)));
    });
    panel.appendChild(list);
  }
  body.appendChild(panel);
}

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "up") return "san-dot-ok";
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
    h("span", {}, [p.status || "-"]), h("span", {}, [p.speed || ""]),
  ]));
  if (p.connected_device) {
    card.appendChild(h("div", { class: "san-pdest" }, [
      `→ ${p.connected_device.name}${p.connected_device.port ? " · " + p.connected_device.port : ""}`,
    ]));
  }
  if (p.wwn) card.appendChild(h("div", { class: "san-pwwn" }, [p.wwn]));
  // Storage has no remote-identity signal (the array's own "wwn" is its own port, not a
  // connected host's), so this is a presence check only — "new" is the only status shown,
  // never "conflict" the way SAN can.
  if (p.drift_status === "new") {
    card.appendChild(h("span", { class: "san-drift-pill new" }, ["Not documented"]));
  }
  return card;
}

function buildDriftSummaryLine(summary) {
  if (!summary) return null;
  const parts = [];
  if (summary.new) parts.push(`${summary.new} new`);
  if (summary.missing) parts.push(`${summary.missing} missing`);
  if (!parts.length) return h("div", { class: "san-drift-summary" }, [h("b", {}, ["No drift"]), " vs. documented cabling (presence check only)"]);
  return h("div", { class: "san-drift-summary" }, [h("b", {}, [parts.join(" · ")]), " vs. documented cabling (presence check only)"]);
}

function renderData(data) {
  const body = document.getElementById("st-body");
  body.innerHTML = "";
  if (!data) {
    body.appendChild(h("div", { class: "san-empty" }, ["No data."]));
    return;
  }
  const block = h("div", { class: "san-block" });
  const head = h("div", { class: "san-head" }, [
    h("b", {}, [`\u{1F5C4}️ ${data.system || "?"}`]),
    h("span", { class: "san-pill san-pill-ip" }, [data.ip || ""]),
    h("span", { class: "san-sub" }, [
      [data.vendor, data.model, data.serial, data.firmware ? "Firmware: " + data.firmware : null, data.health ? "Health: " + data.health : null].filter(Boolean).join(" · "),
    ]),
  ]);
  block.appendChild(head);
  const driftLine = buildDriftSummaryLine(data.drift_summary);
  if (driftLine) block.appendChild(driftLine);

  const controllers = [...new Set((data.ports || []).map(p => p.controller))].sort();
  controllers.forEach(ctrl => {
    const ports = (data.ports || []).filter(p => p.controller === ctrl);
    block.appendChild(h("div", { class: "san-h4" }, [`Controller ${ctrl} (${ports.length} ports)`]));
    const grid = h("div", { class: "san-portgrid" });
    ports.forEach(p => grid.appendChild(buildPortCard(p)));
    block.appendChild(grid);
  });
  if (!(data.ports || []).length) block.appendChild(h("div", { class: "san-empty" }, ["No port data."]));

  body.appendChild(block);
}

async function collectStorage() {
  const errEl = document.getElementById("st-error");
  errEl.textContent = "";
  const deviceId = Number(document.getElementById("st-switch-select").value);
  const ip = document.getElementById("st-ip").value.trim();
  const port = document.getElementById("st-port").value.trim();
  const username = document.getElementById("st-user").value;
  const password = document.getElementById("st-pass").value;

  if (!deviceId) { errEl.textContent = "Select a storage array first."; return; }
  if (!ip) { errEl.textContent = "IP address is required."; return; }
  if (!username || !password) { errEl.textContent = "Username and password are required."; return; }

  const btn = document.getElementById("btn-st-collect");
  btn.disabled = true;
  btn.textContent = "Pulling…";
  try {
    const res = await fetchWithTimeout("/api/storage/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, ip, port: port || null, username, password }),
    });
    const result = await res.json();
    if (!res.ok) {
      errEl.textContent = result.error || `Request failed (${res.status})`;
      return;
    }
    document.getElementById("st-pass").value = "";
    document.getElementById("st-last-pulled").textContent = `Last pulled: ${new Date(result.timestamp).toLocaleString()}`;
    renderData(result.data);
    stDevices = await fetchWithTimeout("/api/storage/devices").then(r => r.json());
  } catch (err) {
    errEl.textContent = err.message || String(err);
  } finally {
    btn.disabled = false;
    btn.textContent = "Pull storage info";
  }
}

async function main() {
  await loadStDevices();
  document.getElementById("st-switch-select").onchange = applySelectedDefaults;
  document.getElementById("btn-st-collect").onclick = collectStorage;
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
