let exDevices = [];

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

async function loadExDevices() {
  exDevices = await fetchWithTimeout("/api/esxi/devices").then(r => r.json());
  const select = document.getElementById("ex-switch-select");
  select.innerHTML = "";
  exDevices.forEach(d => {
    select.appendChild(h("option", { value: d.id }, [`${d.name} (${d.rack_name} · ${d.vendor} ${d.model})`]));
  });
  if (exDevices.length) {
    applySelectedDefaults();
  } else {
    document.getElementById("ex-body").innerHTML = "";
    document.getElementById("ex-body").appendChild(
      h("div", { class: "san-empty" }, ["No server is placed in any rack yet — add one from the catalog first."])
    );
  }
}

function applySelectedDefaults() {
  const id = Number(document.getElementById("ex-switch-select").value);
  const dev = exDevices.find(d => d.id === id);
  const cfg = dev && dev.esxi_config;
  document.getElementById("ex-ip").value = (cfg && cfg.ip) || "";
  document.getElementById("ex-port").value = (cfg && cfg.port) || "";
  loadLastSnapshot(id);
}

async function loadLastSnapshot(deviceId) {
  const hint = document.getElementById("ex-last-pulled");
  const body = document.getElementById("ex-body");
  hint.textContent = "";
  const snap = await fetchWithTimeout(`/api/esxi/snapshot/${deviceId}`).then(r => r.json()).catch(() => null);
  if (!snap) {
    body.innerHTML = "";
    body.appendChild(h("div", { class: "san-empty" }, ["No pull recorded yet for this server."]));
    return;
  }
  hint.textContent = `Last pulled: ${new Date(snap.timestamp).toLocaleString()}`;
  renderData(snap.data);
}

function buildNicCard(n) {
  const up = (n.link_status || "").toLowerCase() === "up";
  const card = h("div", { class: "san-portcard" + (up ? "" : " off") });
  const top = h("div", { class: "san-pn" }, [
    h("span", {}, [h("span", { class: "san-dot " + (up ? "san-dot-ok" : "san-dot-warn") }), n.name || "?"]),
  ]);
  if (n.vswitch) top.appendChild(h("span", { class: "san-pill" }, [n.vswitch]));
  card.appendChild(top);
  card.appendChild(h("div", { class: "san-pmeta" }, [
    h("span", {}, [n.link_status || "-"]), h("span", {}, [n.speed ? n.speed + " Mb" : ""]),
  ]));
  if (n.physical_port && n.physical_port !== n.name) {
    card.appendChild(h("div", { class: "san-pmeta" }, [h("span", {}, [`Mapped: ${n.physical_port}`])]));
  }
  if (n.connected_device) {
    card.appendChild(h("div", { class: "san-pdest" }, [
      `→ ${n.connected_device.name}${n.connected_device.port ? " · " + n.connected_device.port : ""}`,
    ]));
  }
  if (n.neighbor && (n.neighbor.device || n.neighbor.port)) {
    card.appendChild(h("div", { class: "san-pwwn" }, [`CDP/LLDP: ${n.neighbor.device || "?"} · ${n.neighbor.port || "?"}`]));
  }
  if (n.mac) card.appendChild(h("div", { class: "san-pwwn" }, [n.mac]));
  return card;
}

function renderData(data) {
  const body = document.getElementById("ex-body");
  body.innerHTML = "";
  if (!data) {
    body.appendChild(h("div", { class: "san-empty" }, ["No data."]));
    return;
  }
  const block = h("div", { class: "san-block" });
  const head = h("div", { class: "san-head" }, [
    h("b", {}, [`\u{1F5A5} ${data.host || "?"}`]),
    h("span", { class: "san-pill san-pill-ip" }, [data.ip || ""]),
    h("span", { class: "san-sub" }, [data.product || ""]),
  ]);
  block.appendChild(head);

  block.appendChild(h("div", { class: "san-h4" }, [`Physical NICs (${(data.nics || []).length})`]));
  const grid = h("div", { class: "san-portgrid" });
  (data.nics || []).forEach(n => grid.appendChild(buildNicCard(n)));
  if (!(data.nics || []).length) grid.appendChild(h("div", { class: "san-empty" }, ["No NIC data."]));
  block.appendChild(grid);

  body.appendChild(block);
}

async function collectEsxi() {
  const errEl = document.getElementById("ex-error");
  errEl.textContent = "";
  const deviceId = Number(document.getElementById("ex-switch-select").value);
  const ip = document.getElementById("ex-ip").value.trim();
  const port = document.getElementById("ex-port").value.trim();
  const username = document.getElementById("ex-user").value;
  const password = document.getElementById("ex-pass").value;

  if (!deviceId) { errEl.textContent = "Select a server first."; return; }
  if (!ip) { errEl.textContent = "IP address is required."; return; }
  if (!username || !password) { errEl.textContent = "Username and password are required."; return; }

  const btn = document.getElementById("btn-ex-collect");
  btn.disabled = true;
  btn.textContent = "Pulling…";
  try {
    const res = await fetchWithTimeout("/api/esxi/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, ip, port: port || null, username, password }),
    });
    const result = await res.json();
    if (!res.ok) {
      errEl.textContent = result.error || `Request failed (${res.status})`;
      return;
    }
    document.getElementById("ex-pass").value = "";
    document.getElementById("ex-last-pulled").textContent = `Last pulled: ${new Date(result.timestamp).toLocaleString()}`;
    renderData(result.data);
    exDevices = await fetchWithTimeout("/api/esxi/devices").then(r => r.json());
  } catch (err) {
    errEl.textContent = err.message || String(err);
  } finally {
    btn.disabled = false;
    btn.textContent = "Pull NIC info";
  }
}

async function main() {
  await loadExDevices();
  document.getElementById("ex-switch-select").onchange = applySelectedDefaults;
  document.getElementById("btn-ex-collect").onclick = collectEsxi;
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
