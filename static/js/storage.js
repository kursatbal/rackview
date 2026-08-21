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
  return card;
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
