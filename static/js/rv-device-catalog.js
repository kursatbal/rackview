const RV_CATALOG = [

  // ===================== DELL 1U SERVERS =====================
  { model: 'PowerEdge R470',    vendor: 'Dell', gen: '17G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lomPorts: 0, lom: false } },
  { model: 'PowerEdge R670',    vendor: 'Dell', gen: '17G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R6715',   vendor: 'Dell', gen: '17G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R6725',   vendor: 'Dell', gen: '17G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R4715',   vendor: 'Dell', gen: '17G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 8,  bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R660',    vendor: 'Dell', gen: '16G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R660xs',  vendor: 'Dell', gen: '16G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'ocp', ocpCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge R6615',   vendor: 'Dell', gen: '16G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'ocp', ocpCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge R6625',   vendor: 'Dell', gen: '16G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R360',    vendor: 'Dell', gen: '16G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 8,  bayType: 'sff', rearLayout: 'ocp', ocpCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge R260',    vendor: 'Dell', gen: '16G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 6,  bayType: 'sff', rearLayout: 'ocp', ocpCards: 0, lomPorts: 2 } },
  { model: 'PowerEdge R650',    vendor: 'Dell', gen: '15G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'PowerEdge R650xs',  vendor: 'Dell', gen: '15G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'fc', fcCards: 1, lomPorts: 4 } },
  { model: 'PowerEdge R6515',   vendor: 'Dell', gen: '15G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'fc', fcCards: 1, lomPorts: 4 } },
  { model: 'PowerEdge R6525',   vendor: 'Dell', gen: '15G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'PowerEdge R450',    vendor: 'Dell', gen: '15G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 8,  bayType: 'sff', rearLayout: 'fc', fcCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge R350',    vendor: 'Dell', gen: '15G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 8,  bayType: 'sff', rearLayout: 'ocp', ocpCards: 0, lomPorts: 2 } },
  { model: 'PowerEdge R250',    vendor: 'Dell', gen: '15G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 4,  bayType: 'lff', rearLayout: 'ocp', ocpCards: 0, lomPorts: 2 } },
  { model: 'PowerEdge R640',    vendor: 'Dell', gen: '14G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'PowerEdge R440',    vendor: 'Dell', gen: '14G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 8,  bayType: 'sff', rearLayout: 'fc', fcCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge R340',    vendor: 'Dell', gen: '14G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 8,  bayType: 'sff', rearLayout: 'ocp', ocpCards: 0, lomPorts: 2 } },
  { model: 'PowerEdge R240',    vendor: 'Dell', gen: '14G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 4,  bayType: 'lff', rearLayout: 'ocp', ocpCards: 0, lomPorts: 2 } },
  { model: 'PowerEdge R6415',   vendor: 'Dell', gen: '14G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 10, bayType: 'sff', rearLayout: 'fc', fcCards: 1, lomPorts: 4 } },
  { model: 'PowerEdge XR5610',  vendor: 'Dell', gen: '16G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 4,  bayType: 'sff', rearLayout: 'ocp', ocpCards: 1, lomPorts: 2 } },

  // ===================== DELL 2U SERVERS =====================
  { model: 'PowerEdge R770',    vendor: 'Dell', gen: '17G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R770AP',  vendor: 'Dell', gen: '17G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'sff', rearLayout: 'ocp', ocpCards: 1, lom: false } },
  { model: 'PowerEdge R570',    vendor: 'Dell', gen: '17G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 12, bayType: 'lff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R7715',   vendor: 'Dell', gen: '17G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R7725',   vendor: 'Dell', gen: '17G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R7725xd', vendor: 'Dell', gen: '17G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 16, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R5715',   vendor: 'Dell', gen: '17G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 12, bayType: 'lff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R760',    vendor: 'Dell', gen: '16G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 8,  bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R760xs',  vendor: 'Dell', gen: '16G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 16, bayType: 'sff', rearLayout: 'ocp', ocpCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge R760xa',  vendor: 'Dell', gen: '16G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 8,  bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R760xd2', vendor: 'Dell', gen: '16G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'lff', rearLayout: 'ocp', ocpCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge R860',    vendor: 'Dell', gen: '16G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 16, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R7615',   vendor: 'Dell', gen: '16G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'sff', rearLayout: 'ocp', ocpCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge R7625',   vendor: 'Dell', gen: '16G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'sff', rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'PowerEdge R750',    vendor: 'Dell', gen: '15G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 8,  bayType: 'sff', rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'PowerEdge R750xs',  vendor: 'Dell', gen: '15G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 16, bayType: 'sff', rearLayout: 'fc', fcCards: 1, lomPorts: 4 } },
  { model: 'PowerEdge R750xa',  vendor: 'Dell', gen: '15G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 8,  bayType: 'sff', rearLayout: 'fc', fcCards: 1, lomPorts: 4 } },
  { model: 'PowerEdge R550',    vendor: 'Dell', gen: '15G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 8,  bayType: 'lff', rearLayout: 'fc', fcCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge R7515',   vendor: 'Dell', gen: '15G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 12, bayType: 'lff', rearLayout: 'fc', fcCards: 1, lomPorts: 4 } },
  { model: 'PowerEdge R7525',   vendor: 'Dell', gen: '15G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'sff', rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'PowerEdge R740',    vendor: 'Dell', gen: '14G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 16, bayType: 'sff', rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'PowerEdge R740xd',  vendor: 'Dell', gen: '14G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 12, bayType: 'lff', rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'PowerEdge R540',    vendor: 'Dell', gen: '14G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 8,  bayType: 'lff', rearLayout: 'fc', fcCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge R840',    vendor: 'Dell', gen: '14G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'sff', rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'PowerEdge R7415',   vendor: 'Dell', gen: '14G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'sff', rearLayout: 'fc', fcCards: 1, lomPorts: 4 } },
  { model: 'PowerEdge R7425',   vendor: 'Dell', gen: '14G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 24, bayType: 'sff', rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'PowerEdge XR7620',  vendor: 'Dell', gen: '16G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 4,  bayType: 'sff', rearLayout: 'ocp', ocpCards: 1, lomPorts: 2 } },
  { model: 'PowerEdge HS5620',  vendor: 'Dell', gen: '16G', stencil: 'dell-rack-2u', u: 2, opts: { bays: 16, bayType: 'sff', rearLayout: 'ocp', ocpCards: 1, lom: false } },
  { model: 'PowerEdge HS5610',  vendor: 'Dell', gen: '16G', stencil: 'dell-rack-1u', u: 1, opts: { bays: 12, bayType: 'sff', rearLayout: 'ocp', ocpCards: 1, lom: false } },

  // ===================== DELL 3U/4U =====================
  { model: 'PowerEdge R940',    vendor: 'Dell', gen: '14G', stencil: 'dell-rack-4u', u: 3, opts: { bays: 24, bayType: 'sff', lomPorts: 4 } },
  { model: 'PowerEdge R960',    vendor: 'Dell', gen: '16G', stencil: 'dell-rack-4u', u: 4, opts: { bays: 24, bayType: 'sff', lomPorts: 4 } },
  { model: 'PowerEdge R940xa',  vendor: 'Dell', gen: '14G', stencil: 'dell-rack-4u', u: 4, opts: { bays: 32, bayType: 'sff', lomPorts: 4 } },
  { model: 'PowerEdge XE8640',  vendor: 'Dell', gen: '16G', stencil: 'dell-rack-4u', u: 4, opts: { bays: 8,  bayType: 'sff', lomPorts: 2 } },
  { model: 'PowerEdge XE9680',  vendor: 'Dell', gen: '16G', stencil: 'dell-rack-4u', u: 6, opts: { bays: 8,  bayType: 'sff', lomPorts: 2 } },

  // ===================== HPE 1U =====================
  { model: 'ProLiant DL320 Gen12',        vendor: 'HPE', gen: 'Gen12',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 8,  rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL360 Gen12',        vendor: 'HPE', gen: 'Gen12',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 10, rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL325 Gen12',        vendor: 'HPE', gen: 'Gen12',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 10, rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL320 Gen11',        vendor: 'HPE', gen: 'Gen11',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 8,  rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL360 Gen11',        vendor: 'HPE', gen: 'Gen11',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 10, rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL325 Gen11',        vendor: 'HPE', gen: 'Gen11',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 10, rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL365 Gen11',        vendor: 'HPE', gen: 'Gen11',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 10, rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant RL300 Gen11',        vendor: 'HPE', gen: 'Gen11',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 10, rearLayout: 'ocp', ocpCards: 1, lomPorts: 2 } },
  { model: 'ProLiant DL360 Gen10 Plus',   vendor: 'HPE', gen: 'Gen10+', stencil: 'hpe-rack-1u', u: 1, opts: { bays: 10, rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'ProLiant DL325 Gen10 Plus v2',vendor: 'HPE', gen: 'Gen10+', stencil: 'hpe-rack-1u', u: 1, opts: { bays: 10, rearLayout: 'fc', fcCards: 1, lomPorts: 4 } },
  { model: 'ProLiant DL365 Gen10 Plus',   vendor: 'HPE', gen: 'Gen10+', stencil: 'hpe-rack-1u', u: 1, opts: { bays: 10, rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'ProLiant DL20 Gen10 Plus',    vendor: 'HPE', gen: 'Gen10+', stencil: 'hpe-rack-1u', u: 1, opts: { bays: 4,  rearLayout: 'ocp', ocpCards: 0, lomPorts: 2 } },
  { model: 'ProLiant DL360 Gen10',        vendor: 'HPE', gen: 'Gen10',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 8,  rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'ProLiant DL325 Gen10',        vendor: 'HPE', gen: 'Gen10',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 10, rearLayout: 'fc', fcCards: 1, lomPorts: 4 } },
  { model: 'ProLiant DL160 Gen10',        vendor: 'HPE', gen: 'Gen10',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 8,  rearLayout: 'fc', fcCards: 1, lomPorts: 2 } },
  { model: 'ProLiant DL20 Gen10',         vendor: 'HPE', gen: 'Gen10',  stencil: 'hpe-rack-1u', u: 1, opts: { bays: 4,  rearLayout: 'ocp', ocpCards: 0, lomPorts: 2 } },
  { model: 'ProLiant DL360 Gen9',         vendor: 'HPE', gen: 'Gen9',   stencil: 'hpe-rack-1u', u: 1, opts: { bays: 8,  rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },

  // ===================== HPE 2U =====================
  { model: 'ProLiant DL340 Gen12',        vendor: 'HPE', gen: 'Gen12',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL380 Gen12',        vendor: 'HPE', gen: 'Gen12',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 8,  rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL345 Gen12',        vendor: 'HPE', gen: 'Gen12',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL380 Gen11',        vendor: 'HPE', gen: 'Gen11',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 8,  rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL345 Gen11',        vendor: 'HPE', gen: 'Gen11',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL385 Gen11',        vendor: 'HPE', gen: 'Gen11',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL560 Gen11',        vendor: 'HPE', gen: 'Gen11',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, rearLayout: 'ocp', ocpCards: 2, lom: false } },
  { model: 'ProLiant DL380 Gen10 Plus',   vendor: 'HPE', gen: 'Gen10+', stencil: 'hpe-rack-2u', u: 2, opts: { bays: 8,  rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'ProLiant DL345 Gen10 Plus',   vendor: 'HPE', gen: 'Gen10+', stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, rearLayout: 'fc', fcCards: 1, lomPorts: 4 } },
  { model: 'ProLiant DL385 Gen10 Plus v2',vendor: 'HPE', gen: 'Gen10+', stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'ProLiant DL380 Gen10',        vendor: 'HPE', gen: 'Gen10',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 8,  rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'ProLiant DL385 Gen10',        vendor: 'HPE', gen: 'Gen10',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'ProLiant DL560 Gen10',        vendor: 'HPE', gen: 'Gen10',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'ProLiant DL180 Gen10',        vendor: 'HPE', gen: 'Gen10',  stencil: 'hpe-rack-2u', u: 2, opts: { bays: 12, bayType: 'lff', rearLayout: 'fc', fcCards: 1, lomPorts: 2 } },
  { model: 'ProLiant DL380 Gen9',         vendor: 'HPE', gen: 'Gen9',   stencil: 'hpe-rack-2u', u: 2, opts: { bays: 8,  rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'ProLiant DL560 Gen9',         vendor: 'HPE', gen: 'Gen9',   stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, rearLayout: 'fc', fcCards: 2, lomPorts: 4 } },
  { model: 'Apollo 4200 Gen10 Plus',      vendor: 'HPE', gen: 'Gen10+', stencil: 'hpe-rack-2u', u: 2, opts: { bays: 24, bayType: 'lff', rearLayout: 'fc', fcCards: 1, lomPorts: 2 } },

  // ===================== HPE 4U =====================
  { model: 'ProLiant DL380a Gen12',       vendor: 'HPE', gen: 'Gen12',  stencil: 'dell-rack-4u', u: 4, opts: { bays: 8,  lomPorts: 2 } },
  { model: 'ProLiant DL380a Gen11',       vendor: 'HPE', gen: 'Gen11',  stencil: 'dell-rack-4u', u: 4, opts: { bays: 8,  lomPorts: 2 } },
  { model: 'ProLiant DL580 Gen10',        vendor: 'HPE', gen: 'Gen10',  stencil: 'dell-rack-4u', u: 4, opts: { bays: 24, lomPorts: 4 } },
  { model: 'ProLiant DL580 Gen9',         vendor: 'HPE', gen: 'Gen9',   stencil: 'dell-rack-4u', u: 4, opts: { bays: 24, lomPorts: 4 } },

  // ===================== SWITCHES =====================
  { model: 'Catalyst 9300-48P',      vendor: 'Cisco', stencil: 'switch-1u-rj45', u: 1, opts: { ports: 48, uplinks: 4, portPrefix: 'Gi1/0/', uplinkPrefix: 'Te1/1/' } },
  { model: 'Catalyst 9300-24P',      vendor: 'Cisco', stencil: 'switch-1u-rj45', u: 1, opts: { ports: 24, uplinks: 4, portPrefix: 'Gi1/0/', uplinkPrefix: 'Te1/1/' } },
  { model: 'Catalyst 9300X-48HX',    vendor: 'Cisco', stencil: 'switch-1u-rj45', u: 1, opts: { ports: 48, uplinks: 4, portPrefix: 'Te1/0/', uplinkPrefix: 'Fo1/1/' } },
  { model: 'Catalyst 9200-48T',      vendor: 'Cisco', stencil: 'switch-1u-rj45', u: 1, opts: { ports: 48, uplinks: 4, portPrefix: 'Gi1/0/', uplinkPrefix: 'Te1/1/' } },
  { model: 'Catalyst 9200L-24P',     vendor: 'Cisco', stencil: 'switch-1u-rj45', u: 1, opts: { ports: 24, uplinks: 4, portPrefix: 'Gi1/0/', uplinkPrefix: 'Te1/1/' } },
  { model: 'Catalyst 9500-48Y4C',    vendor: 'Cisco', stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 48, uplinks: 4, portPrefix: 'Twe1/0/' } },
  { model: 'Nexus 93180YC-FX',       vendor: 'Cisco', stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 48, uplinks: 6, portPrefix: 'Eth1/' } },
  { model: 'Nexus 93180YC-EX',       vendor: 'Cisco', stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 48, uplinks: 6, portPrefix: 'Eth1/' } },
  { model: 'Nexus 93108TC-EX',       vendor: 'Cisco', stencil: 'switch-1u-rj45', u: 1, opts: { ports: 48, uplinks: 6, portPrefix: 'Eth1/' } },
  { model: 'Nexus 92300YC',          vendor: 'Cisco', stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 48, uplinks: 6, portPrefix: 'Eth1/' } },
  { model: 'Nexus 92348GC-FX3',      vendor: 'Cisco', stencil: 'switch-1u-rj45', u: 1, opts: { ports: 48, uplinks: 6, portPrefix: 'Eth1/' } },
  { model: 'Nexus 9336C-FX2',        vendor: 'Cisco', stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 36, uplinks: 0, portPrefix: 'Eth1/' } },
  { model: 'MDS 9148T',              vendor: 'Cisco', stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 48, uplinks: 0, portPrefix: 'fc1/' } },
  { model: 'PowerSwitch S5248F-ON',  vendor: 'Dell',  stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 48, uplinks: 4, portPrefix: 'Te1/0/' } },
  { model: 'PowerSwitch S5224F-ON',  vendor: 'Dell',  stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 24, uplinks: 4, portPrefix: 'Te1/0/' } },
  { model: 'PowerSwitch S4148F-ON',  vendor: 'Dell',  stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 48, uplinks: 6, portPrefix: 'Te1/0/' } },
  { model: 'PowerSwitch S4148T-ON',  vendor: 'Dell',  stencil: 'switch-1u-rj45', u: 1, opts: { ports: 48, uplinks: 6, portPrefix: 'Te1/0/' } },
  { model: 'PowerSwitch S4128F-ON',  vendor: 'Dell',  stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 28, uplinks: 2, portPrefix: 'Te1/0/' } },
  { model: 'PowerSwitch N3248TE-ON', vendor: 'Dell',  stencil: 'switch-1u-rj45', u: 1, opts: { ports: 48, uplinks: 4, portPrefix: 'Gi1/0/' } },
  { model: 'Aruba CX 6300M 48G',     vendor: 'Aruba', stencil: 'switch-1u-rj45', u: 1, opts: { ports: 48, uplinks: 4, portPrefix: '1/1/' } },
  { model: 'Aruba CX 6200F 48G',     vendor: 'Aruba', stencil: 'switch-1u-rj45', u: 1, opts: { ports: 48, uplinks: 4, portPrefix: '1/1/' } },
  { model: 'Aruba CX 8325-48Y8C',    vendor: 'Aruba', stencil: 'switch-1u-sfp',  u: 1, opts: { ports: 48, uplinks: 8, portPrefix: '1/1/' } },
  { model: 'Aruba 2930F 48G',        vendor: 'Aruba', stencil: 'switch-1u-rj45', u: 1, opts: { ports: 48, uplinks: 4, portPrefix: '1/' } },
  { model: 'Brocade G620',           vendor: 'Broadcom', stencil: 'switch-1u-sfp', u: 1, opts: { ports: 48, uplinks: 0, portPrefix: 'FC ' } },
  { model: 'Brocade G610',           vendor: 'Broadcom', stencil: 'switch-1u-sfp', u: 1, opts: { ports: 24, uplinks: 0, portPrefix: 'FC ' } },

  // ===================== STORAGE =====================
  { model: 'FlashArray//X R4',       vendor: 'Pure Storage', stencil: 'pure-flasharray', u: 3, opts: { bays: 28 } },
  { model: 'FlashArray//X R5',       vendor: 'Pure Storage', stencil: 'pure-flasharray', u: 3, opts: { bays: 28 } },
  { model: 'FlashArray//C R4',       vendor: 'Pure Storage', stencil: 'pure-flasharray', u: 3, opts: { bays: 28 } },
  { model: 'FlashArray//C R5',       vendor: 'Pure Storage', stencil: 'pure-flasharray', u: 3, opts: { bays: 28 } },
  { model: 'FlashArray//XL 130',     vendor: 'Pure Storage', stencil: 'pure-flasharray', u: 5, opts: { bays: 40 } },
  { model: 'FlashArray//XL 170',     vendor: 'Pure Storage', stencil: 'pure-flasharray', u: 5, opts: { bays: 40 } },
  { model: 'FlashArray//E',          vendor: 'Pure Storage', stencil: 'pure-flasharray', u: 3, opts: { bays: 28 } },
  { model: 'PowerVault ME5024',      vendor: 'Dell', stencil: 'dell-me5-2u', u: 2, opts: { bays: 24, bayType: 'sff' } },
  { model: 'PowerVault ME5012',      vendor: 'Dell', stencil: 'dell-me5-2u', u: 2, opts: { bays: 12, bayType: 'lff' } },
  { model: 'PowerVault ME5084',      vendor: 'Dell', stencil: 'dell-me5-2u', u: 5, opts: { bays: 24, bayType: 'lff' } },
  { model: 'PowerVault ME4024',      vendor: 'Dell', stencil: 'dell-me5-2u', u: 2, opts: { bays: 24, bayType: 'sff' } },
  { model: 'PowerVault ME4012',      vendor: 'Dell', stencil: 'dell-me5-2u', u: 2, opts: { bays: 12, bayType: 'lff' } },
  { model: 'PowerStore 500T',        vendor: 'Dell', stencil: 'dell-me5-2u', u: 2, opts: { bays: 25, bayType: 'sff' } },
  { model: 'PowerStore 1200T',       vendor: 'Dell', stencil: 'dell-me5-2u', u: 2, opts: { bays: 25, bayType: 'sff' } },
  { model: 'PowerStore 3200T',       vendor: 'Dell', stencil: 'dell-me5-2u', u: 2, opts: { bays: 25, bayType: 'sff' } },
  { model: 'Unity XT 380F',          vendor: 'Dell', stencil: 'dell-me5-2u', u: 2, opts: { bays: 25, bayType: 'sff' } },
  { model: 'Unity XT 480F',          vendor: 'Dell', stencil: 'dell-me5-2u', u: 2, opts: { bays: 25, bayType: 'sff' } },

  // ===================== INFRASTRUCTURE =====================
  { model: 'AP8659 PDU',             vendor: 'APC', stencil: 'pdu-1u-horizontal', u: 1, opts: { outlets: 24 } },
  { model: 'AP7921B PDU',            vendor: 'APC', stencil: 'pdu-1u-horizontal', u: 1, opts: { outlets: 8 } },
  { model: 'Fiber Patch Panel 24× LC', vendor: 'Generic', stencil: 'patch-panel-lc', u: 1, opts: { ports: 24 } },
  { model: 'Fiber Patch Panel 12× LC', vendor: 'Generic', stencil: 'patch-panel-lc', u: 1, opts: { ports: 12 } },
  { model: 'Copper Patch Panel 24× RJ45', vendor: 'Generic', stencil: 'patch-panel-cat', u: 1, opts: { ports: 24 } },
  { model: 'Blank Filler 1U',        vendor: 'Generic', stencil: 'blank-filler', u: 1, opts: { uHeight: 1 } },
  { model: 'Blank Filler 2U',        vendor: 'Generic', stencil: 'blank-filler', u: 2, opts: { uHeight: 2 } },
  { model: 'Brush Panel 1U',         vendor: 'Generic', stencil: 'brush-panel', u: 1, opts: { uHeight: 1 } },
  { model: 'Brush Panel 2U',         vendor: 'Generic', stencil: 'brush-panel', u: 2, opts: { uHeight: 2 } },
  { model: 'Cable Manager 1U',       vendor: 'Generic', stencil: 'cable-manager', u: 1, opts: { uHeight: 1, rings: 7 } },
  { model: 'Cable Manager 2U',       vendor: 'Generic', stencil: 'cable-manager', u: 2, opts: { uHeight: 2, rings: 7 } },

  // ===================== FIREWALL =====================
  // Port counts per RACKVIEW_FORTIGATE_PORTLAR.md (vendor datasheet figures). sfpPorts folds
  // together SFP/SFP+/SFP28 since they're visually identical (rvFortiSfp doesn't distinguish
  // speed) — only the physically-larger QSFP gets its own count.
  // Every FortiGate model now uses a hand-matched replica of its real front panel (exact port
  // positions/names/counts from Fortinet's own datasheet) instead of the parametric skeleton —
  // see the 'fortigate-*' stencils. 1000F's u was corrected 1->2 (it's actually a 2U chassis).
  { model: 'FortiGate 200G',         vendor: 'Fortinet', stencil: 'fortigate-200g',  u: 1, opts: {} },
  { model: 'FortiGate 400F',         vendor: 'Fortinet', stencil: 'fortigate-400f',  u: 1, opts: {} },
  { model: 'FortiGate 600F',         vendor: 'Fortinet', stencil: 'fortigate-600f',  u: 1, opts: {} },
  { model: 'FortiGate 900G',         vendor: 'Fortinet', stencil: 'fortigate-900g',  u: 1, opts: {} },
  { model: 'FortiGate 1000F',        vendor: 'Fortinet', stencil: 'fortigate-1000f', u: 2, opts: {} },
  { model: 'FortiGate 1800F',        vendor: 'Fortinet', stencil: 'fortigate-1800f', u: 2, opts: {} },
  { model: 'FortiGate 2600F',        vendor: 'Fortinet', stencil: 'fortigate-2600f', u: 2, opts: {} },
  { model: 'FortiGate 3500F',        vendor: 'Fortinet', stencil: 'fortigate-3500f', u: 2, opts: {} },
  { model: 'FortiGate 90G',          vendor: 'Fortinet', stencil: 'fortigate-90g',   u: 1, opts: {} },
  { model: 'FortiGate 120G',         vendor: 'Fortinet', stencil: 'fortigate-120g',  u: 1, opts: {} },
  // Hand-matched to Palo Alto's real PA-3400 Series datasheet front-panel photo.
  { model: 'PA-3410',                vendor: 'Palo Alto', stencil: 'palo-pa3400', u: 1, opts: {} },
  { model: 'PA-3420',                vendor: 'Palo Alto', stencil: 'palo-pa3400', u: 1, opts: {} },
  { model: 'PA-3440',                vendor: 'Palo Alto', stencil: 'palo-pa3400', u: 1, opts: { qsfp: true } },
  { model: 'PA-5410',                vendor: 'Palo Alto', stencil: 'firewall-2u', u: 2, opts: { copperPorts: 16, sfpPorts: 16, qsfpPorts: 4 } },
  { model: 'PA-5420',                vendor: 'Palo Alto', stencil: 'firewall-2u', u: 2, opts: { copperPorts: 16, sfpPorts: 16, qsfpPorts: 8 } },
  { model: 'PA-5430',                vendor: 'Palo Alto', stencil: 'firewall-2u', u: 2, opts: { copperPorts: 16, sfpPorts: 16, qsfpPorts: 8 } },
  { model: 'PA-5440',                vendor: 'Palo Alto', stencil: 'firewall-2u', u: 2, opts: { copperPorts: 16, sfpPorts: 24, qsfpPorts: 8 } },
  // Hand-matched to Palo Alto's real PA-1400 Series datasheet front-panel photo.
  { model: 'PA-1410',                vendor: 'Palo Alto', stencil: 'palo-pa1400', u: 1, opts: {} },
  { model: 'PA-1420',                vendor: 'Palo Alto', stencil: 'palo-pa1400', u: 1, opts: {} },
  // Port counts corrected against Cisco's own datasheets (base-chassis interfaces; optional
  // network-module slots aren't counted since they're not always populated). Still on the
  // generic parametric skeleton — these datasheets are text spec tables, not a numbered front-
  // panel diagram like Fortinet/Palo Alto's, so no dedicated exact-position stencil yet.
  { model: 'Firepower 1140',         vendor: 'Cisco', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 8, sfpPorts: 4 } },
  { model: 'Firepower 2130',         vendor: 'Cisco', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 12, sfpPorts: 4 } },
  { model: 'Firepower 2140',         vendor: 'Cisco', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 12, sfpPorts: 4 } },
  { model: 'Secure Firewall 3120',   vendor: 'Cisco', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 8, sfpPorts: 8 } },
  { model: 'Secure Firewall 3140',   vendor: 'Cisco', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 8, sfpPorts: 8 } },
  { model: 'Firepower 4115',         vendor: 'Cisco', stencil: 'firewall-2u', u: 2, opts: { copperPorts: 0, sfpPorts: 8 } },
  { model: 'Firepower 4125',         vendor: 'Cisco', stencil: 'firewall-2u', u: 2, opts: { copperPorts: 0, sfpPorts: 8 } },
  { model: 'Firepower 9300',         vendor: 'Cisco', stencil: 'firewall-2u', u: 2, opts: { copperPorts: 8, sfpPorts: 16, qsfpPorts: 12 } },
  // Port counts corrected against Juniper's own datasheets (onboard ports; PIM expansion slots
  // not counted since they're optional/not always populated).
  { model: 'SRX1500',                vendor: 'Juniper', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 13, sfpPorts: 9 } },
  { model: 'SRX4100',                vendor: 'Juniper', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 2,  sfpPorts: 10 } },
  { model: 'SRX4200',                vendor: 'Juniper', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 2,  sfpPorts: 10 } },
  { model: 'SonicWall NSa 4700',     vendor: 'SonicWall', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 16, sfpPorts: 8 } },
  { model: 'SonicWall NSa 6700',     vendor: 'SonicWall', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 16, sfpPorts: 12 } },
  // Port counts corrected against Check Point's own datasheets. 6600 matches the "Plus"
  // configuration (10x copper + 4x SFP+); 16600 is the Maestro Hyperscale orchestrator SKU
  // (2x 1GbE copper + 2x 100GbE QSFP28 — much sparser than a typical 2U firewall).
  { model: 'Check Point 6600',       vendor: 'Check Point', stencil: 'firewall-1u', u: 1, opts: { copperPorts: 10, sfpPorts: 4 } },
  { model: 'Check Point 16600',      vendor: 'Check Point', stencil: 'firewall-2u', u: 2, opts: { copperPorts: 2,  sfpPorts: 0, qsfpPorts: 2 } },

  // ===================== ROUTER =====================
  { model: 'ISR 4321',               vendor: 'Cisco', stencil: 'router-1u', u: 1, opts: { gigPorts: 2, tenGigPorts: 0, nimSlots: 2 } },
  { model: 'ISR 4331',               vendor: 'Cisco', stencil: 'router-1u', u: 1, opts: { gigPorts: 3, tenGigPorts: 0, nimSlots: 2 } },
  { model: 'ISR 4351',               vendor: 'Cisco', stencil: 'router-1u', u: 1, opts: { gigPorts: 3, tenGigPorts: 0, nimSlots: 3 } },
  { model: 'ISR 4431',               vendor: 'Cisco', stencil: 'router-1u', u: 1, opts: { gigPorts: 4, tenGigPorts: 0, nimSlots: 3 } },
  { model: 'ISR 4451-X',             vendor: 'Cisco', stencil: 'router-2u', u: 2, opts: { gigPorts: 4, tenGigPorts: 0, nimSlots: 6 } },
  { model: 'ASR 1001-X',             vendor: 'Cisco', stencil: 'router-1u', u: 1, opts: { gigPorts: 6, tenGigPorts: 2, nimSlots: 1 } },
  { model: 'ASR 1001-HX',            vendor: 'Cisco', stencil: 'router-1u', u: 1, opts: { gigPorts: 8, tenGigPorts: 4, nimSlots: 1 } },
  { model: 'ASR 1002-HX',            vendor: 'Cisco', stencil: 'router-2u', u: 2, opts: { gigPorts: 8, tenGigPorts: 8, nimSlots: 4 } },
  { model: 'Catalyst 8200L',         vendor: 'Cisco', stencil: 'router-1u', u: 1, opts: { gigPorts: 4, tenGigPorts: 0, nimSlots: 1 } },
  { model: 'Catalyst 8300-1N1S',     vendor: 'Cisco', stencil: 'router-1u', u: 1, opts: { gigPorts: 4, tenGigPorts: 2, nimSlots: 2 } },
  { model: 'Catalyst 8300-2N2S',     vendor: 'Cisco', stencil: 'router-2u', u: 2, opts: { gigPorts: 4, tenGigPorts: 2, nimSlots: 4 } },
  { model: 'Catalyst 8500-12X',      vendor: 'Cisco', stencil: 'router-2u', u: 2, opts: { gigPorts: 0, tenGigPorts: 12, nimSlots: 2 } },
  { model: 'MX204',                  vendor: 'Juniper', stencil: 'router-1u', u: 1, opts: { gigPorts: 8, tenGigPorts: 4, nimSlots: 1 } },
  { model: 'MX10003',                vendor: 'Juniper', stencil: 'router-2u', u: 2, opts: { gigPorts: 0, tenGigPorts: 12, nimSlots: 2 } },
  { model: 'ACX7100-32C',            vendor: 'Juniper', stencil: 'spine-switch', u: 1, opts: { uHeight: 1, ports: 32, portPrefix: 'et-0/0/' } },

  // ===================== SPINE / BACKBONE =====================
  { model: 'Nexus 9364C',            vendor: 'Cisco', stencil: 'spine-switch', u: 2, opts: { uHeight: 2, ports: 64, portPrefix: 'Eth1/' } },
  { model: 'Nexus 9332C',            vendor: 'Cisco', stencil: 'spine-switch', u: 1, opts: { uHeight: 1, ports: 32, portPrefix: 'Eth1/' } },
  { model: 'Nexus 9316D-GX',         vendor: 'Cisco', stencil: 'spine-switch', u: 1, opts: { uHeight: 1, ports: 16, portPrefix: 'Eth1/' } },
  { model: 'Nexus 9348D-GX2A',       vendor: 'Cisco', stencil: 'spine-switch', u: 2, opts: { uHeight: 2, ports: 48, portPrefix: 'Eth1/' } },
  { model: 'Nexus 9408',             vendor: 'Cisco', stencil: 'spine-switch', u: 4, opts: { uHeight: 4, ports: 64, portPrefix: 'Eth1/' } },
  { model: 'PowerSwitch Z9432F-ON',  vendor: 'Dell', stencil: 'spine-switch', u: 1, opts: { uHeight: 1, ports: 32, portPrefix: 'Eth1/' } },
  { model: 'PowerSwitch Z9664F-ON',  vendor: 'Dell', stencil: 'spine-switch', u: 2, opts: { uHeight: 2, ports: 64, portPrefix: 'Eth1/' } },
  { model: 'PowerSwitch Z9332F-ON',  vendor: 'Dell', stencil: 'spine-switch', u: 1, opts: { uHeight: 1, ports: 32, portPrefix: 'Eth1/' } },
  { model: 'Arista 7050CX3-32S',     vendor: 'Arista', stencil: 'spine-switch', u: 1, opts: { uHeight: 1, ports: 32, portPrefix: 'Et' } },
  { model: 'Arista 7060CX-32S',      vendor: 'Arista', stencil: 'spine-switch', u: 1, opts: { uHeight: 1, ports: 32, portPrefix: 'Et' } },
  { model: 'Arista 7280CR3-32P4',    vendor: 'Arista', stencil: 'spine-switch', u: 1, opts: { uHeight: 1, ports: 32, portPrefix: 'Et' } },
  { model: 'Aruba CX 8360-32Y4C',    vendor: 'Aruba', stencil: 'spine-switch', u: 1, opts: { uHeight: 1, ports: 32, portPrefix: '1/1/' } },
  { model: 'Aruba CX 9300-32D',      vendor: 'Aruba', stencil: 'spine-switch', u: 1, opts: { uHeight: 1, ports: 32, portPrefix: '1/1/' } },

  // ===================== MODULAR CHASSIS =====================
  { model: 'Nexus 9504',             vendor: 'Cisco', stencil: 'modular-chassis', u: 7,  opts: { uHeight: 7,  supervisors: 2, lineCardSlots: 4,  fabricModules: 6, psuCount: 4,
      cards: [ {model:'N9K-X9736C-FX', ports:36, type:'qsfp'}, {model:'N9K-X9736C-FX', ports:36, type:'qsfp'}, {model:'N9K-X9788TC-FX', ports:48, type:'sfp'}, null ] } },
  { model: 'Nexus 9508',             vendor: 'Cisco', stencil: 'modular-chassis', u: 13, opts: { uHeight: 13, supervisors: 2, lineCardSlots: 8,  fabricModules: 6, psuCount: 6,
      cards: [ {model:'N9K-X9736C-FX', ports:36, type:'qsfp'}, {model:'N9K-X9736C-FX', ports:36, type:'qsfp'}, {model:'N9K-X9788TC-FX', ports:48, type:'sfp'}, {model:'N9K-X9788TC-FX', ports:48, type:'sfp'}, null, null, null, null ] } },
  { model: 'Nexus 9516',             vendor: 'Cisco', stencil: 'modular-chassis', u: 20, opts: { uHeight: 20, supervisors: 2, lineCardSlots: 16, fabricModules: 6, psuCount: 8, cards: [] } },
  { model: 'Catalyst 9606R',         vendor: 'Cisco', stencil: 'modular-chassis', u: 6,  opts: { uHeight: 6,  supervisors: 2, lineCardSlots: 4,  fabricModules: 4, psuCount: 4, cards: [] } },
  { model: 'Catalyst 9410R',         vendor: 'Cisco', stencil: 'modular-chassis', u: 13, opts: { uHeight: 13, supervisors: 2, lineCardSlots: 8,  fabricModules: 4, psuCount: 8, cards: [] } },
  { model: 'MX480',                  vendor: 'Juniper', stencil: 'modular-chassis', u: 8, opts: { uHeight: 8, supervisors: 2, lineCardSlots: 6, fabricModules: 4, psuCount: 4, cards: [] } },
  { model: 'MX960',                  vendor: 'Juniper', stencil: 'modular-chassis', u: 16, opts: { uHeight: 16, supervisors: 2, lineCardSlots: 11, fabricModules: 6, psuCount: 4, cards: [] } },
  { model: 'Arista 7504R3',          vendor: 'Arista', stencil: 'modular-chassis', u: 7,  opts: { uHeight: 7,  supervisors: 2, lineCardSlots: 4, fabricModules: 6, psuCount: 4, cards: [] } },
  { model: 'Arista 7508R3',          vendor: 'Arista', stencil: 'modular-chassis', u: 13, opts: { uHeight: 13, supervisors: 2, lineCardSlots: 8, fabricModules: 6, psuCount: 6, cards: [] } }
];

function rvFindDevice(model) {
  return RV_CATALOG.find(d => d.model.toLowerCase() === String(model).toLowerCase());
}

function rvRender(svg, model, face, x, y, w, hooks) {
  const dev = rvFindDevice(model);
  if (!dev) throw new Error('Model not found: ' + model);
  const st = RV_STENCILS[dev.stencil];
  if (!st) throw new Error('Stencil not found: ' + dev.stencil);
  rvInjectDefs(svg);
  const g = el('g', { 'data-model': model, 'data-face': face }, svg);
  const ctx = Object.assign({
    x, y, w, h: dev.u * RV_U - 1, uHeight: dev.u,
    registerPort: (hooks && hooks.registerPort) || null,
    onPortClick: (hooks && hooks.onPortClick) || null,
    onPortContextMenu: (hooks && hooks.onPortContextMenu) || null,
    getLabelOffset: (hooks && hooks.getLabelOffset) || null,
    onLabelDrag: (hooks && hooks.onLabelDrag) || null,
    getLabelText: (hooks && hooks.getLabelText) || null,
    onLabelRename: (hooks && hooks.onLabelRename) || null,
    toSvgPoint: (hooks && hooks.toSvgPoint) || null,
    rearConfig: (hooks && hooks.rearConfig) || null
  }, dev.opts || {});
  (face === 'rear' ? st.rear : st.front).call(st, g, ctx);
  return g;
}

if (typeof module !== 'undefined') module.exports = { RV_CATALOG, rvFindDevice, rvRender };
