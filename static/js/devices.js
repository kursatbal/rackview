let allDevices = [];
let dvSort = { key: "rack_name", dir: 1 };

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

function populateFilters() {
  const catSel = document.getElementById("dv-category");
  const categories = [...new Set(allDevices.map(d => d.category))].sort();
  catSel.innerHTML = "";
  catSel.appendChild(h("option", { value: "" }, ["All categories"]));
  categories.forEach(c => catSel.appendChild(h("option", { value: c }, [CATEGORY_LABELS[c] || c])));

  const custSel = document.getElementById("dv-customer");
  const customers = [...new Set(allDevices.map(d => d.customer).filter(Boolean))].sort();
  custSel.innerHTML = "";
  custSel.appendChild(h("option", { value: "" }, ["All customers"]));
  customers.forEach(c => custSel.appendChild(h("option", { value: c }, [c])));
}

function filteredSorted() {
  const q = document.getElementById("dv-search").value.trim().toLowerCase();
  const cat = document.getElementById("dv-category").value;
  const cust = document.getElementById("dv-customer").value;
  let rows = allDevices.filter(d => {
    if (cat && d.category !== cat) return false;
    if (cust && d.customer !== cust) return false;
    if (q) {
      const hay = [d.name, d.mgmt_ip, d.serial, d.vendor, d.model, d.rack_name].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  rows.sort((a, b) => {
    const av = (a[dvSort.key] || "").toString().toLowerCase();
    const bv = (b[dvSort.key] || "").toString().toLowerCase();
    if (av < bv) return -1 * dvSort.dir;
    if (av > bv) return 1 * dvSort.dir;
    return 0;
  });
  return rows;
}

function renderTable() {
  const rows = filteredSorted();
  const tbody = document.getElementById("dv-tbody");
  tbody.innerHTML = "";
  document.getElementById("dv-count").textContent = `${rows.length} device${rows.length === 1 ? "" : "s"}`;
  if (!rows.length) {
    tbody.appendChild(h("tr", {}, [h("td", { colspan: "8", class: "devices-empty" }, ["No matching devices."])]));
    return;
  }
  rows.forEach(d => {
    const tr = h("tr", { class: "devices-row" });
    tr.onclick = () => { window.location.href = `index.html?rack=${d.rack_id}&device=${d.id}`; };
    tr.appendChild(h("td", { class: "dv-name" }, [d.name]));
    tr.appendChild(h("td", {}, [CATEGORY_LABELS[d.category] || d.category]));
    tr.appendChild(h("td", {}, [`${d.vendor} ${d.model}`]));
    tr.appendChild(h("td", {}, [`${d.rack_name}${d.customer ? " · " + d.customer : ""}`]));
    tr.appendChild(h("td", { class: "dv-mono" }, [d.mgmt_ip || "-"]));
    tr.appendChild(h("td", { class: "dv-mono" }, [d.firmware || "-"]));
    tr.appendChild(h("td", { class: "dv-mono" }, [d.serial || "-"]));
    tr.appendChild(h("td", {}, [d.owner_team || "-"]));
    tbody.appendChild(tr);
  });
}

function setupSortHeaders() {
  document.querySelectorAll("#dv-table th[data-sort]").forEach(th => {
    th.onclick = () => {
      const key = th.dataset.sort;
      if (dvSort.key === key) dvSort.dir *= -1;
      else { dvSort.key = key; dvSort.dir = 1; }
      document.querySelectorAll("#dv-table th[data-sort]").forEach(t => t.classList.remove("sorted-asc", "sorted-desc"));
      th.classList.add(dvSort.dir === 1 ? "sorted-asc" : "sorted-desc");
      renderTable();
    };
  });
}

async function main() {
  allDevices = await fetchWithTimeout("/api/devices/all").then(r => r.json());
  populateFilters();
  setupSortHeaders();
  document.getElementById("dv-search").addEventListener("input", renderTable);
  document.getElementById("dv-category").addEventListener("change", renderTable);
  document.getElementById("dv-customer").addEventListener("change", renderTable);
  renderTable();
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
