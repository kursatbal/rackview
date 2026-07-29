const RV_STENCILS_DELL = {

  'dell-rack-1u': {
    vendor: 'Dell', uHeight: 1, category: 'server',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1);
      const bays = ctx.bays || 10;
      const type = ctx.bayType || 'sff';
      const panelW = 46;
      const areaX = c.innerX + 2;
      const areaW = c.innerW - panelW - 8;
      rvBayRow(g, areaX, y + 3, areaW, h - 6, bays, ctx,
        (type === 'lff' ? 'LFF Bay ' : type === 'e3s' ? 'E3.S Bay ' : 'SFF Bay '), { gap: 2.5 });
      rvCtrlPanel(g, x + w - 15 - panelW - 2, y + 2.5, panelW, h - 5, ctx);
    },
    rear(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 1);
      const layout = ctx.rearLayout || 'ocp';
      let cx = c.innerX + 2;

      if (layout === 'fc') {
        for (let k = 0; k < (ctx.fcCards || 2); k++) {
          const card = rvCard(g, cx, y + 4, 86, h - 8, ctx, 'HBA ' + (k + 1));
          rvLc(card, cx + 8, y + 8, ctx, 'FC' + (k + 1) + ' Port 1');
          rvLc(card, cx + 28, y + 8, ctx, 'FC' + (k + 1) + ' Port 2');
          rvLabel(card, cx + 50, y + 15, '16G FC');
          cx += 92;
        }
      } else {
        for (let k = 0; k < (ctx.ocpCards || 2); k++) {
          const card = rvCard(g, cx, y + 6, 42, 16, ctx, 'OCP NIC' + (k + 1));
          rvSfp(card, cx + 4, y + 9, ctx, 'OCP' + (k + 1) + ' P1', { lit: true });
          rvSfp(card, cx + 21, y + 9, ctx, 'OCP' + (k + 1) + ' P2', { lit: true });
          cx += 48;
        }
        rvBlank(g, cx, y + 5, 72, h - 10); cx += 78;
        rvBlank(g, cx, y + 5, 72, h - 10); cx += 78;
      }

      if (ctx.lom !== false) {
        const lomN = ctx.lomPorts || 4;
        const lom = rvCard(g, cx, y + 6, lomN * 16 + 4, 16, ctx, 'LOM');
        for (let k = 0; k < lomN; k++)
          rvRj45(lom, cx + 3 + k * 16, y + 9, ctx, 'LOM Gb' + (k + 1), { lit: k < 2, dark: false });
        rvLabel(g, cx, y + h - 3, lomN + '× 1GbE LOM');
        cx += lomN * 16 + 10;
      }

      rvRj45(g, cx, y + 8, ctx, 'iDRAC', { lit: true });
      rvLabel(g, cx - 2, y + h - 3, 'iDRAC');
      cx += 20;
      rvUsb(g, cx, y + 10, ctx, 'USB 1'); cx += 13;
      rvUsb(g, cx, y + 10, ctx, 'USB 2'); cx += 17;
      rvVga(g, cx, y + 10, ctx, 'VGA'); cx += 22;

      const psuW = 108;
      rvPsu(g, x + w - 15 - psuW * 2 - 8, y + 4, psuW, h - 8, ctx, 'PSU 1');
      rvPsu(g, x + w - 15 - psuW - 4, y + 4, psuW, h - 8, ctx, 'PSU 2');
    }
  },

  'dell-rack-2u': {
    vendor: 'Dell', uHeight: 2, category: 'server',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2);
      const bays = ctx.bays || 8;
      const type = ctx.bayType || 'sff';
      const panelW = 48;
      const areaX = c.innerX + 2;
      const areaW = c.innerW - panelW - 8;
      if (type === 'lff') {
        const rows = 2, per = bays / rows;
        for (let r = 0; r < rows; r++)
          rvBayRow(g, areaX, y + 4 + r * ((h - 8) / rows + 1), areaW, (h - 10) / rows, per, ctx,
            'LFF R' + (r + 1) + ' Bay ', { gap: 2.5 });
      } else {
        rvBayRow(g, areaX, y + 4, areaW, h - 8, bays, ctx,
          (type === 'e3s' ? 'E3.S Bay ' : 'SFF Bay '), { gap: 2.5 });
      }
      rvCtrlPanel(g, x + w - 15 - panelW - 2, y + 3, panelW, h - 6, ctx);
    },
    rear(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 2);
      const layout = ctx.rearLayout || 'ocp';
      const half = (h - 10) / 2;
      let cx = c.innerX + 2;

      if (layout === 'fc') {
        for (let k = 0; k < (ctx.fcCards || 2); k++) {
          const cy = y + 4 + k * (half + 2);
          const card = rvCard(g, cx, cy, 86, half, ctx, 'HBA ' + (k + 1));
          rvLc(card, cx + 8, cy + (half - 10) / 2, ctx, 'FC' + (k + 1) + ' Port 1');
          rvLc(card, cx + 28, cy + (half - 10) / 2, ctx, 'FC' + (k + 1) + ' Port 2');
          rvLabel(card, cx + 50, cy + half / 2 + 1.5, '16G FC');
        }
        cx += 92;
        rvBlank(g, cx, y + 4, 96, h - 8); cx += 102;
      } else {
        for (let r = 0; r < 2; r++)
          rvBlank(g, cx, y + 4 + r * (half + 2), 118, half);
        cx += 124;
        for (let r = 0; r < 2; r++)
          rvBlank(g, cx, y + 4 + r * (half + 2), 118, half);
        cx += 124;
        for (let k = 0; k < (ctx.ocpCards || 2); k++) {
          const cy = y + 6 + k * (half + 2);
          const card = rvCard(g, cx, cy, 42, 16, ctx, 'OCP NIC' + (k + 1));
          rvSfp(card, cx + 4, cy + 3, ctx, 'OCP' + (k + 1) + ' P1', { lit: true });
          rvSfp(card, cx + 21, cy + 3, ctx, 'OCP' + (k + 1) + ' P2', { lit: true });
        }
        cx += 50;
      }

      if (ctx.lom !== false) {
        const lomN = ctx.lomPorts || 4;
        const lom = rvCard(g, cx, y + 8, lomN * 16 + 4, 16, ctx, 'LOM');
        for (let k = 0; k < lomN; k++)
          rvRj45(lom, cx + 3 + k * 16, y + 11, ctx, 'LOM Gb' + (k + 1), { lit: k < 2 });
        rvLabel(g, cx, y + 32, lomN + '× 1GbE LOM');
        cx += lomN * 16 + 10;
      }

      rvRj45(g, cx, y + 8, ctx, 'iDRAC', { lit: true });
      rvLabel(g, cx - 2, y + 27, 'iDRAC');
      rvUsb(g, cx, y + 36, ctx, 'USB 1');
      rvUsb(g, cx + 13, y + 36, ctx, 'USB 2');
      rvVga(g, cx + 30, y + 36, ctx, 'VGA');
      cx += 54;

      const psuW = 116;
      const px = x + w - 15 - psuW - 4;
      rvPsu(g, px, y + 4, psuW, half, ctx, 'PSU 1');
      rvPsu(g, px, y + 6 + half, psuW, half, ctx, 'PSU 2');
      for (let k = 0; k < 2; k++)
        for (let r = 0; r < 2; r++)
          rvFan(g, px - 90 + k * 38, y + 15 + r * 26, 13, ctx, 'Fan ' + (k * 2 + r + 1));
    }
  },

  'dell-rack-4u': {
    vendor: 'Dell', uHeight: 4, category: 'server',
    front(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 4);
      const bays = ctx.bays || 24;
      const rows = 2, per = bays / rows;
      const panelW = 48;
      const areaW = c.innerW - panelW - 8;
      for (let r = 0; r < rows; r++)
        rvBayRow(g, c.innerX + 2, y + 6 + r * ((h - 14) / rows + 3), areaW, (h - 18) / rows, per, ctx,
          'SFF R' + (r + 1) + ' Bay ', { gap: 2.5 });
      rvCtrlPanel(g, x + w - 15 - panelW - 2, y + 6, panelW, h - 12, ctx);
    },
    rear(g, ctx) {
      const { x, y, w, h } = ctx;
      const c = rvChassis(g, x, y, w, 4);
      const q = (h - 14) / 4;
      let cx = c.innerX + 2;
      for (let r = 0; r < 4; r++) rvBlank(g, cx, y + 5 + r * (q + 2.5), 130, q);
      cx += 136;
      for (let r = 0; r < 4; r++) rvBlank(g, cx, y + 5 + r * (q + 2.5), 130, q);
      cx += 136;
      const lomN = ctx.lomPorts || 4;
      const lom = rvCard(g, cx, y + 8, lomN * 16 + 4, 16, ctx, 'LOM');
      for (let k = 0; k < lomN; k++) rvRj45(lom, cx + 3 + k * 16, y + 11, ctx, 'LOM Gb' + (k + 1), { lit: k < 2 });
      rvRj45(g, cx, y + 30, ctx, 'iDRAC', { lit: true });
      rvLabel(g, cx - 2, y + 48, 'iDRAC');
      rvUsb(g, cx + 20, y + 31, ctx, 'USB 1');
      rvVga(g, cx + 34, y + 31, ctx, 'VGA');
      cx += lomN * 16 + 10;
      const psuW = 108;
      const px = x + w - 15 - psuW - 4;
      for (let k = 0; k < 4; k++)
        rvPsu(g, px, y + 5 + k * (q + 2.5), psuW, q, ctx, 'PSU ' + (k + 1));
    }
  }
};

if (typeof module !== 'undefined') module.exports = RV_STENCILS_DELL;
