// Small toolbar badge: counts LLDP-seen neighbors with no matching Cable record, from
// whichever LLDP Discovery pull is newest per switch. Not a live scan — see the title
// tooltip. Included by every page's toolbar next to the Tools dropdown.
(async () => {
  try {
    const res = await fetch("/api/lldp/unmanaged-summary");
    if (!res.ok) return;
    const data = await res.json();
    const badge = document.getElementById("lldp-unmanaged-badge");
    if (!badge || !data.total) return;
    badge.textContent = data.total;
    badge.style.display = "inline-block";
    badge.onclick = () => { window.location.href = "lldp.html"; };
  } catch (e) {
    // Non-fatal — badge just stays hidden.
  }
})();
