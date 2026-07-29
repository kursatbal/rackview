let lldpSwitches = [];
let lldpResults = [];
let lldpFilter = "all";

function h(tag, attrs, children) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  (children || []).forEach(c => e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return e;
}

function guessMedium(remotePort) {
  const p = (remotePort || "").toLowerCase();
  if (p.includes("lc")) return "fiber";
  if (p.includes("sas")) return "sas";
  if (p.includes("vmnic") || p.includes("ocp") || p.includes("sfp") || p.includes("qsfp")) return "dac";
  return "cat6a";
}

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

async function loadSwitches() {
  const racks = await fetchWithTimeout("/api/racks").then(r => r.json());
  lldpSwitches = [];
  for (const rack of racks) {
    const devices = await fetchWithTimeout(`/api/racks/${rack.id}/devices`).then(r => r.json());
    devices
      .filter(d => ["switch", "firewall", "router"].includes(d.device_type.category))
      .forEach(d => lldpSwitches.push(Object.assign(d, { _rackName: rack.name })));
  }
  const select = document.getElementById("lldp-switch-select");
  select.innerHTML = "";
  lldpSwitches.forEach(d => {
    select.appendChild(h("option", { value: d.id }, [`${d.name} (${d._rackName} · ${d.device_type.vendor} ${d.device_type.model})`]));
  });
}

function setupSampleMenu() {
  const menu = document.getElementById("sample-menu");
  document.getElementById("btn-load-sample").onclick = e => {
    e.stopPropagation();
    menu.classList.toggle("open");
  };
  document.addEventListener("click", () => menu.classList.remove("open"));
  menu.querySelectorAll("button[data-sample]").forEach(btn => {
    btn.onclick = async () => {
      menu.classList.remove("open");
      const text = await fetch(`samples/${btn.dataset.sample}`).then(r => r.text());
      document.getElementById("lldp-textarea").value = text;
    };
  });
}

function rowStatusLabel(status) {
  if (status === "matched") return "Matched";
  if (status === "conflict") return "Conflict";
  return "New";
}

function buildResultRow(item, index) {
  const row = h("div", { class: "lr " + item.status });
  const top = h("div", { class: "lt" }, [
    h("b", {}, [item.localPort || "?"]),
    h("span", { class: "bd " + item.status }, [rowStatusLabel(item.status)]),
  ]);
  row.appendChild(top);

  const bottom = h("div", { class: "lb" }, [
    `${item.remoteSystem || "?"} · ${item.remotePort || "?"}${item.remoteChassisId ? " · " + item.remoteChassisId : ""}`,
  ]);
  row.appendChild(bottom);

  if (item.status === "conflict") {
    row.appendChild(h("div", { class: "lc-note" }, [
      `Recorded: ${item.recorded && item.recorded.device_name ? item.recorded.device_name : "?"} · ${item.recorded ? item.recorded.port : "?"}`,
    ]));
  }

  if (!item.device_known && item.status !== "matched") {
    row.appendChild(h("div", { class: "lc-note warn" }, [`Device '${item.remoteSystem}' not found in rack — create it before applying.`]));
  }

  if (item.status !== "matched" && item.resolution !== "done" && item.device_known) {
    const actions = h("div", { class: "la" });
    const mediumSel = h("select", { class: "lldp-medium-select" });
    ["dac", "fiber", "cat6a", "sas"].forEach(m => {
      const opt = h("option", { value: m }, [m]);
      if (m === guessMedium(item.remotePort)) opt.setAttribute("selected", "selected");
      mediumSel.appendChild(opt);
    });
    actions.appendChild(mediumSel);

    if (item.status === "new") {
      const createBtn = h("button", { class: "ba" }, ["Create cable"]);
      createBtn.onclick = () => applyLldpRecord(item, index, "create", mediumSel.value);
      actions.appendChild(createBtn);
      const ignoreBtn = h("button", { class: "bs" }, ["Ignore"]);
      ignoreBtn.onclick = () => { item.resolution = "ignored"; renderLldpResults(); };
      actions.appendChild(ignoreBtn);
    } else if (item.status === "conflict") {
      const applyBtn = h("button", { class: "ba" }, ["Apply LLDP"]);
      applyBtn.onclick = () => applyLldpRecord(item, index, "update", mediumSel.value);
      actions.appendChild(applyBtn);
      const keepBtn = h("button", { class: "bs" }, ["Keep recorded"]);
      keepBtn.onclick = () => { item.resolution = "ignored"; renderLldpResults(); };
      actions.appendChild(keepBtn);
    }
    row.appendChild(actions);
  } else if (item.resolution === "done") {
    row.appendChild(h("div", { class: "lc-note ok" }, ["Applied."]));
  } else if (item.resolution === "ignored") {
    row.appendChild(h("div", { class: "lc-note" }, ["Ignored."]));
  }

  return row;
}

function renderLldpResults() {
  const list = document.getElementById("lldp-results-list");
  list.innerHTML = "";

  const filtered = lldpResults.filter(item => lldpFilter === "all" || item.status === lldpFilter);
  if (!filtered.length) {
    list.appendChild(h("div", { class: "lldp-empty" }, ["No results in this filter."]));
  } else {
    filtered.forEach((item, i) => list.appendChild(buildResultRow(item, lldpResults.indexOf(item))));
  }

  const pendingNew = lldpResults.filter(r => r.status === "new" && r.device_known && r.resolution !== "done" && r.resolution !== "ignored");
  const bulkBtn = document.getElementById("btn-bulk-create");
  bulkBtn.textContent = `Bulk-create ${pendingNew.length} new cables`;
  bulkBtn.disabled = pendingNew.length === 0;
}

async function applyLldpRecord(item, index, action, medium) {
  const switchId = Number(document.getElementById("lldp-switch-select").value);
  const res = await fetch("/api/lldp/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      switch_id: switchId,
      records: [{
        localPort: item.localPort, remoteSystem: item.remoteSystem, remotePort: item.remotePort,
        medium, action,
      }],
    }),
  });
  const data = await res.json();
  if (data.created && data.created.length) {
    item.resolution = "done";
  } else {
    alert("Could not apply: " + (data.skipped && data.skipped[0] ? data.skipped[0].reason : "unknown error"));
  }
  renderLldpResults();
}

async function bulkCreate() {
  const switchId = Number(document.getElementById("lldp-switch-select").value);
  const pending = lldpResults.filter(r => r.status === "new" && r.device_known && r.resolution !== "done" && r.resolution !== "ignored");
  if (!pending.length) return;

  const records = pending.map(item => ({
    localPort: item.localPort, remoteSystem: item.remoteSystem, remotePort: item.remotePort,
    medium: guessMedium(item.remotePort), action: "create",
  }));
  const res = await fetch("/api/lldp/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ switch_id: switchId, records }),
  });
  const data = await res.json();
  const createdPorts = new Set((data.created || []).map(c => c.a_port));
  pending.forEach(item => {
    if (createdPorts.has(item.localPort)) item.resolution = "done";
  });
  renderLldpResults();
}

async function parseAndMatch() {
  const errEl = document.getElementById("lldp-parse-error");
  errEl.textContent = "";
  const text = document.getElementById("lldp-textarea").value;
  const switchId = Number(document.getElementById("lldp-switch-select").value);
  if (!text.trim()) {
    errEl.textContent = "Paste LLDP output first.";
    return;
  }
  if (!switchId) {
    errEl.textContent = "Select a source switch first.";
    return;
  }

  const parseRes = await fetch("/api/lldp/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).then(r => r.json());

  if (!parseRes.neighbors || !parseRes.neighbors.length) {
    errEl.textContent = "Could not recognize this as Cisco, Dell OS10, or Aruba LLDP output.";
    lldpResults = [];
    renderLldpResults();
    return;
  }

  const matchRes = await fetch("/api/lldp/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ neighbors: parseRes.neighbors, switch_id: switchId }),
  }).then(r => r.json());

  lldpResults = matchRes.results || [];
  lldpFilter = "all";
  document.querySelectorAll("#lldp-filter-chips .chip").forEach(c => c.classList.toggle("active", c.dataset.filter === "all"));
  renderLldpResults();
}

function setupFilterChips() {
  document.getElementById("lldp-filter-chips").querySelectorAll(".chip").forEach(chip => {
    chip.onclick = () => {
      lldpFilter = chip.dataset.filter;
      document.querySelectorAll("#lldp-filter-chips .chip").forEach(c => c.classList.toggle("active", c === chip));
      renderLldpResults();
    };
  });
}

async function main() {
  await loadSwitches();
  setupSampleMenu();
  setupFilterChips();
  document.getElementById("btn-parse").onclick = parseAndMatch;
  document.getElementById("btn-bulk-create").onclick = bulkCreate;
}

function showFatalError(err) {
  console.error(err);
  const container = document.querySelector(".lldp-page") || document.body;
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
