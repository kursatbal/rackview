const RV_DEFS = `
<linearGradient id="rvChasLight" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#E8E6DE"/><stop offset="0.10" stop-color="#D3D1C7"/>
  <stop offset="0.90" stop-color="#B8B6AD"/><stop offset="1" stop-color="#96948C"/>
</linearGradient>
<linearGradient id="rvChasDark" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#5E5D59"/><stop offset="0.10" stop-color="#484744"/>
  <stop offset="0.90" stop-color="#353432"/><stop offset="1" stop-color="#252423"/>
</linearGradient>
<linearGradient id="rvEarLight" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#A8A69D"/><stop offset="0.5" stop-color="#C4C2B8"/><stop offset="1" stop-color="#8E8C84"/>
</linearGradient>
<linearGradient id="rvEarDark" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#3E3D3B"/><stop offset="0.5" stop-color="#5C5B57"/><stop offset="1" stop-color="#32312F"/>
</linearGradient>
<linearGradient id="rvBayLight" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#C9C7BE"/><stop offset="0.5" stop-color="#AEACA3"/><stop offset="1" stop-color="#918F88"/>
</linearGradient>
<linearGradient id="rvBayDark" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#4A4946"/><stop offset="0.5" stop-color="#3A3937"/><stop offset="1" stop-color="#2A2927"/>
</linearGradient>
<linearGradient id="rvHandle" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#4A4946"/><stop offset="0.4" stop-color="#6B6A65"/><stop offset="1" stop-color="#3C3B39"/>
</linearGradient>
<linearGradient id="rvPanel" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#6E6D68"/><stop offset="0.25" stop-color="#95948E"/>
  <stop offset="0.75" stop-color="#7C7B76"/><stop offset="1" stop-color="#5A5955"/>
</linearGradient>
<linearGradient id="rvPsu" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#9C9A93"/><stop offset="0.5" stop-color="#7E7D77"/><stop offset="1" stop-color="#5E5D59"/>
</linearGradient>
<linearGradient id="rvCard" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#A6A49D"/><stop offset="0.5" stop-color="#8E8C85"/><stop offset="1" stop-color="#6E6D68"/>
</linearGradient>
<linearGradient id="rvScreen" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1A2E24"/><stop offset="0.5" stop-color="#2C4A38"/><stop offset="1" stop-color="#16261E"/>
</linearGradient>
<linearGradient id="rvPureOrange" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#FF8A3D"/><stop offset="0.5" stop-color="#F2621F"/><stop offset="1" stop-color="#C4430C"/>
</linearGradient>
<radialGradient id="rvLedGreen"><stop offset="0" stop-color="#D8FFB0"/><stop offset="0.35" stop-color="#8FE028"/><stop offset="1" stop-color="#4C8A12"/></radialGradient>
<radialGradient id="rvLedAmber"><stop offset="0" stop-color="#FFE9B8"/><stop offset="0.35" stop-color="#F5A623"/><stop offset="1" stop-color="#A8660A"/></radialGradient>
<radialGradient id="rvLedBlue"><stop offset="0" stop-color="#CFE8FF"/><stop offset="0.35" stop-color="#3D9BE8"/><stop offset="1" stop-color="#14548F"/></radialGradient>
<filter id="rvShadow" x="-25%" y="-25%" width="150%" height="150%">
  <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" flood-color="#000" flood-opacity="0.33"/>
</filter>
<filter id="rvGlow" x="-90%" y="-90%" width="280%" height="280%">
  <feGaussianBlur stdDeviation="0.88" result="b"/>
  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
`;

function rvInjectDefs(svg) {
  if (svg.querySelector('defs[data-rv]')) return;
  const d = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  d.setAttribute('data-rv', '1');
  d.innerHTML = RV_DEFS;
  svg.insertBefore(d, svg.firstChild);
}

const RV_COLORS = {
  bgLight: '#F1EFE8', chassisLight: '#D3D1C7', midLight: '#B4B2A9',
  mid: '#888780', midDark: '#5F5E5A', dark: '#444441', darkest: '#2C2C2A',
  fiber: '#5DCAA5', fiberDeep: '#1D9E75', fiberDark: '#0F6E56',
  ledGreen: '#97C459', ledGreenDeep: '#639922',
  power: '#A32D2D', powerDark: '#501313',
  pureOrange: '#F2621F',
  selectFill: '#9FE1CB', selectStroke: '#0F6E56',
  relatedFill: '#FAC775', relatedStroke: '#854F0B'
};

const RV_ROLE_COLORS = {
  switch:      '#2E5E8E',
  'san-switch': '#534AB7', // same purple as the SAS/FC cable medium — ties the two together visually
  server:      '#1D7A5E',
  storage:     '#8E5A1F',
  firewall:    '#A83232',
  router:      '#2F6FA8',
  pdu:         '#8E3030',
  panel:       '#6E6D68',
  passthrough: '#6E6D68',
  other:       '#6E6D68'
};

const RV_MEDIA = {
  fiber:  { color: '#1D9E75', width: 1.4, boot: '#0F6E56', label: 'Fiber OM4 LC' },
  dac:    { color: '#2C2C2A', width: 2.4, boot: '#5F5E5A', label: 'DAC' },
  cat6a:  { color: '#888780', width: 2.0, boot: '#5F5E5A', label: 'Cat6a copper' },
  power:  { color: '#A32D2D', width: 2.6, boot: '#501313', label: 'Power C13' },
  sas:    { color: '#534AB7', width: 2.2, boot: '#26215C', label: 'SAS' }
};

if (typeof module !== 'undefined') module.exports = { RV_DEFS, rvInjectDefs, RV_COLORS, RV_MEDIA, RV_ROLE_COLORS };
