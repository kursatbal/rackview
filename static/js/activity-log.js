let logEntries = [];
let logTypeFilter = "";
let logRackFilter = "";

function h(tag, attrs, children) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  (children || []).forEach(c => e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return e;
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

const ACTION_LABEL = { created: "Created", updated: "Updated", deleted: "Deleted" };
const TYPE_ICON = { device: "\u{1F5A5}", cable: "\u{1F517}" };
const FIELD_LABEL = {
  position_u: "Position", device_type_id: "Device type", name: "Name", serial: "Serial",
  mgmt_ip: "Mgmt IP", notes: "Notes", owner_team: "Owner team", warranty_end: "Warranty end",
  role_label: "Role label", a_device_id: "A-side device", a_port: "A-side port",
  b_device_id: "B-side device", b_port: "B-side port", medium: "Medium", label: "Label",
};

function fieldValue(v) {
  return v == null || v === "" ? "(empty)" : String(v);
}

function buildEntryRow(entry) {
  const row = h("div", { class: "log-row log-" + entry.action });
  const top = h("div", { class: "log-row-top" }, [
    h("span", { class: "log-badge log-badge-" + entry.action }, [ACTION_LABEL[entry.action] || entry.action]),
    h("span", { class: "log-entity" }, [`${TYPE_ICON[entry.entity_type] || ""} ${entry.entity_name}`]),
    entry.rack_name ? h("span", { class: "log-rack-pill" }, [entry.rack_name]) : "",
    h("span", { class: "log-time" }, [timeAgo(entry.timestamp)]),
  ]);
  row.appendChild(top);

  if (entry.action === "updated" && entry.changes) {
    const diffs = h("div", { class: "log-diffs" });
    Object.entries(entry.changes).forEach(([field, { from, to }]) => {
      diffs.appendChild(h("div", { class: "log-diff-line" }, [
        h("b", {}, [FIELD_LABEL[field] || field]), ": ",
        h("span", { class: "log-diff-from" }, [fieldValue(from)]), " → ",
        h("span", { class: "log-diff-to" }, [fieldValue(to)]),
      ]));
    });
    row.appendChild(diffs);
  }
  return row;
}

function renderLog() {
  const list = document.getElementById("log-list");
  list.innerHTML = "";
  const filtered = logEntries.filter(e =>
    (!logTypeFilter || e.entity_type === logTypeFilter)
    && (!logRackFilter || String(e.rack_id) === logRackFilter)
  );
  if (!filtered.length) {
    list.appendChild(h("div", { class: "log-empty" }, ["No activity recorded yet."]));
    return;
  }
  filtered.forEach(e => list.appendChild(buildEntryRow(e)));
}

async function loadRacks() {
  const racks = await fetchWithTimeout("/api/racks").then(r => r.json()).catch(() => []);
  const select = document.getElementById("log-rack-select");
  racks.forEach(r => {
    select.appendChild(h("option", { value: r.id }, [`${r.name} · ${r.site}`]));
  });
  select.onchange = () => { logRackFilter = select.value; renderLog(); };
}

async function loadLog() {
  logEntries = await fetchWithTimeout("/api/activity-log").then(r => r.json()).catch(() => []);
  renderLog();
}

function setupTypeChips() {
  document.getElementById("log-type-chips").querySelectorAll(".chip").forEach(chip => {
    chip.onclick = () => {
      logTypeFilter = chip.dataset.type;
      document.querySelectorAll("#log-type-chips .chip").forEach(c => c.classList.toggle("active", c === chip));
      renderLog();
    };
  });
}

async function main() {
  setupTypeChips();
  await loadRacks();
  await loadLog();
}

function showFatalError(err) {
  console.error(err);
  const container = document.querySelector(".log-page") || document.body;
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
