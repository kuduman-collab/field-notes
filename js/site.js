/* Half-Baked Thoughts — shared site logic (sidebar, dashboard, post rendering) */

const CATEGORIES = {
  health:      { label: "Health & Nutrition", light: "#5cc8a8", dark: "#1e7a63", icon: "\u{1FAC0}" },
  food:        { label: "Food",               light: "#f2c14e", dark: "#c98f1e", icon: "\u{1F372}" },
  geopolitics: { label: "Geopolitics",        light: "#ff8a5c", dark: "#d6482c", icon: "\u{1F30D}" },
  family:      { label: "Family Memories",    light: "#4b5cc4", dark: "#293779", icon: "\u{1F4F7}" },
  random:      { label: "Random Thoughts",    light: "#7c7ff2", dark: "#4d4bbf", icon: "\u{1F4AD}" },
  gardening:   { label: "Gardening",          light: "#9bb168", dark: "#566b2e", icon: "\u{1F331}" }
};

const CATEGORY_ORDER = ["health", "food", "geopolitics", "family", "gardening", "random"];

// Sub-filters nested under a top-level category (shown as a collapsible dropdown)
const SUBCATEGORIES = {
  food: [ { key: "recipes", label: "Recipes", icon: "\u{1F35C}" } ]
};

function formatDate(iso){
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function sortedPosts(){
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

function countsByCategory(){
  // Top-level counts exclude posts tagged with a sub-filter (e.g. recipes),
  // so "Food" reflects just the non-recipe posts and doesn't feel crowded.
  const counts = {};
  CATEGORY_ORDER.forEach(c => counts[c] = 0);
  POSTS.forEach(p => {
    if (p.sub) return;
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  return counts;
}

function subCounts(catKey){
  const subs = SUBCATEGORIES[catKey];
  if (!subs) return {};
  const counts = {};
  subs.forEach(s => counts[s.key] = 0);
  POSTS.forEach(p => {
    if (p.category === catKey && p.sub && counts.hasOwnProperty(p.sub)) counts[p.sub]++;
  });
  return counts;
}

/* ---------------- Sidebar (index.html) ---------------- */
function renderSidebar(activeKey){
  const counts = countsByCategory();
  const total = POSTS.length;
  const list = document.getElementById("sidebarList");
  if (!list) return;

  // activeKey is "all", a plain category key like "food", or "food__recipes"
  const [activeCat, activeSub] = activeKey.includes("__") ? activeKey.split("__") : [activeKey, null];

  let html = "";
  html += `<li><a href="#" data-cat="all" class="${activeKey === "all" ? "active" : ""}">
      <span class="icon">✨</span>All Topics <span class="count">${total}</span>
    </a></li>`;

  CATEGORY_ORDER.forEach(key => {
    const cat = CATEGORIES[key];
    const subs = SUBCATEGORIES[key];
    const isOpen = subs && (activeCat === key);
    html += `<li>
      <div class="nav-row">
        <a href="#" data-cat="${key}" class="${activeCat === key && !activeSub ? "active" : ""}">
          <span class="icon">${cat.icon}</span>${cat.label} <span class="count">${counts[key] || 0}</span>
        </a>
        ${subs ? `<button type="button" class="nav-toggle${isOpen ? " open" : ""}" data-toggle="${key}" aria-label="Toggle ${cat.label} sub-items">&#9662;</button>` : ""}
      </div>`;

    if (subs){
      const sc = subCounts(key);
      html += `<ul class="nav-sub${isOpen ? " open" : ""}" data-subsfor="${key}">`;
      subs.forEach(s => {
        const subKey = `${key}__${s.key}`;
        html += `<li><a href="#" data-cat="${subKey}" class="${activeSub === s.key && activeCat === key ? "active" : ""}">
            <span class="icon">${s.icon}</span>${s.label} <span class="count">${sc[s.key] || 0}</span>
          </a></li>`;
      });
      html += `</ul>`;
    }
    html += `</li>`;
  });

  list.innerHTML = html;

  list.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const cat = a.dataset.cat;
      const url = new URL(window.location);
      if (cat === "all") url.searchParams.delete("cat");
      else url.searchParams.set("cat", cat);
      history.replaceState(null, "", url);
      renderSidebar(cat);
      renderDashboard(cat);
    });
  });

  list.querySelectorAll(".nav-toggle").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = btn.dataset.toggle;
      const sublist = list.querySelector(`.nav-sub[data-subsfor="${key}"]`);
      btn.classList.toggle("open");
      if (sublist) sublist.classList.toggle("open");
    });
  });
}

/* ---------------- Dashboard (index.html) ---------------- */
function renderDashboard(activeKey){
  const heading = document.getElementById("dashboardHeading");
  const grid = document.getElementById("bentoGrid");
  if (!grid) return;

  const [activeCat, activeSub] = activeKey.includes("__") ? activeKey.split("__") : [activeKey, null];

  let posts;
  let headingText;
  if (activeKey === "all"){
    posts = sortedPosts();
    headingText = "All Topics — latest first";
  } else if (activeSub){
    posts = sortedPosts().filter(p => p.category === activeCat && p.sub === activeSub);
    const subDef = (SUBCATEGORIES[activeCat] || []).find(s => s.key === activeSub);
    headingText = (subDef ? subDef.label : activeSub) + " — latest first";
  } else {
    posts = sortedPosts().filter(p => p.category === activeCat && !p.sub);
    headingText = CATEGORIES[activeCat].label + " — latest first";
  }

  if (heading) heading.textContent = headingText;

  if (posts.length === 0){
    grid.innerHTML = `<p style="color:var(--muted)">No posts in this category yet.</p>`;
    return;
  }

  const sizePattern = ["large", "normal", "normal", "wide", "normal", "normal", "wide"];
  let html = "";
  posts.forEach((post, i) => {
    const cat = CATEGORIES[post.category];
    const size = i === 0 ? "large" : sizePattern[i % sizePattern.length];
    const sizeClass = size === "large" ? "large" : (size === "wide" ? "wide" : "");
    html += `<a class="tile ${sizeClass}" style="background:linear-gradient(135deg, ${cat.light}, ${cat.dark})" href="post.html?slug=${post.slug}">
        <div class="cat"><span class="tile-icon">${cat.icon}</span>${cat.label}</div>
        <div>
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <div class="date">${formatDate(post.date)}</div>
        </div>
      </a>`;
  });
  grid.innerHTML = html;
}

function initHome(){
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("cat") || "all";
  renderSidebar(cat);
  renderDashboard(cat);

  const newBtn = document.getElementById("newThoughtBtn");
  if (newBtn){
    newBtn.addEventListener("click", () => {
      alert("To add a new post: open js/posts-data.js and add a new entry to the POSTS list — or just tell Claude what you want to write and it'll be added for you.");
    });
  }
}

/* ---------------- Single post (post.html) ---------------- */
const READING_MODES = [
  { key: "full",    label: "Full read" },
  { key: "edited",  label: "Edited" },
  { key: "summary", label: "Quick summary" },
  { key: "simple",  label: "Simplify" },
  { key: "spritz",  label: "AI Spritz" }
];

function renderPostBody(post, mode){
  const text = post[mode] || post.full || post.body;
  // Blocks that are already markup (pull-quotes, dividers, index rows, etc.)
  // render as-is; everything else gets wrapped in a normal paragraph tag.
  return text.split("\n\n").map(p => {
    const trimmed = p.trim();
    return trimmed.startsWith("<") ? trimmed : `<p>${p}</p>`;
  }).join("");
}

function initPost(){
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const post = POSTS.find(p => p.slug === slug);
  const wrap = document.getElementById("postContent");
  if (!wrap) return;

  if (!post){
    wrap.innerHTML = `<p class="not-found">Post not found. <a href="index.html">Back to the dashboard</a>.</p>`;
    return;
  }

  const cat = CATEGORIES[post.category];
  document.title = post.title + " — Half-Baked Thoughts";

  const availableModes = READING_MODES.filter(m => m.key === "full" ? true : !!post[m.key]);
  const showToggle = availableModes.length > 1;

  let mode = "full";

  function renderToggle(){
    if (!showToggle) return "";
    return `<div class="mode-toggle" id="modeToggle">` +
      availableModes.map(m => `<button type="button" class="mode-btn${m.key === mode ? " active" : ""}" data-mode="${m.key}">${m.label}</button>`).join("") +
      `</div>`;
  }

  function renderSources(){
    if (!post.sources || !post.sources.length) return "";
    return `<div class="sources-box">
        <h4>Sources &amp; further reading</h4>
        <ul>
          ${post.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join("")}
        </ul>
      </div>`;
  }

  function render(){
    wrap.innerHTML = `
      <span class="cat-label" style="background:${cat.dark}">${cat.icon ? cat.icon + " " : ""}${cat.label}</span>
      <h1>${post.title}</h1>
      <div class="meta">${formatDate(post.date)}</div>
      ${post.table || ""}
      ${post.diagrams || ""}
      ${renderToggle()}
      <div class="body${mode === "spritz" ? " body-spritz" : ""}">${renderPostBody(post, mode)}</div>
      ${renderSources()}
    `;
    if (showToggle){
      wrap.querySelectorAll(".mode-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          mode = btn.dataset.mode;
          render();
        });
      });
    }
  }

  render();
}

/* ---------------- About page ---------------- */
function initAbout(){
  // static content only, nothing dynamic needed yet
}
