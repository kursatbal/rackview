let lldpSwitches = [];
let lldpResults = [];
let lldpFilter = "all";
let lldpHistory = [];
let currentHistoryId = null;

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
  if (status === "conflict") return "Changed";
  if (status === "removed") return "Removed";
  return "New";
}

function buildResultRow(item, index) {
  const row = h("div", { class: "lr " + item.status });
  const top = h("div", { class: "lt" }, [
    h("b", { class: "lr-port-link" }, [item.localPort || "?"]),
    h("span", { class: "bd " + item.status }, [rowStatusLabel(item.status)]),
  ]);
  top.querySelector(".lr-port-link").onclick = () => goToPortOnRack(item);
  row.appendChild(top);

  if (item.status === "removed") {
    row.appendChild(h("div", { class: "lb" }, [
      `Recorded: ${item.recorded && item.recorded.device_name ? item.recorded.device_name : "?"} · ${item.recorded ? item.recorded.port : "?"}`,
    ]));
    row.appendChild(h("div", { class: "lc-note warn" }, ["Not seen in this LLDP output — cable may be unplugged."]));
  } else {
    row.appendChild(h("div", { class: "lb" }, [
      `${item.remoteSystem || "?"} · ${item.remotePort || "?"}${item.remoteChassisId ? " · " + item.remoteChassisId : ""}`,
    ]));
  }

  if (item.status === "conflict") {
    row.appendChild(h("div", { class: "lc-note" }, [
      `Recorded: ${item.recorded && item.recorded.device_name ? item.recorded.device_name : "?"} · ${item.recorded ? item.recorded.port : "?"}`,
    ]));
  }

  if (!item.device_known && (item.status === "new" || item.status === "conflict")) {
    row.appendChild(h("div", { class: "lc-note warn" }, [`Device '${item.remoteSystem}' not found in rack — create it before applying.`]));
  }

  const actionable = item.status !== "matched" && item.resolution !== "done"
    && (item.status === "removed" || item.device_known);

  if (actionable) {
    const actions = h("div", { class: "la" });

    if (item.status !== "removed") {
      const mediumSel = h("select", { class: "lldp-medium-select" });
      ["dac", "fiber", "cat6a", "sas"].forEach(m => {
        const opt = h("option", { value: m }, [m]);
        if (m === guessMedium(item.remotePort)) opt.setAttribute("selected", "selected");
        mediumSel.appendChild(opt);
      });
      actions.appendChild(mediumSel);

      if (item.status === "new") {
        const createBtn = h("button", { class: "ba" }, ["Create cable"]);
        createBtn.onclick = () => applyLldpRecord(item, "create", mediumSel.value);
        actions.appendChild(createBtn);
        const ignoreBtn = h("button", { class: "bs" }, ["Ignore"]);
        ignoreBtn.onclick = () => { item.resolution = "ignored"; renderLldpResults(); };
        actions.appendChild(ignoreBtn);
      } else if (item.status === "conflict") {
        const applyBtn = h("button", { class: "ba" }, ["Update record"]);
        applyBtn.onclick = () => applyLldpRecord(item, "update", mediumSel.value);
        actions.appendChild(applyBtn);
        const keepBtn = h("button", { class: "bs" }, ["Keep recorded"]);
        keepBtn.onclick = () => { item.resolution = "ignored"; renderLldpResults(); };
        actions.appendChild(keepBtn);
      }
    } else {
      const delBtn = h("button", { class: "ba danger" }, ["Delete cable"]);
      delBtn.onclick = () => applyLldpRecord(item, "remove", null);
      actions.appendChild(delBtn);
      const keepBtn = h("button", { class: "bs" }, ["Keep (maybe temporary)"]);
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

function pendingChanges() {
  return lldpResults.filter(r =>
    r.status !== "matched" && r.resolution !== "done" && r.resolution !== "ignored"
    && (r.status === "removed" || r.device_known)
  );
}

function renderLldpSummary() {
  const el = document.getElementById("lldp-summary");
  if (!lldpResults.length) { el.innerHTML = ""; return; }

  const changed = lldpResults.filter(r => r.status === "conflict").length;
  const added = lldpResults.filter(r => r.status === "new").length;
  const removed = lldpResults.filter(r => r.status === "removed").length;

  if (!changed && !added && !removed) {
    el.innerHTML = "";
    el.appendChild(h("div", { class: "lldp-summary-ok" }, ["✓ Everything is up to date — no differences from this LLDP output."]));
    return;
  }
  el.innerHTML = "";
  const parts = [];
  if (changed) parts.push(`${changed} changed`);
  if (added) parts.push(`${added} new`);
  if (removed) parts.push(`${removed} removed`);
  el.appendChild(h("div", { class: "lldp-summary-line" }, [parts.join(" · ")]));
}

function goToPortOnRack(item) {
  const switchId = Number(document.getElementById("lldp-switch-select").value);
  const sw = lldpSwitches.find(d => d.id === switchId);
  if (!sw) return;
  try {
    sessionStorage.setItem("rackview_lldp_markers", JSON.stringify({
      deviceId: switchId,
      items: lldpResults.filter(r => r.status !== "matched").map(r => ({ port: r.localPort, status: r.status })),
    }));
  } catch (e) { /* sessionStorage unavailable — marker overlay just won't show, navigation still works */ }
  window.location.href = `index.html?rack=${sw.rack_id}&device=${switchId}`;
}

function renderLldpResults() {
  const list = document.getElementById("lldp-results-list");
  list.innerHTML = "";

  const filtered = lldpResults.filter(item => lldpFilter === "all" || item.status === lldpFilter);
  if (!filtered.length) {
    list.appendChild(h("div", { class: "lldp-empty" }, [lldpResults.length ? "No results in this filter." : "Paste LLDP output (or load a sample) and click \"Parse & match\"."]));
  } else {
    filtered.forEach(item => list.appendChild(buildResultRow(item)));
  }

  renderLldpSummary();

  const pending = pendingChanges();
  const applyBtn = document.getElementById("btn-apply-all");
  applyBtn.textContent = pending.length ? `Apply all changes (${pending.length})` : "Apply all changes";
  applyBtn.disabled = pending.length === 0;

  const viewBtn = document.getElementById("btn-view-on-rack");
  viewBtn.style.display = lldpResults.some(r => r.status !== "matched") ? "inline-block" : "none";
  viewBtn.onclick = () => goToPortOnRack({});
}

async function applyLldpRecord(item, action, medium) {
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
    await markHistoryApplied();
  } else {
    alert("Could not apply: " + (data.skipped && data.skipped[0] ? data.skipped[0].reason : "unknown error"));
  }
  renderLldpResults();
}

async function applyAllChanges() {
  const switchId = Number(document.getElementById("lldp-switch-select").value);
  const pending = pendingChanges();
  if (!pending.length) return;

  const records = pending.map(item => ({
    localPort: item.localPort, remoteSystem: item.remoteSystem, remotePort: item.remotePort,
    medium: guessMedium(item.remotePort),
    action: item.status === "new" ? "create" : item.status === "conflict" ? "update" : "remove",
  }));
  const res = await fetch("/api/lldp/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ switch_id: switchId, records }),
  });
  const data = await res.json();
  const skippedPorts = new Set((data.skipped || []).map(s => s.localPort));
  let anyDone = false;
  pending.forEach(item => {
    if (!skippedPorts.has(item.localPort)) { item.resolution = "done"; anyDone = true; }
  });
  if (anyDone) await markHistoryApplied();
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
    body: JSON.stringify({ neighbors: parseRes.neighbors, switch_id: switchId, raw_lldp: text }),
  }).then(r => r.json());

  lldpResults = matchRes.results || [];
  currentHistoryId = matchRes.history_id || null;
  await loadHistory();
  lldpFilter = "all";
  document.querySelectorAll("#lldp-filter-chips .chip").forEach(c => c.classList.toggle("active", c.dataset.filter === "all"));
  renderLldpResults();
}

function timeAgo(isoString) {
  const then = new Date(isoString);
  const mins = Math.floor((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

function summaryBadges(summary) {
  const parts = [];
  if (summary.changed) parts.push(`${summary.changed} changed`);
  if (summary.added) parts.push(`${summary.added} new`);
  if (summary.removed) parts.push(`${summary.removed} removed`);
  return parts.length ? parts.join(" · ") : "no changes";
}

async function loadHistory() {
  lldpHistory = await fetchWithTimeout("/api/lldp/history").then(r => r.json()).catch(() => []);
  renderHistoryList();
}

function renderHistoryList() {
  const list = document.getElementById("lldp-history-list");
  list.innerHTML = "";
  if (!lldpHistory.length) {
    list.appendChild(h("div", { class: "lldp-empty" }, ["No discoveries yet."]));
    return;
  }
  lldpHistory.forEach(item => {
    const row = h("div", { class: "lh" + (item.id === currentHistoryId ? " active" : "") + (item.applied ? " done" : "") });
    row.onclick = () => restoreFromHistory(item.id);

    const top = h("div", { class: "lh-top" }, [
      h("span", { class: "lh-time" }, [timeAgo(item.timestamp)]),
      h("span", { class: "lh-switch" }, [item.switch_name]),
    ]);
    const delBtn = h("button", { class: "lh-del", title: "Delete this record" }, ["×"]);
    delBtn.onclick = ev => { ev.stopPropagation(); deleteHistoryEntry(item.id); };
    top.appendChild(delBtn);
    row.appendChild(top);

    row.appendChild(h("div", { class: "lh-summary" }, [summaryBadges(item.summary)]));
    row.appendChild(h("div", { class: "lh-state" }, [item.applied ? "Applied" : "Pending"]));
    list.appendChild(row);
  });
}

async function restoreFromHistory(id) {
  const detail = await fetchWithTimeout(`/api/lldp/history/${id}`).then(r => r.json());
  currentHistoryId = id;
  document.getElementById("lldp-switch-select").value = detail.switch_id;
  document.getElementById("lldp-textarea").value = detail.raw_lldp || "";
  document.getElementById("lldp-parse-error").textContent = "";
  lldpResults = detail.results || [];
  lldpFilter = "all";
  document.querySelectorAll("#lldp-filter-chips .chip").forEach(c => c.classList.toggle("active", c.dataset.filter === "all"));
  renderLldpResults();
  renderHistoryList();
}

async function deleteHistoryEntry(id) {
  await fetch(`/api/lldp/history/${id}`, { method: "DELETE" });
  if (currentHistoryId === id) currentHistoryId = null;
  await loadHistory();
}

async function markHistoryApplied() {
  if (!currentHistoryId) return;
  await fetch(`/api/lldp/history/${currentHistoryId}/apply`, { method: "POST" });
  await loadHistory();
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
  await loadHistory();
  setupSampleMenu();
  setupFilterChips();
  document.getElementById("btn-parse").onclick = parseAndMatch;
  document.getElementById("btn-apply-all").onclick = applyAllChanges;
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
