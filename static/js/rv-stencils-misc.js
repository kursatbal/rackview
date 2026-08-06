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

  // Brocade 300: unlike most 1U switches, everything (FC ports, console/mgmt/USB, and the power
  // inlet) lives on the single port-side panel — the non-port side only has fans, no PSU. Modeled
  // from the vendor product guide's own port-side photo rather than the shared switch-1u-sfp split.
  'brocade-300': {
    uHeight: 1, category: 'switch',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      let mx = c.innerX + 4;
      el('circle', { cx: mx, cy: y + 4, r: 0.9, fill: 'url(#rvLedAmber)', filter: 'url(#rvGlow)' }, g);
      el('circle', { cx: mx, cy: y + 9, r: 0.9, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, g);
      mx += 5;
      mx += rvRj45(g, mx, y + 3, ctx, 'Console', { dark: true, lit: false }) + 3;
      mx += rvRj45(g, mx, y + 3, ctx, 'mgmt0', { dark: true, lit: true }) + 3;
      mx += rvUsb(g, mx, y + 4, ctx, 'USB') + 8;

      const groups = 3, perGroup = 8, cols = 4;
      const portsW = c.innerX + c.innerW - 26 - mx;
      const step = portsW / (groups * cols);
      let portNum = 1;
      for (let gi = 0; gi < groups; gi++) {
        for (let i = 0; i < perGroup; i++) {
          const col = Math.floor(i / 2), row = i % 2;
          rvSfp(g, mx + gi * (cols * step + 6) + col * step, y + (row ? h / 2 + 1 : 3), ctx,
            (ctx.portPrefix || 'FC ') + portNum, { lit: portNum <= 8 });
          portNum++;
        }
      }
      rvIec(g, x + w - 20, y + h / 2 - 5, ctx, 'Power');
    },
    rear(g, ctx) {
      const { x, y, w, h } = ctx;
      rvChassis(g, x, y, w, 1, { dark: true });
      const n = 3, gap = 40;
      const startX = x + w / 2 - ((n - 1) * gap) / 2;
      for (let k = 0; k < n; k++) rvFan(g, startX + k * gap, y + h / 2, 15, ctx, 'Fan ' + (k + 1));
    }
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
      const fanCount = ctx.fans != null ? ctx.fans : 4;
      let fx = c.innerX + 20 + psuW * 2;
      for (let k = 0; k < fanCount; k++) rvFan(g, fx + k * 46, y + h / 2, 17, ctx, 'Fan ' + (k + 1));
      const conx = fx + fanCount * 46 + 10;
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

// FortiGate-only port artwork — deliberately separate from the shared rvRj45/rvSfp/rvQsfp
// primitives (used by 50+ other stencils) so tuning these for the FortiGate family can never
// shift how any other vendor's device renders: RACKVIEW_FORTIGATE.md.
//
// Copper RJ45 (gold pin + dark jack) and SFP/fiber (blue accent) get a clearly different tone at
// a glance; QSFP is the same fiber tone but visibly larger. `s` uniformly scales box + pitch
// together so a model with unusually many ports never overlaps its own neighbors or the MGMT/PSU
// block — see fortiRowLayout below.
function rvFortiRj45(g, x, y, ctx, portName, opts) {
  opts = opts || {};
  const s = opts.s || 1;
  const w = 12 * s, h = 9.5 * s;
  el('rect', { x, y, width: w, height: h, rx: 1, fill: '#3A3A38', stroke: '#1A1A18', 'stroke-width': 0.5 }, g);
  el('rect', { x: x + 1.5 * s, y: y + 1.5 * s, width: w - 3 * s, height: 1.6 * s, fill: '#D4A843' }, g);
  el('rect', { x: x + 2.3 * s, y: y + 5 * s, width: w - 4.6 * s, height: 3.2 * s, fill: '#141312' }, g);
  if (opts.lit) el('circle', { cx: x + w - 1.6 * s, cy: y + 1.6 * s, r: 0.9 * s, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, g);
  rvHit(g, x, y, w, h, ctx, portName);
  return w;
}

function rvFortiSfp(g, x, y, ctx, portName, opts) {
  opts = opts || {};
  const s = opts.s || 1;
  const w = 13 * s, h = 9.5 * s;
  el('rect', { x, y, width: w, height: h, rx: 0.9 * s, fill: '#2A3A44', stroke: '#14202A', 'stroke-width': 0.5 }, g);
  el('rect', { x: x + 1.6 * s, y: y + 2.4 * s, width: w - 3.2 * s, height: h - 4.4 * s, rx: 0.4 * s, fill: '#0A1218' }, g);
  el('rect', { x: x + 1.6 * s, y: y + h * 0.42, width: w - 3.2 * s, height: 0.9 * s, fill: '#4A9EDE' }, g);
  if (opts.lit) el('circle', { cx: x + w - 1.7 * s, cy: y + 1.6 * s, r: 0.9 * s, fill: 'url(#rvLedGreen)', filter: 'url(#rvGlow)' }, g);
  rvHit(g, x, y, w, h, ctx, portName);
  return w;
}

function rvFortiQsfp(g, x, y, ctx, portName, opts) {
  opts = opts || {};
  const s = opts.s || 1;
  const w = 18 * s, h = 12 * s;
  el('rect', { x, y, width: w, height: h, rx: 1 * s, fill: '#2A3A44', stroke: '#14202A', 'stroke-width': 0.55 * s }, g);
  el('rect', { x: x + 2 * s, y: y + 3 * s, width: w - 4 * s, height: h - 5.6 * s, rx: 0.5 * s, fill: '#0A1218' }, g);
  el('rect', { x: x + 2 * s, y: y + h * 0.42, width: w - 4 * s, height: 1.2 * s, fill: '#5AAEEE' }, g);
  rvHit(g, x, y, w, h, ctx, portName);
  return w;
}

// Lays out copper/SFP/QSFP as consecutive groups (8-per-block gap, larger gap between types).
// If the natural width would overflow the room available before the LCD/MGMT block, the whole
// row — box sizes included — scales down uniformly so a model with unusually many ports (e.g. a
// 24-copper/24-SFP/8-QSFP 2600F) still never overlaps its own ports or the panel next to it.
function fortiRowLayout(startX, availWidth, segments) {
  const GROUP_GAP = 4, REGION_GAP = 9;
  const active = segments.filter(s => s.count > 0);
  let natural = 0;
  active.forEach((seg, i) => {
    natural += seg.count * seg.spacing + Math.floor((seg.count - 1) / 8) * GROUP_GAP;
    if (i > 0) natural += REGION_GAP;
  });
  const scale = natural > availWidth && natural > 0 ? Math.max(availWidth / natural, 0.55) : 1;
  const rows = [];
  let px = startX;
  let firstDrawn = true;
  segments.forEach(seg => {
    if (seg.count === 0) { rows.push([]); return; }
    if (!firstDrawn) px += REGION_GAP * scale;
    firstDrawn = false;
    const xs = [];
    for (let i = 0; i < seg.count; i++) {
      if (i > 0 && i % 8 === 0) px += GROUP_GAP * scale;
      xs.push(px);
      px += seg.spacing * scale;
    }
    rows.push(xs);
  });
  return { rows, scale };
}

// Tiny printed numbering above/below each port — the real hardware silkscreens a number right
// next to every port, and without it the ports are an unreadable wall of identical boxes.
function fortiTinyLabel(g, cx, y, text) {
  const t = el('text', { x: cx, y, 'font-size': 3, 'font-family': 'monospace', fill: '#B8B6AE', 'text-anchor': 'middle' }, g);
  t.textContent = text;
}

// Draws a group of RJ45/SFP ports in the real FortiGate convention: `cols` columns of 2 rows,
// odd numbers on top (1, 3, 5, 7...), even numbers directly below (2, 4, 6, 8...) — not left-to-
// right sequential. `startNum` is the first port number in the group (its odd/top port). Each
// port's real number is printed above (top row) or below (bottom row) it, like the real unit.
function fortiPortGroup(g, ctx, startX, topY, botY, cols, spacing, startNum, drawFn, namePrefix, litFrac, s) {
  for (let c = 0; c < cols; c++) {
    const px = startX + c * spacing;
    const topNum = startNum + c * 2, botNum = topNum + 1;
    drawFn(g, px, topY, ctx, namePrefix + topNum, { lit: c < cols * (litFrac || 0), s });
    drawFn(g, px, botY, ctx, namePrefix + botNum, { lit: c < cols * (litFrac || 0), s });
    fortiTinyLabel(g, px + 5.5, topY - 1.2, String(topNum));
    fortiTinyLabel(g, px + 5.5, botY + 9.5 * (s || 1) + 3.4, String(botNum));
  }
}

// Two ports stacked in one column (HA/MGMT, MGMT1/MGMT2, HA1/HA2, the 90G's shared-media pairs...)
// — the single most common sub-unit across every FortiGate front panel.
function fortiStackedPair(g, ctx, x, topY, botY, topName, botName, drawFn, s, topLabel, botLabel, litTop, litBot) {
  drawFn(g, x, topY, ctx, topName, { lit: litTop, s });
  drawFn(g, x, botY, ctx, botName, { lit: litBot, s });
  fortiTinyLabel(g, x + 5.5, topY - 1.2, topLabel);
  fortiTinyLabel(g, x + 5.5, botY + 9.5 * (s || 1) + 3.4, botLabel);
}

// A single row of QSFP slots (the 2U models' 100GE uplinks) — no top/bottom split, they're big
// enough to sit in one row on the real unit.
function fortiQsfpRow(g, ctx, startX, y, count, startNum, spacing, s) {
  for (let i = 0; i < count; i++) {
    const px = startX + i * spacing;
    rvFortiQsfp(g, px, y, ctx, 'port' + (startNum + i), { s });
    fortiTinyLabel(g, px + 9 * (s || 1), y - 1.2, String(startNum + i));
  }
}

const RV_STENCILS_NETWORK = {

  // A one-off, hand-matched replica of the real FortiGate 200G front panel (RACKVIEW_FORTIGATE_PORTLAR.md
  // follow-up: exact port positions instead of the generic parametric firewall-1u skeleton), built
  // from Fortinet's official FortiGate 200G Series datasheet interface diagram. Port names match
  // FortiOS's own interface naming (port1..port20, x1..x8, ha, mgmt) so cabling docs read the same
  // as the CLI. Only this one model uses this stencil — every other FortiGate stays on the
  // parametric firewall-1u/2u skeleton.
  'fortigate-200g': {
    uHeight: 1, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const S = 0.85; // every port drawn slightly smaller so there's room for a printed number above/below, like the real unit
      const boxH = 9.5 * S;
      const topY = y + 3.2, botY = y + 15;

      // Status LEDs (STATUS/ALARM/HA/POWER) + power button, left of CONSOLE — cosmetic, no ports.
      const ledX = c.innerX + 3;
      ['STATUS', 'ALARM', 'HA', 'POWER'].forEach((label, i) =>
        el('rect', { x: ledX, y: y + 4 + i * 5, width: 3, height: 3, rx: 0.5, fill: '#2A2927' }, g));
      el('circle', { cx: c.innerX + 15, cy: y + h / 2, r: 5, fill: '#3A3937', stroke: '#1E1D1C', 'stroke-width': 0.6 }, g);

      // CONSOLE (RJ45) over USB — a single column, matching the real panel's leftmost port pair.
      const consoleX = c.innerX + 32;
      rvFortiRj45(g, consoleX, topY, ctx, 'console', { lit: false, s: S });
      rvUsb(g, consoleX + 1, botY, ctx, 'usb');
      fortiTinyLabel(g, consoleX + 5, topY - 1.2, 'CON');
      fortiTinyLabel(g, consoleX + 5, botY + 7 + 3.4, 'USB');

      // HA over MGMT — its own column, right of CONSOLE/USB, before the switch port banks.
      const haX = c.innerX + 56;
      rvFortiRj45(g, haX, topY, ctx, 'ha', { lit: true, s: S });
      rvFortiRj45(g, haX, botY, ctx, 'mgmt', { lit: true, s: S });
      fortiTinyLabel(g, haX + 5, topY - 1.2, 'HA');
      fortiTinyLabel(g, haX + 5, botY + boxH + 3.4, 'MGMT');

      // 8x GE RJ45 (port1-port8): 4 columns x 2 rows, odd top / even bottom.
      fortiPortGroup(g, ctx, c.innerX + 84, topY, botY, 4, 14, 1, rvFortiRj45, 'port', 0.4, S);

      // 8x 5GE RJ45 (port9-port16). The real unit brackets these with a "5G" heading above the
      // numbers, but a 1U-tall render has no clean room for a second text line above the port
      // numbers without the two overlapping — the port numbers (9-16) already identify the group
      // unambiguously, so the speed heading is dropped rather than rendered illegibly.
      fortiPortGroup(g, ctx, c.innerX + 165, topY, botY, 4, 14, 9, rvFortiRj45, 'port', 0.4, S);

      // 8x 10GE SFP+ FortiLink slots (x1-x8): 4 columns x 2 rows. x1/x2 carry a small link glyph
      // on the real unit marking them as the default FortiLink trunk pair.
      const sfpPlusX = c.innerX + 250;
      for (let cIdx = 0; cIdx < 4; cIdx++) {
        const px = sfpPlusX + cIdx * 17;
        const topNum = cIdx * 2 + 1, botNum = topNum + 1;
        rvFortiSfp(g, px, topY, ctx, 'x' + topNum, { lit: cIdx < 2, s: S });
        rvFortiSfp(g, px, botY, ctx, 'x' + botNum, { lit: cIdx < 2, s: S });
        fortiTinyLabel(g, px + 5.5, topY - 1.2, 'X' + topNum);
        fortiTinyLabel(g, px + 5.5, botY + boxH + 3.4, 'X' + botNum);
      }
      el('circle', { cx: sfpPlusX + 15.5, cy: y + h / 2, r: 1.3, fill: 'none', stroke: '#3D9BE8', 'stroke-width': 0.6 }, g);

      // 4x GE SFP (port17-port20): 2 columns x 2 rows.
      fortiPortGroup(g, ctx, c.innerX + 345, topY, botY, 2, 17, 17, rvFortiSfp, 'port', 0.5, S);
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  // Hand-matched replicas of the rest of the FortiGate family's real front panels, from each
  // model's official Fortinet datasheet interface diagram — same approach and reasoning as
  // 'fortigate-200g' above. Each is model-specific and touches nothing else.

  'fortigate-90g': {
    uHeight: 1, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const S = 0.85, topY = y + 3.2, botY = y + 15, boxH = 9.5 * S;

      const ledX = c.innerX + 3;
      ['STATUS', 'ALARM', 'HA', 'POWER'].forEach((label, i) =>
        el('rect', { x: ledX, y: y + 4 + i * 5, width: 3, height: 3, rx: 0.5, fill: '#2A2927' }, g));

      const consoleX = c.innerX + 18;
      rvFortiRj45(g, consoleX, topY, ctx, 'console', { lit: false, s: S });
      rvUsb(g, consoleX + 1, botY, ctx, 'usb');
      fortiTinyLabel(g, consoleX + 5, topY - 1.2, 'CON');
      fortiTinyLabel(g, consoleX + 5, botY + 7 + 3.4, 'USB');

      // Shared-media pair: SFP+1/SFP+2 and WAN1/WAN2 are the SAME 2 logical ports with two
      // connector choices each (use the RJ45 jack or the SFP+ cage, not both) — the real unit
      // prints both connector pairs side by side under a single "shared" bracket.
      const sfpX = c.innerX + 40;
      fortiStackedPair(g, ctx, sfpX, topY, botY, 'sfp+1', 'sfp+2', rvFortiSfp, S, 'SFP+1', 'SFP+2', false, false);
      const wanX = c.innerX + 58;
      fortiStackedPair(g, ctx, wanX, topY, botY, 'wan1', 'wan2', rvFortiRj45, S, 'WAN1', 'WAN2', true, true);

      // 8x GE RJ45 — the real unit numbers the first 6 (1,3,5 / 2,4,6) then silkscreens the last
      // column "A"/"B" instead of 7/8.
      const rjX = c.innerX + 84;
      [1, 3, 5].forEach((n, ci) => {
        const px = rjX + ci * 14;
        rvFortiRj45(g, px, topY, ctx, 'port' + n, { lit: true, s: S });
        rvFortiRj45(g, px, botY, ctx, 'port' + (n + 1), { lit: true, s: S });
        fortiTinyLabel(g, px + 5, topY - 1.2, String(n));
        fortiTinyLabel(g, px + 5, botY + boxH + 3.4, String(n + 1));
      });
      const abX = rjX + 3 * 14;
      rvFortiRj45(g, abX, topY, ctx, 'porta', { lit: false, s: S });
      rvFortiRj45(g, abX, botY, ctx, 'portb', { lit: false, s: S });
      fortiTinyLabel(g, abX + 5, topY - 1.2, 'A');
      fortiTinyLabel(g, abX + 5, botY + boxH + 3.4, 'B');
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'fortigate-120g': {
    uHeight: 1, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const S = 0.85, topY = y + 3.2, botY = y + 15, boxH = 9.5 * S;

      const ledX = c.innerX + 3;
      ['STATUS', 'ALARM', 'HA', 'POWER'].forEach((label, i) =>
        el('rect', { x: ledX, y: y + 4 + i * 5, width: 3, height: 3, rx: 0.5, fill: '#2A2927' }, g));

      const consoleX = c.innerX + 18;
      rvFortiRj45(g, consoleX, topY, ctx, 'console', { lit: false, s: S });
      fortiTinyLabel(g, consoleX + 5, topY - 1.2, 'CON');

      const haX = c.innerX + 36;
      fortiStackedPair(g, ctx, haX, topY, botY, 'ha', 'mgmt', rvFortiRj45, S, 'HA', 'MGMT', true, true);

      fortiPortGroup(g, ctx, c.innerX + 58, topY, botY, 4, 14, 1, rvFortiRj45, 'port', 0.4, S);
      fortiPortGroup(g, ctx, c.innerX + 124, topY, botY, 4, 14, 9, rvFortiRj45, 'port', 0.4, S);

      const sfpPlusX = c.innerX + 190;
      for (let i = 0; i < 2; i++) {
        const px = sfpPlusX + i * 17;
        rvFortiSfp(g, px, topY, ctx, 'x' + (i * 2 + 1), { lit: true, s: S });
        rvFortiSfp(g, px, botY, ctx, 'x' + (i * 2 + 2), { lit: true, s: S });
        fortiTinyLabel(g, px + 5.5, topY - 1.2, 'X' + (i * 2 + 1));
        fortiTinyLabel(g, px + 5.5, botY + boxH + 3.4, 'X' + (i * 2 + 2));
      }
      el('circle', { cx: sfpPlusX + 8.5, cy: y + h / 2, r: 1.3, fill: 'none', stroke: '#3D9BE8', 'stroke-width': 0.6 }, g);

      fortiPortGroup(g, ctx, c.innerX + 230, topY, botY, 4, 15, 17, rvFortiSfp, 'port', 0.5, S);
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'fortigate-400f': {
    uHeight: 1, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const S = 0.85, topY = y + 3.2, botY = y + 15, boxH = 9.5 * S;

      const usbX = c.innerX + 12;
      rvUsb(g, usbX, topY, ctx, 'usb');
      fortiTinyLabel(g, usbX + 5, topY - 1.2, 'USB');
      const consoleX = c.innerX + 30;
      rvFortiRj45(g, consoleX, topY, ctx, 'console', { lit: false, s: S });
      fortiTinyLabel(g, consoleX + 5, topY - 1.2, 'CON');

      const haX = c.innerX + 52;
      fortiStackedPair(g, ctx, haX, topY, botY, 'ha', 'mgmt', rvFortiRj45, S, 'HA', 'MGMT', true, true);

      fortiPortGroup(g, ctx, c.innerX + 76, topY, botY, 4, 14, 1, rvFortiRj45, 'port', 0.4, S);
      fortiPortGroup(g, ctx, c.innerX + 142, topY, botY, 4, 14, 9, rvFortiRj45, 'port', 0.4, S);

      // 4x 10GE SFP+ FortiLink (X1-X4), then 4x SFP+ Ultra Low Latency (X5-X8).
      const sfpPlusX = c.innerX + 208;
      for (let i = 0; i < 2; i++) {
        const px = sfpPlusX + i * 17;
        rvFortiSfp(g, px, topY, ctx, 'x' + (i * 2 + 1), { lit: true, s: S });
        rvFortiSfp(g, px, botY, ctx, 'x' + (i * 2 + 2), { lit: true, s: S });
        fortiTinyLabel(g, px + 5.5, topY - 1.2, 'X' + (i * 2 + 1));
        fortiTinyLabel(g, px + 5.5, botY + boxH + 3.4, 'X' + (i * 2 + 2));
      }
      el('circle', { cx: sfpPlusX + 8.5, cy: y + h / 2, r: 1.3, fill: 'none', stroke: '#3D9BE8', 'stroke-width': 0.6 }, g);

      const ullX = c.innerX + 249;
      for (let i = 0; i < 2; i++) {
        const px = ullX + i * 17;
        rvFortiSfp(g, px, topY, ctx, 'x' + (i * 2 + 5), { lit: false, s: S });
        rvFortiSfp(g, px, botY, ctx, 'x' + (i * 2 + 6), { lit: false, s: S });
        fortiTinyLabel(g, px + 5.5, topY - 1.2, 'X' + (i * 2 + 5));
        fortiTinyLabel(g, px + 5.5, botY + boxH + 3.4, 'X' + (i * 2 + 6));
      }

      fortiPortGroup(g, ctx, c.innerX + 290, topY, botY, 4, 15, 17, rvFortiSfp, 'port', 0.5, S);
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'fortigate-600f': {
    uHeight: 1, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const S = 0.85, topY = y + 3.2, botY = y + 15, boxH = 9.5 * S;

      rvUsb(g, c.innerX + 8, topY, ctx, 'usb1');
      rvUsb(g, c.innerX + 20, topY, ctx, 'usb2');
      fortiTinyLabel(g, c.innerX + 13, topY - 1.2, 'USB');
      const consoleX = c.innerX + 46;
      rvFortiRj45(g, consoleX, topY, ctx, 'console', { lit: false, s: S });
      fortiTinyLabel(g, consoleX + 5, topY - 1.2, 'CON');

      const haX = c.innerX + 64;
      fortiStackedPair(g, ctx, haX, topY, botY, 'ha', 'mgmt', rvFortiRj45, S, 'HA', 'MGMT', true, true);

      fortiPortGroup(g, ctx, c.innerX + 88, topY, botY, 4, 14, 1, rvFortiRj45, 'port', 0.4, S);
      fortiPortGroup(g, ctx, c.innerX + 154, topY, botY, 4, 14, 9, rvFortiRj45, 'port', 0.4, S);
      fortiPortGroup(g, ctx, c.innerX + 220, topY, botY, 4, 15, 17, rvFortiSfp, 'port', 0.5, S);

      const sfpPlusX = c.innerX + 289;
      for (let i = 0; i < 2; i++) {
        const px = sfpPlusX + i * 17;
        rvFortiSfp(g, px, topY, ctx, 'x' + (i * 2 + 1), { lit: true, s: S });
        rvFortiSfp(g, px, botY, ctx, 'x' + (i * 2 + 2), { lit: true, s: S });
        fortiTinyLabel(g, px + 5.5, topY - 1.2, 'X' + (i * 2 + 1));
        fortiTinyLabel(g, px + 5.5, botY + boxH + 3.4, 'X' + (i * 2 + 2));
      }
      el('circle', { cx: sfpPlusX + 8.5, cy: y + h / 2, r: 1.3, fill: 'none', stroke: '#3D9BE8', 'stroke-width': 0.6 }, g);

      const ullX = c.innerX + 330;
      for (let i = 0; i < 2; i++) {
        const px = ullX + i * 17;
        rvFortiSfp(g, px, topY, ctx, 'x' + (i * 2 + 5), { lit: false, s: S });
        rvFortiSfp(g, px, botY, ctx, 'x' + (i * 2 + 6), { lit: false, s: S });
        fortiTinyLabel(g, px + 5.5, topY - 1.2, 'X' + (i * 2 + 5));
        fortiTinyLabel(g, px + 5.5, botY + boxH + 3.4, 'X' + (i * 2 + 6));
      }
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  // 900G's front panel groups (RJ45 -> SFP -> SFP+ -> SFP28 ULL) match the 600F exactly, only
  // the HA port's own speed differs (2.5GE vs GE) — invisible at this drawing scale.
  'fortigate-900g': {
    uHeight: 1, category: 'firewall',
    front(g, ctx) { RV_STENCILS_NETWORK['fortigate-600f'].front(g, ctx); },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  // 1000F is a 2U chassis (the generic catalog previously had it at 1U — corrected here).
  'fortigate-1000f': {
    uHeight: 2, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2, { dark: true });
      const S = 1, topY = y + 5, botY = y + 30, boxH = 9.5 * S;

      rvUsb(g, c.innerX + 6, topY, ctx, 'usb1');
      rvUsb(g, c.innerX + 18, topY, ctx, 'usb2');
      fortiTinyLabel(g, c.innerX + 11, topY - 1.5, 'USB');
      const consoleX = c.innerX + 42;
      rvFortiRj45(g, consoleX, topY, ctx, 'console', { lit: false, s: S });
      fortiTinyLabel(g, consoleX + 6, topY - 1.5, 'CON');

      const haX = c.innerX + 62;
      fortiStackedPair(g, ctx, haX, topY, botY, 'ha', 'mgmt', rvFortiRj45, S, 'HA', 'MGMT', true, true);

      // 8x RJ45 (port1-8)
      fortiPortGroup(g, ctx, c.innerX + 86, topY, botY, 4, 16, 1, rvFortiRj45, 'port', 0.4, S);

      // 16x SFP+ (port9-24)
      fortiPortGroup(g, ctx, c.innerX + 160, topY, botY, 8, 17, 9, rvFortiSfp, 'port', 0.4, S);

      // 8x SFP28 (port25-32)
      fortiPortGroup(g, ctx, c.innerX + 310, topY, botY, 4, 18, 25, rvFortiSfp, 'port', 0.5, S);

      // 2x QSFP28 (port33-34), single row, vertically centered on the port band.
      fortiQsfpRow(g, ctx, c.innerX + 400, (topY + botY) / 2, 2, 33, 24, S);
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'fortigate-1800f': {
    uHeight: 2, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2, { dark: true });
      const S = 1, topY = y + 5, botY = y + 30, boxH = 9.5 * S;

      const consoleX = c.innerX + 10;
      rvFortiRj45(g, consoleX, topY, ctx, 'console', { lit: false, s: S });
      fortiTinyLabel(g, consoleX + 6, topY - 1.5, 'CON');
      rvUsb(g, consoleX + 1, botY, ctx, 'usb');
      fortiTinyLabel(g, consoleX + 6, botY + 7 + 3.6, 'USB');

      const mgmtX = c.innerX + 32;
      fortiStackedPair(g, ctx, mgmtX, topY, botY, 'mgmt1', 'mgmt2', rvFortiRj45, S, 'MGMT1', 'MGMT2', true, true);
      const haX = c.innerX + 52;
      fortiStackedPair(g, ctx, haX, topY, botY, 'ha1', 'ha2', rvFortiSfp, S, 'HA1', 'HA2', false, false);

      // 16x GE RJ45 (port1-16): two 4-column blocks.
      fortiPortGroup(g, ctx, c.innerX + 78, topY, botY, 4, 16, 1, rvFortiRj45, 'port', 0.4, S);
      fortiPortGroup(g, ctx, c.innerX + 152, topY, botY, 4, 16, 9, rvFortiRj45, 'port', 0.4, S);

      // 8x GE SFP (port17-24)
      fortiPortGroup(g, ctx, c.innerX + 226, topY, botY, 4, 17, 17, rvFortiSfp, 'port', 0.5, S);

      // 12x 25GE SFP28 (port25-36)
      fortiPortGroup(g, ctx, c.innerX + 300, topY, botY, 6, 18, 25, rvFortiSfp, 'port', 0.5, S);

      // 4x 100GE QSFP28 (port37-40), single row.
      fortiQsfpRow(g, ctx, c.innerX + 420, (topY + botY) / 2, 4, 37, 24, S);
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'fortigate-2600f': {
    uHeight: 2, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2, { dark: true });
      const S = 1, topY = y + 5, botY = y + 30, boxH = 9.5 * S;

      const consoleX = c.innerX + 10;
      rvFortiRj45(g, consoleX, topY, ctx, 'console', { lit: false, s: S });
      fortiTinyLabel(g, consoleX + 6, topY - 1.5, 'CON');
      rvUsb(g, consoleX + 1, botY, ctx, 'usb');
      fortiTinyLabel(g, consoleX + 6, botY + 7 + 3.6, 'USB');

      const mgmtX = c.innerX + 32;
      fortiStackedPair(g, ctx, mgmtX, topY, botY, 'mgmt1', 'mgmt2', rvFortiRj45, S, 'MGMT1', 'MGMT2', true, true);
      const haX = c.innerX + 52;
      fortiStackedPair(g, ctx, haX, topY, botY, 'ha1', 'ha2', rvFortiSfp, S, 'HA1', 'HA2', false, false);

      // 16x 10GE/GE RJ45 (port1-16): two 4-column blocks.
      fortiPortGroup(g, ctx, c.innerX + 78, topY, botY, 4, 16, 1, rvFortiRj45, 'port', 0.4, S);
      fortiPortGroup(g, ctx, c.innerX + 152, topY, botY, 4, 16, 9, rvFortiRj45, 'port', 0.4, S);

      // 16x 25GE SFP28 (port17-32)
      fortiPortGroup(g, ctx, c.innerX + 226, topY, botY, 8, 18, 17, rvFortiSfp, 'port', 0.5, S);

      // 4x 100GE QSFP28 (port33-36), single row.
      fortiQsfpRow(g, ctx, c.innerX + 380, (topY + botY) / 2, 4, 33, 24, S);
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'fortigate-3500f': {
    uHeight: 2, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2, { dark: true });
      const S = 1, topY = y + 5, botY = y + 30, boxH = 9.5 * S;

      const consoleX = c.innerX + 10;
      rvFortiRj45(g, consoleX, topY, ctx, 'console', { lit: false, s: S });
      fortiTinyLabel(g, consoleX + 6, topY - 1.5, 'CON');
      rvUsb(g, consoleX + 1, botY, ctx, 'usb');
      fortiTinyLabel(g, consoleX + 6, botY + 7 + 3.6, 'USB');

      const mgmtX = c.innerX + 32;
      fortiStackedPair(g, ctx, mgmtX, topY, botY, 'mgmt1', 'mgmt2', rvFortiRj45, S, 'MGMT1', 'MGMT2', true, true);
      const haX = c.innerX + 52;
      fortiStackedPair(g, ctx, haX, topY, botY, 'ha1', 'ha2', rvFortiSfp, S, 'HA1', 'HA2', false, false);

      // 30x 25GE SFP28/SFP+ (port1-30): 15 columns x 2 rows — the widest single bank in the family.
      fortiPortGroup(g, ctx, c.innerX + 78, topY, botY, 15, 17, 1, rvFortiSfp, 'port', 0.4, S);

      // 6x 100GE QSFP28 (port31-36), single row.
      fortiQsfpRow(g, ctx, c.innerX + 342, (topY + botY) / 2, 6, 31, 24, S);
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  // Hand-matched replicas of Palo Alto's real front panels (Strata PA-1400/PA-3400 series
  // datasheets), same approach as the FortiGate ones above — reuses the same rvFortiRj45/
  // rvFortiSfp/rvFortiQsfp artwork (copper vs fiber tone) for a consistent visual language.

  // PA-1410 and PA-1420 share one physical layout — the datasheet's own numbered diagram (1-22)
  // is identical for both; only internal port speed capability differs, invisible at this scale.
  'palo-pa1400': {
    uHeight: 1, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const S = 0.85, topY = y + 3.2, botY = y + 15, boxH = 9.5 * S;

      // 12x copper (port1-12): two blocks, 4 cols then 2 cols.
      fortiPortGroup(g, ctx, c.innerX + 8, topY, botY, 4, 14, 1, rvFortiRj45, 'port', 0.4, S);
      fortiPortGroup(g, ctx, c.innerX + 74, topY, botY, 2, 14, 9, rvFortiRj45, 'port', 0.4, S);

      // 10x SFP/SFP+ (port13-22): 5 columns x 2 rows.
      fortiPortGroup(g, ctx, c.innerX + 112, topY, botY, 5, 15, 13, rvFortiSfp, 'port', 0.4, S);

      // HSCI HA link: a single 10G SFP+ (ha) plus a redundant RJ45 pair (ha-1a/ha-1b).
      const haSfpX = c.innerX + 200;
      rvFortiSfp(g, haSfpX, topY, ctx, 'ha', { lit: false, s: S });
      fortiTinyLabel(g, haSfpX + 5.5, topY - 1.2, 'HA');
      const haRjX = c.innerX + 218;
      fortiStackedPair(g, ctx, haRjX, topY, botY, 'ha-1a', 'ha-1b', rvFortiRj45, S, '1-A', '1-B', true, true);

      // MGMT over CONSOLE — stacked, matching the real panel's dual-RJ45 housing.
      const mgmtX = c.innerX + 240;
      fortiStackedPair(g, ctx, mgmtX, topY, botY, 'mgmt', 'console', rvFortiRj45, S, 'MGMT', 'CON', true, false);

      // The datasheet lists a USB-A port and a separate Micro-USB console port.
      rvUsb(g, c.innerX + 262, topY, ctx, 'usb');
      fortiTinyLabel(g, c.innerX + 267, topY - 1.2, 'USB');
      rvUsb(g, c.innerX + 262, botY, ctx, 'usb-micro');
      fortiTinyLabel(g, c.innerX + 267, botY + 7 + 3.6, 'USB-C');
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  // PA-3410/PA-3420 share one layout (no QSFP); PA-3440 is the same plus 2x QSFP28.
  'palo-pa3400': {
    uHeight: 1, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      const S = 0.85, topY = y + 3.2, botY = y + 15, boxH = 9.5 * S;

      // 12x copper (port1-12): two blocks, 4 cols then 2 cols.
      fortiPortGroup(g, ctx, c.innerX + 8, topY, botY, 4, 14, 1, rvFortiRj45, 'port', 0.4, S);
      fortiPortGroup(g, ctx, c.innerX + 74, topY, botY, 2, 14, 9, rvFortiRj45, 'port', 0.4, S);

      // 10x SFP/SFP+ (port13-22): 5 columns x 2 rows.
      fortiPortGroup(g, ctx, c.innerX + 112, topY, botY, 5, 15, 13, rvFortiSfp, 'port', 0.4, S);

      // 4x 25GE SFP28 (port23-26): 2 columns x 2 rows.
      fortiPortGroup(g, ctx, c.innerX + 200, topY, botY, 2, 17, 23, rvFortiSfp, 'port', 0.5, S);

      let mx = c.innerX + 240;
      if (ctx.qsfp) {
        fortiQsfpRow(g, ctx, mx, (topY + botY) / 2, 2, 27, 24, S);
        mx += 54;
      }

      const haSfpX = mx;
      rvFortiSfp(g, haSfpX, topY, ctx, 'ha', { lit: false, s: S });
      fortiTinyLabel(g, haSfpX + 5.5, topY - 1.2, 'HA');
      const haRjX = mx + 18;
      fortiStackedPair(g, ctx, haRjX, topY, botY, 'ha-1a', 'ha-1b', rvFortiRj45, S, '1-A', '1-B', true, true);

      const mgmtX = mx + 40;
      fortiStackedPair(g, ctx, mgmtX, topY, botY, 'mgmt', 'console', rvFortiRj45, S, 'MGMT', 'CON', true, false);

      // The PA-3400 datasheet lists only a single Micro-USB console port (no separate USB-A,
      // unlike the PA-1400).
      rvUsb(g, mx + 62, topY, ctx, 'usb-micro');
      fortiTinyLabel(g, mx + 67, topY - 1.2, 'USB-C');
    },
    rear(g, ctx) { RV_STENCILS_SWITCH['switch-1u-rear'].rear(g, ctx); }
  },

  'firewall-1u': {
    uHeight: 1, category: 'firewall',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1, { dark: true });
      el('rect', { x: x + 16, y: y + 2, width: 3, height: h - 4, rx: 1, fill: '#D64545' }, g);
      // `?? ` not `||` — a model can legitimately have 0 of a port type (e.g. Check Point 16600
      // has no SFP), and `0 || 8` would silently fall back to the default instead of drawing none.
      const cu = ctx.copperPorts != null ? ctx.copperPorts : 16;
      const sf = ctx.sfpPorts != null ? ctx.sfpPorts : 8;
      const qs = ctx.qsfpPorts != null ? ctx.qsfpPorts : 0;
      // Real 1U FortiGates stack copper into two rows (top/bottom) rather than one long strip —
      // a single row made the device look far wider than the real hardware: RACKVIEW_FORTIGATE_2SIRA.md.
      const cuTop = Math.ceil(cu / 2), cuBot = cu - cuTop;
      const startX = c.innerX + 4;
      const availW = (x + w - 130 - 10) - startX;
      const { rows, scale } = fortiRowLayout(startX, availW, [
        { count: cuTop, spacing: 14 }, { count: sf, spacing: 15 }, { count: qs, spacing: 21 },
      ]);
      const copperXs = rows[0];
      const topY = y + 2, botY = topY + (9.5 + 3) * scale;
      // Both rows share the same x's (drawn from the same array) so they line up exactly; the
      // shorter bottom row (when cu is odd) just uses the first cuBot of them.
      copperXs.forEach((px, i) => rvFortiRj45(g, px, topY, ctx, 'port' + (i + 1), { lit: i < cuTop * 0.4, s: scale }));
      copperXs.slice(0, cuBot).forEach((px, i) => rvFortiRj45(g, px, botY, ctx, 'port' + (cuTop + i + 1), { lit: i < cuBot * 0.4, s: scale }));
      rows[1].forEach((px, i) => rvFortiSfp(g, px, y + 9, ctx, 'port' + (cu + i + 1), { lit: i < sf / 2, s: scale }));
      // A handful of 1U models (e.g. 1000F) carry a couple of QSFP+ uplinks alongside RJ45/SFP —
      // firewall-2u already draws QSFP, this just extends the same fortiRowLayout segment to 1U.
      rows[2].forEach((px, i) => rvFortiQsfp(g, px, y + 8, ctx, 'port' + (cu + sf + i + 1), { s: scale }));
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
      // `!= null` not `||` — see the matching note in firewall-1u above (a model can legitimately
      // have 0 of a port type).
      const cu = ctx.copperPorts != null ? ctx.copperPorts : 24;
      const sf = ctx.sfpPorts != null ? ctx.sfpPorts : 16;
      const qs = ctx.qsfpPorts != null ? ctx.qsfpPorts : 8;
      const cuRow = cu / 2, sfRow = sf / 2, qsRow = qs / 2;
      const startX = c.innerX + 4;
      const availW = (x + w - 250 - 10) - startX;
      const { rows, scale } = fortiRowLayout(startX, availW, [
        { count: cuRow, spacing: 14 }, { count: sfRow, spacing: 15 }, { count: qsRow, spacing: 21 },
      ]);
      [0, 1].forEach(r => {
        const py = y + (r ? 17 : 4);
        rows[0].forEach((px, i) => rvFortiRj45(g, px, py, ctx, 'port' + (r * cuRow + i + 1), { lit: i < 5, s: scale }));
        rows[1].forEach((px, i) => rvFortiSfp(g, px, y + (r ? 16 : 3), ctx, 'port' + (cu + r * sfRow + i + 1), { lit: i < 4, s: scale }));
        rows[2].forEach((px, i) => rvFortiQsfp(g, px, y + (r ? 32 : 4), ctx, 'port' + (cu + sf + r * qsRow + i + 1), { s: scale }));
      });
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
      // `!= null` not `||` — a model can legitimately have 0 of a port type (e.g. the MX204 has
      // no plain GE ports, only 10G/QSFP), and `0 || 8` would silently fall back to the default.
      const gp = ctx.gigPorts != null ? ctx.gigPorts : 8;
      // Some families' onboard GE ports are RJ45 copper (Cisco's own datasheets show this for the
      // ISR 4000 and Catalyst 8200/8300), others are SFP (ASR 1000, Catalyst 8500, Juniper MX) —
      // `gigIsCopper` picks the real connector per model instead of always drawing SFP cages.
      const gigDraw = ctx.gigIsCopper ? rvRj45 : rvSfp;
      for (let i = 0; i < gp; i++) { gigDraw(g, px, y + 10, ctx, 'GigabitEthernet0/0/' + i, { dark: true, lit: i < gp / 2 }); px += 15; }
      const tp = ctx.tenGigPorts != null ? ctx.tenGigPorts : 4;
      for (let i = 0; i < tp; i++) { rvSfp(g, px + 6, y + 10, ctx, 'TenGigabitEthernet0/0/' + i, { lit: i < 2 }); px += 15; }
      const nims = ctx.nimSlots != null ? ctx.nimSlots : 2;
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
      // Draw at the device's real U height (dev.u from the catalog, e.g. the MX10003 is 3U) —
      // was hardcoded to 2, which left a visible gap under any router using this stencil at a
      // height other than 2U.
      const c = rvChassis(g, x, y, w, ctx.uHeight || 2, { dark: true });
      el('rect', { x: x + 16, y: y + 2, width: 3, height: h - 4, rx: 1, fill: '#3D9BE8' }, g);
      // Was hardcoded to exactly 4+4 regardless of the model's real port counts (opts.gigPorts /
      // opts.tenGigPorts were never actually read here) — e.g. the ASR 1002-HX's real 8+8 never
      // rendered. `!= null` (not `||`) so a model with legitimately 0 of a type draws none.
      const gp2 = ctx.gigPorts != null ? ctx.gigPorts : 4;
      const gigDraw2 = ctx.gigIsCopper ? rvRj45 : rvSfp;
      for (let i = 0; i < gp2; i++) gigDraw2(g, c.innerX + 4 + i * 14, y + 6, ctx, 'GigabitEthernet0/0/' + i, { dark: true, lit: i < gp2 / 2 });
      const tp2 = ctx.tenGigPorts != null ? ctx.tenGigPorts : 4;
      for (let i = 0; i < tp2; i++) rvSfp(g, c.innerX + 4 + i * 15, y + 32, ctx, 'TenGigabitEthernet0/0/' + i, { lit: i < tp2 / 2 });
      // An odd nimSlots count (e.g. 5) used to divide unevenly across the two rows and produce
      // fractional slot labels like "NIM 1.5" — lay out left-to-right, row by row, instead.
      const nims = ctx.nimSlots != null ? ctx.nimSlots : 6;
      const nimCols = Math.max(Math.ceil(nims / 2), 1);
      for (let idx = 0; idx < nims; idx++) {
        const r = Math.floor(idx / nimCols), cc = idx % nimCols;
        const nx = c.innerX + 70 + cc * 106, ny = y + 4 + r * 26;
        el('rect', { x: nx, y: ny, width: 102, height: 22, rx: 1, fill: '#484744', stroke: '#232221', 'stroke-width': 0.6 }, g);
        rvLabel(g, nx + 9, ny + 20, 'NIM ' + idx, true);
        rvHit(g, nx, ny, 8, 22, ctx, 'NIM slot ' + idx);
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
