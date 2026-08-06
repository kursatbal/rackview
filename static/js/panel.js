const MEDIUM_COLORS = {
  fiber: "#1D9E75",
  dac: "#2C2C2A",
  cat6a: "#888780",
  power: "#A32D2D",
  sas: "#534AB7",
};

const MEDIUM_GROUPS = [
  { key: "data", label: "Data", media: ["dac", "fiber"] },
  { key: "mgmt", label: "Management", media: ["cat6a"] },
  { key: "storage", label: "Storage", media: ["sas"] },
];

let panelEl = null;
let panelDeviceId = null;
let panelEditMode = false;
let panelActiveTab = "connections";

function h(tag, attrs, children) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  (children || []).forEach(c => e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return e;
}

function guessMedium(portName) {
  const p = (portName || "").toLowerCase();
  if (p.includes("lc") || p.includes("fc")) return "fiber";
  if (p.includes("sas")) return "sas";
  if (p.includes("ocp") || p.includes("sfp") || p.includes("qsfp")) return "dac";
  return "cat6a";
}

function attachEditTracking(el, original) {
  el.dataset.orig = original == null ? "" : String(original);
  el.addEventListener("input", () => {
    const changed = el.textContent.trim() !== (el.dataset.orig || "").trim();
    el.classList.toggle("chg", changed);
    updateEditBar();
  });
}

function sectionTitle(text) {
  return h("div", { class: "section-title" }, [text]);
}

function editableRow(label, key, value) {
  const row = h("div", { class: "gen-row" });
  row.appendChild(h("div", { class: "gen-label" }, [label]));
  const valEl = h("div", {
    class: "ed gen-val",
    contenteditable: panelEditMode ? "true" : "false",
    "data-k": key,
  }, [value == null || value === "" ? "-" : String(value)]);
  attachEditTracking(valEl, value == null ? "" : value);
  row.appendChild(valEl);
  return row;
}

function editableBlock(label, key, value) {
  const wrap = h("div", {});
  wrap.appendChild(sectionTitle(label));
  const el = h("pre", {
    class: "ed config-block",
    contenteditable: panelEditMode ? "true" : "false",
    "data-k": key,
  }, [value || "-"]);
  attachEditTracking(el, value || "");
  wrap.appendChild(el);
  return wrap;
}

function buildKvTable(map, keyHeader, valHeader) {
  const table = h("table", {});
  table.appendChild(h("thead", {}, [h("tr", {}, [keyHeader, valHeader].map(t => h("th", {}, [t])))]));
  const tbody = h("tbody", {});
  Object.keys(map).forEach(k => tbody.appendChild(h("tr", {}, [h("td", {}, [k]), h("td", {}, [String(map[k])])])));
  table.appendChild(tbody);
  return table;
}

function buildHeader(device, type) {
  const wrap = h("div", { class: "panel-header" });
  const top = h("div", { class: "ph-top" });
  top.appendChild(h("span", { class: "ph-role-sq", style: `background:${roleColor(type.category)}` }));
  const nameEl = h("span", {
    class: "ed ph-name",
    contenteditable: panelEditMode ? "true" : "false",
    "data-k": "name",
  }, [device.name]);
  attachEditTracking(nameEl, device.name);
  top.appendChild(nameEl);
  const editBtn = h("button", { class: "ph-edit-btn" }, [panelEditMode ? "Editing…" : "Edit"]);
  editBtn.onclick = () => { panelEditMode = !panelEditMode; renderPanelBody(); };
  top.appendChild(editBtn);
  wrap.appendChild(top);
  wrap.appendChild(h("div", { class: "ph-model" }, [`${type.vendor} ${type.model}`]));
  const chips = h("div", { class: "ph-chips" });
  const uTop = device.position_u + type.u_height - 1;
  [`U${device.position_u}–U${uTop}`, `${type.u_height}U`, type.category, panelRackName()].forEach(c => {
    chips.appendChild(h("span", { class: "chip-sm" }, [c]));
  });
  wrap.appendChild(chips);
  return wrap;
}

function panelRackName() {
  return (typeof rack !== "undefined" && rack && rack.name) || "";
}

function buildTabs(device, rack, cables) {
  const wrap = h("div", { class: "panel-tabs" });
  const connCount = cables.filter(c => c.a_device_id === device.id || c.b_device_id === device.id).length;
  const tabs = [
    ["general", "General"],
    ["connections", `Connections${connCount ? ` (${connCount})` : ""}`],
    ["system", "System"],
    ["impact", "Impact"],
  ];
  tabs.forEach(([key, label]) => {
    const btn = h("button", { class: "panel-tab" + (panelActiveTab === key ? " active" : "") }, [label]);
    btn.onclick = () => { panelActiveTab = key; renderPanelBody(); };
    wrap.appendChild(btn);
  });
  return wrap;
}

function buildGeneralTab(device) {
  const wrap = h("div", { class: "tab-body" });
  // Editing still shows every field (so there's somewhere to type a new value);
  // read-only view skips blanks instead of padding the panel with "-" rows.
  const maybeRow = (label, key, value) => {
    if (panelEditMode || (value != null && value !== "")) wrap.appendChild(editableRow(label, key, value));
  };
  maybeRow("Serial", "serial", device.serial);
  maybeRow("Mgmt IP", "mgmt_ip", device.mgmt_ip);
  maybeRow("Role label", "role_label", device.role_label);
  maybeRow("Owner team", "owner_team", device.owner_team);
  maybeRow("Warranty end", "warranty_end", device.warranty_end);
  if (panelEditMode || device.notes) wrap.appendChild(editableBlock("Notes", "notes", device.notes));
  if (!panelEditMode && !wrap.childElementCount) wrap.appendChild(h("div", { class: "tab-empty" }, ["No general info yet — click Edit to add some."]));
  if (device.device_type.category === "server" && panelEditMode) wrap.appendChild(buildRearConfigSection(device));
  return wrap;
}

// ---- Server rear-port configurator (RACKVIEW_PORT_YAPILANDIRICI.md) ----
// Servers only. Draft state is per-device so switching devices doesn't leak a stale edit.
let rearConfigDraft = null;
let rearConfigDraftDeviceId = null;

function inferRearConfigFromCatalog(device) {
  const catalogDev = (typeof rvFindDevice === "function") ? rvFindDevice(device.device_type.model) : null;
  const opts = (catalogDev && catalogDev.opts) || {};
  const layout = opts.rearLayout || "ocp";
  return {
    fc_ports: layout === "fc" ? (opts.fcCards || 2) * 2 : 0,
    fc_speed: "16Gb",
    nic_ports: layout === "ocp" ? (opts.ocpCards || 2) * 2 : 0,
    nic_speed: "25GbE",
    lom: opts.lom === false ? "yok" : opts.lomPorts === 2 ? "2x1GbE" : opts.lomPorts === 0 ? "yok" : "4x1GbE",
    idrac: true,
  };
}

function rearConfigPortNames(cfg) {
  const names = [];
  for (let i = 1; i <= (cfg.fc_ports || 0); i++) names.push("FC" + i);
  for (let i = 1; i <= (cfg.nic_ports || 0); i++) names.push("NIC" + i);
  const lomN = cfg.lom === "4x1GbE" ? 4 : cfg.lom === "2x1GbE" ? 2 : 0;
  for (let i = 1; i <= lomN; i++) names.push("LOM" + i);
  if (cfg.idrac) names.push("iDRAC");
  return names;
}

function rearConfigSummary(cfg) {
  const parts = [];
  if (cfg.fc_ports) parts.push(`${cfg.fc_ports}× ${cfg.fc_speed} FC`);
  if (cfg.nic_ports) parts.push(`${cfg.nic_ports}× ${cfg.nic_speed} NIC`);
  const lomN = cfg.lom === "4x1GbE" ? 4 : cfg.lom === "2x1GbE" ? 2 : 0;
  if (lomN) parts.push(`${lomN}× 1GbE LOM`);
  if (cfg.idrac) parts.push("iDRAC");
  return parts.length ? parts.join(" · ") : "No ports selected";
}

function buildRearConfigSection(device) {
  if (rearConfigDraftDeviceId !== device.id) {
    rearConfigDraft = device.metadata_json && device.metadata_json.rear_config
      ? Object.assign({}, device.metadata_json.rear_config)
      : inferRearConfigFromCatalog(device);
    rearConfigDraftDeviceId = device.id;
  }
  const cfg = rearConfigDraft;
  const hasOverride = !!(device.metadata_json && device.metadata_json.rear_config);

  const wrap = h("div", { class: "rear-cfg" });
  wrap.appendChild(sectionTitle("Rear-panel ports"));
  wrap.appendChild(h("div", { class: "rear-cfg-note" }, [
    hasOverride ? "Custom configuration for this device." : "Using the model's default layout — pick a value below to override it.",
  ]));

  const btnGroup = (label, options, current, onPick) => {
    const row = h("div", { class: "rear-cfg-row" });
    row.appendChild(h("div", { class: "rear-cfg-label" }, [label]));
    const opts = h("div", { class: "rear-cfg-opts" });
    options.forEach(opt => {
      const btn = h("button", { class: "rear-cfg-btn" + (String(current) === String(opt) ? " active" : "") }, [String(opt)]);
      btn.onclick = () => { onPick(opt); rerenderRearConfigSection(device); };
      opts.appendChild(btn);
    });
    row.appendChild(opts);
    return row;
  };

  wrap.appendChild(btnGroup("FC ports", [0, 2, 4, 6], cfg.fc_ports, v => { cfg.fc_ports = v; }));
  if (cfg.fc_ports > 0) wrap.appendChild(btnGroup("FC speed", ["16Gb", "32Gb", "64Gb"], cfg.fc_speed, v => { cfg.fc_speed = v; }));
  wrap.appendChild(btnGroup("NIC ports", [0, 2, 4, 6], cfg.nic_ports, v => { cfg.nic_ports = v; }));
  if (cfg.nic_ports > 0) wrap.appendChild(btnGroup("NIC speed", ["10GbE", "25GbE", "100GbE"], cfg.nic_speed, v => { cfg.nic_speed = v; }));
  wrap.appendChild(btnGroup("LOM", ["4x1GbE", "2x1GbE", "yok"], cfg.lom, v => { cfg.lom = v; }));
  wrap.appendChild(btnGroup("iDRAC / MGMT", [true, false], cfg.idrac, v => { cfg.idrac = v; }));

  wrap.appendChild(h("div", { class: "rear-cfg-preview" }, ["→ " + rearConfigSummary(cfg)]));

  const actions = h("div", { class: "rear-cfg-actions" });
  const saveBtn = h("button", { class: "btn-link" }, ["Save rear config"]);
  saveBtn.onclick = () => saveRearConfig(device, cfg);
  actions.appendChild(saveBtn);
  if (hasOverride) {
    const resetBtn = h("button", { class: "btn-link" }, ["Reset to model default"]);
    resetBtn.onclick = () => saveRearConfig(device, null);
    actions.appendChild(resetBtn);
  }
  wrap.appendChild(actions);

  return wrap;
}

function rerenderRearConfigSection(device) {
  const old = panelEl.querySelector(".rear-cfg");
  if (!old) return;
  old.replaceWith(buildRearConfigSection(device));
}

async function saveRearConfig(device, cfg) {
  if (cfg && !cfg.fc_ports && !cfg.nic_ports && cfg.lom === "yok" && !cfg.idrac) {
    window.alert("Select at least one port type.");
    return;
  }

  const newPortNames = cfg ? rearConfigPortNames(cfg) : null; // null = reverting to model default, can't predict names, be conservative below
  const myCables = (cables || []).filter(c => c.a_device_id === device.id || c.b_device_id === device.id);
  const affected = myCables.filter(c => {
    const ownPort = c.a_device_id === device.id ? c.a_port : c.b_port;
    return newPortNames ? !newPortNames.includes(ownPort) : true;
  });

  if (affected.length) {
    const portList = affected.map(c => c.a_device_id === device.id ? c.a_port : c.b_port).join(", ");
    const ok = window.confirm(`This will remove ${affected.length} cable(s) on port(s): ${portList}. Continue?`);
    if (!ok) return;
    for (const c of affected) {
      await fetch(`/api/cables/${c.id}`, { method: "DELETE" });
    }
  }

  await fetch(`/api/devices/${device.id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metadata_json: { rear_config: cfg } }),
  });
  rearConfigDraft = null;
  rearConfigDraftDeviceId = null;
  await panelReload();
  if (typeof refreshCabling === "function") refreshCabling();
}

function subInfoFor(device, ownPort) {
  const meta = device.metadata_json || {};
  if (device.device_type.category === "server" && meta.vmnic_map) {
    const entry = Object.entries(meta.vmnic_map).find(([, v]) => v === ownPort);
    if (entry) return entry[0];
  }
  return "";
}

function buildGroupHeader(group, count) {
  const color = MEDIUM_COLORS[group.media[0]] || "#888780";
  return h("div", { class: "conn-group-title" }, [
    h("span", { class: "cg-stripe", style: `background:${color}` }),
    h("span", {}, [group.label]),
    h("span", { class: "cg-count" }, [String(count)]),
  ]);
}

function buildConnCard(device, rack, cable) {
  const mine = cable.a_device_id === device.id;
  const ownPort = mine ? cable.a_port : cable.b_port;
  const otherId = mine ? cable.b_device_id : cable.a_device_id;
  const otherPort = mine ? cable.b_port : cable.a_port;
  const other = rack.devices.find(d => d.id === otherId);

  const card = h("div", { class: "row" });
  if (panelEditMode) {
    const del = h("button", { class: "row-del", title: "Remove connection" }, ["×"]);
    del.onclick = () => deleteConnection(cable.id);
    card.appendChild(del);
  }
  card.appendChild(h("div", { class: "rl" }, [h("b", {}, [ownPort]), h("span", {}, [subInfoFor(device, ownPort)])]));
  card.appendChild(h("div", { class: "rr" }, [h("b", {}, [other ? other.name : "?"]), h("span", {}, [otherPort])]));

  if (cable.label || panelEditMode) {
    const cfgEl = h("div", {
      class: "ed rt",
      contenteditable: panelEditMode ? "true" : "false",
    }, [cable.label || (panelEditMode ? "" : "-")]);
    if (panelEditMode) {
      cfgEl.addEventListener("keydown", ev => {
        if (ev.key === "Escape") { ev.preventDefault(); cfgEl.textContent = cable.label || ""; cfgEl.blur(); }
      });
      cfgEl.addEventListener("blur", () => saveCableLabel(cable.id, cfgEl.textContent.trim()));
    }
    card.appendChild(cfgEl);
  }
  return card;
}

function buildAddConnectionRow(device, rack) {
  const wrap = h("div", { class: "add-conn-wrap" });
  const btn = h("button", { class: "add-conn-btn" }, ["+ Add connection"]);
  btn.onclick = () => {
    wrap.removeChild(btn);
    wrap.appendChild(buildAddConnectionForm(device, rack));
  };
  wrap.appendChild(btn);
  return wrap;
}

function buildAddConnectionForm(device, rack) {
  const form = h("div", { class: "add-conn-form" });

  const srcSel = h("select", { class: "ed-select" });
  srcSel.appendChild(h("option", { value: "" }, ["Source port…"]));
  const tgtDevSel = h("select", { class: "ed-select" });
  tgtDevSel.appendChild(h("option", { value: "" }, ["Target device…"]));
  rack.devices.filter(d => d.id !== device.id).forEach(d => {
    tgtDevSel.appendChild(h("option", { value: d.id }, [d.name]));
  });
  const tgtPortSel = h("select", { class: "ed-select" });
  tgtPortSel.setAttribute("disabled", "disabled");
  tgtPortSel.appendChild(h("option", { value: "" }, ["Target port…"]));
  const mediumSel = h("select", { class: "ed-select" });
  ["dac", "fiber", "cat6a", "sas"].forEach(m => mediumSel.appendChild(h("option", { value: m }, [m])));
  const cfgInput = h("input", { class: "ed-input", type: "text", placeholder: "Config (optional)" });

  fetch(`/api/devices/${device.id}/free-ports`).then(r => r.json()).then(ports => {
    ports.forEach(p => srcSel.appendChild(h("option", { value: p.name }, [p.name])));
  });

  tgtDevSel.onchange = () => {
    while (tgtPortSel.firstChild) tgtPortSel.removeChild(tgtPortSel.firstChild);
    tgtPortSel.appendChild(h("option", { value: "" }, ["Target port…"]));
    if (!tgtDevSel.value) { tgtPortSel.setAttribute("disabled", "disabled"); return; }
    tgtPortSel.removeAttribute("disabled");
    fetch(`/api/devices/${tgtDevSel.value}/free-ports`).then(r => r.json()).then(ports => {
      ports.forEach(p => tgtPortSel.appendChild(h("option", { value: p.name }, [p.name])));
    });
  };
  srcSel.onchange = () => { if (srcSel.value) mediumSel.value = guessMedium(srcSel.value); };

  async function commit() {
    if (!srcSel.value || !tgtDevSel.value || !tgtPortSel.value) return;
    const res = await fetch("/api/cables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        a_device_id: device.id, a_port: srcSel.value,
        b_device_id: Number(tgtDevSel.value), b_port: tgtPortSel.value,
        medium: mediumSel.value, label: cfgInput.value.trim() || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(`Could not add connection: ${err.error || res.status}`);
      return;
    }
    await panelReload();
  }

  [srcSel, tgtDevSel, tgtPortSel, mediumSel, cfgInput].forEach(el => {
    el.addEventListener("keydown", ev => {
      if (ev.key === "Enter") { ev.preventDefault(); commit(); }
      if (ev.key === "Escape") { ev.preventDefault(); renderPanelBody(); }
    });
  });

  const addBtn = h("button", { class: "add-conn-commit" }, ["Add"]);
  addBtn.onclick = commit;

  [srcSel, tgtDevSel, tgtPortSel, mediumSel, cfgInput, addBtn].forEach(el => form.appendChild(el));
  return form;
}

async function deleteConnection(cableId) {
  const res = await fetch(`/api/cables/${cableId}`, { method: "DELETE" });
  if (!res.ok) { alert("Could not delete connection"); return; }
  await panelReload();
}

async function saveCableLabel(cableId, value) {
  await fetch(`/api/cables/${cableId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label: value || null }),
  });
  await panelReload();
}

function buildConnectionsTab(device, rack, cables) {
  const wrap = h("div", { class: "tab-body" });
  const myCables = cables.filter(c => c.a_device_id === device.id || c.b_device_id === device.id);
  if (myCables.length) {
    const exportBtn = h("button", { class: "btn-link conn-export-btn" }, ["Export to Excel"]);
    exportBtn.onclick = () => { window.location.href = `/api/devices/${device.id}/export.xlsx`; };
    wrap.appendChild(exportBtn);
  }
  let any = false;
  MEDIUM_GROUPS.forEach(group => {
    const groupCables = myCables.filter(c => group.media.includes(c.medium));
    if (!groupCables.length) return;
    any = true;
    wrap.appendChild(buildGroupHeader(group, groupCables.length));
    groupCables.forEach(c => wrap.appendChild(buildConnCard(device, rack, c)));
  });
  if (!any && !panelEditMode) wrap.appendChild(h("div", { class: "tab-empty" }, ["No connections."]));
  if (panelEditMode) wrap.appendChild(buildAddConnectionRow(device, rack));

  const cabledPorts = new Set();
  myCables.forEach(c => cabledPorts.add(c.a_device_id === device.id ? c.a_port : c.b_port));
  const lldpNotes = Object.entries((device.metadata_json || {}).lldp_ports || {})
    .filter(([port]) => !cabledPorts.has(port));
  if (lldpNotes.length) {
    wrap.appendChild(sectionTitle("LLDP info (no cable recorded here)"));
    lldpNotes.forEach(([port, note]) => wrap.appendChild(buildLldpNoteRow(port, note)));
  }
  return wrap;
}

function buildLldpNoteRow(port, note) {
  const row = h("div", { class: "row lldp-note-row" });
  row.appendChild(h("div", { class: "rl" }, [h("b", {}, [port]), h("span", {}, ["no cable recorded"])]));
  row.appendChild(h("div", { class: "rr" }, [h("b", {}, [note.remoteSystem || "?"]), h("span", {}, [note.remotePort || "?"])]));
  const when = note.seenAt ? new Date(note.seenAt).toLocaleString() : "";
  row.appendChild(h("div", { class: "rt" }, [when ? `Seen via LLDP · ${when}` : "Seen via LLDP"]));
  return row;
}

function buildArpSection(device) {
  const holder = h("div", {});
  fetch(`/api/devices/${device.id}`).then(r => r.json()).then(data => {
    const table = h("table", {});
    table.appendChild(h("thead", {}, [h("tr", {}, ["IP", "MAC", "Port", "VLAN"].map(t => h("th", {}, [t])))]));
    const tbody = h("tbody", {});
    (data.arp || []).forEach(a => {
      tbody.appendChild(h("tr", {}, [
        h("td", {}, [a.ip]), h("td", {}, [a.mac]), h("td", {}, [a.port]), h("td", {}, [a.vlan || "-"]),
      ]));
    });
    table.appendChild(tbody);
    holder.appendChild(table);
  });
  return holder;
}

function buildModularChassisSection(device, type) {
  const wrap = h("div", {});
  const catalogDev = (typeof rvFindDevice === "function") ? rvFindDevice(type.model) : null;
  const opts = (catalogDev && catalogDev.opts) || {};
  const slots = opts.lineCardSlots || 0;
  const cards = device.line_cards || opts.cards || [];

  wrap.appendChild(sectionTitle("Slot occupancy"));
  const table = h("table", {});
  table.appendChild(h("thead", {}, [h("tr", {}, ["Slot", "Card", "Ports", "Status"].map(t => h("th", {}, [t])))]));
  const tbody = h("tbody", {});
  for (let i = 0; i < (opts.supervisors || 0); i++) {
    tbody.appendChild(h("tr", {}, [
      h("td", {}, [`SUP-${String.fromCharCode(65 + i)}`]),
      h("td", {}, [`${type.vendor} Supervisor`]),
      h("td", {}, ["—"]),
      h("td", {}, [i === 0 ? "Active" : "Standby"]),
    ]));
  }
  for (let i = 0; i < slots; i++) {
    const card = cards[i];
    tbody.appendChild(h("tr", {}, [
      h("td", {}, [String(i + 1)]),
      h("td", {}, [card ? card.model : "—"]),
      h("td", {}, [card ? String(card.ports) : "—"]),
      h("td", {}, [card ? "Occupied" : "Empty"]),
    ]));
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

function renderSection(wrap, title, rows) {
  const visible = panelEditMode ? rows : rows.filter(([, , v]) => v != null && v !== "");
  if (!visible.length) return;
  wrap.appendChild(sectionTitle(title));
  visible.forEach(([label, key, value]) => wrap.appendChild(editableRow(label, key, value)));
}

function buildSystemTab(device, type) {
  const wrap = h("div", { class: "tab-body" });
  const meta = device.metadata_json || {};

  if (type.category === "server") {
    renderSection(wrap, "Hypervisor / OS", [["Build", "esxi_build", meta.esxi_build]]);
    if (Object.keys(meta.vmnic_map || {}).length) {
      wrap.appendChild(sectionTitle("vmnic mapping"));
      wrap.appendChild(buildKvTable(meta.vmnic_map || {}, "vmnic", "Uplink"));
    }
    renderSection(wrap, "IP addresses", [
      ["iDRAC / iLO IP", "oob_ip", meta.oob_ip],
      ["ESXi Mgmt IP", "mgmt_ip", device.mgmt_ip],
      ["vMotion IP", "vmotion_ip", meta.vmotion_ip],
    ]);
  } else if (type.category === "switch") {
    renderSection(wrap, "Software", [["Version", "sw_version", meta.sw_version]]);
    renderSection(wrap, "IP address", [["Mgmt IP", "mgmt_ip", device.mgmt_ip]]);
    wrap.appendChild(sectionTitle("ARP"));
    wrap.appendChild(buildArpSection(device));
    if (panelEditMode || meta.config) wrap.appendChild(editableBlock("Running-config", "config", meta.config));
    if (type.stencil === "modular-chassis") wrap.appendChild(buildModularChassisSection(device, type));
  } else if (type.category === "firewall") {
    renderSection(wrap, "Software", [["Version", "sw_version", meta.sw_version]]);
    renderSection(wrap, "IP address", [["Mgmt IP", "mgmt_ip", device.mgmt_ip]]);
    renderSection(wrap, "High availability", [
      ["HA status", "ha_status", meta.ha_status],
      ["Peer device", "ha_peer", meta.ha_peer],
    ]);
    renderSection(wrap, "Policy", [
      ["Zones", "zone_count", meta.zone_count],
      ["Policies", "policy_count", meta.policy_count],
      ["VPN tunnels", "vpn_tunnels", meta.vpn_tunnels],
      ["Throughput", "throughput", meta.throughput],
    ]);
  } else if (type.category === "router") {
    renderSection(wrap, "Software", [["Version", "os_version", meta.os_version]]);
    renderSection(wrap, "IP address", [["Mgmt IP", "mgmt_ip", device.mgmt_ip]]);
    renderSection(wrap, "Routing", [
      ["BGP AS", "bgp_as", meta.bgp_as],
      ["OSPF area", "ospf_area", meta.ospf_area],
    ]);
    renderSection(wrap, "WAN circuit", [
      ["Circuit ID", "wan_circuit", meta.wan_circuit],
      ["NIM/SM slots", "slot_occupancy", meta.slot_occupancy],
    ]);
  } else if (type.category === "storage") {
    renderSection(wrap, "Disk", [
      ["Count", "disk_count", meta.disk_count],
      ["Type", "disk_type", meta.disk_type],
    ]);
    const ctrlIps = meta.ctrl_ips || {};
    renderSection(wrap, "IP addresses", [
      ["Cluster / System IP", "cluster_ip", meta.cluster_ip],
      ...Object.keys(ctrlIps).map(k => [`${k} IP`, `ctrl_ips.${k}`, ctrlIps[k]]),
    ]);
    renderSection(wrap, "RAID", [["Group", "raid_group", meta.raid_group]]);
    const volMap = meta.volume_mapping || {};
    if (Object.keys(volMap).length) {
      wrap.appendChild(sectionTitle("Volume mapping"));
      Object.keys(volMap).forEach(k => wrap.appendChild(h("div", {}, [`${k}: ${volMap[k].join(", ")}`])));
    }
  } else {
    wrap.appendChild(h("div", { class: "tab-empty" }, ["No system data for this device type."]));
  }
  if (!panelEditMode && !wrap.childElementCount) wrap.appendChild(h("div", { class: "tab-empty" }, ["No system data yet — click Edit to add some."]));
  return wrap;
}

const IMPACT_BADGE = {
  critical: { bg: "#FCE8E6", fg: "#A32D2D", label: "Critical" },
  degraded: { bg: "#FBEDD4", fg: "#B8791A", label: "Attention" },
  safe: { bg: "#DFF5E6", fg: "#0F6E56", label: "Safe" },
};

function buildImpactCountCard(label, count, color) {
  const card = h("div", { class: "impact-count-card", style: `border-color:${color}` });
  card.appendChild(h("div", { class: "icc-num", style: `color:${color}` }, [String(count)]));
  card.appendChild(h("div", { class: "icc-label" }, [label]));
  return card;
}

function buildImpactCard(item, kind) {
  const card = h("div", { class: "ic " + kind });
  const inRow = h("div", { class: "in" }, [h("b", {}, [item.device_name])]);
  const rackSuffix = item.rack_name ? ` (${item.rack_name})` : "";
  inRow.appendChild(document.createTextNode(`${rackSuffix} · ${item.reason}`));
  card.appendChild(inRow);
  if (item.detail) card.appendChild(h("div", { class: "id" }, [item.detail]));
  card.onclick = () => {
    const sameRack = typeof rack !== "undefined" && rack && item.rack_id === rack.id;
    if (sameRack && typeof focusDevice === "function") {
      focusDevice(item.device_id);
    } else if (item.rack_id) {
      location.href = `index.html?rack=${item.rack_id}&device=${item.device_id}`;
    }
  };
  return card;
}

function buildImpactTab(device) {
  const wrap = h("div", { class: "tab-body impact-tab" });
  wrap.appendChild(h("div", { class: "impact-loading" }, ["Loading impact analysis…"]));

  fetch(`/api/devices/${device.id}/impact`).then(r => r.json()).then(data => {
    if (panelDeviceId !== device.id || panelActiveTab !== "impact") return;
    wrap.innerHTML = "";

    const badge = IMPACT_BADGE[data.severity] || IMPACT_BADGE.safe;
    wrap.appendChild(h("div", { class: "impact-severity", style: `background:${badge.bg};color:${badge.fg}` }, [badge.label]));

    const counts = h("div", { class: "impact-counts" });
    counts.appendChild(buildImpactCountCard("Service outage", data.counts.critical, "#A32D2D"));
    counts.appendChild(buildImpactCountCard("Loses redundancy", data.counts.degraded, "#B8791A"));
    counts.appendChild(buildImpactCountCard("Unaffected", data.counts.safe, "#0F6E56"));
    wrap.appendChild(counts);

    if (data.critical.length) {
      wrap.appendChild(sectionTitle("Service outage"));
      data.critical.forEach(item => wrap.appendChild(buildImpactCard(item, "crit")));
    }
    if (data.degraded.length) {
      wrap.appendChild(sectionTitle("Loses redundancy"));
      data.degraded.forEach(item => wrap.appendChild(buildImpactCard(item, "warn")));
    }
    if (data.safe.length) {
      wrap.appendChild(sectionTitle("Unaffected"));
      data.safe.forEach(item => wrap.appendChild(buildImpactCard(item, "ok")));
    }

    if (typeof applyImpactHighlight === "function") applyImpactHighlight(data);
  });

  return wrap;
}

function buildActionBar() {
  const bar = h("div", { class: "panel-action-bar" });
  const count = h("span", { id: "panel-chg-count" }, ["0 field(s) changed"]);
  const deleteBtn = h("button", { class: "delete-btn" }, ["Delete device"]);
  deleteBtn.onclick = deleteCurrentDevice;
  const discardBtn = h("button", {}, ["Discard"]);
  discardBtn.onclick = () => { panelEditMode = false; renderPanelBody(); };
  const saveBtn = h("button", { class: "save-btn" }, ["Save"]);
  saveBtn.onclick = savePanelChanges;
  bar.appendChild(count);
  bar.appendChild(deleteBtn);
  bar.appendChild(discardBtn);
  bar.appendChild(saveBtn);
  return bar;
}

async function deleteCurrentDevice() {
  const device = rack.devices.find(d => d.id === panelDeviceId);
  if (!device) return;
  const cableCount = (cables || []).filter(c => c.a_device_id === device.id || c.b_device_id === device.id).length;
  const warning = cableCount
    ? `Delete "${device.name}"? This will also remove ${cableCount} connected cable(s). This cannot be undone.`
    : `Delete "${device.name}"? This cannot be undone.`;
  if (!window.confirm(warning)) return;

  const res = await fetch(`/api/devices/${device.id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    window.alert(`Could not delete: ${err.error || res.status}`);
    return;
  }
  panelEditMode = false;
  panelDeviceId = null;
  if (typeof resetSelection === "function") resetSelection();
  await panelReload();
}

function updateEditBar() {
  if (!panelEl) return;
  const n = panelEl.querySelectorAll(".ed.chg").length;
  const countEl = document.getElementById("panel-chg-count");
  if (countEl) countEl.textContent = `${n} field(s) changed`;
}

async function savePanelChanges() {
  const changed = {};
  panelEl.querySelectorAll(".ed.chg").forEach(e => {
    if (!e.dataset.k) return;
    const value = e.textContent.trim();
    if (e.dataset.k.includes(".")) {
      const [parent, child] = e.dataset.k.split(".");
      changed[parent] = changed[parent] || {};
      changed[parent][child] = value;
    } else {
      changed[e.dataset.k] = value;
    }
  });
  if (Object.keys(changed).length) {
    const res = await fetch(`/api/devices/${panelDeviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changed),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(`Could not save: ${err.error || res.status}`);
      return;
    }
  }
  panelEditMode = false;
  await panelReload();
}

async function panelReload() {
  await reloadData();
  if (panelDeviceId) renderPanel(panelEl, panelDeviceId, rack, cables);
}

function renderPanelBody() {
  if (!panelEl) return;
  panelEl.innerHTML = "";
  panelEl.classList.toggle("edit", panelEditMode);

  if (!panelDeviceId) {
    panelEl.textContent = "Select a device.";
    if (typeof clearImpactHighlight === "function") clearImpactHighlight();
    return;
  }
  const device = rack.devices.find(d => d.id === panelDeviceId);
  if (!device) {
    panelEl.textContent = "Select a device.";
    if (typeof clearImpactHighlight === "function") clearImpactHighlight();
    return;
  }
  const type = device.device_type;

  if (panelActiveTab !== "impact" && typeof clearImpactHighlight === "function") clearImpactHighlight();

  panelEl.appendChild(buildHeader(device, type));
  panelEl.appendChild(buildTabs(device, rack, cables));

  if (panelActiveTab === "general") panelEl.appendChild(buildGeneralTab(device));
  else if (panelActiveTab === "connections") panelEl.appendChild(buildConnectionsTab(device, rack, cables));
  else if (panelActiveTab === "system") panelEl.appendChild(buildSystemTab(device, type));
  else if (panelActiveTab === "impact") panelEl.appendChild(buildImpactTab(device));

  if (panelEditMode) panelEl.appendChild(buildActionBar());
}

function renderPanel(el, deviceId, rackArg, cablesArg) {
  panelEl = el;
  if (deviceId !== panelDeviceId) {
    panelEditMode = false;
    panelActiveTab = "connections";
  }
  panelDeviceId = deviceId || null;
  renderPanelBody();
}
