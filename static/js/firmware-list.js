let fwlRows = [];
let fwlSort = { key: "vendor", dir: 1 };

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
  firewall: "Firewall", router: "Router",
};

function populateCategoryFilter() {
  const sel = document.getElementById("fwl-category");
  const categories = [...new Set(fwlRows.map(r => r.category))].sort();
  sel.innerHTML = "";
  sel.appendChild(h("option", { value: "" }, ["All categories"]));
  categories.forEach(c => sel.appendChild(h("option", { value: c }, [CATEGORY_LABELS[c] || c])));
}

async function loadRows() {
  fwlRows = await fetchWithTimeout("/api/firmware/catalog").then(r => r.json());
  populateCategoryFilter();
  render();
}

function filteredSorted() {
  const q = document.getElementById("fwl-search").value.trim().toLowerCase();
  const cat = document.getElementById("fwl-category").value;
  let rows = fwlRows.filter(r => {
    if (cat && r.category !== cat) return false;
    if (q && !`${r.vendor} ${r.model}`.toLowerCase().includes(q)) return false;
    return true;
  });
  rows.sort((a, b) => {
    const av = (a[fwlSort.key] ?? "").toString().toLowerCase();
    const bv = (b[fwlSort.key] ?? "").toString().toLowerCase();
    if (av < bv) return -1 * fwlSort.dir;
    if (av > bv) return 1 * fwlSort.dir;
    return 0;
  });
  return rows;
}

function render() {
  const rows = filteredSorted();
  const tbody = document.getElementById("fwl-tbody");
  tbody.innerHTML = "";
  document.getElementById("fwl-count").textContent = `${rows.length} model${rows.length === 1 ? "" : "s"}`;
  if (!rows.length) {
    tbody.appendChild(h("tr", {}, [h("td", { colspan: "5", class: "devices-empty" }, ["No matching models."])]));
    return;
  }
  rows.forEach(r => tbody.appendChild(buildRow(r)));
}

function buildRow(r) {
  const tr = h("tr", {});
  const label = r.model.toLowerCase().startsWith(r.vendor.toLowerCase()) ? r.model : `${r.vendor} ${r.model}`;
  tr.appendChild(h("td", { class: "dv-name" }, [label]));
  tr.appendChild(h("td", {}, [CATEGORY_LABELS[r.category] || r.category]));
  tr.appendChild(h("td", { class: "dv-mono" }, [r.deployed_count ? String(r.deployed_count) : "-"]));

  const historyText = (r.versions || []).map(v => v.date ? `${v.version} | ${v.date}` : v.version).join("\n");
  const versionsArea = h("textarea", { name: "versions", rows: "3", placeholder: "9.4.2 | 2026-05\n9.4.1 | 2026-02\n9.4.0 | 2025-11" }, [historyText]);
  const notesInput = h("input", { name: "notes", type: "text", placeholder: "notes (optional)", value: r.notes || "" });
  const saveBtn = h("button", {}, ["Save"]);
  saveBtn.onclick = () => saveReference(r, versionsArea.value, notesInput.value.trim(), saveBtn);
  const editRow = h("div", { class: "fw-edit-row" }, [versionsArea, notesInput, saveBtn]);
  tr.appendChild(h("td", {}, [editRow]));

  tr.appendChild(h("td", { class: "dv-mono" }, [r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "-"]));

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

function setupSortHeaders() {
  document.querySelectorAll("#fwl-table th[data-sort]").forEach(th => {
    th.onclick = () => {
      const key = th.dataset.sort;
      if (fwlSort.key === key) fwlSort.dir *= -1;
      else { fwlSort.key = key; fwlSort.dir = 1; }
      document.querySelectorAll("#fwl-table th[data-sort]").forEach(t => t.classList.remove("sorted-asc", "sorted-desc"));
      th.classList.add(fwlSort.dir === 1 ? "sorted-asc" : "sorted-desc");
      render();
    };
  });
}

async function main() {
  await loadRows();
  setupSortHeaders();
  document.getElementById("fwl-search").addEventListener("input", render);
  document.getElementById("fwl-category").addEventListener("change", render);
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
