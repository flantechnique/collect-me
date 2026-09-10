import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- state ----------
let currentUser = null;
let categories = [];
let activeCategorySlug = null;
let currentCatalogueItems = [];
let catalogueSearchQuery = "";
let catalogueSortKey = "recent";
let collectionSearchQuery = "";

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
  itemBubble: document.getElementById("item-bubble"),
  itemBubbleContent: document.getElementById("item-bubble-content"),
  itemBubbleClose: document.getElementById("item-bubble-close"),
  brandLogo: document.getElementById("brand-logo"),
  creatorView: document.getElementById("creator-view"),
  creatorTitle: document.getElementById("creator-title"),
  creatorList: document.getElementById("creator-list"),
  creatorBack: document.getElementById("creator-back"),
  catalogueSearch: document.getElementById("catalogue-search"),
  catalogueSort: document.getElementById("catalogue-sort"),
  collectionSearch: document.getElementById("collection-search"),
};

let currentDetail = null;

// Catégories dont la recherche externe repose sur Discogs (même edge function, même
// forme de réponse) : vinyles et CD partagent le même catalogue de référence musical.
const DISCOGS_CATEGORIES = ["vinyl", "cd"];

// Catégories dont la recherche externe repose sur TMDB (même edge function) : DVD/steelbooks
// et affiches de films sont tous deux des objets liés à un film du catalogue TMDB.
const TMDB_CATEGORIES = ["dvd", "movie_poster"];

// Catégories pour lesquelles une edge function de recherche externe existe.
// Ajouter une entrée ici active automatiquement le bloc de recherche pour la catégorie.
const CATEGORY_SEARCH_FUNCTIONS = {
  vinyl: "discogs-search",
  cd: "discogs-search",
  video_game: "rawg-search",
  book: "openlibrary-search",
  dvd: "tmdb-search",
  movie_poster: "tmdb-search",
};

// Pour chaque catégorie avec recherche externe : comment transformer un résultat
// brut de l'API (voir la edge function correspondante) en { externalIds, attributes }
// compatibles avec le attribute_schema de la catégorie.
const discogsResultMapper = (r) => ({
  externalIds: { discogs_id: r.discogs_id },
  attributes: {
    ...(r.label && { label: r.label }),
    ...(r.year && { pressing_year: r.year }),
    ...(r.format && { format: r.format }),
  },
});

const CATEGORY_RESULT_MAPPERS = {
  vinyl: discogsResultMapper,
  cd: discogsResultMapper,
  video_game: (r) => ({
    externalIds: { rawg_id: r.rawg_id },
    attributes: {
      ...(r.platform && { platform: r.platform }),
      ...(r.genre && { genre: r.genre }),
      ...(r.year && { release_year: r.year }),
    },
  }),
  book: (r) => ({
    externalIds: { olid: r.olid },
    attributes: {
      ...(r.author && { author: r.author }),
      ...(r.publisher && { publisher: r.publisher }),
      ...(r.year && { year: r.year }),
    },
  }),
  dvd: (r) => ({
    externalIds: { tmdb_id: r.tmdb_id },
    attributes: {
      ...(r.year && { release_year: r.year }),
    },
  }),
  movie_poster: (r) => ({
    externalIds: { tmdb_id: r.tmdb_id },
    attributes: {
      ...(r.year && { release_year: r.year }),
    },
  }),
};

// Pour chaque catégorie, l'attribut qui représente son "créateur" (artiste, studio,
// auteur, réalisateur...) : affiché comme un lien cliquable menant à l'ensemble de ses œuvres.
const CREATOR_FIELD_BY_CATEGORY = {
  vinyl: "artist",
  cd: "artist",
  video_game: "publisher",
  book: "author",
  dvd: "director",
  movie_poster: "director",
};

// Clé dans external_ids qui identifie un item pour chaque catégorie avec recherche externe.
const EXTERNAL_ID_KEY = {
  vinyl: "discogs_id",
  cd: "discogs_id",
  video_game: "rawg_id",
  book: "olid",
  dvd: "tmdb_id",
  movie_poster: "tmdb_id",
};

// Clé dans external_ids qui identifie le "créateur" d'un item, quand on la connaît
// précisément (sinon on retombe sur une recherche approximative par nom).
const CREATOR_ID_KEY = {
  vinyl: "discogs_artist_id",
  cd: "discogs_artist_id",
  book: "ol_author_id",
  dvd: "tmdb_director_id",
  movie_poster: "tmdb_director_id",
};

function creatorIcon(cat) {
  if (cat.slug === "book") return "✍️";
  if (cat.slug === "video_game") return "🏢";
  if (TMDB_CATEGORIES.includes(cat.slug)) return "🎬";
  return "🎤";
}

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
  catalogueSearchQuery = "";
  catalogueSortKey = "recent";
  el.catalogueSearch.value = "";
  el.catalogueSort.value = "recent";
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

  currentCatalogueItems = data;
  renderCatalogueList();
}

el.catalogueSearch.addEventListener("input", () => {
  catalogueSearchQuery = el.catalogueSearch.value.trim().toLowerCase();
  renderCatalogueList();
});

el.catalogueSort.addEventListener("change", () => {
  catalogueSortKey = el.catalogueSort.value;
  renderCatalogueList();
});

function sortComparator(key) {
  return (a, b) => {
    if (key === "title") return a.title.localeCompare(b.title);
    if (key === "year") {
      const yearOf = (item) => Number(
        item.attributes?.pressing_year ?? item.attributes?.release_year ?? item.attributes?.year ?? 0
      );
      return yearOf(b) - yearOf(a);
    }
    return new Date(b.created_at) - new Date(a.created_at);
  };
}

function renderCatalogueList() {
  const cat = currentCategory();
  if (!cat) return;

  let items = currentCatalogueItems;
  if (catalogueSearchQuery) {
    items = items.filter((item) => {
      if (item.title.toLowerCase().includes(catalogueSearchQuery)) return true;
      return Object.values(item.attributes || {}).some((v) =>
        String(v).toLowerCase().includes(catalogueSearchQuery)
      );
    });
  }
  items = [...items].sort(sortComparator(catalogueSortKey));

  el.catalogueList.innerHTML = "";
  if (!items.length) {
    el.catalogueList.innerHTML = currentCatalogueItems.length
      ? "<p class='empty'>Aucun item ne correspond à ta recherche.</p>"
      : "<p class='empty'>Aucun item pour l'instant dans cette catégorie.</p>";
    return;
  }
  items.forEach((item) => el.catalogueList.appendChild(renderItemCard(item, cat)));
}

function renderItemCard(item, cat) {
  const card = document.createElement("div");
  card.className = "card";

  const body = document.createElement("div");
  body.className = "card-visual";

  const img = document.createElement("img");
  img.className = "card-thumb";
  img.src = item.cover_image_url ?? "";
  img.alt = "";
  img.onerror = () => { img.style.visibility = "hidden"; };
  body.appendChild(img);

  const info = document.createElement("div");
  info.className = "card-visual-info";

  const title = document.createElement("h3");
  title.textContent = item.title;
  info.appendChild(title);

  const attrs = document.createElement("ul");
  attrs.className = "attrs";
  (cat.attribute_schema || []).forEach((field) => {
    const val = item.attributes?.[field.key];
    if (!val) return;
    const li = document.createElement("li");
    if (field.key === CREATOR_FIELD_BY_CATEGORY[cat.slug]) {
      li.append(`${field.label} : `);
      const span = document.createElement("span");
      span.className = "creator-link";
      span.textContent = val;
      span.onclick = (e) => {
        e.stopPropagation();
        openCreatorWorks({ cat, name: val, artistId: item.external_ids?.[CREATOR_ID_KEY[cat.slug]] || null });
      };
      li.appendChild(span);
    } else {
      li.textContent = `${field.label} : ${val}`;
    }
    attrs.appendChild(li);
  });
  info.appendChild(attrs);

  body.appendChild(info);
  card.appendChild(body);

  if (currentUser) {
    const actions = document.createElement("div");
    actions.className = "actions";
    ["owned", "wanted"].forEach((status) => {
      const btn = document.createElement("button");
      btn.textContent = status === "owned" ? "J'ai ça" : "Je le veux";
      btn.onclick = (e) => {
        e.stopPropagation();
        addToCollection(item.id, status);
      };
      actions.appendChild(btn);
    });
    card.appendChild(actions);
  }

  attachItemBubble(card, item, cat);

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
  const title = el.addItemTitle.value.trim();
  if (!title) return;

  try {
    const { item, created } = await findOrCreateItem({
      cat,
      title,
      externalIds: {},
      attributes,
      coverImageUrl: null,
      source: "user_submitted",
    });
    if (!created) {
      alert(`« ${item.title} » existe déjà dans le catalogue — pas de doublon créé.`);
    }
    el.addItemForm.reset();
    loadCatalogue();
  } catch (err) {
    alert(err.message);
  }
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
  let rows = filterSlug ? data.filter((r) => r.items.categories.slug === filterSlug) : data;
  if (collectionSearchQuery) {
    rows = rows.filter((r) => r.items.title.toLowerCase().includes(collectionSearchQuery));
  }

  el.collectionList.innerHTML = "";
  if (!rows.length) {
    el.collectionList.innerHTML = data.length
      ? "<p class='empty'>Aucun item ne correspond.</p>"
      : "<p class='empty'>Rien ici pour l'instant.</p>";
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
    <div class="card-visual">
      <img class="card-thumb" src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="card-visual-info">
        <h3>${item.categories.icon ?? ""} ${escapeHtml(item.title)}</h3>
        <p class="status status-${status}">${statusLabel(status)}</p>
        <p class="collection-qty">${entryIds.length} exemplaire${entryIds.length > 1 ? "s" : ""}</p>
      </div>
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "actions";

  const minusBtn = document.createElement("button");
  minusBtn.textContent = entryIds.length > 1 ? "− 1 exemplaire" : "Retirer";
  minusBtn.onclick = (e) => {
    e.stopPropagation();
    removeCollectionEntry(entryIds[entryIds.length - 1]);
  };
  actions.appendChild(minusBtn);

  const plusBtn = document.createElement("button");
  plusBtn.textContent = "+ 1 doublon";
  plusBtn.onclick = (e) => {
    e.stopPropagation();
    addToCollection(item.id, status);
  };
  actions.appendChild(plusBtn);

  const detailsBtn = document.createElement("button");
  detailsBtn.textContent = "Détails";
  detailsBtn.onclick = (e) => {
    e.stopPropagation();
    toggleEntryDetailsForm(card, entryIds[entryIds.length - 1]);
  };
  actions.appendChild(detailsBtn);

  card.appendChild(actions);
  attachItemBubble(card, item, item.categories);
  return card;
}

async function removeCollectionEntry(entryId) {
  const { error } = await sb.from("collection_entries").delete().eq("id", entryId);
  if (error) return alert(error.message);
  loadMyCollection();
}

// ---------- détails d'un exemplaire (état, prix payé, date d'acquisition, notes) ----------
// Sur un groupe avec doublons, agit sur l'exemplaire le plus récemment ajouté — cohérent
// avec le bouton "− 1 exemplaire" qui retire déjà ce même exemplaire en premier.
async function toggleEntryDetailsForm(card, entryId) {
  const existing = card.querySelector(".entry-details-form");
  if (existing) {
    existing.remove();
    return;
  }

  const { data: entry, error } = await sb
    .from("collection_entries")
    .select("*")
    .eq("id", entryId)
    .single();
  if (error) return alert(error.message);

  const form = document.createElement("form");
  form.className = "entry-details-form";
  form.innerHTML = `
    <label>État
      <input name="condition" value="${escapeHtml(entry.condition ?? "")}" placeholder="Neuf, Bon état..." />
    </label>
    <label>Prix payé (€)
      <input name="price_paid" type="number" step="0.01" min="0" value="${entry.price_paid ?? ""}" />
    </label>
    <label>Date d'acquisition
      <input name="acquired_at" type="date" value="${entry.acquired_at ?? ""}" />
    </label>
    <label class="full-width">Notes
      <textarea name="notes">${escapeHtml(entry.notes ?? "")}</textarea>
    </label>
    <div class="actions">
      <button type="submit">Enregistrer</button>
      <button type="button" class="cancel-btn">Annuler</button>
    </div>
  `;
  form.addEventListener("click", (e) => e.stopPropagation());
  form.querySelector(".cancel-btn").addEventListener("click", () => form.remove());
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const { error: updateError } = await sb
      .from("collection_entries")
      .update({
        condition: fd.get("condition")?.trim() || null,
        price_paid: fd.get("price_paid") || null,
        acquired_at: fd.get("acquired_at") || null,
        notes: fd.get("notes")?.trim() || null,
      })
      .eq("id", entryId);
    if (updateError) return alert(updateError.message);
    form.remove();
  });

  card.appendChild(form);
}

function statusLabel(status) {
  return { owned: "Possédé", wanted: "Recherché", for_sale: "À vendre" }[status] ?? status;
}

el.collectionFilter.addEventListener("change", loadMyCollection);
el.collectionSearch.addEventListener("input", () => {
  collectionSearchQuery = el.collectionSearch.value.trim().toLowerCase();
  loadMyCollection();
});

// ---------- view switching ----------
function goHome() {
  unsubscribeCommunityFeed();
  switchView("home");
}

el.viewHomeBtn.addEventListener("click", goHome);
el.backToHomeBtn.addEventListener("click", goHome);
el.brandLogo.addEventListener("click", goHome);
el.brandLogo.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    goHome();
  }
});
el.viewCollectionBtn.addEventListener("click", () => {
  unsubscribeCommunityFeed();
  switchView("collection");
});

el.detailBack.addEventListener("click", () => switchView("catalogue"));
el.creatorBack.addEventListener("click", () => switchView("catalogue"));

function switchView(view) {
  el.homeView.hidden = view !== "home";
  el.catalogueView.hidden = view !== "catalogue";
  el.collectionView.hidden = view !== "collection";
  el.detailView.hidden = view !== "detail";
  el.creatorView.hidden = view !== "creator";
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

// ---------- helpers ----------
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// ---------- bulle résumée d'item (clic sur un item -> résumé -> fiche complète) ----------
function showItemBubble(anchorEl, { title, image, meta, onOpen }) {
  el.itemBubbleContent.innerHTML = `
    <img class="item-bubble-cover" src="${image ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
    <div class="item-bubble-title">${escapeHtml(title ?? "")}</div>
    ${meta ? `<div class="item-bubble-meta">${escapeHtml(meta)}</div>` : ""}
    <button type="button" class="item-bubble-open">Voir la fiche complète →</button>
  `;
  el.itemBubbleContent.querySelector(".item-bubble-open").onclick = () => {
    hideItemBubble();
    onOpen();
  };
  positionItemBubble(anchorEl);
  el.itemBubble.hidden = false;
}

function positionItemBubble(anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  const bubbleWidth = 240;
  let left = rect.left + window.scrollX;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - bubbleWidth - 12;
  left = Math.min(Math.max(12, left), Math.max(12, maxLeft));
  const top = rect.bottom + window.scrollY + 8;
  el.itemBubble.style.left = `${left}px`;
  el.itemBubble.style.top = `${top}px`;
}

function hideItemBubble() {
  el.itemBubble.hidden = true;
}

el.itemBubbleClose.addEventListener("click", hideItemBubble);
document.addEventListener("click", (e) => {
  if (!el.itemBubble.hidden && !el.itemBubble.contains(e.target) && !e.target.closest("[data-bubble-trigger]")) {
    hideItemBubble();
  }
});
window.addEventListener("scroll", hideItemBubble, true);

// attache le clic "résumé" à un élément représentant un item déjà en base (catalogue,
// fil communautaire, collection) : il porte forcément un id, des attributs et une catégorie
function attachItemBubble(node, item, cat) {
  node.dataset.bubbleTrigger = "true";
  node.classList.add("clickable");
  node.addEventListener("click", (e) => {
    if (e.target.closest(".actions")) return; // ne pas intercepter les boutons d'action
    e.stopPropagation();
    const meta = (cat.attribute_schema || [])
      .map((f) => item.attributes?.[f.key])
      .filter(Boolean)
      .slice(0, 3)
      .join(" · ");
    showItemBubble(node, {
      title: item.title,
      image: item.cover_image_url,
      meta,
      onOpen: () => openItemDetail(item, cat),
    });
  });
}

// attache le clic "résumé" à une ligne de référence externe consultée (pas encore
// forcément dans le catalogue local) : titre + pochette + identifiant externe
function attachReferenceBubble(node, ref, externalId, cat) {
  node.dataset.bubbleTrigger = "true";
  node.addEventListener("click", (e) => {
    e.stopPropagation();
    showItemBubble(node, {
      title: ref.title,
      image: ref.cover_image_url,
      meta: `${ref.count}× consulté`,
      onOpen: () => {
        const r = { [EXTERNAL_ID_KEY[cat.slug]]: externalId, title: ref.title, cover_image: ref.cover_image_url };
        openDetail(r, cat);
      },
    });
  });
}

// point d'entrée générique pour ouvrir la fiche complète d'un item déjà en base :
// si on a un identifiant externe, on récupère le détail riche (description, versions...)
// via la edge function ; sinon on affiche la fiche à partir des seules données locales.
async function openItemDetail(item, cat) {
  const fnName = CATEGORY_SEARCH_FUNCTIONS[cat.slug];
  const extId = item.external_ids?.[EXTERNAL_ID_KEY[cat.slug]];
  if (fnName && extId) {
    const r = { [EXTERNAL_ID_KEY[cat.slug]]: extId, title: item.title, cover_image: item.cover_image_url };
    return openDetail(r, cat);
  }
  renderLocalItemDetail(item, cat);
}

function renderLocalItemDetail(item, cat) {
  currentDetail = null;
  switchView("detail");

  const creatorKey = CREATOR_FIELD_BY_CATEGORY[cat.slug];
  let html = `
    <div class="detail-header">
      <img class="detail-cover" src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div>
        <h2>${escapeHtml(item.title)}</h2>
      </div>
    </div>
    <ul class="attrs">
      ${(cat.attribute_schema || [])
        .map((field) => {
          const val = item.attributes?.[field.key];
          if (!val) return "";
          if (field.key === creatorKey) {
            const artistId = item.external_ids?.[CREATOR_ID_KEY[cat.slug]] ?? "";
            return `<li>${escapeHtml(field.label)} : <span class="creator-link" data-artist-id="${escapeHtml(String(artistId))}">${escapeHtml(String(val))}</span></li>`;
          }
          return `<li>${escapeHtml(field.label)} : ${escapeHtml(String(val))}</li>`;
        })
        .join("")}
    </ul>
  `;
  el.detailContent.innerHTML = html;
  wireCreatorLinks(cat);

  if (currentUser) {
    const actions = document.createElement("div");
    actions.className = "actions detail-actions";
    const ownedBtn = document.createElement("button");
    ownedBtn.textContent = "Ajouter à ma collection";
    ownedBtn.onclick = () => addToCollection(item.id, "owned");
    const wantedBtn = document.createElement("button");
    wantedBtn.textContent = "Ajouter à ma wantlist";
    wantedBtn.onclick = () => addToCollection(item.id, "wanted");
    actions.append(ownedBtn, wantedBtn);
    if (item.created_by === currentUser.id) {
      const editBtn = document.createElement("button");
      editBtn.textContent = "Modifier la fiche";
      editBtn.onclick = () => renderItemEditForm(item, cat);
      actions.appendChild(editBtn);
    }
    el.detailContent.appendChild(actions);
  }

  renderOwnershipCounts(el.detailContent, item.id);
}

// ---------- édition d'une fiche catalogue (réservée à son créateur, cf. RLS) ----------
function renderItemEditForm(item, cat) {
  const form = document.createElement("form");
  form.className = "edit-item-form";

  const titleLabel = document.createElement("label");
  titleLabel.textContent = "Titre";
  const titleInput = document.createElement("input");
  titleInput.name = "title";
  titleInput.value = item.title;
  titleInput.required = true;
  titleLabel.appendChild(titleInput);
  form.appendChild(titleLabel);

  const coverLabel = document.createElement("label");
  coverLabel.textContent = "URL de la pochette";
  const coverInput = document.createElement("input");
  coverInput.name = "cover_image_url";
  coverInput.value = item.cover_image_url ?? "";
  coverInput.placeholder = "https://...";
  coverLabel.appendChild(coverInput);
  form.appendChild(coverLabel);

  const fieldInputs = {};
  (cat.attribute_schema || []).forEach((field) => {
    const label = document.createElement("label");
    label.textContent = field.label;
    let input;
    if (field.type === "select") {
      input = document.createElement("select");
      input.innerHTML = '<option value=""></option>' +
        field.options.map((o) => `<option value="${o}">${o}</option>`).join("");
      input.value = item.attributes?.[field.key] ?? "";
    } else {
      input = document.createElement("input");
      input.type = field.type === "number" ? "number" : "text";
      input.value = item.attributes?.[field.key] ?? "";
    }
    fieldInputs[field.key] = input;
    label.appendChild(input);
    form.appendChild(label);
  });

  const actions = document.createElement("div");
  actions.className = "actions";
  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.textContent = "Enregistrer";
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Annuler";
  cancelBtn.onclick = () => renderLocalItemDetail(item, cat);
  actions.append(saveBtn, cancelBtn);
  form.appendChild(actions);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const attributes = {};
    Object.entries(fieldInputs).forEach(([key, input]) => {
      if (input.value) attributes[key] = input.value;
    });
    const { data, error } = await sb
      .from("items")
      .update({
        title: titleInput.value.trim(),
        cover_image_url: coverInput.value.trim() || null,
        attributes,
      })
      .eq("id", item.id)
      .select()
      .single();
    if (error) return alert(error.message);
    renderLocalItemDetail(data, cat);
    loadCatalogue();
  });

  el.detailContent.innerHTML = "";
  const heading = document.createElement("h2");
  heading.textContent = `Modifier « ${item.title} »`;
  el.detailContent.appendChild(heading);
  el.detailContent.appendChild(form);
}

// ---------- "possédé par / recherché par" (comptages anonymisés, aucune identité exposée) ----------
async function renderOwnershipCounts(container, itemId) {
  if (!itemId) return;
  const { data, error } = await sb
    .from("item_ownership_counts")
    .select("status, cnt")
    .eq("item_id", itemId);
  if (error || !data?.length) return;

  const owned = data.find((d) => d.status === "owned")?.cnt ?? 0;
  const wanted = data.find((d) => d.status === "wanted")?.cnt ?? 0;
  if (!owned && !wanted) return;

  const parts = [];
  if (owned) parts.push(`👥 possédé par ${owned} collectionneur${owned > 1 ? "s" : ""}`);
  if (wanted) parts.push(`⭐ recherché par ${wanted} collectionneur${wanted > 1 ? "s" : ""}`);

  const p = document.createElement("p");
  p.className = "ownership-counts";
  p.textContent = parts.join(" · ");
  container.appendChild(p);
}

// ---------- œuvres d'un artiste / studio ----------
function wireCreatorLinks(cat) {
  el.detailContent.querySelectorAll(".creator-link").forEach((node) => {
    node.onclick = (e) => {
      e.stopPropagation();
      openCreatorWorks({ cat, name: node.textContent.trim(), artistId: node.dataset.artistId || null });
    };
  });
}

async function openCreatorWorks({ cat, name, artistId }) {
  if (!name) return;
  const fnName = CATEGORY_SEARCH_FUNCTIONS[cat.slug];
  if (!fnName) return;

  switchView("creator");
  el.creatorTitle.textContent = `${creatorIcon(cat)} ${name}`;
  el.creatorList.innerHTML = "<p class='empty'>Recherche des œuvres...</p>";

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    el.creatorList.innerHTML = "<p class='empty'>Connecte-toi pour explorer le catalogue externe.</p>";
    return;
  }

  const params = new URLSearchParams({ category_id: cat.id });
  if (DISCOGS_CATEGORIES.includes(cat.slug)) {
    if (artistId) params.set("artist_id", artistId);
    else params.set("artist", name);
  } else if (cat.slug === "video_game") {
    params.set("publisher", name);
  } else if (cat.slug === "book") {
    if (artistId) params.set("author_id", artistId);
    else params.set("author", name);
  } else if (TMDB_CATEGORIES.includes(cat.slug)) {
    if (artistId) params.set("person_id", artistId);
    else params.set("person", name);
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}?${params}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const payload = await res.json();
  if (!res.ok) {
    el.creatorList.innerHTML = `<p class='empty'>Erreur : ${payload.error ?? res.statusText}</p>`;
    return;
  }
  renderCreatorResults(payload.results ?? [], cat);
}

function renderCreatorResults(results, cat) {
  el.creatorList.innerHTML = "";
  if (!results.length) {
    el.creatorList.innerHTML = "<p class='empty'>Aucune autre œuvre trouvée.</p>";
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
      <span class="r-title">${escapeHtml(r.title)}</span>
      <span class="r-meta">${escapeHtml(meta)}</span>
    `;
    row.appendChild(info);

    row.addEventListener("click", (e) => {
      e.stopPropagation();
      showItemBubble(row, {
        title: r.title,
        image: r.cover_image,
        meta,
        onOpen: () => openDetail(r, cat),
      });
    });
    el.creatorList.appendChild(row);
  });
}

// ---------- dédoublonnage du catalogue ----------
// Avant toute création d'item (import externe ou saisie manuelle), on vérifie s'il
// n'existe pas déjà : d'abord par identifiant externe (le plus fiable, ex. discogs_id),
// puis par titre identique à la casse près dans la même catégorie ("Minecraft" ==
// "minecraft"). Si un item correspond, on le réutilise au lieu d'en créer un doublon.
async function findOrCreateItem({ cat, title, externalIds, attributes, coverImageUrl, source }) {
  const extKey = Object.keys(externalIds || {}).find((k) => externalIds[k]);
  if (extKey) {
    const { data: existing, error } = await sb
      .from("items")
      .select("*")
      .eq("category_id", cat.id)
      .eq(`external_ids->>${extKey}`, String(externalIds[extKey]))
      .maybeSingle();
    if (error) throw error;
    if (existing) return { item: existing, created: false };
  }

  const { data: existingByTitle, error: titleError } = await sb
    .from("items")
    .select("*")
    .eq("category_id", cat.id)
    .ilike("title", title)
    .maybeSingle();
  if (titleError) throw titleError;
  if (existingByTitle) return { item: existingByTitle, created: false };

  const { data: created, error: insertError } = await sb
    .from("items")
    .insert({
      category_id: cat.id,
      title,
      cover_image_url: coverImageUrl ?? null,
      external_ids: externalIds ?? {},
      attributes: attributes ?? {},
      source,
      created_by: currentUser.id,
    })
    .select()
    .single();
  if (insertError) throw insertError;
  return { item: created, created: true };
}

async function openDetail(r, cat) {
  el.externalSearchResults.hidden = true;
  el.externalSearchInput.value = "";
  switchView("detail");
  el.detailContent.innerHTML = "<p class='empty'>Chargement...</p>";

  const fnName = CATEGORY_SEARCH_FUNCTIONS[cat.slug];
  const id = r[EXTERNAL_ID_KEY[cat.slug]];

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
    localItemId: null,
  };

  const extKey = EXTERNAL_ID_KEY[cat.slug];
  if (extKey && id) {
    const { data: localMatch } = await sb
      .from("items")
      .select("id")
      .eq("category_id", cat.id)
      .eq(`external_ids->>${extKey}`, String(id))
      .maybeSingle();
    currentDetail.localItemId = localMatch?.id ?? null;
  }

  renderDetail();
  loadTopReferences(cat); // cette consultation vient d'être journalisée côté serveur
}

function renderDetail() {
  const { cat, detail, versions, platforms, selectedVersionIndex, selectedPlatform } = currentDetail;
  const activeVersion = versions[selectedVersionIndex];
  const displayTitle = activeVersion?.title ?? detail.title;
  const displayImage = activeVersion?.thumb ?? detail.cover_image;

  const creatorName = detail.artist ?? detail.author ?? detail.director ?? null;
  const creatorId = detail.artist_id ?? detail.author_id ?? detail.director_id ?? "";

  let html = `
    <div class="detail-header">
      <img class="detail-cover" src="${displayImage ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div>
        <h2>${escapeHtml(displayTitle)}</h2>
        ${creatorName ? `<p class="muted"><span class="creator-link" data-artist-id="${escapeHtml(String(creatorId))}">${escapeHtml(creatorName)}</span></p>` : ""}
      </div>
    </div>
  `;

  if (detail.description) {
    const desc = String(detail.description);
    const truncated = desc.length > 600 ? `${desc.slice(0, 600)}…` : desc;
    html += `<p class="detail-description">${escapeHtml(truncated)}</p>`;
  }

  const isDiscogs = DISCOGS_CATEGORIES.includes(cat.slug);

  html += `<ul class="attrs">`;
  if (isDiscogs) {
    if (detail.label) html += `<li>Label : ${escapeHtml(detail.label)}</li>`;
    const format = activeVersion?.format ?? detail.format;
    if (format) html += `<li>Format : ${escapeHtml(format)}</li>`;
    const year = activeVersion?.year ?? detail.pressing_year;
    if (year) html += `<li>Année : ${escapeHtml(String(year))}</li>`;
    if (activeVersion?.country) html += `<li>Pays : ${escapeHtml(activeVersion.country)}</li>`;
    if (detail.genre) html += `<li>Genre : ${escapeHtml(detail.genre)}</li>`;
  } else if (cat.slug === "video_game") {
    if (selectedPlatform) html += `<li>Plateforme : ${escapeHtml(selectedPlatform)}</li>`;
    if (detail.genre) html += `<li>Genre : ${escapeHtml(detail.genre)}</li>`;
    if (detail.publisher) html += `<li>Éditeur : <span class="creator-link">${escapeHtml(detail.publisher)}</span></li>`;
    if (detail.release_year) html += `<li>Année de sortie : ${escapeHtml(String(detail.release_year))}</li>`;
  } else if (cat.slug === "book") {
    if (detail.publisher) html += `<li>Éditeur : ${escapeHtml(detail.publisher)}</li>`;
    if (detail.year) html += `<li>Année de publication : ${escapeHtml(String(detail.year))}</li>`;
    if (detail.isbn) html += `<li>ISBN : ${escapeHtml(detail.isbn)}</li>`;
  } else if (TMDB_CATEGORIES.includes(cat.slug)) {
    if (detail.genre) html += `<li>Genre : ${escapeHtml(detail.genre)}</li>`;
    if (detail.release_year) html += `<li>Année de sortie : ${escapeHtml(String(detail.release_year))}</li>`;
  }
  html += `</ul>`;

  if (isDiscogs && detail.tracklist?.length) {
    html += `<h3 class="detail-subheading">Tracklist</h3><ol class="tracklist">`;
    detail.tracklist.forEach((t) => {
      html += `<li><span class="track-position">${escapeHtml(t.position ?? "")}</span> ${escapeHtml(t.title)}${t.duration ? `<span class="track-duration">${escapeHtml(t.duration)}</span>` : ""}</li>`;
    });
    html += `</ol>`;
  }

  if (cat.slug === "book" && detail.subjects?.length) {
    html += `<h3 class="detail-subheading">Sujets</h3><p class="detail-description">${escapeHtml(detail.subjects.join(" · "))}</p>`;
  }

  if (TMDB_CATEGORIES.includes(cat.slug) && detail.cast?.length) {
    html += `<h3 class="detail-subheading">Casting</h3><ul class="cast-list">`;
    detail.cast.forEach((c) => {
      html += `<li><span class="creator-link" data-artist-id="${escapeHtml(String(c.id))}">${escapeHtml(c.name)}</span>${c.character ? ` <span class="cast-role">(${escapeHtml(c.character)})</span>` : ""}</li>`;
    });
    html += `</ul>`;
  }

  if (isDiscogs) {
    const buyLinks = [{
      label: `Voir sur le marketplace Discogs${detail.num_for_sale ? ` (${detail.num_for_sale} en vente${detail.lowest_price ? `, dès ${detail.lowest_price}` : ""})` : ""}`,
      url: `https://www.discogs.com/sell/release/${detail.discogs_id}`,
    }];
    if (detail.artist) {
      buyLinks.push({
        label: "Rechercher sur Bandcamp",
        url: `https://bandcamp.com/search?q=${encodeURIComponent(`${detail.artist} ${displayTitle}`)}`,
      });
    }
    html += `<h3 class="detail-subheading">Où l'acheter</h3><ul class="buy-links">`;
    buyLinks.forEach((l) => {
      html += `<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)}</a></li>`;
    });
    html += `</ul>`;
  }

  el.detailContent.innerHTML = html;
  wireCreatorLinks(cat);

  if (isDiscogs && versions.length > 1) {
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

  if (currentDetail.localItemId) {
    renderOwnershipCounts(el.detailContent, currentDetail.localItemId);
  }
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

  if (DISCOGS_CATEGORIES.includes(cat.slug)) {
    title = activeVersion?.title ?? detail.title;
    externalIds = {
      discogs_id: activeVersion?.discogs_id ?? detail.discogs_id,
      ...(detail.artist_id && { discogs_artist_id: detail.artist_id }),
    };
    const format = activeVersion?.format ?? detail.format;
    const year = activeVersion?.year ?? detail.pressing_year;
    attributes = {
      ...(detail.artist && { artist: detail.artist }),
      ...(detail.label && { label: detail.label }),
      ...(year && { pressing_year: year }),
      ...(format && { format }),
      ...(detail.genre && { genre: detail.genre }),
    };
    coverImageUrl = activeVersion?.thumb ?? detail.cover_image ?? null;
  } else if (cat.slug === "video_game") {
    title = detail.title;
    externalIds = { rawg_id: detail.rawg_id };
    attributes = {
      ...(selectedPlatform && { platform: selectedPlatform }),
      ...(detail.genre && { genre: detail.genre }),
      ...(detail.release_year && { release_year: detail.release_year }),
    };
    coverImageUrl = detail.cover_image ?? null;
  } else if (cat.slug === "book") {
    title = detail.title;
    externalIds = {
      olid: detail.olid,
      ...(detail.author_id && { ol_author_id: detail.author_id }),
    };
    attributes = {
      ...(detail.author && { author: detail.author }),
      ...(detail.publisher && { publisher: detail.publisher }),
      ...(detail.year && { year: detail.year }),
      ...(detail.isbn && { isbn: detail.isbn }),
    };
    coverImageUrl = detail.cover_image ?? null;
  } else if (TMDB_CATEGORIES.includes(cat.slug)) {
    title = detail.title;
    externalIds = {
      tmdb_id: detail.tmdb_id,
      ...(detail.director_id && { tmdb_director_id: detail.director_id }),
    };
    attributes = {
      ...(detail.director && { director: detail.director }),
      ...(detail.genre && { genre: detail.genre }),
      ...(detail.release_year && { release_year: detail.release_year }),
    };
    coverImageUrl = detail.cover_image ?? null;
  }

  let item;
  try {
    ({ item } = await findOrCreateItem({
      cat,
      title,
      externalIds,
      attributes,
      coverImageUrl,
      source: "external_api",
    }));
  } catch (err) {
    return alert(err.message);
  }

  await addToCollection(item.id, status);
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
  data.forEach((item) => el.communityFeed.appendChild(renderCommunityItem(item, cat)));
}

function renderCommunityItem(item, cat) {
  const row = document.createElement("div");
  row.className = "community-item";
  row.innerHTML = `
    <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
    <div>
      <div class="ci-title">${escapeHtml(item.title)}</div>
      <div class="ci-time">${timeAgo(item.created_at)}</div>
    </div>
  `;
  attachItemBubble(row, item, cat);
  return row;
}

function prependCommunityItem(item) {
  if (el.communityFeed.querySelector(".empty")) el.communityFeed.innerHTML = "";
  el.communityFeed.prepend(renderCommunityItem(item, currentCategory()));
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
      attachReferenceBubble(row, ref, externalId, cat);
      el.topSearches.appendChild(row);
    });
}

// ---------- boot ----------
initAuth();
loadCategories();
