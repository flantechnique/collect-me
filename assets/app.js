import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- state ----------
let currentUser = null;
let categories = [];
let activeCategorySlug = null;

// ---------- elements ----------
const el = {
  authArea: document.getElementById("auth-area"),
  viewHomeBtn: document.getElementById("view-home"),
  viewCollectionBtn: document.getElementById("view-collection"),
  homeView: document.getElementById("home-view"),
  homeCategories: document.getElementById("home-categories"),
  backToHomeBtn: document.getElementById("back-to-home"),
  catalogueTitle: document.getElementById("catalogue-title"),
  catalogueView: document.getElementById("catalogue-view"),
  collectionView: document.getElementById("collection-view"),
  catalogueList: document.getElementById("catalogue-list"),
  collectionList: document.getElementById("collection-list"),
  addItemForm: document.getElementById("add-item-form"),
  addItemFields: document.getElementById("add-item-fields"),
  addItemTitle: document.getElementById("add-item-title"),
  collectionFilter: document.getElementById("collection-filter"),
  externalSearch: document.getElementById("external-search"),
  externalSearchInput: document.getElementById("external-search-input"),
  externalSearchResults: document.getElementById("external-search-results"),
  communityFeed: document.getElementById("community-feed"),
  topSearches: document.getElementById("top-searches"),
  detailView: document.getElementById("detail-view"),
  detailContent: document.getElementById("detail-content"),
  detailBack: document.getElementById("detail-back"),
};

let currentDetail = null;

// Catégories pour lesquelles une edge function de recherche externe existe.
// Ajouter une entrée ici active automatiquement le bloc de recherche pour la catégorie.
const CATEGORY_SEARCH_FUNCTIONS = {
  vinyl: "discogs-search",
  video_game: "rawg-search",
};

// Pour chaque catégorie avec recherche externe : comment transformer un résultat
// brut de l'API (voir la edge function correspondante) en { externalIds, attributes }
// compatibles avec le attribute_schema de la catégorie.
const CATEGORY_RESULT_MAPPERS = {
  vinyl: (r) => ({
    externalIds: { discogs_id: r.discogs_id },
    attributes: {
      ...(r.label && { label: r.label }),
      ...(r.year && { pressing_year: r.year }),
      ...(r.format && { format: r.format }),
    },
  }),
  video_game: (r) => ({
    externalIds: { rawg_id: r.rawg_id },
    attributes: {
      ...(r.platform && { platform: r.platform }),
      ...(r.genre && { genre: r.genre }),
      ...(r.year && { release_year: r.year }),
    },
  }),
};

// ---------- auth ----------
async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  currentUser = session?.user ?? null;
  renderAuth();

  sb.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    renderAuth();
    if (currentUser) loadMyCollection();
  });
}

function renderAuth() {
  el.authArea.innerHTML = "";
  if (currentUser) {
    const name = currentUser.user_metadata?.full_name || currentUser.email;
    const span = document.createElement("span");
    span.textContent = `Connecté : ${name}`;
    const btn = document.createElement("button");
    btn.textContent = "Se déconnecter";
    btn.onclick = () => sb.auth.signOut();
    el.authArea.append(span, btn);
  } else {
    const btn = document.createElement("button");
    btn.textContent = "Se connecter avec Google";
    btn.onclick = () =>
      sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href },
      });
    el.authArea.append(btn);
  }
}

// ---------- categories ----------
async function loadCategories() {
  const { data, error } = await sb.from("categories").select("*").order("name");
  if (error) return console.error(error);
  categories = data;

  el.collectionFilter.innerHTML = '<option value="">Toutes les catégories</option>';
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.slug;
    opt.textContent = cat.name;
    el.collectionFilter.appendChild(opt);
  });

  renderHome();
  switchView("home");
}

function renderHome() {
  el.homeCategories.innerHTML = "";
  categories.forEach((cat) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "home-category-card";
    card.innerHTML = `
      <span class="home-category-icon">${cat.icon ?? ""}</span>
      <span class="home-category-name">${escapeHtml(cat.name)}</span>
    `;
    card.onclick = () => {
      selectCategory(cat.slug);
      switchView("catalogue");
    };
    el.homeCategories.appendChild(card);
  });
}

function currentCategory() {
  return categories.find((c) => c.slug === activeCategorySlug);
}

function selectCategory(slug) {
  activeCategorySlug = slug;
  const cat = currentCategory();

  el.catalogueTitle.textContent = `${cat.icon ?? ""} ${cat.name}`.trim();

  renderAddItemFields();
  loadCatalogue();

  const hasExternalSearch = Boolean(CATEGORY_SEARCH_FUNCTIONS[slug]);
  el.externalSearch.hidden = !hasExternalSearch;
  el.externalSearchResults.hidden = true;
  el.externalSearchResults.innerHTML = "";
  el.externalSearchInput.value = "";

  loadCommunityFeed(cat);
  subscribeCommunityFeed(cat);
  loadTopReferences(cat);
}

// ---------- catalogue ----------
async function loadCatalogue() {
  if (!activeCategorySlug) return;
  const cat = currentCategory();
  const { data, error } = await sb
    .from("items")
    .select("*")
    .eq("category_id", cat.id)
    .order("created_at", { ascending: false });
  if (error) return console.error(error);

  el.catalogueList.innerHTML = "";
  if (!data.length) {
    el.catalogueList.innerHTML = "<p class='empty'>Aucun item pour l'instant dans cette catégorie.</p>";
    return;
  }
  data.forEach((item) => el.catalogueList.appendChild(renderItemCard(item, cat)));
}

function renderItemCard(item, cat) {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = item.title;
  card.appendChild(title);

  const attrs = document.createElement("ul");
  attrs.className = "attrs";
  (cat.attribute_schema || []).forEach((field) => {
    const val = item.attributes?.[field.key];
    if (val) {
      const li = document.createElement("li");
      li.textContent = `${field.label} : ${val}`;
      attrs.appendChild(li);
    }
  });
  card.appendChild(attrs);

  if (currentUser) {
    const actions = document.createElement("div");
    actions.className = "actions";
    ["owned", "wanted"].forEach((status) => {
      const btn = document.createElement("button");
      btn.textContent = status === "owned" ? "J'ai ça" : "Je le veux";
      btn.onclick = () => addToCollection(item.id, status);
      actions.appendChild(btn);
    });
    card.appendChild(actions);
  }

  return card;
}

// ---------- add item to catalogue ----------
function renderAddItemFields() {
  const cat = currentCategory();
  el.addItemFields.innerHTML = "";
  if (!cat) return;
  (cat.attribute_schema || []).forEach((field) => {
    const wrapper = document.createElement("label");
    wrapper.textContent = field.label;
    let input;
    if (field.type === "select") {
      input = document.createElement("select");
      input.innerHTML = '<option value=""></option>' +
        field.options.map((o) => `<option value="${o}">${o}</option>`).join("");
    } else {
      input = document.createElement("input");
      input.type = field.type === "number" ? "number" : "text";
    }
    input.name = field.key;
    wrapper.appendChild(input);
    el.addItemFields.appendChild(wrapper);
  });
}

el.addItemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert("Connecte-toi pour ajouter un item.");
    return;
  }
  const cat = currentCategory();
  const attributes = {};
  [...el.addItemFields.querySelectorAll("[name]")].forEach((inp) => {
    if (inp.value) attributes[inp.name] = inp.value;
  });

  const { error } = await sb.from("items").insert({
    category_id: cat.id,
    title: el.addItemTitle.value,
    attributes,
    source: "user_submitted",
    created_by: currentUser.id,
  });
  if (error) return alert(error.message);

  el.addItemForm.reset();
  loadCatalogue();
});

// ---------- collection ----------
async function addToCollection(itemId, status) {
  const { error } = await sb.from("collection_entries").insert({
    item_id: itemId,
    status,
    user_id: currentUser.id,
  });
  if (error) return alert(error.message);
  loadMyCollection();
};

async function loadMyCollection() {
  if (!currentUser) {
    el.collectionList.innerHTML = "<p class='empty'>Connecte-toi pour voir ta collection.</p>";
    return;
  }
  const { data, error } = await sb
    .from("collection_entries")
    .select("*, items(*, categories(*))")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });
  if (error) return console.error(error);

  const filterSlug = el.collectionFilter.value;
  const rows = filterSlug ? data.filter((r) => r.items.categories.slug === filterSlug) : data;

  el.collectionList.innerHTML = "";
  if (!rows.length) {
    el.collectionList.innerHTML = "<p class='empty'>Rien ici pour l'instant.</p>";
    return;
  }

  // regroupe par item + statut, pour afficher les doublons (plusieurs exemplaires)
  // comme un seul bloc avec un compteur plutôt qu'une carte répétée
  const groups = new Map();
  rows.forEach((entry) => {
    const key = `${entry.item_id}:${entry.status}`;
    if (!groups.has(key)) {
      groups.set(key, { item: entry.items, status: entry.status, entryIds: [] });
    }
    groups.get(key).entryIds.push(entry.id);
  });

  // regroupement par catégorie (trié par type) — masqué quand un filtre de catégorie est actif
  const byCategory = new Map();
  groups.forEach((group) => {
    const catName = group.item.categories.name;
    if (!byCategory.has(catName)) byCategory.set(catName, []);
    byCategory.get(catName).push(group);
  });

  [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([catName, catGroups]) => {
      if (!filterSlug) {
        const header = document.createElement("h3");
        header.className = "collection-category-header";
        header.textContent = catName;
        el.collectionList.appendChild(header);
      }
      catGroups.forEach((group) => el.collectionList.appendChild(renderCollectionGroup(group)));
    });
}

function renderCollectionGroup(group) {
  const { item, status, entryIds } = group;
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h3>${item.categories.icon ?? ""} ${item.title}</h3>
    <p class="status status-${status}">${statusLabel(status)}${entryIds.length > 1 ? ` × ${entryIds.length}` : ""}</p>
  `;

  const actions = document.createElement("div");
  actions.className = "actions";

  const minusBtn = document.createElement("button");
  minusBtn.textContent = entryIds.length > 1 ? "− 1 exemplaire" : "Retirer";
  minusBtn.onclick = () => removeCollectionEntry(entryIds[entryIds.length - 1]);
  actions.appendChild(minusBtn);

  const plusBtn = document.createElement("button");
  plusBtn.textContent = "+ 1 doublon";
  plusBtn.onclick = () => addToCollection(item.id, status);
  actions.appendChild(plusBtn);

  card.appendChild(actions);
  return card;
}

async function removeCollectionEntry(entryId) {
  const { error } = await sb.from("collection_entries").delete().eq("id", entryId);
  if (error) return alert(error.message);
  loadMyCollection();
}

function statusLabel(status) {
  return { owned: "Possédé", wanted: "Recherché", for_sale: "À vendre" }[status] ?? status;
}

el.collectionFilter.addEventListener("change", loadMyCollection);

// ---------- view switching ----------
el.viewHomeBtn.addEventListener("click", () => {
  unsubscribeCommunityFeed();
  switchView("home");
});
el.backToHomeBtn.addEventListener("click", () => {
  unsubscribeCommunityFeed();
  switchView("home");
});
el.viewCollectionBtn.addEventListener("click", () => {
  unsubscribeCommunityFeed();
  switchView("collection");
});

el.detailBack.addEventListener("click", () => switchView("catalogue"));

function switchView(view) {
  el.homeView.hidden = view !== "home";
  el.catalogueView.hidden = view !== "catalogue";
  el.collectionView.hidden = view !== "collection";
  el.detailView.hidden = view !== "detail";
  el.viewHomeBtn.classList.toggle("active", view === "home");
  el.viewCollectionBtn.classList.toggle("active", view === "collection");
  if (view === "collection") loadMyCollection();
}

// ---------- recherche externe (Discogs, RAWG...) — dropdown en live ----------
let searchDebounceTimer = null;
let searchToken = 0;

el.externalSearchInput.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  const query = el.externalSearchInput.value.trim();
  if (query.length < 2) {
    el.externalSearchResults.hidden = true;
    el.externalSearchResults.innerHTML = "";
    return;
  }
  searchDebounceTimer = setTimeout(searchExternal, 350);
});

// referme le dropdown si on clique ailleurs
document.addEventListener("click", (e) => {
  if (!el.externalSearch.contains(e.target)) {
    el.externalSearchResults.hidden = true;
  }
});

async function searchExternal() {
  const cat = currentCategory();
  const fnName = CATEGORY_SEARCH_FUNCTIONS[cat?.slug];
  const query = el.externalSearchInput.value.trim();
  if (!fnName || query.length < 2) return;

  const token = ++searchToken;

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    el.externalSearchResults.hidden = false;
    el.externalSearchResults.innerHTML = "<p class='empty'>Connecte-toi pour rechercher.</p>";
    return;
  }

  el.externalSearchResults.hidden = false;
  el.externalSearchResults.innerHTML = "<p class='empty'>Recherche...</p>";

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/${fnName}?q=${encodeURIComponent(query)}&category_id=${encodeURIComponent(cat.id)}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );
  const payload = await res.json();

  // une frappe plus récente a déjà relancé une recherche : on ignore cette réponse
  if (token !== searchToken) return;

  if (!res.ok) {
    el.externalSearchResults.innerHTML = `<p class='empty'>Erreur : ${payload.error ?? res.statusText}</p>`;
    return;
  }
  renderExternalResults(payload.results ?? [], cat);
}

function renderExternalResults(results, cat) {
  el.externalSearchResults.innerHTML = "";
  if (!results.length) {
    el.externalSearchResults.innerHTML = "<p class='empty'>Aucun résultat.</p>";
    return;
  }
  const mapper = CATEGORY_RESULT_MAPPERS[cat.slug];
  results.forEach((r) => {
    const { attributes } = mapper(r);
    const meta = (cat.attribute_schema || [])
      .map((field) => attributes[field.key])
      .filter(Boolean)
      .join(" · ");

    const row = document.createElement("div");
    row.className = "search-result-row";

    const img = document.createElement("img");
    img.src = r.cover_image ?? "";
    img.alt = "";
    img.onerror = () => { img.style.visibility = "hidden"; };
    row.appendChild(img);

    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `
      <span class="r-title">${r.title}</span>
      <span class="r-meta">${meta}</span>
    `;
    row.appendChild(info);

    row.onclick = () => openDetail(r, cat);
    el.externalSearchResults.appendChild(row);
  });
}

// ---------- fiche détail (ouverte depuis une suggestion de recherche) ----------
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

async function openDetail(r, cat) {
  el.externalSearchResults.hidden = true;
  el.externalSearchInput.value = "";
  switchView("detail");
  el.detailContent.innerHTML = "<p class='empty'>Chargement...</p>";

  const fnName = CATEGORY_SEARCH_FUNCTIONS[cat.slug];
  const id = cat.slug === "vinyl" ? r.discogs_id : r.rawg_id;

  const { data: { session } } = await sb.auth.getSession();
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/${fnName}?id=${encodeURIComponent(id)}&category_id=${encodeURIComponent(cat.id)}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );
  const payload = await res.json();
  if (!res.ok) {
    el.detailContent.innerHTML = `<p class='empty'>Erreur : ${payload.error ?? res.statusText}</p>`;
    return;
  }

  currentDetail = {
    cat,
    detail: payload.detail,
    versions: payload.versions ?? [],
    platforms: payload.platforms ?? [],
    selectedVersionIndex: 0,
    selectedPlatform: (payload.platforms ?? [])[0] ?? null,
  };
  renderDetail();
  loadTopReferences(cat); // cette consultation vient d'être journalisée côté serveur
}

function renderDetail() {
  const { cat, detail, versions, platforms, selectedVersionIndex, selectedPlatform } = currentDetail;
  const activeVersion = versions[selectedVersionIndex];
  const displayTitle = activeVersion?.title ?? detail.title;
  const displayImage = activeVersion?.thumb ?? detail.cover_image;

  let html = `
    <div class="detail-header">
      <img class="detail-cover" src="${displayImage ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div>
        <h2>${escapeHtml(displayTitle)}</h2>
        ${detail.artist ? `<p class="muted">${escapeHtml(detail.artist)}</p>` : ""}
      </div>
    </div>
  `;

  if (detail.description) {
    const desc = String(detail.description);
    const truncated = desc.length > 600 ? `${desc.slice(0, 600)}…` : desc;
    html += `<p class="detail-description">${escapeHtml(truncated)}</p>`;
  }

  html += `<ul class="attrs">`;
  if (cat.slug === "vinyl") {
    if (detail.label) html += `<li>Label : ${escapeHtml(detail.label)}</li>`;
    const format = activeVersion?.format ?? detail.format;
    if (format) html += `<li>Format : ${escapeHtml(format)}</li>`;
    const year = activeVersion?.year ?? detail.pressing_year;
    if (year) html += `<li>Année : ${escapeHtml(String(year))}</li>`;
    if (activeVersion?.country) html += `<li>Pays : ${escapeHtml(activeVersion.country)}</li>`;
  } else {
    if (selectedPlatform) html += `<li>Plateforme : ${escapeHtml(selectedPlatform)}</li>`;
    if (detail.genre) html += `<li>Genre : ${escapeHtml(detail.genre)}</li>`;
    if (detail.publisher) html += `<li>Éditeur : ${escapeHtml(detail.publisher)}</li>`;
    if (detail.release_year) html += `<li>Année de sortie : ${escapeHtml(String(detail.release_year))}</li>`;
  }
  html += `</ul>`;

  el.detailContent.innerHTML = html;

  if (cat.slug === "vinyl" && versions.length > 1) {
    el.detailContent.appendChild(
      buildDetailSelect(
        "Édition / version",
        versions.map((v, i) => [i, [v.format, v.year, v.country].filter(Boolean).join(" — ")]),
        selectedVersionIndex,
        (value) => {
          currentDetail.selectedVersionIndex = Number(value);
          renderDetail();
        }
      )
    );
  }

  if (cat.slug === "video_game" && platforms.length > 1) {
    el.detailContent.appendChild(
      buildDetailSelect(
        "Plateforme",
        platforms.map((p) => [p, p]),
        selectedPlatform,
        (value) => {
          currentDetail.selectedPlatform = value;
          renderDetail();
        }
      )
    );
  }

  const actions = document.createElement("div");
  actions.className = "actions detail-actions";
  const ownedBtn = document.createElement("button");
  ownedBtn.textContent = "Ajouter à ma collection";
  ownedBtn.onclick = () => addDetailToCollection("owned");
  const wantedBtn = document.createElement("button");
  wantedBtn.textContent = "Ajouter à ma wantlist";
  wantedBtn.onclick = () => addDetailToCollection("wanted");
  actions.append(ownedBtn, wantedBtn);
  el.detailContent.appendChild(actions);
}

function buildDetailSelect(labelText, options, selectedValue, onChange) {
  const wrapper = document.createElement("label");
  wrapper.className = "detail-selector";
  wrapper.textContent = labelText;
  const select = document.createElement("select");
  select.innerHTML = options
    .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
    .join("");
  select.value = selectedValue;
  select.onchange = () => onChange(select.value);
  wrapper.appendChild(select);
  return wrapper;
}

async function addDetailToCollection(status) {
  if (!currentUser) {
    alert("Connecte-toi pour ajouter un item.");
    return;
  }
  const { cat, detail, versions, selectedVersionIndex, selectedPlatform } = currentDetail;
  const activeVersion = versions[selectedVersionIndex];

  let title, externalIds, attributes, coverImageUrl;

  if (cat.slug === "vinyl") {
    title = activeVersion?.title ?? detail.title;
    externalIds = { discogs_id: activeVersion?.discogs_id ?? detail.discogs_id };
    const format = activeVersion?.format ?? detail.format;
    const year = activeVersion?.year ?? detail.pressing_year;
    attributes = {
      ...(detail.label && { label: detail.label }),
      ...(year && { pressing_year: year }),
      ...(format && { format }),
    };
    coverImageUrl = activeVersion?.thumb ?? detail.cover_image ?? null;
  } else {
    title = detail.title;
    externalIds = { rawg_id: detail.rawg_id };
    attributes = {
      ...(selectedPlatform && { platform: selectedPlatform }),
      ...(detail.genre && { genre: detail.genre }),
      ...(detail.release_year && { release_year: detail.release_year }),
    };
    coverImageUrl = detail.cover_image ?? null;
  }

  const { data, error } = await sb
    .from("items")
    .insert({
      category_id: cat.id,
      title,
      cover_image_url: coverImageUrl,
      external_ids: externalIds,
      attributes,
      source: "external_api",
      created_by: currentUser.id,
    })
    .select()
    .single();

  if (error) return alert(error.message);

  await addToCollection(data.id, status);
  switchView("catalogue");
  selectCategory(cat.slug);
}

// ---------- fil communautaire temps réel ----------
let realtimeChannel = null;

function unsubscribeCommunityFeed() {
  if (realtimeChannel) {
    sb.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

function subscribeCommunityFeed(cat) {
  unsubscribeCommunityFeed();
  realtimeChannel = sb
    .channel(`items-inserts-${cat.slug}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "items", filter: `category_id=eq.${cat.id}` },
      (payload) => prependCommunityItem(payload.new)
    )
    .subscribe();
}

async function loadCommunityFeed(cat) {
  const { data, error } = await sb
    .from("items")
    .select("*")
    .eq("category_id", cat.id)
    .order("created_at", { ascending: false })
    .limit(8);

  el.communityFeed.innerHTML = "";
  if (error || !data.length) {
    el.communityFeed.innerHTML = "<p class='empty'>Rien pour l'instant.</p>";
    return;
  }
  data.forEach((item) => el.communityFeed.appendChild(renderCommunityItem(item)));
}

function renderCommunityItem(item) {
  const row = document.createElement("div");
  row.className = "community-item";
  row.innerHTML = `
    <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
    <div>
      <div class="ci-title">${escapeHtml(item.title)}</div>
      <div class="ci-time">${timeAgo(item.created_at)}</div>
    </div>
  `;
  return row;
}

function prependCommunityItem(item) {
  if (el.communityFeed.querySelector(".empty")) el.communityFeed.innerHTML = "";
  el.communityFeed.prepend(renderCommunityItem(item));
  while (el.communityFeed.children.length > 8) {
    el.communityFeed.removeChild(el.communityFeed.lastChild);
  }
}

function timeAgo(iso) {
  const diffSec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diffSec < 60) return "à l'instant";
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `il y a ${Math.floor(diffSec / 3600)} h`;
  return `il y a ${Math.floor(diffSec / 86400)} j`;
}

// ---------- références les plus consultées ----------
async function loadTopReferences(cat) {
  const { data, error } = await sb
    .from("reference_views")
    .select("external_id, title, cover_image_url")
    .eq("category_id", cat.id)
    .order("created_at", { ascending: false })
    .limit(500);

  el.topSearches.innerHTML = "";
  if (error || !data.length) {
    el.topSearches.innerHTML = "<p class='empty'>Pas encore de consultations.</p>";
    return;
  }

  // regroupe par référence (id externe) pour compter les consultations,
  // en gardant le titre/pochette les plus récents pour cette référence
  const groups = new Map();
  data.forEach((row) => {
    if (!groups.has(row.external_id)) {
      groups.set(row.external_id, { title: row.title, cover_image_url: row.cover_image_url, count: 0 });
    }
    groups.get(row.external_id).count += 1;
  });

  [...groups.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .forEach(([externalId, ref]) => {
      const row = document.createElement("div");
      row.className = "top-reference-row";
      row.innerHTML = `
        <img src="${ref.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
        <span class="top-reference-title">${escapeHtml(ref.title)}</span>
        <span class="top-reference-count">${ref.count}×</span>
      `;
      row.onclick = () => {
        const r = cat.slug === "vinyl"
          ? { discogs_id: externalId, title: ref.title, cover_image: ref.cover_image_url }
          : { rawg_id: externalId, title: ref.title, cover_image: ref.cover_image_url };
        openDetail(r, cat);
      };
      el.topSearches.appendChild(row);
    });
}

// ---------- boot ----------
initAuth();
loadCategories();
