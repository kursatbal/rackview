const RV_STENCILS_HPE = {

  'hpe-rack-1u': {
    vendor: 'HPE', uHeight: 1, category: 'server',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1);
      const bays = ctx.bays || 10;
      const areaW = c.innerW - 54;
      rvBayRow(g, c.innerX + 2, y + 3, areaW, h - 6, bays, ctx, 'SFF Bay ', { gap: 2 });
      const px = x + w - 15 - 48;
      const p = el('g', { filter: 'url(#rvShadow)' }, g);
      el('rect', { x: px, y: y + 3, width: 46, height: h - 6, rx: 1.3, fill: 'url(#rvPanel)', stroke: '#4C4B47', 'stroke-width': 0.6 }, p);
      el('circle', { cx: px + 9, cy: y + 9, r: 3.4, fill: '#3A3937', stroke: '#22211F', 'stroke-width': 0.55 }, p);
      el('circle', { cx: px + 9, cy: y + 9, r: 1.8, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, p);
      for (let k = 0; k < 4; k++)
        el('circle', { cx: px + 19 + k * 6.5, cy: y + 9, r: 1.5,
          fill: k < 2 ? 'url(#rvLedGreen)' : '#242322', filter: k < 2 ? 'url(#rvGlow)' : '' }, p);
      el('rect', { x: px + 5, y: y + 15, width: 8, height: 6, rx: 0.7, fill: '#2A2927' }, p);
      el('rect', { x: px + 16, y: y + 15, width: 7, height: 6, rx: 0.7, fill: '#1E1D1C' }, p);
      rvHit(p, px, y + 3, 46, h - 6, ctx, 'Control panel');
    },
    rear(g, ctx) { RV_STENCILS_DELL['dell-rack-1u'].rear(g, ctx); }
  },

  'hpe-rack-2u': {
    vendor: 'HPE', uHeight: 2, category: 'server',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2);
      const bays = ctx.bays || 8;
      const type = ctx.bayType || 'sff';
      const areaW = c.innerW - 54;
      if (type === 'lff') {
        for (let r = 0; r < 2; r++)
          rvBayRow(g, c.innerX + 2, y + 4 + r * ((h - 8) / 2 + 1), areaW, (h - 10) / 2, bays / 2, ctx, 'LFF R' + (r + 1) + ' Bay ', { gap: 2 });
      } else {
        rvBayRow(g, c.innerX + 2, y + 4, areaW, h - 8, bays, ctx, 'SFF Bay ', { gap: 2 });
      }
      const px = x + w - 15 - 48;
      const p = el('g', { filter: 'url(#rvShadow)' }, g);
      el('rect', { x: px, y: y + 4, width: 46, height: h - 8, rx: 1.3, fill: 'url(#rvPanel)', stroke: '#4C4B47', 'stroke-width': 0.6 }, p);
      el('circle', { cx: px + 11, cy: y + 13, r: 4.2, fill: '#3A3937', stroke: '#22211F', 'stroke-width': 0.6 }, p);
      el('circle', { cx: px + 11, cy: y + 13, r: 2.2, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, p);
      for (let k = 0; k < 4; k++)
        el('circle', { cx: px + 24 + k * 6, cy: y + 13, r: 1.6,
          fill: k < 2 ? 'url(#rvLedGreen)' : '#242322', filter: k < 2 ? 'url(#rvGlow)' : '' }, p);
      rvUsb(p, px + 5, y + 24, ctx, 'Front USB 1');
      rvUsb(p, px + 17, y + 24, ctx, 'Front USB 2');
      el('rect', { x: px + 30, y: y + 24, width: 10, height: 7, rx: 0.7, fill: '#1E1D1C' }, p);
      el('rect', { x: px + 5, y: y + 35, width: 36, height: 10, rx: 0.8, fill: '#4A4945' }, p);
      rvHit(p, px, y + 4, 46, h - 8, ctx, 'Control panel');
    },
    rear(g, ctx) { RV_STENCILS_DELL['dell-rack-2u'].rear(g, ctx); }
  }
};

const RV_STENCILS_SWITCH = {

  'switch-1u-rj45': {
    uHeight: 1, category: 'switch',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const n = ctx.ports || 48;
      const up = ctx.uplinks || 4;
      const cols = Math.ceil(n / 2);
      const areaW = c.innerW - up * 24 - 30;
      const step = areaW / cols;
      for (let i = 0; i < n; i++) {
        const col = Math.floor(i / 2), row = i % 2;
        rvRj45(g, c.innerX + 2 + col * step, y + (row ? h / 2 + 1 : 3), ctx,
          (ctx.portPrefix || 'Gi1/0/') + (i + 1), { dark: true, lit: i < n * 0.75 });
      }
      let ux = c.innerX + 2 + cols * step + 8;
      for (let i = 0; i < up; i++) {
        rvSfp(g, ux, y + h / 2 - 5, ctx, (ctx.uplinkPrefix || 'Te1/1/') + (i + 1), { lit: i < 2 });
        ux += 24;
      }
      el('rect', { x: x + w - 22, y: y + 6, width: 10, height: h - 12, rx: 0.8, fill: '#2A2927' }, g);
      el('circle', { cx: x + w - 17, cy: y + 10, r: 1.3, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, g);
      el('circle', { cx: x + w - 17, cy: y + 15, r: 1.3, fill: 'url(#rvLedAmber)', filter: 'url(#rvGlow)' }, g);
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'switch-1u-sfp': {
    uHeight: 1, category: 'switch',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const n = ctx.ports || 48;
      const up = ctx.uplinks || 6;
      const cols = Math.ceil(n / 2);
      const areaW = c.innerW - Math.ceil(up / 2) * 20 - 44;
      const step = areaW / cols;
      for (let i = 0; i < n; i++) {
        const col = Math.floor(i / 2), row = i % 2;
        rvSfp(g, c.innerX + 2 + col * step, y + (row ? h / 2 + 1 : 3), ctx,
          (ctx.portPrefix || 'Eth1/') + (i + 1), { lit: i < n * 0.67 });
      }
      let ux = c.innerX + 2 + cols * step + 6;
      for (let i = 0; i < up; i++) {
        const col = Math.floor(i / 2), row = i % 2;
        rvQsfp(g, ux + col * 20, y + (row ? h / 2 + 0.5 : 2.5), ctx, (ctx.portPrefix || 'Eth1/') + (n + i + 1));
      }
      const mx = x + w - 32;
      el('rect', { x: mx - 12, y: y + 5, width: 9, height: h - 10, rx: 0.8, fill: '#2A2927' }, g);
      ['rvLedGreen', 'rvLedBlue', 'rvLedAmber'].forEach((c2, k) =>
        el('circle', { cx: mx - 7.5, cy: y + 9 + k * 5, r: 1.2, fill: `url(#${c2})`, filter: 'url(#rvGlow)' }, g));
      rvRj45(g, mx, y + 5, ctx, 'mgmt0', { dark: true, lit: true });
      el('rect', { x: mx, y: y + 17, width: 12, height: 7, rx: 0.7, fill: '#2A2927' }, g);
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'switch-1u-rear': {
    uHeight: 1, category: 'switch',
    front() {},
    rear(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const psuW = 150;
      rvPsu(g, c.innerX + 2, y + 4, psuW, h - 8, ctx, 'PSU 1', { dark: true });
      rvPsu(g, c.innerX + 8 + psuW, y + 4, psuW, h - 8, ctx, 'PSU 2', { dark: true });
      let fx = c.innerX + 20 + psuW * 2;
      for (let k = 0; k < (ctx.fans || 4); k++) rvFan(g, fx + k * 46, y + h / 2, 17, ctx, 'Fan ' + (k + 1));
      const conx = fx + (ctx.fans || 4) * 46 + 10;
      rvRj45(g, conx, y + 9, ctx, 'Console', { dark: true, lit: false });
      el('rect', { x: conx + 18, y: y + 10, width: 11, height: 8, rx: 0.7, fill: '#2A2927' }, g);
      rvLabel(g, conx, y + h - 3, 'CONSOLE  USB', true);
      el('rect', { x: x + w - 100, y: y + 6, width: 82, height: h - 12, rx: 1, fill: '#3A3937', stroke: '#232221', 'stroke-width': 0.5 }, g);
      rvLabel(g, x + w - 96, y + h / 2 + 2, 'SERIAL / MODEL', true);
    }
  }
};

const RV_STENCILS_STORAGE = {

  'pure-flasharray': {
    vendor: 'Pure Storage', uHeight: 3, category: 'storage',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 3, { dark: true });
      const bw = 60;
      el('rect', { x: c.innerX, y: y + 3, width: bw, height: h - 6, rx: 1.5,
        fill: 'url(#rvPureOrange)', stroke: '#A8380A', 'stroke-width': 0.7, filter: 'url(#rvShadow)' }, g);
      el('rect', { x: c.innerX + 1, y: y + 4, width: bw - 2, height: 1.4, fill: '#FFB380', opacity: 0.6 }, g);
      el('circle', { cx: c.innerX + bw / 2, cy: y + h * 0.52, r: 2.6, fill: '#FFF', opacity: 0.9, filter: 'url(#rvGlow)' }, g);
      rvHit(g, c.innerX, y + 3, bw, h - 6, ctx, 'Bezel');
      const n = ctx.bays || 28, rows = 2, per = n / rows;
      const areaX = c.innerX + bw + 8, areaW = c.innerW - bw - 10;
      for (let r = 0; r < rows; r++)
        rvBayRow(g, areaX, y + 5 + r * ((h - 10) / rows + 3), areaW, (h - 16) / rows, per, ctx,
          'DFM R' + (r + 1) + ' ', { gap: 3, dark: true });
    },
    rear(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 3, { dark: true });
      const half = (h - 10) / 2;
      for (let ci = 0; ci < 2; ci++) {
        const cy = y + 4 + ci * (half + 3);
        const nm = 'CT' + ci;
        el('rect', { x: c.innerX, y: cy, width: c.innerW, height: half, rx: 1.2,
          fill: '#3A3937', stroke: '#1E1D1C', 'stroke-width': 0.6, filter: 'url(#rvShadow)' }, g);
        rvLabel(g, c.innerX + 5, cy + 11, nm, true);
        rvPsu(g, c.innerX + 4, cy + half - 22, 96, 20, ctx, nm + ' PSU', { dark: true });
        let px = c.innerX + 112;
        for (let k = 0; k < 4; k++) { rvLc(g, px, cy + 7, ctx, nm + ' FC' + k); px += 20; }
        rvLabel(g, c.innerX + 112, cy + 24, 'FC 32Gb', true);
        px = c.innerX + 204;
        for (let k = 0; k < 4; k++) { rvSfp(g, px, cy + 7, ctx, nm + ' ETH' + k, { lit: k < 2 }); px += 17; }
        rvLabel(g, c.innerX + 204, cy + 24, 'ETH 25G', true);
        rvRj45(g, c.innerX + 282, cy + 7, ctx, nm + ' mgmt', { dark: true, lit: true });
        rvRj45(g, c.innerX + 297, cy + 7, ctx, nm + ' repl', { dark: true, lit: false });
        rvLabel(g, c.innerX + 282, cy + 24, 'MGMT REPL', true);
        for (let k = 0; k < 3; k++) rvFan(g, c.innerX + 400 + k * 40, cy + half / 2, 16, ctx, nm + ' Fan ' + (k + 1));
        rvBlank(g, c.innerX + 528, cy + 6, 126, half - 12, { dark: true });
      }
    }
  },

  'dell-me5-2u': {
    vendor: 'Dell', uHeight: 2, category: 'storage',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2);
      const n = ctx.bays || 24;
      if (ctx.bayType === 'lff') {
        for (let r = 0; r < 2; r++)
          rvBayRow(g, c.innerX, y + 4 + r * ((h - 8) / 2 + 1), c.innerW, (h - 10) / 2, n / 2, ctx, 'LFF R' + (r + 1) + ' Bay ', { gap: 2.5 });
      } else {
        rvBayRow(g, c.innerX, y + 4, c.innerW, h - 8, n, ctx, 'SFF Bay ', { gap: 2 });
      }
    },
    rear(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2);
      const half = (h - 10) / 2;
      for (let ci = 0; ci < 2; ci++) {
        const cy = y + 4 + ci * (half + 2);
        const nm = 'Ctrl' + (ci ? 'B' : 'A');
        el('rect', { x: c.innerX, y: cy, width: c.innerW, height: half, rx: 1.1,
          fill: '#9A9891', stroke: '#5F5E5A', 'stroke-width': 0.55, filter: 'url(#rvShadow)' }, g);
        el('rect', { x: c.innerX + 0.5, y: cy + 0.5, width: c.innerW - 1, height: 0.8, fill: '#C2C0B8', opacity: 0.6 }, g);
        const labelText = 'Controller ' + (ci ? 'B' : 'A');
        const labelW = labelText.length * 4.3 + 6;
        const labelX = c.innerX + c.innerW - labelW - 6;
        el('rect', { x: labelX, y: cy + 3, width: labelW, height: 9, rx: 1.5,
          fill: '#2C2B2A', opacity: 0.85 }, g);
        const t = el('text', { x: labelX + labelW / 2, y: cy + 9.5, 'font-size': 6, fill: '#F1EFE8',
          'font-family': 'monospace', 'font-weight': '600', 'text-anchor': 'middle' }, g);
        t.textContent = labelText;
        let px = c.innerX + 42;
        for (let k = 0; k < 4; k++) { rvLc(g, px, cy + 10, ctx, nm + ' P' + k); px += 20; }
        rvLabel(g, c.innerX + 42, cy + 24, '16Gb FC', false, ctx, nm + '-fc-label');
        rvRj45(g, c.innerX + 130, cy + 10, ctx, nm + ' mgmt', { lit: true });
        rvLabel(g, c.innerX + 128, cy + 24, 'MGMT', false, ctx, nm + '-mgmt-label');
        for (let k = 0; k < 2; k++)
          el('rect', { x: c.innerX + 154 + k * 20, y: cy + 9, width: 17, height: 12, rx: 0.8,
            fill: '#5F5E5A', stroke: '#3A3937', 'stroke-width': 0.5 }, g);
        rvLabel(g, c.innerX + 154, cy + 24, 'SAS exp', false, ctx, nm + '-sas-label');
        rvPsu(g, c.innerX + 222, cy + 2, 120, half - 4, ctx, 'PSU ' + (ci + 1));
        for (let k = 0; k < 2; k++) rvFan(g, c.innerX + 364 + k * 32, cy + half / 2, 13, ctx, nm + ' Fan ' + (k + 1));
        rvBlank(g, c.innerX + 412, cy + 4, c.innerW - 416, half - 8);
      }
    }
  }
};

const RV_STENCILS_INFRA = {

  'pdu-1u-horizontal': {
    vendor: 'APC', uHeight: 1, category: 'pdu',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const n = ctx.outlets || 20;
      const step = (c.innerW - 230) / n;
      for (let i = 0; i < n; i++) rvIec(g, c.innerX + 2 + i * step, y + 10, ctx, 'Outlet ' + (i + 1));
      const dx = c.innerX + 2 + n * step + 6;
      el('rect', { x: dx, y: y + 6, width: 44, height: h - 12, rx: 1, fill: '#1A2E24', stroke: '#0E1512', 'stroke-width': 0.5 }, g);
      el('rect', { x: dx + 3, y: y + 9, width: 38, height: 5, fill: '#5DCAA5', opacity: 0.5 }, g);
      el('rect', { x: dx + 3, y: y + 16, width: 24, height: 4, fill: '#5DCAA5', opacity: 0.35 }, g);
      rvHit(g, dx, y + 6, 44, h - 12, ctx, 'Display');
      rvRj45(g, dx + 52, y + 10, ctx, 'PDU mgmt', { dark: true, lit: true });
      el('rect', { x: dx + 68, y: y + 11, width: 11, height: 8, rx: 0.7, fill: '#2A2927' }, g);
      const bx = dx + 90;
      el('rect', { x: bx, y: y + 5, width: 52, height: h - 10, rx: 1.5, fill: '#3A3937', stroke: '#232221', 'stroke-width': 0.5 }, g);
      el('rect', { x: bx + 6, y: y + 9, width: 16, height: 12, rx: 1, fill: '#C4430C' }, g);
      el('rect', { x: bx + 28, y: y + 9, width: 16, height: 12, rx: 1, fill: '#C4430C' }, g);
      rvHit(g, bx, y + 5, 52, h - 10, ctx, 'Breaker');
      el('rect', { x: x + w - 34, y: y + 8, width: 20, height: h - 16, rx: 1, fill: '#2A2927' }, g);
    },
    rear(g, ctx) { rvChassis(g, ctx.x, ctx.y, ctx.w, 1, { dark: true }); }
  },

  'patch-panel-lc': {
    uHeight: 1, category: 'patch-panel',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1);
      const n = ctx.ports || 24;
      const step = (c.innerW - 26) / n;
      for (let i = 0; i < n; i++) rvLc(g, c.innerX + 2 + i * step, y + 10, ctx, 'LC ' + (i + 1));
      el('rect', { x: x + w - 34, y: y + 6, width: 18, height: h - 12, rx: 1, fill: '#B4B2A9', stroke: '#75746F', 'stroke-width': 0.45 }, g);
      rvLabel(g, x + w - 32, y + h / 2 + 2, 'PP');
    },
    rear(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1);
      const n = ctx.ports || 24;
      const step = (c.innerW - 26) / n;
      for (let i = 0; i < n; i++) rvLc(g, c.innerX + 2 + i * step, y + 10, ctx, 'LC ' + (i + 1) + ' rear');
    }
  },

  'patch-panel-cat': {
    uHeight: 1, category: 'patch-panel',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1);
      const n = ctx.ports || 24;
      const step = (c.innerW - 26) / n;
      for (let i = 0; i < n; i++) rvRj45(g, c.innerX + 2 + i * step, y + 10, ctx, 'CAT ' + (i + 1), { lit: false });
      el('rect', { x: x + w - 34, y: y + 6, width: 18, height: h - 12, rx: 1, fill: '#B4B2A9', stroke: '#75746F', 'stroke-width': 0.45 }, g);
      rvLabel(g, x + w - 32, y + h / 2 + 2, 'PP');
    },
    rear(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1);
      const n = ctx.ports || 24;
      const step = (c.innerW - 26) / n;
      for (let i = 0; i < n; i++) rvRj45(g, c.innerX + 2 + i * step, y + 10, ctx, 'CAT ' + (i + 1) + ' rear', { lit: false });
    }
  },

  'brush-panel': {
    uHeight: 1, category: 'passthrough',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, ctx.uHeight || 1);
      const ix = c.innerX + 3, iw = c.innerW - 6, iy = y + 4, ih = h - 8;
      const mid = iy + ih / 2;

      el('rect', { x: ix, y: iy, width: iw, height: ih, rx: 1.2,
        fill: '#2A2927', stroke: '#1A1918', 'stroke-width': 0.6 }, g);
      el('rect', { x: ix + 0.6, y: iy + 0.6, width: iw - 1.2, height: 0.7,
        fill: '#5A5955', opacity: 0.5 }, g);

      const passX = ctx.passThroughX || [];
      const n = Math.floor(iw / 2.6);
      for (let k = 0; k < n; k++) {
        const bx = ix + 2 + k * ((iw - 4) / (n - 1));
        let push = 0;
        passX.forEach(cxp => {
          const d = Math.abs(bx - cxp);
          if (d < 7) push += (7 - d) * 0.55;
        });
        el('line', { x1: bx, y1: iy + 2.2, x2: bx, y2: mid - 0.6 - push,
          stroke: '#6E6D68', 'stroke-width': 0.62, opacity: 0.92, 'stroke-linecap': 'round' }, g);
        el('line', { x1: bx, y1: mid + 0.6 + push, x2: bx, y2: iy + ih - 2.2,
          stroke: '#6E6D68', 'stroke-width': 0.62, opacity: 0.92, 'stroke-linecap': 'round' }, g);
      }

      const t = el('text', { x: x + w - 18, y: y + h - 3.2, 'font-size': 4.2,
        'font-family': 'monospace', fill: '#E4E2DA', 'text-anchor': 'end', opacity: 0.75 }, g);
      t.textContent = 'BRUSH PANEL ' + (ctx.uHeight || 1) + 'U';

      if (ctx.registerPort) ctx.registerPort('passthrough', x + w / 2, mid);
      return mid;
    },
    rear(g, ctx) { RV_STENCILS_INFRA['brush-panel'].front(g, ctx); }
  },

  'cable-manager': {
    uHeight: 1, category: 'passthrough',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, ctx.uHeight || 1);
      const rings = ctx.rings || 7;
      const step = c.innerW / rings;
      const mid = y + h / 2;
      for (let k = 0; k < rings; k++) {
        const dx = c.innerX + step * 0.35 + k * step;
        el('path', { d: `M${dx},${y + 4} L${dx},${y + h - 4}`
          + ` M${dx},${y + 4} Q${dx + 11},${y + 4} ${dx + 11},${mid}`
          + ` Q${dx + 11},${y + h - 4} ${dx},${y + h - 4}`,
          stroke: '#6E6D68', fill: 'none', 'stroke-width': 1.7, 'stroke-linecap': 'round' }, g);
      }
      const t = el('text', { x: x + w - 18, y: y + h - 3.5, 'font-size': 4.2,
        'font-family': 'monospace', fill: '#75746F', 'text-anchor': 'end' }, g);
      t.textContent = 'CABLE MGR ' + (ctx.uHeight || 1) + 'U';
      if (ctx.registerPort) ctx.registerPort('passthrough', x + w / 2, mid);
      return mid;
    },
    rear(g, ctx) { RV_STENCILS_INFRA['cable-manager'].front(g, ctx); }
  },

  'blank-filler': {
    uHeight: 1, category: 'panel',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, ctx.uHeight || 1);
      rvBlank(g, c.innerX, y + 3, c.innerW, h - 6);
    },
    rear(g, ctx) { this.front(g, ctx); }
  }
};

const RV_STENCILS = Object.assign({}, RV_STENCILS_DELL, RV_STENCILS_HPE,
  RV_STENCILS_SWITCH, RV_STENCILS_STORAGE, RV_STENCILS_INFRA);

if (typeof module !== 'undefined') module.exports = {
  RV_STENCILS, RV_STENCILS_HPE, RV_STENCILS_SWITCH, RV_STENCILS_STORAGE, RV_STENCILS_INFRA
};

const RV_STENCILS_NETWORK = {

  'firewall-1u': {
    uHeight: 1, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      el('rect', { x: x + 16, y: y + 2, width: 3, height: h - 4, rx: 1, fill: '#D64545' }, g);
      let px = c.innerX + 4;
      const cu = ctx.copperPorts || 16;
      for (let i = 0; i < cu; i++) { rvRj45(g, px, y + 3, ctx, 'port' + (i + 1), { dark: true, lit: i < cu * 0.4 }); px += 14; }
      px = c.innerX + 4;
      const sf = ctx.sfpPorts || 8;
      for (let i = 0; i < sf; i++) { rvSfp(g, px, y + 15, ctx, 'port' + (cu + i + 1), { lit: i < sf / 2 }); px += 15; }
      const mx = x + w - 130;
      el('rect', { x: mx, y: y + 6, width: 52, height: 17, rx: 1, fill: '#1A2E24', stroke: '#0E1512', 'stroke-width': 0.5 }, g);
      el('rect', { x: mx + 2, y: y + 8, width: 48, height: 2.4, fill: '#5DCAA5', opacity: 0.5 }, g);
      rvHit(g, mx, y + 6, 52, 17, ctx, 'LCD panel');
      rvRj45(g, mx + 60, y + 10, ctx, 'MGMT', { dark: true, lit: true });
      rvUsb(g, mx + 76, y + 11, ctx, 'Console USB');
      [0, 1, 2].forEach(k => el('circle', { cx: mx + 96 + k * 9, cy: y + 14.5, r: 1.7,
        fill: k === 2 ? '#1F1E1D' : (k ? 'url(#rvLedAmber)' : 'url(#rvLedGreen)'),
        filter: k === 2 ? '' : 'url(#rvGlow)' }, g));
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'firewall-2u': {
    uHeight: 2, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2, { dark: true });
      el('rect', { x: x + 16, y: y + 2, width: 3, height: h - 4, rx: 1, fill: '#D64545' }, g);
      const cu = ctx.copperPorts || 24;
      for (let r = 0; r < 2; r++) for (let i = 0; i < cu / 2; i++)
        rvRj45(g, c.innerX + 4 + i * 14, y + (r ? 17 : 4), ctx, 'port' + (r * cu / 2 + i + 1), { dark: true, lit: i < 5 });
      const sf = ctx.sfpPorts || 16;
      for (let r = 0; r < 2; r++) for (let i = 0; i < sf / 2; i++)
        rvSfp(g, c.innerX + 180 + i * 15, y + (r ? 16 : 3), ctx, 'port' + (cu + r * sf / 2 + i + 1), { lit: i < 4 });
      const qs = ctx.qsfpPorts || 8;
      for (let r = 0; r < 2; r++) for (let i = 0; i < qs / 2; i++)
        rvQsfp(g, c.innerX + 310 + i * 20, y + (r ? 32 : 4), ctx, 'port' + (cu + sf + r * qs / 2 + i + 1));
      const mx = x + w - 250;
      el('rect', { x: mx, y: y + 12, width: 60, height: 22, rx: 1, fill: '#1A2E24', stroke: '#0E1512', 'stroke-width': 0.5 }, g);
      el('rect', { x: mx + 3, y: y + 15, width: 54, height: 3, fill: '#5DCAA5', opacity: 0.5 }, g);
      rvHit(g, mx, y + 12, 60, 22, ctx, 'LCD panel');
      rvRj45(g, mx + 128, y + 18, ctx, 'MGMT', { dark: true, lit: true });
      for (let i = 0; i < 2; i++)
        rvPsu(g, x + w - 116 + i * 42, y + 6, 38, h - 12, ctx, 'PSU ' + (i + 1), { dark: true });
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'router-1u': {
    uHeight: 1, category: 'router',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      el('rect', { x: x + 16, y: y + 2, width: 3, height: h - 4, rx: 1, fill: '#3D9BE8' }, g);
      let px = c.innerX + 4;
      const gp = ctx.gigPorts || 8;
      for (let i = 0; i < gp; i++) { rvSfp(g, px, y + 10, ctx, 'GigabitEthernet0/0/' + i, { lit: i < gp / 2 }); px += 15; }
      const tp = ctx.tenGigPorts || 4;
      for (let i = 0; i < tp; i++) { rvSfp(g, px + 6, y + 10, ctx, 'TenGigabitEthernet0/0/' + i, { lit: i < 2 }); px += 15; }
      const nims = ctx.nimSlots || 2;
      for (let k = 0; k < nims; k++) {
        const nx = c.innerX + 190 + k * 126;
        el('rect', { x: nx, y: y + 4, width: 120, height: 21, rx: 1, fill: '#484744', stroke: '#232221', 'stroke-width': 0.5 }, g);
        rvLabel(g, nx + 4, y + 23, 'NIM ' + k, true);
        rvHit(g, nx, y + 4, 8, 21, ctx, 'NIM slot ' + k);
        if (k === 0) for (let i = 0; i < 4; i++)
          rvRj45(g, nx + 8 + i * 14, y + 9, ctx, 'NIM' + k + ' port' + i, { dark: true, lit: false });
      }
      rvRj45(g, x + w - 180, y + 10, ctx, 'MGMT', { dark: true, lit: true });
      rvRj45(g, x + w - 164, y + 10, ctx, 'CON', { dark: true, lit: false });
      for (let i = 0; i < 2; i++)
        rvPsu(g, x + w - 116 + i * 50, y + 5, 46, h - 10, ctx, 'PSU ' + (i + 1), { dark: true });
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'router-2u': {
    uHeight: 2, category: 'router',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2, { dark: true });
      el('rect', { x: x + 16, y: y + 2, width: 3, height: h - 4, rx: 1, fill: '#3D9BE8' }, g);
      for (let i = 0; i < 4; i++) rvRj45(g, c.innerX + 4 + i * 14, y + 6, ctx, 'GigabitEthernet0/0/' + i, { dark: true, lit: i < 2 });
      for (let i = 0; i < 4; i++) rvSfp(g, c.innerX + 4 + i * 15, y + 32, ctx, 'TenGigabitEthernet0/0/' + i, { lit: i < 2 });
      const nims = ctx.nimSlots || 6;
      for (let r = 0; r < 2; r++) for (let cc = 0; cc < nims / 2; cc++) {
        const nx = c.innerX + 70 + cc * 106, ny = y + 4 + r * 26;
        el('rect', { x: nx, y: ny, width: 102, height: 22, rx: 1, fill: '#484744', stroke: '#232221', 'stroke-width': 0.6 }, g);
        rvLabel(g, nx + 9, ny + 20, 'NIM ' + (r * nims / 2 + cc), true);
        rvHit(g, nx, ny, 8, 22, ctx, 'NIM slot ' + (r * nims / 2 + cc));
        if (r === 0) for (let i = 0; i < 4; i++)
          rvRj45(g, nx + 11 + i * 14, ny + 5, ctx, 'NIM' + cc + ' port' + i, { dark: true, lit: false });
      }
      const sx = c.innerX + 392;
      el('rect', { x: sx, y: y + 4, width: 96, height: h - 8, rx: 1, fill: '#484744', stroke: '#232221', 'stroke-width': 0.6 }, g);
      rvLabel(g, sx + 4, y + h - 4, 'SM-X slot', true);
      rvHit(g, sx, y + 4, 96, h - 8, ctx, 'SM-X service module slot');
      rvRj45(g, x + w - 180, y + 32, ctx, 'MGMT', { dark: true, lit: true });
      rvRj45(g, x + w - 164, y + 32, ctx, 'CON', { dark: true, lit: false });
      for (let i = 0; i < 2; i++)
        rvPsu(g, x + w - 120 + i * 54, y + 6, 50, h - 12, ctx, 'PSU ' + (i + 1), { dark: true });
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'spine-switch': {
    uHeight: 2, category: 'switch',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, ctx.uHeight || 2, { dark: true });
      el('rect', { x: x + 16, y: y + 2, width: 3, height: h - 4, rx: 1, fill: '#534AB7' }, g);
      const n = ctx.ports || 64;
      const oneRow = h < 40;
      const rows = oneRow ? 1 : 2;
      const per = n / (2 * rows);
      for (let blk = 0; blk < 2; blk++) for (let r = 0; r < rows; r++) for (let i = 0; i < per; i++)
        rvQsfp(g, c.innerX + 4 + blk * 324 + i * 20, y + (oneRow ? (h - 12) / 2 : (r ? 32 : 4)), ctx,
          (ctx.portPrefix || 'Eth1/') + (blk * per * rows + r * per + i + 1));
      el('rect', { x: x + w - 28, y: y + 6, width: 9, height: h - 12, rx: 0.8, fill: '#2A2927' }, g);
      ['rvLedGreen', 'rvLedBlue', 'rvLedAmber'].forEach((cc, k) =>
        el('circle', { cx: x + w - 23.5, cy: y + 12 + k * 8, r: 1.3, fill: `url(#${cc})`, filter: 'url(#rvGlow)' }, g));
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'modular-chassis': {
    uHeight: 7, category: 'switch',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, ctx.uHeight || 7, { dark: true });
      el('rect', { x: x + 16, y: y + 2, width: 3, height: h - 4, rx: 1, fill: '#534AB7' }, g);
      const sups = ctx.supervisors || 2;
      const slots = ctx.lineCardSlots || 4;
      const cards = ctx.cards || [];
      const supH = 26, lcH = (h - 8 - sups * (supH + 2)) / slots - 2;
      let cy = y + 4;

      for (let k = 0; k < sups; k++) {
        el('rect', { x: c.innerX, y: cy, width: c.innerW, height: supH, rx: 1,
          fill: '#434240', stroke: '#252423', 'stroke-width': 0.6 }, g);
        el('rect', { x: c.innerX + 3, y: cy + 2, width: 4, height: supH - 4, rx: 0.7, fill: '#2A2927' }, g);
        el('circle', { cx: c.innerX + 5, cy: cy + 5, r: 1.3, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, g);
        rvHit(g, c.innerX, cy, 10, supH, ctx, 'Supervisor ' + String.fromCharCode(65 + k) + (k ? ' — standby' : ' — active'));
        el('rect', { x: c.innerX + 14, y: cy + 4, width: 54, height: 17, rx: 1, fill: '#1A2E24', stroke: '#0E1512', 'stroke-width': 0.5 }, g);
        el('rect', { x: c.innerX + 16, y: cy + 6, width: 50, height: 2.4, fill: '#5DCAA5', opacity: 0.5 }, g);
        rvRj45(g, c.innerX + 74, cy + 6, ctx, 'SUP' + k + ' MGMT', { dark: true, lit: k === 0 });
        rvRj45(g, c.innerX + 90, cy + 6, ctx, 'SUP' + k + ' CON', { dark: true, lit: false });
        for (let i = 0; i < 2; i++) rvSfp(g, c.innerX + 130 + i * 15, cy + 6, ctx, 'SUP' + k + ' SFP' + i, { lit: false });
        rvLabel(g, x + w - 22, cy + supH - 3, 'SUPERVISOR ' + String.fromCharCode(65 + k), true);
        cy += supH + 2;
      }

      for (let k = 0; k < slots; k++) {
        const card = cards[k] || null;
        const empty = !card;
        el('rect', { x: c.innerX, y: cy, width: c.innerW, height: lcH, rx: 1,
          fill: empty ? '#3A3937' : '#434240', stroke: '#252423', 'stroke-width': 0.6 }, g);
        el('rect', { x: c.innerX + 3, y: cy + 2, width: 4, height: lcH - 4, rx: 0.7, fill: '#2A2927' }, g);
        el('circle', { cx: c.innerX + 5, cy: cy + 5, r: 1.3,
          fill: empty ? '#1F1E1D' : 'url(#rvLedGreen)', filter: empty ? '' : 'url(#rvGlow)' }, g);
        rvHit(g, c.innerX, cy, 10, lcH, ctx, 'Line card slot ' + (k + 1) + (empty ? ' — empty' : ' — ' + card.model));
        if (empty) {
          for (let i = 0; i < 28; i++)
            el('rect', { x: c.innerX + 18 + i * 22, y: cy + 6, width: 14, height: lcH - 12, rx: 0.8, fill: '#2A2927', opacity: 0.5 }, g);
          rvLabel(g, x + w - 22, cy + lcH - 3, 'SLOT ' + (k + 1) + ' EMPTY', true);
        } else {
          const per = card.ports / 2;
          const isQ = (card.type || 'qsfp') === 'qsfp';
          for (let r = 0; r < 2; r++) for (let i = 0; i < per; i++) {
            const px = c.innerX + 14 + i * ((c.innerW - 40) / per), py = cy + 3 + r * (lcH / 2 - 1);
            const nm = 'LC' + (k + 1) + ' Eth1/' + (r * per + i + 1);
            if (isQ) rvQsfp(g, px, py, ctx, nm); else rvSfp(g, px, py, ctx, nm, { lit: i < 6 });
          }
          rvLabel(g, x + w - 22, cy + lcH - 3, 'LINE CARD ' + (k + 1), true);
        }
        cy += lcH + 2;
      }
    },
    rear(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, ctx.uHeight || 7, { dark: true });
      const fm = ctx.fabricModules || 6;
      const fw = (c.innerW - 40) / fm;
      for (let k = 0; k < fm; k++) {
        const fx = c.innerX + 4 + k * (fw + 6);
        el('rect', { x: fx, y: y + 4, width: fw, height: h * 0.62, rx: 1, fill: '#434240', stroke: '#252423', 'stroke-width': 0.6 }, g);
        for (let i = 0; i < 6; i++)
          el('rect', { x: fx + 4, y: y + 10 + i * (h * 0.62 / 7), width: fw - 8, height: h * 0.055, rx: 0.5, fill: '#2A2927' }, g);
        rvHit(g, fx, y + 4, fw, h * 0.62, ctx, 'Fabric module ' + (k + 1));
      }
      const psuY = y + h * 0.66;
      for (let k = 0; k < (ctx.psuCount || 4); k++)
        rvPsu(g, c.innerX + 4 + k * ((c.innerW - 20) / (ctx.psuCount || 4)), psuY,
          (c.innerW - 20) / (ctx.psuCount || 4) - 6, h * 0.28, ctx, 'PSU ' + (k + 1), { dark: true });
    }
  }
};

Object.assign(RV_STENCILS, RV_STENCILS_NETWORK);
