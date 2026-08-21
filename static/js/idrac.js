let bmcDevices = [];

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

async function loadBmcDevices() {
  bmcDevices = await fetchWithTimeout("/api/idrac/devices").then(r => r.json());
  const select = document.getElementById("bmc-switch-select");
  select.innerHTML = "";
  bmcDevices.forEach(d => {
    select.appendChild(h("option", { value: d.id }, [`${d.name} (${d.rack_name} · ${d.vendor} ${d.model})`]));
  });
  if (bmcDevices.length) {
    applySelectedDefaults();
  } else {
    document.getElementById("bmc-body").innerHTML = "";
    document.getElementById("bmc-body").appendChild(
      h("div", { class: "san-empty" }, ["No server is placed in any rack yet — add one from the catalog first."])
    );
  }
}

function applySelectedDefaults() {
  const id = Number(document.getElementById("bmc-switch-select").value);
  const dev = bmcDevices.find(d => d.id === id);
  const cfg = dev && dev.idrac_config;
  document.getElementById("bmc-ip").value = (cfg && cfg.ip) || "";
  document.getElementById("bmc-vendor").value = (cfg && cfg.vendor) || (dev && dev.vendor === "HPE" ? "hpe" : "dell");
  document.getElementById("bmc-port").value = (cfg && cfg.port) || "";
  loadLastSnapshot(id);
}

async function loadLastSnapshot(deviceId) {
  const hint = document.getElementById("bmc-last-pulled");
  const body = document.getElementById("bmc-body");
  hint.textContent = "";
  const snap = await fetchWithTimeout(`/api/idrac/snapshot/${deviceId}`).then(r => r.json()).catch(() => null);
  if (!snap) {
    body.innerHTML = "";
    body.appendChild(h("div", { class: "san-empty" }, ["No pull recorded yet for this server."]));
    return;
  }
  hint.textContent = `Last pulled: ${new Date(snap.timestamp).toLocaleString()}`;
  renderData(snap.data);
}

function healthDotClass(health) {
  const s = (health || "").toUpperCase();
  if (s === "OK") return "san-dot-ok";
  if (s === "WARN" || s === "FAIL") return "san-dot-warn";
  return "san-dot-unknown";
}

function buildHealthCard(item, label) {
  const card = h("div", { class: "san-portcard" + (healthDotClass(item.health) === "san-dot-ok" ? "" : "") });
  const top = h("div", { class: "san-pn" }, [
    h("span", {}, [h("span", { class: "san-dot " + healthDotClass(item.health) }), item.name || label]),
  ]);
  card.appendChild(top);
  const meta = [];
  if (item.model) meta.push(item.model);
  if (item.capacity_watts) meta.push(`${item.output_watts || "?"}/${item.capacity_watts}W`);
  if (item.reading != null) meta.push(`${item.reading} ${item.units || ""}`);
  card.appendChild(h("div", { class: "san-pmeta" }, [h("span", {}, [meta.join(" · ") || "-"])]));
  return card;
}

function renderData(data) {
  const body = document.getElementById("bmc-body");
  body.innerHTML = "";
  if (!data) {
    body.appendChild(h("div", { class: "san-empty" }, ["No data."]));
    return;
  }
  const block = h("div", { class: "san-block" });
  const head = h("div", { class: "san-head" }, [
    h("b", {}, [`\u{1F5A5} ${data.host_name || data.host || "?"}`]),
    h("span", { class: "san-pill san-pill-ip" }, [data.ip || ""]),
    h("span", { class: "san-sub" }, [
      [data.manufacturer, data.model, data.serial, `Health: ${data.health || "?"}`, `Power: ${data.power_state || "?"}`]
        .filter(Boolean).join(" · "),
    ]),
  ]);
  block.appendChild(head);

  block.appendChild(h("div", { class: "san-h4" }, ["Firmware"]));
  const fwGrid = h("div", { class: "san-portgrid" });
  fwGrid.appendChild(buildHealthCard({ name: "BIOS", model: data.bios_version, health: "OK" }, "BIOS"));
  fwGrid.appendChild(buildHealthCard({ name: data.vendor === "hpe" ? "iLO" : "iDRAC", model: data.bmc_firmware, health: "OK" }, "BMC"));
  block.appendChild(fwGrid);

  if ((data.power_supplies || []).length) {
    block.appendChild(h("div", { class: "san-h4" }, [`Power supplies (${data.power_supplies.length})`]));
    const grid = h("div", { class: "san-portgrid" });
    data.power_supplies.forEach(p => grid.appendChild(buildHealthCard(p, "PSU")));
    block.appendChild(grid);
  }

  if ((data.fans || []).length) {
    block.appendChild(h("div", { class: "san-h4" }, [`Fans (${data.fans.length})`]));
    const grid = h("div", { class: "san-portgrid" });
    data.fans.forEach(f => grid.appendChild(buildHealthCard(f, "Fan")));
    block.appendChild(grid);
  }

  const inventory = data.firmware_inventory || [];
  if (inventory.length) {
    block.appendChild(h("div", { class: "san-h4" }, [`All firmware components (${inventory.length})`]));
    block.appendChild(h("div", { class: "san-hint" }, [
      "Every component this BMC reports a version for — NICs, RAID/HBA controllers, PSUs, CPLDs, and more. These vary by exact configuration, not by model, so there's no \"latest known\" comparison for them — this is just what's on this specific box right now.",
    ]));
    const searchBox = h("input", { class: "san-fw-search", type: "text", placeholder: "Filter components…" });
    const listBox = h("div", { class: "san-fw-list" });
    const renderList = () => {
      const q = searchBox.value.trim().toLowerCase();
      listBox.innerHTML = "";
      inventory
        .filter(c => !q || (c.name || "").toLowerCase().includes(q))
        .forEach(c => {
          listBox.appendChild(h("div", { class: "san-fw-row" }, [
            h("span", { class: "san-fw-name" }, [c.name || "?"]),
            h("span", { class: "san-fw-version" }, [c.version || "-"]),
          ]));
        });
    };
    searchBox.addEventListener("input", renderList);
    renderList();
    block.appendChild(searchBox);
    block.appendChild(listBox);
  }

  body.appendChild(block);
}

async function collectBmc() {
  const errEl = document.getElementById("bmc-error");
  errEl.textContent = "";
  const deviceId = Number(document.getElementById("bmc-switch-select").value);
  const ip = document.getElementById("bmc-ip").value.trim();
  const vendor = document.getElementById("bmc-vendor").value;
  const port = document.getElementById("bmc-port").value.trim();
  const username = document.getElementById("bmc-user").value;
  const password = document.getElementById("bmc-pass").value;

  if (!deviceId) { errEl.textContent = "Select a server first."; return; }
  if (!ip) { errEl.textContent = "IP address is required."; return; }
  if (!username || !password) { errEl.textContent = "Username and password are required."; return; }

  const btn = document.getElementById("btn-bmc-collect");
  btn.disabled = true;
  btn.textContent = "Pulling…";
  try {
    const res = await fetchWithTimeout("/api/idrac/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, ip, vendor, port: port || null, username, password }),
    });
    const result = await res.json();
    if (!res.ok) {
      errEl.textContent = result.error || `Request failed (${res.status})`;
      return;
    }
    document.getElementById("bmc-pass").value = "";
    document.getElementById("bmc-last-pulled").textContent = `Last pulled: ${new Date(result.timestamp).toLocaleString()}`;
    renderData(result.data);
    bmcDevices = await fetchWithTimeout("/api/idrac/devices").then(r => r.json());
  } catch (err) {
    errEl.textContent = err.message || String(err);
  } finally {
    btn.disabled = false;
    btn.textContent = "Pull BMC info";
  }
}

async function main() {
  await loadBmcDevices();
  document.getElementById("bmc-switch-select").onchange = applySelectedDefaults;
  document.getElementById("btn-bmc-collect").onclick = collectBmc;
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
