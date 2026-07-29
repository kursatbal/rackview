let searchResults = [];
let searchActiveIndex = -1;
let searchDebounceTimer = null;

function isSearchOpen() {
  const overlay = document.getElementById("search-overlay");
  return overlay && overlay.classList.contains("open");
}

function openSearch() {
  const overlay = document.getElementById("search-overlay");
  overlay.classList.add("open");
  const input = document.getElementById("search-input");
  input.value = "";
  input.focus();
  renderSearchResults([], "text");
}

function closeSearch() {
  document.getElementById("search-overlay").classList.remove("open");
}

function highlightActiveResult() {
  const cards = document.querySelectorAll("#search-results .sr");
  cards.forEach((c, i) => c.classList.toggle("active", i === searchActiveIndex));
  const activeCard = cards[searchActiveIndex];
  if (activeCard) activeCard.scrollIntoView({ block: "nearest" });
}

function renderSearchResults(results, detectedType) {
  searchResults = results;
  searchActiveIndex = results.length ? 0 : -1;

  const badge = document.getElementById("search-type-badge");
  const showBadge = detectedType && detectedType !== "text" && document.getElementById("search-input").value.trim();
  badge.textContent = showBadge ? detectedType.toUpperCase() : "";
  badge.style.display = showBadge ? "inline-block" : "none";

  const container = document.getElementById("search-results");
  container.innerHTML = "";

  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = document.getElementById("search-input").value.trim() ? "No results." : "Type to search…";
    container.appendChild(empty);
    return;
  }

  results.forEach(r => {
    const card = document.createElement("div");
    card.className = "sr";
    const st = document.createElement("div");
    st.className = "st";
    const b = document.createElement("b");
    b.textContent = r.device_name;
    const loc = document.createElement("span");
    loc.className = "bd loc";
    loc.textContent = `${r.rack} · ${r.position}`;
    st.appendChild(b);
    st.appendChild(loc);

    const sb = document.createElement("div");
    sb.className = "sb";
    sb.textContent = r.context ? `${r.model} · ${r.context}` : r.model;

    const sm = document.createElement("div");
    sm.className = "sm";
    sm.textContent = r.match_reason;

    card.appendChild(st);
    card.appendChild(sb);
    card.appendChild(sm);
    card.onclick = () => selectSearchResult(r);
    container.appendChild(card);
  });

  highlightActiveResult();
}

async function runSearch(q) {
  if (!q.trim()) {
    renderSearchResults([], "text");
    return;
  }
  const customer = (typeof rack !== "undefined" && rack && rack.customer) || "";
  const url = `/api/search?q=${encodeURIComponent(q)}` + (customer ? `&customer=${encodeURIComponent(customer)}` : "");
  const res = await fetch(url);
  const data = await res.json();
  renderSearchResults(data.results, data.detected_type);
}

function selectSearchResult(r) {
  closeSearch();
  const sameRack = typeof rack !== "undefined" && rack && r.rack_id === rack.id;
  if (!sameRack && r.rack_id) {
    location.href = `index.html?rack=${r.rack_id}&device=${r.device_id}`;
    return;
  }
  if (typeof focusDevice === "function") focusDevice(r.device_id);
  if (window.onSelectionChange) window.onSelectionChange(r.device_id);
}

function setupSearch() {
  const btn = document.getElementById("btn-search");
  if (btn) btn.onclick = openSearch;

  document.addEventListener("keydown", ev => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
      ev.preventDefault();
      openSearch();
      return;
    }
    if (!isSearchOpen()) return;
    if (ev.key === "Escape") {
      closeSearch();
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      if (searchActiveIndex < searchResults.length - 1) searchActiveIndex++;
      highlightActiveResult();
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      if (searchActiveIndex > 0) searchActiveIndex--;
      highlightActiveResult();
    } else if (ev.key === "Enter") {
      if (searchActiveIndex >= 0 && searchResults[searchActiveIndex]) {
        selectSearchResult(searchResults[searchActiveIndex]);
      }
    }
  });

  const input = document.getElementById("search-input");
  input.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => runSearch(input.value), 150);
  });

  document.getElementById("search-overlay").addEventListener("click", ev => {
    if (ev.target.id === "search-overlay") closeSearch();
  });
}
