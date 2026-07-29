const RV_NS = 'http://www.w3.org/2000/svg';
const RV_U = 29;

function el(tag, attrs, parent) {
  const e = document.createElementNS(RV_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function rvHit(parent, x, y, w, h, ctx, portName) {
  const r = el('rect', { x, y, width: w, height: h, fill: 'transparent', 'data-port': portName || '' }, parent);
  if (portName && ctx && ctx.registerPort) ctx.registerPort(portName, x + w / 2, y + h / 2);
  if (ctx && ctx.onPortClick && portName) {
    r.style.cursor = 'pointer';
    r.addEventListener('click', ev => { ev.stopPropagation(); ctx.onPortClick(portName); });
  }
  if (ctx && ctx.onPortContextMenu && portName) {
    r.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); ctx.onPortContextMenu(portName, ev); });
  }
  return r;
}

function rvChassis(parent, x, y, w, uHeight, opts) {
  opts = opts || {};
  const dark = !!opts.dark;
  const h = uHeight * RV_U - 1;
  const g = el('g', { class: 'rv-chassis' }, parent);

  el('rect', { x, y, width: w, height: h, rx: 2.5,
    fill: dark ? 'url(#rvChasDark)' : 'url(#rvChasLight)',
    stroke: dark ? '#232221' : '#6E6D68', 'stroke-width': 0.9 }, g);
  el('rect', { x, y, width: w, height: 1.3, fill: dark ? '#78776F' : '#F2F0E9', opacity: dark ? 0.5 : 0.75 }, g);
  el('rect', { x, y: y + h - 1.3, width: w, height: 1.3, fill: dark ? '#171615' : '#6A6963', opacity: 0.55 }, g);

  const eg = el('g', { filter: 'url(#rvShadow)' }, g);
  const ew = 15;
  el('rect', { x, y, width: ew, height: h, rx: 1.5,
    fill: dark ? 'url(#rvEarDark)' : 'url(#rvEarLight)',
    stroke: dark ? '#232221' : '#6E6D68', 'stroke-width': 0.7 }, eg);
  el('rect', { x: x + w - ew, y, width: ew, height: h, rx: 1.5,
    fill: dark ? 'url(#rvEarDark)' : 'url(#rvEarLight)',
    stroke: dark ? '#232221' : '#6E6D68', 'stroke-width': 0.7 }, eg);

  for (let u = 0; u < uHeight; u++) {
    const base = y + 8 + u * RV_U;
    [x + ew / 2, x + w - ew / 2].forEach(cx => {
      [base, base + 13].forEach(cy => {
        el('circle', { cx, cy, r: 2.4, fill: dark ? '#575652' : '#8A8880',
          stroke: dark ? '#1E1D1C' : '#5C5B56', 'stroke-width': 0.5 }, g);
        el('circle', { cx, cy, r: 1.3, fill: dark ? '#8D8C86' : '#E6E4DC' }, g);
      });
    });
  }
  return { g, h, innerX: x + ew + 3, innerW: w - (ew + 3) * 2 };
}

function rvLabel(parent, x, y, text, dark, ctx, labelKey) {
  const off = (ctx && labelKey && ctx.getLabelOffset) ? ctx.getLabelOffset(labelKey) : null;
  const dx = (off && off.dx) || 0, dy = (off && off.dy) || 0;
  const px = x + dx, py = y + dy;
  const displayText = (ctx && labelKey && ctx.getLabelText) ? ctx.getLabelText(labelKey, text) : text;

  const w = displayText.length * 4.1 + 2;
  const rect = el('rect', { x: px - 1.5, y: py - 6.5, width: w, height: 8, rx: 1,
    fill: dark ? '#000000B0' : '#F1EFE8CC' }, parent);
  const t = el('text', { x: px, y: py, 'font-size': 6.5, 'font-family': 'monospace', 'font-weight': '600',
    fill: dark ? '#E8E6DE' : '#1A1A18' }, parent);
  t.textContent = displayText;

  if (ctx && labelKey && ctx.onLabelRename) {
    rect.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); ctx.onLabelRename(labelKey, displayText); });
    t.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); ctx.onLabelRename(labelKey, displayText); });
  }

  if (ctx && labelKey && ctx.onLabelDrag && ctx.toSvgPoint) {
    rect.style.cursor = 'move';
    t.style.cursor = 'move';
    let dragging = false, start = null, startOff = null;
    const apply = (ndx, ndy) => {
      rect.setAttribute('x', x + ndx - 1.5);
      rect.setAttribute('y', y + ndy - 6.5);
      t.setAttribute('x', x + ndx);
      t.setAttribute('y', y + ndy);
    };
    const onMove = ev => {
      if (!dragging) return;
      const p = ctx.toSvgPoint(ev.clientX, ev.clientY);
      apply(startOff.dx + (p.x - start.x), startOff.dy + (p.y - start.y));
    };
    const onUp = ev => {
      if (!dragging) return;
      dragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const p = ctx.toSvgPoint(ev.clientX, ev.clientY);
      ctx.onLabelDrag(labelKey, startOff.dx + (p.x - start.x), startOff.dy + (p.y - start.y));
    };
    const onDown = ev => {
      ev.stopPropagation();
      ev.preventDefault();
      dragging = true;
      start = ctx.toSvgPoint(ev.clientX, ev.clientY);
      startOff = { dx, dy };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
    rect.addEventListener('mousedown', onDown);
    t.addEventListener('mousedown', onDown);
  }
  return t;
}

function rvRj45(parent, x, y, ctx, portName, opts) {
  opts = opts || {};
  const dark = !!opts.dark, lit = opts.lit !== false;
  const w = opts.w || 12, h = opts.h || 9.5;
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 0.9, fill: dark ? '#5A5955' : '#8E8C85',
    stroke: dark ? '#2C2B2A' : '#5C5B57', 'stroke-width': 0.45 }, g);
  el('rect', { x: x + 0.4, y: y + 0.4, width: w - 0.8, height: 0.7,
    fill: dark ? '#84837D' : '#BFBDB5', opacity: 0.65 }, g);
  const jw = w * 0.68, jx = x + (w - jw) / 2;
  el('path', { d: `M${jx},${y + 1.9} h${jw} v${h * 0.43} h-${jw * 0.3} v${h * 0.22} h-${jw * 0.39} v-${h * 0.22} h-${jw * 0.3} z`,
    fill: '#151413' }, g);
  el('rect', { x: x + w * 0.37, y: y + 2.1, width: w * 0.26, height: 1.6,
    fill: dark ? '#4A4945' : '#6B6A65' }, g);
  el('circle', { cx: x + 2.2, cy: y + h - 1.8, r: 0.85,
    fill: lit ? 'url(#rvLedGreen)' : '#1F1E1D', filter: lit ? 'url(#rvGlow)' : '' }, g);
  el('circle', { cx: x + w - 2.2, cy: y + h - 1.8, r: 0.85,
    fill: lit ? 'url(#rvLedAmber)' : '#1F1E1D', filter: lit ? 'url(#rvGlow)' : '' }, g);
  rvHit(g, x, y, w, h, ctx, portName);
  return w;
}

function rvSfp(parent, x, y, ctx, portName, opts) {
  opts = opts || {};
  const lit = !!opts.lit;
  const w = opts.w || 13, h = opts.h || 9.5;
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 0.8, fill: '#6B6A65', stroke: '#333230', 'stroke-width': 0.45 }, g);
  el('rect', { x: x + 0.4, y: y + 0.4, width: w - 0.8, height: 0.7, fill: '#96958F', opacity: 0.55 }, g);
  el('rect', { x: x + 1.3, y: y + 1.5, width: w - 2.6, height: h - 2.9, rx: 0.45, fill: '#151413' }, g);
  el('rect', { x: x + 2.4, y: y + 2.4, width: w - 4.8, height: h * 0.36, rx: 0.3, fill: '#2A2927' }, g);
  el('rect', { x: x + 2.2, y: y + h - 2.1, width: w - 4.4, height: 1.1, rx: 0.3, fill: '#7E7D77' }, g);
  if (lit) el('circle', { cx: x + w / 2, cy: y + h * 0.42, r: 1, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, g);
  rvHit(g, x, y, w, h, ctx, portName);
  return w;
}

function rvQsfp(parent, x, y, ctx, portName, opts) {
  opts = opts || {};
  const w = opts.w || 17, h = opts.h || 12;
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 0.9, fill: '#6B6A65', stroke: '#333230', 'stroke-width': 0.5 }, g);
  el('rect', { x: x + 0.4, y: y + 0.4, width: w - 0.8, height: 0.8, fill: '#96958F', opacity: 0.55 }, g);
  el('rect', { x: x + 1.6, y: y + 1.8, width: w - 3.2, height: h - 3.6, rx: 0.5, fill: '#151413' }, g);
  el('rect', { x: x + 2.8, y: y + 2.8, width: w - 5.6, height: 2.4, rx: 0.3, fill: '#2E2D2B' }, g);
  el('rect', { x: x + 2.8, y: y + 6, width: w - 5.6, height: 2.4, rx: 0.3, fill: '#2E2D2B' }, g);
  el('rect', { x: x + 3, y: y + h - 2.6, width: w - 6, height: 1.2, rx: 0.3, fill: '#7E7D77' }, g);
  rvHit(g, x, y, w, h, ctx, portName);
  return w;
}

function rvLc(parent, x, y, ctx, portName, opts) {
  opts = opts || {};
  const w = opts.w || 15, h = opts.h || 10;
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 0.8, fill: '#6B6A65', stroke: '#3E3D3A', 'stroke-width': 0.45 }, g);
  el('rect', { x: x + 1.3, y: y + 1.5, width: w - 2.6, height: h - 3.2, rx: 0.45, fill: '#141312' }, g);
  const aw = (w - 5.8) / 2;
  [x + 2.5, x + 2.5 + aw + 1.6].forEach(ax => {
    el('rect', { x: ax, y: y + 2.5, width: aw, height: h - 5.2, rx: 0.35,
      fill: '#2FD9AE', stroke: '#0B7358', 'stroke-width': 0.3 }, g);
    el('rect', { x: ax + aw * 0.22, y: y + 3.5, width: aw * 0.55, height: h - 7.2, fill: '#05392C' }, g);
  });
  rvHit(g, x, y, w, h, ctx, portName);
  return w;
}

function rvIec(parent, x, y, ctx, portName, opts) {
  opts = opts || {};
  const w = opts.w || 12, h = opts.h || 10;
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 0.9, fill: '#1E1D1C', stroke: '#0F0E0E', 'stroke-width': 0.45 }, g);
  el('rect', { x: x + w * 0.18, y: y + h * 0.26, width: w * 0.17, height: h * 0.44, fill: '#8A8880' }, g);
  el('rect', { x: x + w * 0.64, y: y + h * 0.26, width: w * 0.17, height: h * 0.44, fill: '#8A8880' }, g);
  el('rect', { x: x + w * 0.41, y: y + h * 0.16, width: w * 0.18, height: h * 0.3, fill: '#8A8880' }, g);
  rvHit(g, x, y, w, h, ctx, portName);
  return w;
}

function rvVga(parent, x, y, ctx, portName) {
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('path', { d: `M${x + 1.5},${y} h12 l1.5,2 v5 l-1.5,2 h-12 l-1.5,-2 v-5 z`,
    fill: '#2E4A8A', stroke: '#1C2E56', 'stroke-width': 0.5 }, g);
  for (let k = 0; k < 5; k++) {
    el('circle', { cx: x + 2.5 + k * 2.5, cy: y + 3, r: 0.55, fill: '#C8C6BE' }, g);
    el('circle', { cx: x + 2.5 + k * 2.5, cy: y + 6, r: 0.55, fill: '#C8C6BE' }, g);
  }
  rvHit(g, x - 1.5, y, 17, 9, ctx, portName);
  return 17;
}

function rvUsb(parent, x, y, ctx, portName) {
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: 10, height: 7, rx: 0.7, fill: '#4A4945', stroke: '#2E2D2B', 'stroke-width': 0.45 }, g);
  el('rect', { x: x + 1.5, y: y + 3.4, width: 7, height: 2.2, fill: '#B8B6AE' }, g);
  rvHit(g, x, y, 10, 7, ctx, portName);
  return 10;
}

function rvPsu(parent, x, y, w, h, ctx, portName, opts) {
  opts = opts || {};
  const dark = !!opts.dark;
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 1.1, fill: dark ? '#484744' : 'url(#rvPsu)',
    stroke: dark ? '#232221' : '#4A4945', 'stroke-width': 0.55 }, g);
  el('rect', { x: x + 0.5, y: y + 0.5, width: w - 1, height: 0.8,
    fill: dark ? '#6E6D68' : '#B4B2AB', opacity: 0.55 }, g);
  const fx = x + 2.5, fw = w * 0.4;
  el('rect', { x: fx, y: y + 2, width: fw, height: h - 4, rx: 0.7, fill: '#3A3937', stroke: '#1E1D1C', 'stroke-width': 0.4 }, g);
  const n = Math.floor(fw / 3);
  for (let k = 0; k < n; k++)
    el('rect', { x: fx + 1.4 + k * 3, y: y + 3, width: 1.4, height: h - 6, rx: 0.35, fill: '#1A1918' }, g);
  const ix = x + fw + 5.5;
  el('rect', { x: ix, y: y + h / 2 - 4.5, width: 12, height: 9, rx: 0.9, fill: '#141312', stroke: '#0A0909', 'stroke-width': 0.4 }, g);
  el('rect', { x: ix + 2, y: y + h / 2 - 2.3, width: 1.9, height: 3.6, fill: '#7E7D77' }, g);
  el('rect', { x: ix + 8.1, y: y + h / 2 - 2.3, width: 1.9, height: 3.6, fill: '#7E7D77' }, g);
  el('rect', { x: ix + 5, y: y + h / 2 - 4, width: 1.9, height: 2.7, fill: '#7E7D77' }, g);
  el('circle', { cx: ix + 17, cy: y + h / 2, r: 1.6, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, g);
  rvHit(g, x, y, w, h, ctx, portName);
  return w;
}

function rvFan(parent, cx, cy, r, ctx, portName) {
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('circle', { cx, cy, r, fill: '#3E3D3B', stroke: '#1E1D1C', 'stroke-width': 0.55 }, g);
  for (let k = 1; k <= 3; k++)
    el('circle', { cx, cy, r: r * k / 3.6, fill: 'none', stroke: '#1A1918', 'stroke-width': 0.45 }, g);
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    el('line', { x1: cx + Math.cos(a) * r * 0.2, y1: cy + Math.sin(a) * r * 0.2,
      x2: cx + Math.cos(a) * r * 0.92, y2: cy + Math.sin(a) * r * 0.92,
      stroke: '#1A1918', 'stroke-width': 0.45 }, g);
  }
  el('circle', { cx, cy, r: r * 0.2, fill: '#252423' }, g);
  if (portName) rvHit(g, cx - r, cy - r, r * 2, r * 2, ctx, portName);
}

function rvBay(parent, x, y, w, h, ctx, portName, opts) {
  opts = opts || {};
  const dark = !!opts.dark;
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 1.1,
    fill: dark ? 'url(#rvBayDark)' : 'url(#rvBayLight)',
    stroke: dark ? '#1E1D1C' : '#6C6B66', 'stroke-width': 0.5 }, g);
  el('rect', { x: x + 0.4, y: y + 0.4, width: w - 0.8, height: 0.8,
    fill: dark ? '#6E6D68' : '#E4E2DA', opacity: 0.6 }, g);
  const hw = Math.max(3, w * 0.13);
  el('rect', { x: x + 1.8, y: y + 1.8, width: hw, height: h - 3.6, rx: 0.9,
    fill: dark ? '#232221' : 'url(#rvHandle)', stroke: dark ? '#131211' : '#2E2D2B', 'stroke-width': 0.4 }, g);
  el('rect', { x: x + 2.6, y: y + 3, width: 1.1, height: h - 6,
    fill: dark ? '#5A5955' : '#8B8A85', opacity: 0.4 }, g);
  if (h > 20)
    el('rect', { x: x + 2.6, y: y + h / 2 - h * 0.12, width: hw - 1.6, height: h * 0.24, rx: 0.8, fill: '#2A2927' }, g);
  const dx = x + hw + 3, dw = w - hw - 5;
  el('rect', { x: dx, y: y + 2.2, width: dw, height: h - 4.4, rx: 0.7,
    fill: dark ? '#33322F' : '#A5A39B', stroke: dark ? '#1A1918' : '#75746F', 'stroke-width': 0.4 }, g);
  el('rect', { x: dx + 1, y: y + 3, width: dw - 2, height: 0.8,
    fill: dark ? '#5A5955' : '#C8C6BE', opacity: 0.7 }, g);
  const rows = Math.max(2, Math.floor((h - 8) / 4.2));
  for (let k = 0; k < rows; k++)
    el('rect', { x: dx + 1.6, y: y + 5.4 + k * 4.2, width: dw - 3.2, height: 1, rx: 0.3,
      fill: dark ? '#232221' : '#8E8C86', opacity: 0.45 }, g);
  el('circle', { cx: x + 1.8 + hw / 2, cy: y + 4, r: 1.3, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, g);
  if (h > 20)
    el('circle', { cx: x + 1.8 + hw / 2, cy: y + 8.5, r: 1.3, fill: '#242322' }, g);
  rvHit(g, x, y, w, h, ctx, portName);
}

function rvBayRow(parent, x, y, w, h, count, ctx, prefix, opts) {
  const gap = (opts && opts.gap) || 2;
  const bw = (w - gap * (count - 1)) / count;
  for (let i = 0; i < count; i++)
    rvBay(parent, x + i * (bw + gap), y, bw, h, ctx, prefix + (i + 1), opts);
  return bw;
}

function rvCard(parent, x, y, w, h, ctx, portName, opts) {
  opts = opts || {};
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 1, fill: opts.dark ? '#4A4946' : 'url(#rvCard)',
    stroke: opts.dark ? '#252423' : '#5A5955', 'stroke-width': 0.55 }, g);
  el('rect', { x: x + 0.5, y: y + 0.5, width: w - 1, height: 0.8,
    fill: opts.dark ? '#6E6D68' : '#C2C0B8', opacity: 0.62 }, g);
  el('rect', { x: x + 2, y: y + 2, width: 2.8, height: h - 4, rx: 0.5, fill: opts.dark ? '#2A2927' : '#75746F' }, g);
  if (portName) rvHit(g, x, y, 6, h, ctx, portName);
  return g;
}

function rvBlank(parent, x, y, w, h, opts) {
  opts = opts || {};
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 1, fill: opts.dark ? '#4A4946' : '#9A9891',
    stroke: opts.dark ? '#252423' : '#5F5E5A', 'stroke-width': 0.55 }, g);
  el('rect', { x: x + 0.5, y: y + 0.5, width: w - 1, height: 0.8,
    fill: opts.dark ? '#6E6D68' : '#C2C0B8', opacity: 0.62 }, g);
  const n = Math.floor((w - 6) / 4.5);
  for (let k = 0; k < n; k++)
    el('rect', { x: x + 3 + k * 4.5, y: y + 2.5, width: 2.6, height: h - 5, rx: 0.5,
      fill: opts.dark ? '#2A2927' : '#6E6D68' }, g);
  return g;
}

function rvCtrlPanel(parent, x, y, w, h, ctx, opts) {
  opts = opts || {};
  const g = el('g', { filter: 'url(#rvShadow)' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 1.5, fill: 'url(#rvPanel)', stroke: '#4C4B47', 'stroke-width': 0.6 }, g);
  const sw = w * 0.5, sh = Math.min(h * 0.32, 16);
  el('rect', { x: x + 4, y: y + 4, width: sw, height: sh, rx: 1, fill: 'url(#rvScreen)', stroke: '#141F19', 'stroke-width': 0.5 }, g);
  const lines = Math.max(2, Math.floor(sh / 3.6));
  for (let k = 0; k < lines; k++)
    el('rect', { x: x + 5.5, y: y + 5.8 + k * 3.5, width: sw * (0.9 - k * 0.16), height: 1.5,
      fill: '#5DCAA5', opacity: 0.5 - k * 0.06 }, g);
  const lx = x + sw + 10;
  el('circle', { cx: lx, cy: y + 7, r: 2.6, fill: '#3A3937', stroke: '#22211F', 'stroke-width': 0.5 }, g);
  el('circle', { cx: lx, cy: y + 7, r: 1.3, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, g);
  el('circle', { cx: lx + (h > 30 ? 0 : 7), cy: y + (h > 30 ? 15 : 7), r: 2.6, fill: '#3A3937', stroke: '#22211F', 'stroke-width': 0.5 }, g);
  el('circle', { cx: lx + (h > 30 ? 0 : 7), cy: y + (h > 30 ? 15 : 7), r: 1.3, fill: 'url(#rvLedAmber)', filter: 'url(#rvGlow)' }, g);
  const by = y + sh + 8;
  if (h > 30) {
    rvUsb(g, x + 4, by, ctx, 'Front USB 1');
    rvUsb(g, x + 15, by, ctx, 'Front USB 2');
    el('rect', { x: x + 26, y: by, width: 8, height: 7, rx: 0.7, fill: '#1E1D1C' }, g);
    el('rect', { x: x + 37, y: by + 1, width: 6, height: 5, rx: 2.5, fill: '#1E1D1C' }, g);
    el('rect', { x: x + 4, y: by + 10, width: w - 8, height: 5, rx: 0.7, fill: '#4A4945' }, g);
  } else {
    el('rect', { x: x + w - 19, y: y + h - 13, width: 7, height: 5.5, rx: 0.6, fill: '#2A2927' }, g);
    el('rect', { x: x + w - 10, y: y + h - 13, width: 6, height: 5.5, rx: 0.6, fill: '#1E1D1C' }, g);
    el('rect', { x: x + 4, y: y + h - 6, width: w - 8, height: 3.5, rx: 0.6, fill: '#4A4945' }, g);
  }
  rvHit(g, x, y, w, h, ctx, 'Control panel');
  return g;
}

// Per-instance server rear-port override (RACKVIEW_PORT_YAPILANDIRICI.md).
// Only used when a device has an explicit rear_config; every server stencil's default
// (unconfigured) rendering is untouched — this function is purely additive.
function drawServerRearPorts(g, ctx, x0, portY, config) {
  const LABEL_DY = 19;
  const GAP = 6;
  let cx = x0;

  if (config.fc_ports > 0) {
    const startX = cx;
    for (let i = 0; i < config.fc_ports; i++) {
      const w = rvLc(g, cx, portY, ctx, 'FC' + (i + 1));
      cx += w + 5;
    }
    rvLabel(g, startX, portY + LABEL_DY, `${config.fc_ports}× ${config.fc_speed || '16Gb'} FC`);
    cx += GAP;
  }

  if (config.nic_ports > 0) {
    const startX = cx;
    for (let i = 0; i < config.nic_ports; i++) {
      const w = rvSfp(g, cx, portY, ctx, 'NIC' + (i + 1), { lit: true });
      cx += w + 5;
    }
    rvLabel(g, startX, portY + LABEL_DY, `${config.nic_ports}× ${config.nic_speed || '25GbE'} NIC`);
    cx += GAP;
  }

  const lomN = config.lom === '4x1GbE' ? 4 : config.lom === '2x1GbE' ? 2 : 0;
  if (lomN > 0) {
    const startX = cx;
    for (let i = 0; i < lomN; i++) {
      const w = rvRj45(g, cx, portY, ctx, 'LOM' + (i + 1), { lit: i < 2 });
      cx += w + 3;
    }
    rvLabel(g, startX, portY + LABEL_DY, `${lomN}× 1GbE LOM`);
    cx += GAP;
  }

  if (config.idrac) {
    rvRj45(g, cx, portY, ctx, 'iDRAC', { lit: true });
    rvLabel(g, cx - 2, portY + LABEL_DY, 'iDRAC');
    cx += 20;
  }

  return cx;
}

if (typeof module !== 'undefined') module.exports = {
  el, RV_U, rvHit, rvChassis, rvLabel, rvRj45, rvSfp, rvQsfp, rvLc, rvIec,
  rvVga, rvUsb, rvPsu, rvFan, rvBay, rvBayRow, rvCard, rvBlank, rvCtrlPanel,
  drawServerRearPorts
};
