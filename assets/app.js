import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- PWA : installable + app shell hors-ligne (voir sw.js) ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // pas bloquant : le site fonctionne normalement sans service worker
    });
  });
}

// ---------- state ----------
let currentUser = null;
let categories = [];
let activeCategorySlug = null;
let currentCatalogueItems = [];
let catalogueSearchQuery = "";
let catalogueSortKey = "recent";
let collectionSearchQuery = "";
let collectionViewMode = "list"; // "list" | "pokedex"

// ---------- elements ----------
const el = {
  authArea: document.getElementById("auth-area"),
  viewHomeBtn: document.getElementById("view-home"),
  viewCollectionBtn: document.getElementById("view-collection"),
  homeView: document.getElementById("home-view"),
  homeCategories: document.getElementById("home-categories"),
  globalSearchInput: document.getElementById("global-search-input"),
  globalSearchResults: document.getElementById("global-search-results"),
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
  barcodeScanBtn: document.getElementById("barcode-scan-btn"),
  barcodeScannerModal: document.getElementById("barcode-scanner-modal"),
  barcodeScannerVideo: document.getElementById("barcode-scanner-video"),
  barcodeScannerStatus: document.getElementById("barcode-scanner-status"),
  barcodeScannerClose: document.getElementById("barcode-scanner-close"),
  csvTemplateBtn: document.getElementById("csv-template-btn"),
  csvImportBtn: document.getElementById("csv-import-btn"),
  csvImportInput: document.getElementById("csv-import-input"),
  csvImportStatus: document.getElementById("csv-import-status"),
  viewStatsBtn: document.getElementById("view-stats"),
  statsView: document.getElementById("stats-view"),
  statsContent: document.getElementById("stats-content"),
  statsExportCsvBtn: document.getElementById("stats-export-csv-btn"),
  statsExportJsonBtn: document.getElementById("stats-export-json-btn"),
  statsExportReimportBtn: document.getElementById("stats-export-reimport-btn"),
  collectionViewToggle: document.getElementById("collection-view-toggle"),
  viewFunBtn: document.getElementById("view-fun"),
  funView: document.getElementById("fun-view"),
  recommendationsContent: document.getElementById("recommendations-content"),
  compareInput: document.getElementById("compare-input"),
  compareBtn: document.getElementById("compare-btn"),
  compareSummary: document.getElementById("compare-summary"),
  compareResult: document.getElementById("compare-result"),
  digestContent: document.getElementById("digest-content"),
  wantlistAlertsContent: document.getElementById("wantlist-alerts-content"),
  creatorFollowRow: document.getElementById("creator-follow-row"),
  timelineContent: document.getElementById("timeline-content"),
  rouletteBtn: document.getElementById("roulette-btn"),
  rouletteResult: document.getElementById("roulette-result"),
  badgesContent: document.getElementById("badges-content"),
  quizStartBtn: document.getElementById("quiz-start-btn"),
  quizQuestion: document.getElementById("quiz-question"),
  showcaseView: document.getElementById("showcase-view"),
  showcaseBanner: document.getElementById("showcase-banner"),
  showcaseBannerImg: document.getElementById("showcase-banner-img"),
  showcaseAvatarImg: document.getElementById("showcase-avatar-img"),
  showcaseTitle: document.getElementById("showcase-title"),
  showcaseBio: document.getElementById("showcase-bio"),
  showcaseContent: document.getElementById("showcase-content"),
  showcaseForsaleSection: document.getElementById("showcase-forsale-section"),
  showcaseForsaleContent: document.getElementById("showcase-forsale-content"),
  showcaseActivitySection: document.getElementById("showcase-activity-section"),
  showcaseActivityContent: document.getElementById("showcase-activity-content"),
  collectionPrintLabelsBtn: document.getElementById("collection-print-labels-btn"),
  collectionBulkBar: document.getElementById("collection-bulk-bar"),
  collectionBulkCount: document.getElementById("collection-bulk-count"),
  collectionBulkStatus: document.getElementById("collection-bulk-status"),
  collectionBulkApplyBtn: document.getElementById("collection-bulk-apply-btn"),
  collectionBulkDeleteBtn: document.getElementById("collection-bulk-delete-btn"),
  collectionBulkClearBtn: document.getElementById("collection-bulk-clear-btn"),
  labelsView: document.getElementById("labels-view"),
  labelsGrid: document.getElementById("labels-grid"),
  labelsBackBtn: document.getElementById("labels-back-btn"),
  printLabelsBtn: document.getElementById("print-labels-btn"),
  funAccountLink: document.getElementById("fun-account-link"),
  accountView: document.getElementById("account-view"),
  accountBackBtn: document.getElementById("account-back-btn"),
  accountAvatarImg: document.getElementById("account-avatar-img"),
  accountAvatarInput: document.getElementById("account-avatar-input"),
  accountBannerImg: document.getElementById("account-banner-img"),
  accountBannerInput: document.getElementById("account-banner-input"),
  accountProfileForm: document.getElementById("account-profile-form"),
  accountUsernameInput: document.getElementById("account-username-input"),
  accountUsernameStatus: document.getElementById("account-username-status"),
  accountDisplayNameInput: document.getElementById("account-display-name-input"),
  accountBioInput: document.getElementById("account-bio-input"),
  accountShowcaseCheckbox: document.getElementById("account-showcase-checkbox"),
  accountLinkRow: document.getElementById("account-link-row"),
  accountLinkInput: document.getElementById("account-link-input"),
  accountLinkCopyBtn: document.getElementById("account-link-copy-btn"),
  accountProfileStatus: document.getElementById("account-profile-status"),
  accountAuthMethods: document.getElementById("account-auth-methods"),
  accountPasswordForm: document.getElementById("account-password-form"),
  accountPasswordLabel: document.getElementById("account-password-label"),
  accountPasswordInput: document.getElementById("account-password-input"),
  accountPasswordConfirmInput: document.getElementById("account-password-confirm-input"),
  accountPasswordStatus: document.getElementById("account-password-status"),
  accountCurrentEmail: document.getElementById("account-current-email"),
  accountEmailForm: document.getElementById("account-email-form"),
  accountEmailInput: document.getElementById("account-email-input"),
  accountEmailStatus: document.getElementById("account-email-status"),
  accountExportBeforeDeleteBtn: document.getElementById("account-export-before-delete-btn"),
  accountDeleteForm: document.getElementById("account-delete-form"),
  accountDeleteConfirmInput: document.getElementById("account-delete-confirm-input"),
  accountDeleteSubmitBtn: document.getElementById("account-delete-submit-btn"),
  accountDeleteStatus: document.getElementById("account-delete-status"),
  authModal: document.getElementById("auth-modal"),
  authModalClose: document.getElementById("auth-modal-close"),
  authModalTitle: document.getElementById("auth-modal-title"),
  authModalForm: document.getElementById("auth-modal-form"),
  authModalEmail: document.getElementById("auth-modal-email"),
  authModalPassword: document.getElementById("auth-modal-password"),
  authModalError: document.getElementById("auth-modal-error"),
  authModalSubmit: document.getElementById("auth-modal-submit"),
  authModalToggleMode: document.getElementById("auth-modal-toggle-mode"),
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

// Catégories pour lesquelles un code-barres scanné (EAN-13/UPC) peut être résolu
// directement : le "barcode" Discogs pour les disques, l'ISBN (qui EST le code-barres
// imprimé) pour les livres. Pas de source fiable et gratuite pour jeux vidéo/DVD/affiches,
// donc le bouton de scan reste masqué pour ces catégories.
const BARCODE_LOOKUP = {
  vinyl: { fn: "discogs-search", param: "barcode" },
  cd: { fn: "discogs-search", param: "barcode" },
  book: { fn: "openlibrary-search", param: "isbn" },
};

// Attribut qui porte l'année de sortie/publication pour chaque catégorie — utilisé par
// la frise chronologique et les badges. stamp/coin n'ont pas d'année de "sortie" au même
// sens (ce sont des objets historiques, pas des œuvres publiées), donc absents ici.
const YEAR_ATTRIBUTE_BY_CATEGORY = {
  vinyl: "pressing_year",
  cd: "pressing_year",
  video_game: "release_year",
  book: "year",
  dvd: "release_year",
  movie_poster: "release_year",
};

function itemYear(item) {
  const key = YEAR_ATTRIBUTE_BY_CATEGORY[item.categories?.slug];
  const raw = key ? item.attributes?.[key] : null;
  const year = raw ? parseInt(raw, 10) : null;
  return Number.isFinite(year) ? year : null;
}

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
    const accountBtn = document.createElement("button");
    accountBtn.type = "button";
    accountBtn.textContent = "⚙️ Mon compte";
    accountBtn.onclick = () => openAccountView();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Se déconnecter";
    btn.onclick = () => sb.auth.signOut();
    el.authArea.append(span, accountBtn, btn);
  } else {
    const googleBtn = document.createElement("button");
    googleBtn.type = "button";
    googleBtn.textContent = "Se connecter avec Google";
    googleBtn.onclick = () =>
      sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href },
      });
    const emailBtn = document.createElement("button");
    emailBtn.type = "button";
    emailBtn.textContent = "✉️ Email / mot de passe";
    emailBtn.onclick = () => openAuthModal("signin");
    el.authArea.append(googleBtn, emailBtn);
  }
}

// ---------- connexion email + mot de passe (en plus de Google) ----------
let authModalMode = "signin"; // "signin" | "signup"

function openAuthModal(mode) {
  authModalMode = mode;
  el.authModalEmail.value = "";
  el.authModalPassword.value = "";
  el.authModalError.hidden = true;
  el.authModalError.classList.remove("auth-modal-info");
  updateAuthModalMode();
  el.authModal.hidden = false;
  el.authModalEmail.focus();
}

function updateAuthModalMode() {
  if (authModalMode === "signup") {
    el.authModalTitle.textContent = "Créer un compte";
    el.authModalSubmit.textContent = "Créer mon compte";
    el.authModalToggleMode.textContent = "Déjà un compte ? Se connecter";
    el.authModalPassword.autocomplete = "new-password";
  } else {
    el.authModalTitle.textContent = "Se connecter";
    el.authModalSubmit.textContent = "Se connecter";
    el.authModalToggleMode.textContent = "Pas encore de compte ? Créer un compte";
    el.authModalPassword.autocomplete = "current-password";
  }
}

el.authModalClose.addEventListener("click", () => { el.authModal.hidden = true; });
el.authModalToggleMode.addEventListener("click", () => {
  authModalMode = authModalMode === "signup" ? "signin" : "signup";
  el.authModalError.hidden = true;
  el.authModalError.classList.remove("auth-modal-info");
  updateAuthModalMode();
});

el.authModalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.authModalError.hidden = true;
  const email = el.authModalEmail.value.trim();
  const password = el.authModalPassword.value;
  el.authModalSubmit.disabled = true;
  try {
    const { error } =
      authModalMode === "signup"
        ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } })
        : await sb.auth.signInWithPassword({ email, password });
    if (error) {
      el.authModalError.textContent = error.message;
      el.authModalError.hidden = false;
      return;
    }
    if (authModalMode === "signup") {
      el.authModalError.textContent =
        "Compte créé ! Si une confirmation par email est requise, clique sur le lien reçu avant de te connecter.";
      el.authModalError.hidden = false;
      el.authModalError.classList.add("auth-modal-info");
      return;
    }
    el.authModal.hidden = true;
  } finally {
    el.authModalSubmit.disabled = false;
  }
});

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

// ---- recherche globale : toutes catégories confondues, via l'index plein texte serveur
// (search_vector, tsvector généré sur titre + attributs) — utile dès que le catalogue
// grossit, plutôt que le filtrage client habituel qui reste scopé à une seule catégorie ----
let globalSearchDebounceTimer = null;
let globalSearchToken = 0;

el.globalSearchInput.addEventListener("input", () => {
  clearTimeout(globalSearchDebounceTimer);
  const query = el.globalSearchInput.value.trim();
  if (query.length < 2) {
    el.globalSearchResults.hidden = true;
    el.globalSearchResults.innerHTML = "";
    return;
  }
  globalSearchDebounceTimer = setTimeout(runGlobalSearch, 350);
});

document.addEventListener("click", (e) => {
  if (!el.globalSearchInput.parentElement.contains(e.target)) {
    el.globalSearchResults.hidden = true;
  }
});

async function runGlobalSearch() {
  const query = el.globalSearchInput.value.trim();
  if (query.length < 2) return;
  const token = ++globalSearchToken;

  el.globalSearchResults.hidden = false;
  el.globalSearchResults.innerHTML = "<p class='empty'>Recherche...</p>";

  // websearch_to_tsquery gère naturellement plusieurs mots ; en repli, une recherche ilike
  // sur le titre pour les requêtes trop courtes/partielles qu'une tsquery mots-entiers loupe
  const [{ data: ftsResults }, { data: ilikeResults }] = await Promise.all([
    sb.from("items").select("*, categories(*)").textSearch("search_vector", query, { type: "websearch", config: "french" }).limit(15),
    sb.from("items").select("*, categories(*)").ilike("title", `%${query}%`).limit(15),
  ]);
  if (token !== globalSearchToken) return;

  const merged = [...new Map([...(ftsResults ?? []), ...(ilikeResults ?? [])].map((i) => [i.id, i])).values()].slice(0, 15);

  if (!merged.length) {
    el.globalSearchResults.innerHTML = "<p class='empty'>Aucun résultat dans le catalogue.</p>";
    return;
  }

  el.globalSearchResults.innerHTML = "";
  merged.forEach((item) => {
    const row = document.createElement("div");
    row.className = "search-result-row";
    row.innerHTML = `
      <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="info">
        <span class="r-title">${escapeHtml(item.title)}</span>
        <span class="r-meta">${item.categories.icon ?? ""} ${escapeHtml(item.categories.name)}</span>
      </div>
    `;
    row.addEventListener("click", () => {
      el.globalSearchResults.hidden = true;
      el.globalSearchInput.value = "";
      selectCategory(item.categories.slug);
      openItemDetail(item, item.categories);
    });
    el.globalSearchResults.appendChild(row);
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
  el.barcodeScanBtn.hidden = !BARCODE_LOOKUP[slug];

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

// ---- édition en masse : sélection de plusieurs groupes (item+statut) à la fois ----
let bulkSelection = new Set(); // clés "item_id:status"
let lastRenderedGroups = new Map(); // clé -> { item, status, entryIds }

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
    rows = rows.filter((r) => {
      const q = collectionSearchQuery;
      if (r.items.title.toLowerCase().includes(q)) return true;
      if (Object.values(r.items.attributes || {}).some((v) => String(v).toLowerCase().includes(q))) return true;
      if (r.condition && r.condition.toLowerCase().includes(q)) return true;
      if (r.notes && r.notes.toLowerCase().includes(q)) return true;
      return false;
    });
  }

  el.collectionList.innerHTML = "";
  if (!rows.length) {
    el.collectionList.innerHTML = data.length
      ? "<p class='empty'>Aucun item ne correspond.</p>"
      : "<p class='empty'>Rien ici pour l'instant.</p>";
    lastRenderedGroups = new Map();
    bulkSelection.clear();
    el.collectionBulkBar.hidden = true;
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
  lastRenderedGroups = groups;
  // on ne garde en sélection que les clés encore présentes (ex: après un changement de filtre)
  bulkSelection = new Set([...bulkSelection].filter((k) => groups.has(k)));

  if (collectionViewMode === "pokedex") {
    el.collectionBulkBar.hidden = true;
    renderCollectionPokedex([...groups.values()]);
    return;
  }
  updateBulkBar();

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

// ---------- vue "Pokédex" de la collection : grille compacte, possédés en couleur,
// recherchés en silhouette grisée façon "pas encore capturé" ----------
function renderCollectionPokedex(groups) {
  const grid = document.createElement("div");
  grid.className = "pokedex-grid";
  groups
    .filter((g) => g.status !== "for_sale")
    .sort((a, b) => a.item.title.localeCompare(b.item.title))
    .forEach((group) => {
      const { item, status } = group;
      const card = document.createElement("div");
      card.className = `pokedex-card ${status}`;
      card.innerHTML = `
        <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
        <span class="pokedex-badge">${status === "owned" ? "✅" : "❔"}</span>
        <div class="pokedex-title">${escapeHtml(item.title)}</div>
      `;
      attachItemBubble(card, item, item.categories);
      grid.appendChild(card);
    });
  el.collectionList.appendChild(grid);
}

function renderCollectionGroup(group) {
  const { item, status, entryIds } = group;
  const key = `${item.id}:${status}`;
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <input type="checkbox" class="card-select-checkbox" aria-label="Sélectionner pour édition en masse" ${bulkSelection.has(key) ? "checked" : ""} />
    <div class="card-visual">
      <img class="card-thumb" src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="card-visual-info">
        <h3>${item.categories.icon ?? ""} ${escapeHtml(item.title)}</h3>
        <p class="status status-${status}">${statusLabel(status)}</p>
        <p class="collection-qty">${entryIds.length} exemplaire${entryIds.length > 1 ? "s" : ""}</p>
      </div>
    </div>
  `;
  const selectCheckbox = card.querySelector(".card-select-checkbox");
  selectCheckbox.addEventListener("click", (e) => e.stopPropagation());
  selectCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) bulkSelection.add(key);
    else bulkSelection.delete(key);
    updateBulkBar();
  });

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

  const labelBtn = document.createElement("button");
  labelBtn.textContent = "🏷️ Étiquette";
  labelBtn.onclick = (e) => {
    e.stopPropagation();
    openLabelsView([item]);
  };
  actions.appendChild(labelBtn);

  if (status === "owned" || status === "for_sale") {
    const saleBtn = document.createElement("button");
    saleBtn.textContent = status === "for_sale" ? "↩️ Retirer de la vente" : "💰 Mettre en vente";
    saleBtn.onclick = async (e) => {
      e.stopPropagation();
      const entryId = entryIds[entryIds.length - 1];
      const newStatus = status === "for_sale" ? "owned" : "for_sale";
      const { error } = await sb
        .from("collection_entries")
        .update({ status: newStatus, ...(newStatus === "owned" ? { asking_price: null } : {}) })
        .eq("id", entryId);
      if (error) return alert(error.message);
      loadMyCollection();
    };
    actions.appendChild(saleBtn);
  }

  card.appendChild(actions);
  attachItemBubble(card, item, item.categories);
  return card;
}

async function removeCollectionEntry(entryId) {
  const { error } = await sb.from("collection_entries").delete().eq("id", entryId);
  if (error) return alert(error.message);
  loadMyCollection();
}

// ---- édition en masse : barre d'actions groupées, applique aux TOUS les exemplaires des
// groupes (item+statut) sélectionnés d'un coup ----
function updateBulkBar() {
  el.collectionBulkBar.hidden = bulkSelection.size === 0;
  const totalEntries = [...bulkSelection].reduce((sum, key) => sum + (lastRenderedGroups.get(key)?.entryIds.length ?? 0), 0);
  el.collectionBulkCount.textContent = `${bulkSelection.size} groupe${bulkSelection.size > 1 ? "s" : ""} sélectionné${bulkSelection.size > 1 ? "s" : ""} (${totalEntries} exemplaire${totalEntries > 1 ? "s" : ""})`;
}

function bulkSelectedEntryIds() {
  return [...bulkSelection].flatMap((key) => lastRenderedGroups.get(key)?.entryIds ?? []);
}

el.collectionBulkApplyBtn.addEventListener("click", async () => {
  const ids = bulkSelectedEntryIds();
  if (!ids.length) return;
  const newStatus = el.collectionBulkStatus.value;
  const { error } = await sb.from("collection_entries").update({ status: newStatus }).in("id", ids);
  if (error) return alert(error.message);
  bulkSelection.clear();
  loadMyCollection();
});

el.collectionBulkDeleteBtn.addEventListener("click", async () => {
  const ids = bulkSelectedEntryIds();
  if (!ids.length) return;
  if (!confirm(`Supprimer ${ids.length} exemplaire${ids.length > 1 ? "s" : ""} de ta collection ?`)) return;
  const { error } = await sb.from("collection_entries").delete().in("id", ids);
  if (error) return alert(error.message);
  bulkSelection.clear();
  loadMyCollection();
});

el.collectionBulkClearBtn.addEventListener("click", () => {
  bulkSelection.clear();
  loadMyCollection();
});

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
    ${entry.status === "for_sale" ? `<label>Prix demandé (€)
      <input name="asking_price" type="number" step="0.01" min="0" value="${entry.asking_price ?? ""}" />
    </label>` : ""}
    <label>Date d'acquisition
      <input name="acquired_at" type="date" value="${entry.acquired_at ?? ""}" />
    </label>
    <label class="full-width">Notes
      <textarea name="notes">${escapeHtml(entry.notes ?? "")}</textarea>
    </label>
    <label class="full-width">Photos personnelles
      <div class="entry-photos-gallery"></div>
      <input type="file" accept="image/*" multiple class="entry-photos-input" />
    </label>
    <div class="actions">
      <button type="submit">Enregistrer</button>
      <button type="button" class="cancel-btn">Annuler</button>
    </div>
  `;
  form.addEventListener("click", (e) => e.stopPropagation());
  form.querySelector(".cancel-btn").addEventListener("click", () => form.remove());

  // photos personnelles : upload direct vers le bucket Storage privé "personal-photos",
  // chemin <user_id>/<entry_id>/<fichier> — cohérent avec les policies RLS du bucket
  const photoPaths = [...(entry.personal_photos ?? [])];
  const gallery = form.querySelector(".entry-photos-gallery");
  renderEntryPhotosGallery(gallery, photoPaths, entryId);

  const photoInput = form.querySelector(".entry-photos-input");
  photoInput.addEventListener("change", async () => {
    const files = [...photoInput.files];
    photoInput.value = "";
    if (!files.length) return;
    gallery.insertAdjacentHTML("beforeend", "<p class='empty'>Envoi en cours...</p>");
    for (const file of files) {
      const path = `${currentUser.id}/${entryId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await sb.storage.from("personal-photos").upload(path, file);
      if (uploadError) {
        alert(uploadError.message);
        continue;
      }
      photoPaths.push(path);
    }
    const { error: saveError } = await sb
      .from("collection_entries")
      .update({ personal_photos: photoPaths })
      .eq("id", entryId);
    if (saveError) alert(saveError.message);
    renderEntryPhotosGallery(gallery, photoPaths, entryId);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const { error: updateError } = await sb
      .from("collection_entries")
      .update({
        condition: fd.get("condition")?.trim() || null,
        price_paid: fd.get("price_paid") || null,
        ...(entry.status === "for_sale" ? { asking_price: fd.get("asking_price") || null } : {}),
        acquired_at: fd.get("acquired_at") || null,
        notes: fd.get("notes")?.trim() || null,
      })
      .eq("id", entryId);
    if (updateError) return alert(updateError.message);
    form.remove();
  });

  card.appendChild(form);
}

// affiche les vignettes des photos personnelles d'un exemplaire — le bucket étant privé,
// chaque vignette nécessite une URL signée (valable 1h, largement assez pour l'affichage)
async function renderEntryPhotosGallery(gallery, photoPaths, entryId) {
  gallery.innerHTML = "";
  if (!photoPaths.length) {
    gallery.innerHTML = "<p class='empty'>Pas encore de photo.</p>";
    return;
  }
  const { data: signedUrls, error } = await sb.storage
    .from("personal-photos")
    .createSignedUrls(photoPaths, 3600);
  if (error) {
    gallery.innerHTML = "<p class='empty'>Impossible de charger les photos.</p>";
    return;
  }
  signedUrls.forEach((signed, i) => {
    const path = photoPaths[i];
    const thumb = document.createElement("div");
    thumb.className = "entry-photo-thumb";
    thumb.innerHTML = `
      <img src="${signed.signedUrl ?? ""}" alt="" />
      <button type="button" class="entry-photo-remove" aria-label="Supprimer">×</button>
    `;
    thumb.querySelector(".entry-photo-remove").addEventListener("click", async () => {
      await sb.storage.from("personal-photos").remove([path]);
      photoPaths.splice(photoPaths.indexOf(path), 1);
      await sb.from("collection_entries").update({ personal_photos: photoPaths }).eq("id", entryId);
      renderEntryPhotosGallery(gallery, photoPaths, entryId);
    });
    gallery.appendChild(thumb);
  });
}

function statusLabel(status) {
  return { owned: "Possédé", wanted: "Recherché", for_sale: "À vendre" }[status] ?? status;
}

el.collectionFilter.addEventListener("change", loadMyCollection);
el.collectionSearch.addEventListener("input", () => {
  collectionSearchQuery = el.collectionSearch.value.trim().toLowerCase();
  loadMyCollection();
});
el.collectionViewToggle.addEventListener("click", () => {
  collectionViewMode = collectionViewMode === "pokedex" ? "list" : "pokedex";
  el.collectionViewToggle.classList.toggle("active", collectionViewMode === "pokedex");
  el.collectionViewToggle.textContent = collectionViewMode === "pokedex" ? "📋 Vue liste" : "🎴 Vue Pokédex";
  loadMyCollection();
});

// ---------- étiquettes imprimables (QR code vers la fiche de l'item, via la librairie
// "qrcode" chargée depuis jsdelivr) ----------
el.collectionPrintLabelsBtn.addEventListener("click", async () => {
  const entries = await fetchCollectionEntries();
  const owned = entries.filter((e) => e.status === "owned");
  const uniqueItems = [...new Map(owned.map((e) => [e.item_id, e.items])).values()];
  if (!uniqueItems.length) {
    alert("Rien à imprimer pour l'instant — ajoute des items possédés à ta collection.");
    return;
  }
  openLabelsView(uniqueItems);
});
el.labelsBackBtn.addEventListener("click", () => switchView("collection"));
el.printLabelsBtn.addEventListener("click", () => window.print());

function openLabelsView(items) {
  el.labelsGrid.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "label-card";
    const canvas = document.createElement("canvas");
    card.appendChild(canvas);
    const info = document.createElement("div");
    info.className = "label-info";
    info.innerHTML = `
      <div class="label-title">${escapeHtml(item.title)}</div>
      <div class="label-meta">${item.categories?.icon ?? ""} ${escapeHtml(item.categories?.name ?? "")}</div>
    `;
    card.appendChild(info);
    el.labelsGrid.appendChild(card);

    const url = `${location.origin}${location.pathname}?item=${item.id}`;
    if (typeof QRCode !== "undefined") {
      QRCode.toCanvas(canvas, url, { width: 72, margin: 0 }, () => {});
    }
  });
  switchView("labels");
}

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
el.viewStatsBtn.addEventListener("click", () => {
  unsubscribeCommunityFeed();
  switchView("stats");
});
el.viewFunBtn.addEventListener("click", () => {
  unsubscribeCommunityFeed();
  switchView("fun");
});

el.detailBack.addEventListener("click", () => switchView("catalogue"));
el.creatorBack.addEventListener("click", () => switchView("catalogue"));

function switchView(view) {
  el.homeView.hidden = view !== "home";
  el.catalogueView.hidden = view !== "catalogue";
  el.collectionView.hidden = view !== "collection";
  el.statsView.hidden = view !== "stats";
  el.funView.hidden = view !== "fun";
  el.detailView.hidden = view !== "detail";
  el.creatorView.hidden = view !== "creator";
  el.labelsView.hidden = view !== "labels";
  el.accountView.hidden = view !== "account";
  el.viewHomeBtn.classList.toggle("active", view === "home");
  el.viewCollectionBtn.classList.toggle("active", view === "collection");
  el.viewStatsBtn.classList.toggle("active", view === "stats");
  el.viewFunBtn.classList.toggle("active", view === "fun");
  if (view === "collection") loadMyCollection();
  if (view === "stats") loadStats();
  if (view === "fun") loadFunView();
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

// ---------- scan de code-barres (ZXing, caméra du téléphone/webcam) ----------
let barcodeReader = null;

el.barcodeScanBtn.addEventListener("click", openBarcodeScanner);
el.barcodeScannerClose.addEventListener("click", closeBarcodeScanner);

async function openBarcodeScanner() {
  const cat = currentCategory();
  const lookup = BARCODE_LOOKUP[cat?.slug];
  if (!lookup) return;

  if (typeof ZXing === "undefined") {
    alert("Le lecteur de code-barres n'a pas pu se charger. Vérifie ta connexion et réessaie.");
    return;
  }

  el.barcodeScannerModal.hidden = false;
  el.barcodeScannerStatus.textContent = "Vise le code-barres avec ta caméra...";
  barcodeReader = new ZXing.BrowserMultiFormatReader();

  try {
    await barcodeReader.decodeFromVideoDevice(undefined, el.barcodeScannerVideo, (result, err) => {
      if (result) {
        const code = result.getText();
        closeBarcodeScanner();
        searchByBarcode(code, cat, lookup);
      }
      // les erreurs de "pas encore de code détecté" sont normales à chaque frame, on les ignore
    });
  } catch (err) {
    el.barcodeScannerStatus.textContent =
      "Impossible d'accéder à la caméra. Vérifie les autorisations de ton navigateur.";
    console.error(err);
  }
}

function closeBarcodeScanner() {
  if (barcodeReader) {
    barcodeReader.reset();
    barcodeReader = null;
  }
  el.barcodeScannerModal.hidden = true;
}

async function searchByBarcode(code, cat, lookup) {
  el.externalSearchInput.value = code;
  el.externalSearchResults.hidden = false;
  el.externalSearchResults.innerHTML = "<p class='empty'>Recherche...</p>";

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    el.externalSearchResults.innerHTML = "<p class='empty'>Connecte-toi pour rechercher.</p>";
    return;
  }

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/${lookup.fn}?${lookup.param}=${encodeURIComponent(code)}&category_id=${encodeURIComponent(cat.id)}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );
  const payload = await res.json();
  if (!res.ok) {
    el.externalSearchResults.innerHTML = `<p class='empty'>Erreur : ${payload.error ?? res.statusText}</p>`;
    return;
  }
  if (!payload.results?.length) {
    el.externalSearchResults.innerHTML = `<p class='empty'>Aucun résultat pour le code ${escapeHtml(code)}. Essaie la recherche par titre.</p>`;
    return;
  }
  renderExternalResults(payload.results, cat);
}

// ---------- import CSV en masse ----------
el.csvTemplateBtn.addEventListener("click", downloadCsvTemplate);
el.csvImportBtn.addEventListener("click", () => el.csvImportInput.click());
el.csvImportInput.addEventListener("change", async () => {
  const file = el.csvImportInput.files?.[0];
  el.csvImportInput.value = "";
  if (file) await importCsv(file);
});

const CSV_FIXED_COLUMNS = ["titre", "image_url", "statut", "etat", "prix", "date_acquisition", "notes"];
const CSV_STATUS_LABELS = { owned: "possede", wanted: "recherche", for_sale: "a_vendre" };

function csvColumnsForCategory(cat) {
  return [...CSV_FIXED_COLUMNS, ...(cat.attribute_schema || []).map((f) => f.key)];
}

function downloadCsvTemplate() {
  const cat = currentCategory();
  if (!cat) return;
  const columns = csvColumnsForCategory(cat);
  const exampleRow = columns.map((c) => (c === "statut" ? "possede" : ""));
  const csv = [columns.join(","), exampleRow.join(",")].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `collect-me-modele-${cat.slug}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Parseur CSV minimal mais robuste : gère les champs entre guillemets (avec virgules,
// guillemets échappés en "" et retours à la ligne à l'intérieur d'un champ).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1)
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
      return obj;
    });
}

function parseCsvStatus(raw) {
  const v = (raw || "").trim().toLowerCase();
  if (!v) return "owned";
  if (["owned", "possede", "possédé", "possédée"].includes(v)) return "owned";
  if (["wanted", "recherche", "recherché", "recherchée"].includes(v)) return "wanted";
  if (["for_sale", "a_vendre", "à vendre", "a vendre"].includes(v)) return "for_sale";
  return "owned";
}

async function importCsv(file) {
  if (!currentUser) {
    alert("Connecte-toi pour importer un CSV.");
    return;
  }
  const cat = currentCategory();
  if (!cat) return;

  const text = await file.text();
  const rows = parseCsv(text);
  if (!rows.length) {
    el.csvImportStatus.hidden = false;
    el.csvImportStatus.textContent = "Le fichier est vide ou n'a pas pu être lu.";
    return;
  }

  const attrKeys = (cat.attribute_schema || []).map((f) => f.key);
  el.csvImportStatus.hidden = false;

  // détection d'un export natif Discogs ("Exporter" depuis la collection Discogs) : on le
  // reconnaît à ses colonnes caractéristiques et on le remappe vers nos colonnes internes,
  // en conservant release_id comme identifiant externe pour un dédoublonnage précis avec
  // le catalogue partagé (au lieu de retomber sur un dédoublonnage approximatif par titre)
  const isDiscogsExport =
    DISCOGS_CATEGORIES.includes(cat.slug) &&
    "title" in rows[0] &&
    "release_id" in rows[0] &&
    ("artist" in rows[0] || "label" in rows[0]);
  if (isDiscogsExport) {
    el.csvImportStatus.textContent = "Export Discogs détecté, conversion en cours...";
  }

  let added = 0, reused = 0, errors = 0;
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const r = isDiscogsExport ? mapDiscogsExportRow(raw) : raw;
    el.csvImportStatus.textContent = `Import en cours... (${i + 1}/${rows.length})`;
    const title = (r["titre"] || "").trim();
    if (!title) { errors++; continue; }

    const attributes = {};
    attrKeys.forEach((k) => { if (r[k]) attributes[k] = r[k]; });

    try {
      const { item, created } = await findOrCreateItem({
        cat,
        title,
        externalIds: r["__discogs_id"] ? { discogs_id: r["__discogs_id"] } : {},
        attributes,
        coverImageUrl: r["image_url"] || null,
        source: "csv_import",
      });
      if (created) added++; else reused++;

      const { error: entryError } = await sb.from("collection_entries").insert({
        item_id: item.id,
        user_id: currentUser.id,
        status: parseCsvStatus(r["statut"]),
        condition: r["etat"] || null,
        price_paid: r["prix"] ? Number(r["prix"].replace(",", ".")) || null : null,
        acquired_at: r["date_acquisition"] || null,
        notes: r["notes"] || null,
      });
      if (entryError) throw entryError;
    } catch (err) {
      console.error(err);
      errors++;
    }
  }

  el.csvImportStatus.textContent =
    `Import terminé${isDiscogsExport ? " (export Discogs)" : ""} : ${added} nouvel${added > 1 ? "s" : ""} item${added > 1 ? "s" : ""} créé${added > 1 ? "s" : ""}, ` +
    `${reused} déjà existant${reused > 1 ? "s" : ""} réutilisé${reused > 1 ? "s" : ""}, ` +
    `${errors} ligne${errors > 1 ? "s" : ""} en erreur.`;

  loadCatalogue();
  if (!el.collectionView.hidden) loadMyCollection();
}

// remappe une ligne d'export natif Discogs (colonnes Artist/Title/Label/Format/Released/
// release_id/Date Added/Collection Media Condition/Collection Sleeve Condition/Collection
// Notes, en-têtes déjà passés en minuscules par parseCsv) vers nos colonnes internes
function mapDiscogsExportRow(r) {
  const condition = [r["collection media condition"], r["collection sleeve condition"]]
    .filter(Boolean)
    .join(" / ");
  const dateMatch = String(r["date added"] || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return {
    titre: r["title"] || "",
    statut: "possede",
    etat: condition,
    prix: "",
    date_acquisition: dateMatch ? dateMatch[1] : "",
    notes: r["collection notes"] || "",
    artist: r["artist"] || "",
    label: r["label"] || "",
    pressing_year: r["released"] || "",
    format: r["format"] || "",
    __discogs_id: r["release_id"] || "",
  };
}

// ---------- récupération partagée de la collection (stats, badges, roulette, quiz, frise) ----------
let collectionEntriesCache = [];

async function fetchCollectionEntries() {
  if (!currentUser) return [];
  const { data, error } = await sb
    .from("collection_entries")
    .select("*, items(*, categories(*))")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  collectionEntriesCache = data ?? [];
  return collectionEntriesCache;
}

// ---------- statistiques ----------
async function loadStats() {
  if (!currentUser) {
    el.statsContent.innerHTML = "<p class='empty'>Connecte-toi pour voir tes statistiques.</p>";
    return;
  }
  el.statsContent.innerHTML = "<p class='empty'>Chargement...</p>";
  const entries = await fetchCollectionEntries();
  renderStats(entries);
}

function renderStats(entries) {
  el.statsContent.innerHTML = "";
  if (!entries.length) {
    el.statsContent.innerHTML =
      "<p class='empty'>Rien à analyser pour l'instant — ajoute des items à ta collection.</p>";
    return;
  }

  const byStatus = { owned: 0, wanted: 0, for_sale: 0 };
  const byCategory = new Map(); // nom de catégorie -> nombre d'exemplaires
  const uniqueItemIds = new Set();
  let totalSpent = 0;
  let spentCount = 0;
  const byYear = new Map(); // année -> nombre d'acquisitions

  entries.forEach((e) => {
    byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
    const catName = e.items.categories.name;
    byCategory.set(catName, (byCategory.get(catName) ?? 0) + 1);
    uniqueItemIds.add(e.item_id);
    if (e.price_paid != null) {
      totalSpent += Number(e.price_paid);
      spentCount++;
    }
    if (e.acquired_at) {
      const year = e.acquired_at.slice(0, 4);
      byYear.set(year, (byYear.get(year) ?? 0) + 1);
    }
  });

  // ---- cartes résumé ----
  const cards = document.createElement("div");
  cards.className = "stats-cards";
  const summary = [
    [entries.length, "Exemplaires au total"],
    [uniqueItemIds.size, "Items uniques"],
    [byStatus.owned, "Possédés"],
    [byStatus.wanted, "Recherchés"],
    [byStatus.for_sale, "À vendre"],
    [spentCount ? `${totalSpent.toFixed(2)} €` : "—", "Dépensé (renseigné)"],
  ];
  summary.forEach(([value, label]) => {
    const card = document.createElement("div");
    card.className = "stats-card";
    card.innerHTML = `<div class="stats-card-value">${value}</div><div class="stats-card-label">${label}</div>`;
    cards.appendChild(card);
  });
  el.statsContent.appendChild(cards);

  // ---- répartition par catégorie ----
  el.statsContent.appendChild(
    buildStatsBarSection("Répartition par catégorie", [...byCategory.entries()].sort((a, b) => b[1] - a[1]))
  );

  // ---- répartition par année d'acquisition (seulement si l'info est renseignée) ----
  if (byYear.size) {
    el.statsContent.appendChild(
      buildStatsBarSection(
        "Acquisitions par année",
        [...byYear.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      )
    );
  }

  // ---- derniers ajouts ----
  const recentSection = document.createElement("div");
  recentSection.className = "stats-section";
  recentSection.innerHTML = "<h3>Derniers ajouts</h3>";
  const list = document.createElement("ul");
  list.className = "stats-recent-list";
  entries.slice(0, 8).forEach((e) => {
    const date = e.acquired_at ?? e.created_at?.slice(0, 10) ?? "";
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${e.items.categories.icon ?? ""} ${escapeHtml(e.items.title)}</span>
      <span class="stats-recent-date">${escapeHtml(date)}</span>
    `;
    list.appendChild(li);
  });
  recentSection.appendChild(list);
  el.statsContent.appendChild(recentSection);
}

function buildStatsBarSection(title, pairs) {
  const section = document.createElement("div");
  section.className = "stats-section";
  const heading = document.createElement("h3");
  heading.textContent = title;
  section.appendChild(heading);
  const max = Math.max(...pairs.map(([, count]) => count), 1);
  pairs.forEach(([label, count]) => {
    const row = document.createElement("div");
    row.className = "stats-bar-row";
    row.innerHTML = `
      <span class="stats-bar-label">${escapeHtml(String(label))}</span>
      <span class="stats-bar-track"><span class="stats-bar-fill" style="width:${(count / max) * 100}%"></span></span>
      <span class="stats-bar-count">${count}</span>
    `;
    section.appendChild(row);
  });
  return section;
}

// ---------- export de la collection (sauvegarde/analyse externe) ----------
el.statsExportCsvBtn.addEventListener("click", exportCollectionCsv);
el.statsExportJsonBtn.addEventListener("click", exportCollectionJson);
el.statsExportReimportBtn.addEventListener("click", exportReimportableCsv);

function triggerDownload(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCollectionCsv() {
  if (!collectionEntriesCache.length) return;
  const columns = ["categorie", "titre", "statut", "etat", "prix_paye", "date_acquisition", "notes", "attributs"];
  const rows = collectionEntriesCache.map((e) => [
    e.items.categories.name,
    e.items.title,
    statusLabel(e.status),
    e.condition ?? "",
    e.price_paid ?? "",
    e.acquired_at ?? "",
    e.notes ?? "",
    JSON.stringify(e.items.attributes ?? {}),
  ]);
  const csv = [columns.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\r\n");
  triggerDownload(csv, "ma-collection.csv", "text/csv;charset=utf-8;");
}

function exportCollectionJson() {
  if (!collectionEntriesCache.length) return;
  const data = collectionEntriesCache.map((e) => ({
    categorie: e.items.categories.slug,
    titre: e.items.title,
    statut: e.status,
    etat: e.condition,
    prix_paye: e.price_paid,
    date_acquisition: e.acquired_at,
    notes: e.notes,
    image: e.items.cover_image_url,
    attributs: e.items.attributes,
  }));
  triggerDownload(JSON.stringify(data, null, 2), "ma-collection.json", "application/json;charset=utf-8;");
}

// export "réimportable" : un fichier CSV par catégorie, exactement dans le format attendu
// par l'import (mêmes colonnes que downloadCsvTemplate, mêmes codes de statut) — permet un
// aller-retour propre, y compris entre deux instances de Collect Me
function exportReimportableCsv() {
  if (!collectionEntriesCache.length) return;
  const byCategory = new Map(); // slug -> { cat, rows }
  collectionEntriesCache.forEach((e) => {
    const cat = e.items.categories;
    if (!byCategory.has(cat.slug)) byCategory.set(cat.slug, { cat, rows: [] });
    byCategory.get(cat.slug).rows.push(e);
  });

  let delay = 0;
  byCategory.forEach(({ cat, rows }) => {
    const columns = csvColumnsForCategory(cat);
    const csvRows = rows.map((e) =>
      columns.map((c) => {
        if (c === "titre") return e.items.title;
        if (c === "image_url") return e.items.cover_image_url ?? "";
        if (c === "statut") return CSV_STATUS_LABELS[e.status] ?? e.status;
        if (c === "etat") return e.condition ?? "";
        if (c === "prix") return e.price_paid ?? "";
        if (c === "date_acquisition") return e.acquired_at ?? "";
        if (c === "notes") return e.notes ?? "";
        return e.items.attributes?.[c] ?? "";
      })
    );
    const csv = [columns.join(","), ...csvRows.map((r) => r.map(csvEscape).join(","))].join("\r\n");
    // léger décalage entre chaque téléchargement : la plupart des navigateurs bloquent
    // plusieurs déclenchements de téléchargement strictement simultanés
    setTimeout(() => triggerDownload(csv, `collect-me-export-${cat.slug}.csv`, "text/csv;charset=utf-8;"), delay);
    delay += 300;
  });
}

// ---------- "Découvrir" : frise chronologique, roulette, badges, quiz tracklist ----------
async function loadFunView() {
  if (!currentUser) {
    el.timelineContent.innerHTML = "<p class='empty'>Connecte-toi pour découvrir ta collection.</p>";
    el.badgesContent.innerHTML = "";
    el.rouletteResult.innerHTML = "";
    el.quizQuestion.innerHTML = "";
    return;
  }
  el.timelineContent.innerHTML = "<p class='empty'>Chargement...</p>";
  const entries = await fetchCollectionEntries();
  loadCreatorDigest(entries);
  renderWantlistAlerts(entries);
  renderRecommendations(entries);
  renderTimeline(entries);
  renderBadges(entries);
  el.rouletteResult.innerHTML = "";
  el.quizQuestion.innerHTML = "";
  el.compareResult.innerHTML = "";
  el.compareSummary.innerHTML = "";
}

el.funAccountLink.addEventListener("click", () => openAccountView());

// ---- digest des nouveautés des créateurs suivis : une recherche "œuvres du créateur" par
// créateur suivi (même mode que la page créateur), en écartant ce qui est déjà possédé ----
async function loadCreatorDigest(entries) {
  el.digestContent.innerHTML = "";
  if (!currentUser) return;

  const { data: followed, error } = await sb
    .from("followed_creators")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });
  if (error || !followed?.length) {
    el.digestContent.innerHTML =
      "<p class='empty'>Suis un artiste, un auteur, un studio ou un réalisateur depuis sa page pour voir ses nouveautés ici.</p>";
    return;
  }

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    el.digestContent.innerHTML = "<p class='empty'>Connecte-toi pour voir les nouveautés.</p>";
    return;
  }

  const ownedExternalIds = new Set();
  entries
    .filter((e) => e.status === "owned")
    .forEach((e) => {
      Object.values(e.items.external_ids || {}).forEach((v) => ownedExternalIds.add(String(v)));
    });

  el.digestContent.innerHTML = "<p class='empty'>Recherche des nouveautés...</p>";
  const sections = [];

  for (const follow of followed) {
    const cat = categories.find((c) => c.slug === follow.category_slug);
    const fnName = cat && CATEGORY_SEARCH_FUNCTIONS[cat.slug];
    if (!cat || !fnName) continue;

    const params = new URLSearchParams({ category_id: cat.id });
    if (DISCOGS_CATEGORIES.includes(cat.slug)) {
      if (follow.creator_id) params.set("artist_id", follow.creator_id);
      else params.set("artist", follow.creator_name);
    } else if (cat.slug === "video_game") {
      params.set("publisher", follow.creator_name);
    } else if (cat.slug === "book") {
      if (follow.creator_id) params.set("author_id", follow.creator_id);
      else params.set("author", follow.creator_name);
    } else if (TMDB_CATEGORIES.includes(cat.slug)) {
      if (follow.creator_id) params.set("person_id", follow.creator_id);
      else params.set("person", follow.creator_name);
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = await res.json();
      if (!res.ok) continue;

      const idKey = EXTERNAL_ID_KEY[cat.slug];
      const works = (payload.results ?? [])
        .filter((w) => !ownedExternalIds.has(String(w[idKey])))
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
        .slice(0, 3);
      if (!works.length) continue;

      const section = document.createElement("div");
      section.className = "digest-creator";
      section.innerHTML = `<h4>${creatorIcon(cat)} ${escapeHtml(follow.creator_name)}</h4>`;
      const row = document.createElement("div");
      row.className = "digest-row";
      works.forEach((w) => {
        const item = document.createElement("div");
        item.className = "timeline-item";
        item.innerHTML = `
          <img src="${w.cover_image ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
          <span>${escapeHtml(w.title)}${w.year ? ` (${w.year})` : ""}</span>
        `;
        item.onclick = () => openDetail(w, cat);
        row.appendChild(item);
      });
      section.appendChild(row);
      sections.push(section);
    } catch (_e) {
      // une source indisponible ne doit pas bloquer les autres créateurs suivis
    }
  }

  el.digestContent.innerHTML = "";
  if (!sections.length) {
    el.digestContent.innerHTML =
      "<p class='empty'>Pas de nouveauté détectée pour tes créateurs suivis pour l'instant.</p>";
    return;
  }
  sections.forEach((s) => el.digestContent.appendChild(s));
}

// ---- alertes wantlist : croise les items "recherchés" avec public_for_sale_items (les
// vendeurs ayant activé leur vitrine publique), sans jamais toucher aux collections privées
// d'autrui — seulement ce que chacun a lui-même choisi de rendre visible ----
async function renderWantlistAlerts(entries) {
  const wanted = entries.filter((e) => e.status === "wanted");
  if (!wanted.length) {
    el.wantlistAlertsContent.innerHTML = "<p class='empty'>Ajoute des items à ta wantlist pour être alerté·e s'ils apparaissent à la vente.</p>";
    return;
  }
  el.wantlistAlertsContent.innerHTML = "<p class='empty'>Recherche en cours...</p>";
  const wantedIds = [...new Set(wanted.map((e) => e.item_id))];
  const { data: matches, error } = await sb
    .from("public_for_sale_items")
    .select("*")
    .in("item_id", wantedIds)
    .neq("user_id", currentUser.id);

  if (error || !matches?.length) {
    el.wantlistAlertsContent.innerHTML = "<p class='empty'>Rien à la vente pour l'instant parmi tes items recherchés.</p>";
    return;
  }

  el.wantlistAlertsContent.innerHTML = `<p>${matches.length} item${matches.length > 1 ? "s" : ""} de ta wantlist ${matches.length > 1 ? "sont" : "est"} à la vente :</p>`;
  const grid = document.createElement("div");
  grid.className = "pokedex-grid";
  matches.forEach((item) => {
    const sellerLink = item.seller_username ? `?u=${item.seller_username}` : `?showcase=${item.user_id}`;
    const sellerName = item.seller_username ? `@${item.seller_username}` : (item.seller_display_name || "un·e collectionneur·se");
    const card = document.createElement("a");
    card.href = sellerLink;
    card.target = "_blank";
    card.rel = "noopener";
    card.className = "pokedex-card owned";
    card.innerHTML = `
      <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="pokedex-title">${item.category_icon ?? ""} ${escapeHtml(item.title)}</div>
      <p class="empty recommendation-reason">${item.asking_price ? `${item.asking_price} € — ` : ""}chez ${escapeHtml(sellerName)}</p>
    `;
    grid.appendChild(card);
  });
  el.wantlistAlertsContent.innerHTML = "";
  el.wantlistAlertsContent.appendChild(grid);
}

// ---- comparer sa collection avec celle d'un ami : repose sur la vitrine publique de l'ami
// (public_showcase_items), donc jamais d'accès aux collections privées — seulement ce que
// l'ami a lui-même choisi de rendre visible ----
el.compareBtn.addEventListener("click", compareWithFriend);

// accepte un lien/id de vitrine sous les deux formats : ?showcase=<uuid> (historique) et
// ?u=<pseudo> (nouveau, lié au profil personnalisable) — ce dernier nécessite une résolution
// pseudo → user_id via la table profiles
function extractShowcaseUserId(raw) {
  const linkMatch = raw.match(/showcase=([0-9a-f-]{36})/i);
  if (linkMatch) return linkMatch[1];
  const bareMatch = raw.trim().match(/^[0-9a-f-]{36}$/i);
  return bareMatch ? bareMatch[0] : null;
}

function extractShowcaseUsername(raw) {
  const linkMatch = raw.match(/[?&]u=([a-z0-9_]{3,20})/i);
  if (linkMatch) return linkMatch[1].toLowerCase();
  const bareMatch = raw.trim().match(/^[a-z0-9_]{3,20}$/i);
  return bareMatch && !/^[0-9a-f-]{36}$/i.test(raw.trim()) ? bareMatch[0].toLowerCase() : null;
}

async function resolveFriendId(raw) {
  const byId = extractShowcaseUserId(raw);
  if (byId) return byId;
  const byUsername = extractShowcaseUsername(raw);
  if (!byUsername) return null;
  const { data } = await sb.from("profiles").select("id").eq("username", byUsername).maybeSingle();
  return data?.id ?? null;
}

async function compareWithFriend() {
  const raw = el.compareInput.value.trim();
  if (!raw) return;
  const friendId = await resolveFriendId(raw);
  if (!friendId) {
    el.compareResult.innerHTML = "<p class='empty'>Lien ou identifiant de vitrine invalide.</p>";
    return;
  }
  if (currentUser && friendId === currentUser.id) {
    el.compareResult.innerHTML = "<p class='empty'>C'est ton propre lien de vitrine !</p>";
    return;
  }

  el.compareResult.innerHTML = "<p class='empty'>Comparaison en cours...</p>";
  el.compareSummary.innerHTML = "";

  const { data: profile } = await sb
    .from("profiles")
    .select("display_name, public_showcase")
    .eq("id", friendId)
    .maybeSingle();
  if (!profile || !profile.public_showcase) {
    el.compareResult.innerHTML = "<p class='empty'>Cette personne n'a pas (ou plus) de vitrine publique activée.</p>";
    return;
  }
  const friendName = profile.display_name || "cette personne";

  const { data: friendItems, error } = await sb.from("public_showcase_items").select("*").eq("user_id", friendId);
  if (error) {
    el.compareResult.innerHTML = "<p class='empty'>Impossible de charger sa vitrine pour l'instant.</p>";
    return;
  }

  const entries = collectionEntriesCache.length ? collectionEntriesCache : await fetchCollectionEntries();
  const myOwned = entries.filter((e) => e.status === "owned");
  const ownedIds = new Set(myOwned.map((e) => e.item_id));
  const uniqueFriendItems = [...new Map((friendItems ?? []).map((i) => [i.item_id, i])).values()];
  const common = uniqueFriendItems.filter((i) => ownedIds.has(i.item_id));

  // ---- duel : tailles de collection + répartition par catégorie, qui en a le plus ----
  const myByCategory = new Map();
  myOwned.forEach((e) => {
    const name = e.items.categories.name;
    myByCategory.set(name, (myByCategory.get(name) ?? 0) + 1);
  });
  const friendByCategory = new Map();
  uniqueFriendItems.forEach((i) => {
    friendByCategory.set(i.category_name, (friendByCategory.get(i.category_name) ?? 0) + 1);
  });
  const allCategoryNames = [...new Set([...myByCategory.keys(), ...friendByCategory.keys()])].sort();

  const summary = document.createElement("div");
  summary.className = "duel-summary";
  const myTotal = myOwned.length;
  const friendTotal = uniqueFriendItems.length;
  const totalWinner = myTotal === friendTotal ? "égalité" : myTotal > friendTotal ? "toi" : escapeHtml(friendName);
  summary.innerHTML = `
    <p class="duel-total">🏆 ${myTotal} vs ${friendTotal} items possédés — ${
      totalWinner === "égalité" ? "égalité parfaite !" : `avantage ${totalWinner === "toi" ? "à toi" : `à ${totalWinner}`} !`
    }</p>
    <table class="duel-table">
      <thead><tr><th>Catégorie</th><th>Toi</th><th></th><th>${escapeHtml(friendName)}</th></tr></thead>
      <tbody>
        ${allCategoryNames.map((name) => {
          const mine = myByCategory.get(name) ?? 0;
          const theirs = friendByCategory.get(name) ?? 0;
          const badge = mine === theirs ? "🤝" : mine > theirs ? "◀️" : "▶️";
          return `<tr><td>${escapeHtml(name)}</td><td>${mine}</td><td>${badge}</td><td>${theirs}</td></tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
  el.compareSummary.appendChild(summary);

  if (!common.length) {
    el.compareResult.innerHTML = `<p class='empty'>Aucun item en commun avec ${escapeHtml(friendName)} pour l'instant.</p>`;
    return;
  }

  el.compareResult.innerHTML = `<p>${common.length} item${common.length > 1 ? "s" : ""} en commun avec ${escapeHtml(friendName)} :</p>`;
  const grid = document.createElement("div");
  grid.className = "pokedex-grid";
  common.forEach((item) => {
    const card = document.createElement("div");
    card.className = "pokedex-card owned";
    card.innerHTML = `
      <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="pokedex-title">${item.category_icon ?? ""} ${escapeHtml(item.title)}</div>
    `;
    grid.appendChild(card);
  });
  el.compareResult.appendChild(grid);
}

// ---- recommandations "si tu as aimé X" : suggestions basées sur les genres des items
// possédés, comparés au reste du catalogue partagé (pas seulement ce que l'utilisateur a
// ajouté lui-même). book/stamp/coin n'ont pas d'attribut "genre" et sont donc naturellement
// exclus de ce calcul. ----
async function renderRecommendations(entries) {
  el.recommendationsContent.innerHTML = "<p class='empty'>Chargement...</p>";
  const owned = entries.filter((e) => e.status === "owned");
  const ownedItemIds = new Set(owned.map((e) => e.item_id));

  const genresByCategory = new Map(); // category_id -> Set(genre)
  owned.forEach((e) => {
    const genreRaw = e.items.attributes?.genre;
    if (!genreRaw) return;
    const catId = e.items.category_id;
    if (!genresByCategory.has(catId)) genresByCategory.set(catId, new Set());
    String(genreRaw)
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean)
      .forEach((g) => genresByCategory.get(catId).add(g));
  });

  if (!genresByCategory.size) {
    el.recommendationsContent.innerHTML =
      "<p class='empty'>Pas encore assez d'items avec un genre renseigné pour te faire des suggestions.</p>";
    return;
  }

  const { data: candidateItems, error } = await sb
    .from("items")
    .select("*, categories(*)")
    .in("category_id", [...genresByCategory.keys()]);
  if (error || !candidateItems) {
    el.recommendationsContent.innerHTML = "<p class='empty'>Impossible de charger les suggestions.</p>";
    return;
  }

  const scored = candidateItems
    .filter((item) => !ownedItemIds.has(item.id))
    .map((item) => {
      const genres = genresByCategory.get(item.category_id);
      const itemGenres = String(item.attributes?.genre ?? "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);
      return { item, matched: itemGenres.filter((g) => genres.has(g)) };
    })
    .filter((x) => x.matched.length)
    .sort((a, b) => b.matched.length - a.matched.length)
    .slice(0, 6);

  if (!scored.length) {
    el.recommendationsContent.innerHTML =
      "<p class='empty'>Rien de nouveau à te suggérer pour l'instant dans le catalogue.</p>";
    return;
  }

  const grid = document.createElement("div");
  grid.className = "pokedex-grid";
  scored.forEach(({ item, matched }) => {
    const card = document.createElement("div");
    card.className = "pokedex-card owned";
    card.innerHTML = `
      <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="pokedex-title">${item.categories.icon ?? ""} ${escapeHtml(item.title)}</div>
      <p class="empty recommendation-reason">Parce que tu aimes ${escapeHtml(matched[0])}</p>
    `;
    attachItemBubble(card, item, item.categories);
    grid.appendChild(card);
  });
  el.recommendationsContent.innerHTML = "";
  el.recommendationsContent.appendChild(grid);
}

// ---- "Mon compte" : profil public (pseudo, avatar, bannière, bio, vitrine) + connexion ----
el.accountBackBtn.addEventListener("click", () => switchView("home"));

async function openAccountView() {
  if (!currentUser) return;
  switchView("account");
  el.accountProfileStatus.hidden = true;
  el.accountPasswordStatus.hidden = true;
  el.accountUsernameStatus.textContent = "";
  el.accountUsernameStatus.className = "account-username-status";

  const { data: profile, error } = await sb
    .from("profiles")
    .select("username, display_name, bio, avatar_url, banner_url, public_showcase")
    .eq("id", currentUser.id)
    .maybeSingle();
  if (error) return alert(error.message);

  el.accountUsernameInput.value = profile?.username || "";
  el.accountUsernameInput.dataset.original = profile?.username || "";
  el.accountDisplayNameInput.value = profile?.display_name || currentUser.user_metadata?.full_name || "";
  el.accountBioInput.value = profile?.bio || "";
  el.accountShowcaseCheckbox.checked = profile?.public_showcase ?? false;
  updateAccountLinkVisibility(profile?.public_showcase ?? false, profile?.username || null);
  setAccountImagePreview(el.accountAvatarImg, profile?.avatar_url);
  setAccountImagePreview(el.accountBannerImg, profile?.banner_url);

  renderAccountAuthMethods();

  el.accountCurrentEmail.textContent = currentUser.email || "(aucun)";
  el.accountEmailInput.value = "";
  el.accountEmailStatus.hidden = true;
  el.accountDeleteConfirmInput.value = "";
  el.accountDeleteSubmitBtn.disabled = true;
  el.accountDeleteStatus.hidden = true;
}

function setAccountImagePreview(imgEl, url) {
  imgEl.src = url || "";
  imgEl.style.visibility = url ? "visible" : "hidden";
}

function updateAccountLinkVisibility(isPublic, username) {
  el.accountLinkRow.hidden = !isPublic;
  if (isPublic && currentUser) {
    const base = `${location.origin}${location.pathname}`;
    el.accountLinkInput.value = username ? `${base}?u=${username}` : `${base}?showcase=${currentUser.id}`;
  }
}

// upload avatar/bannière : bucket Storage public "profile-images", chemin
// <user_id>/avatar.<ext> ou <user_id>/banner.<ext> (upsert pour remplacer l'ancien fichier),
// URL publique permanente (contrairement aux photos personnelles, ces images sont destinées
// à être vues par des visiteurs anonymes sur la page de profil publique)
async function uploadAccountImage(file, kind) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${currentUser.id}/${kind}.${ext}`;
  const { error: uploadError } = await sb.storage
    .from("profile-images")
    .upload(path, file, { upsert: true });
  if (uploadError) {
    alert(uploadError.message);
    return null;
  }
  const { data } = sb.storage.from("profile-images").getPublicUrl(path);
  // on ajoute un paramètre anti-cache : même chemin qu'avant si l'utilisateur remplace son image
  return `${data.publicUrl}?v=${Date.now()}`;
}

el.accountAvatarInput.addEventListener("change", async () => {
  const file = el.accountAvatarInput.files[0];
  el.accountAvatarInput.value = "";
  if (!file) return;
  const url = await uploadAccountImage(file, "avatar");
  if (!url) return;
  const { error } = await sb
    .from("profiles")
    .upsert({ id: currentUser.id, avatar_url: url }, { onConflict: "id" });
  if (error) return alert(error.message);
  setAccountImagePreview(el.accountAvatarImg, url);
});

el.accountBannerInput.addEventListener("change", async () => {
  const file = el.accountBannerInput.files[0];
  el.accountBannerInput.value = "";
  if (!file) return;
  const url = await uploadAccountImage(file, "banner");
  if (!url) return;
  const { error } = await sb
    .from("profiles")
    .upsert({ id: currentUser.id, banner_url: url }, { onConflict: "id" });
  if (error) return alert(error.message);
  setAccountImagePreview(el.accountBannerImg, url);
});

// vérification de disponibilité du pseudo, avec anti-rebond
let usernameCheckTimer = null;
el.accountUsernameInput.addEventListener("input", () => {
  clearTimeout(usernameCheckTimer);
  const raw = el.accountUsernameInput.value.trim().toLowerCase();
  el.accountUsernameInput.value = raw;
  if (!raw) {
    el.accountUsernameStatus.textContent = "";
    return;
  }
  if (!/^[a-z0-9_]{3,20}$/.test(raw)) {
    el.accountUsernameStatus.textContent = "3 à 20 caractères : lettres, chiffres, _";
    el.accountUsernameStatus.className = "account-username-status taken";
    return;
  }
  if (raw === el.accountUsernameInput.dataset.original) {
    el.accountUsernameStatus.textContent = "Ton pseudo actuel";
    el.accountUsernameStatus.className = "account-username-status ok";
    return;
  }
  el.accountUsernameStatus.textContent = "Vérification...";
  el.accountUsernameStatus.className = "account-username-status";
  usernameCheckTimer = setTimeout(async () => {
    const { data, error } = await sb.from("profiles").select("id").eq("username", raw).maybeSingle();
    if (error) return;
    if (data) {
      el.accountUsernameStatus.textContent = "Déjà pris";
      el.accountUsernameStatus.className = "account-username-status taken";
    } else {
      el.accountUsernameStatus.textContent = "Disponible";
      el.accountUsernameStatus.className = "account-username-status ok";
    }
  }, 400);
});

el.accountProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.accountProfileStatus.hidden = true;
  const username = el.accountUsernameInput.value.trim().toLowerCase() || null;
  if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
    el.accountProfileStatus.textContent = "Pseudo invalide (3 à 20 caractères : lettres, chiffres, _).";
    el.accountProfileStatus.hidden = false;
    return;
  }
  const isPublic = el.accountShowcaseCheckbox.checked;
  const { error } = await sb.from("profiles").upsert(
    {
      id: currentUser.id,
      username,
      display_name: el.accountDisplayNameInput.value.trim() || currentUser.user_metadata?.full_name || currentUser.email || null,
      bio: el.accountBioInput.value.trim() || null,
      public_showcase: isPublic,
    },
    { onConflict: "id" }
  );
  if (error) {
    el.accountProfileStatus.textContent = error.message.includes("profiles_username_unique")
      ? "Ce pseudo est déjà pris."
      : error.message;
    el.accountProfileStatus.hidden = false;
    return;
  }
  el.accountUsernameInput.dataset.original = username || "";
  updateAccountLinkVisibility(isPublic, username);
  el.accountProfileStatus.textContent = "Profil enregistré !";
  el.accountProfileStatus.hidden = false;
});

el.accountLinkCopyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(el.accountLinkInput.value);
    const original = el.accountLinkCopyBtn.textContent;
    el.accountLinkCopyBtn.textContent = "Copié !";
    setTimeout(() => { el.accountLinkCopyBtn.textContent = original; }, 1500);
  } catch (_e) {
    el.accountLinkInput.select();
  }
});

// ---- connexion & mot de passe : un compte connecté (via Google ou email) peut définir/
// changer un mot de passe, ce qui active email+mot de passe comme moyen de connexion
// supplémentaire sur ce même compte (identités Supabase, cf. currentUser.identities) ----
function hasPasswordAuth() {
  return (currentUser?.identities || []).some((i) => i.provider === "email");
}

function renderAccountAuthMethods() {
  const methods = (currentUser?.identities || []).map((i) => i.provider);
  const label = methods.length
    ? `Moyens de connexion actifs : ${methods.map((m) => (m === "google" ? "Google" : "Email + mot de passe")).join(", ")}.`
    : "";
  el.accountAuthMethods.textContent = label;
  el.accountPasswordLabel.textContent = hasPasswordAuth() ? "Changer le mot de passe" : "Définir un mot de passe";
}

el.accountPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.accountPasswordStatus.hidden = true;
  const password = el.accountPasswordInput.value;
  const confirm = el.accountPasswordConfirmInput.value;
  if (password !== confirm) {
    el.accountPasswordStatus.textContent = "Les deux mots de passe ne correspondent pas.";
    el.accountPasswordStatus.hidden = false;
    return;
  }
  const { error } = await sb.auth.updateUser({ password });
  if (error) {
    el.accountPasswordStatus.textContent = error.message;
    el.accountPasswordStatus.hidden = false;
    return;
  }
  el.accountPasswordInput.value = "";
  el.accountPasswordConfirmInput.value = "";
  // on rafraîchit l'utilisateur pour que currentUser.identities reflète l'ajout de l'identité email
  const { data: { user } } = await sb.auth.getUser();
  if (user) currentUser = user;
  renderAccountAuthMethods();
  el.accountPasswordStatus.textContent = "Mot de passe enregistré !";
  el.accountPasswordStatus.hidden = false;
});

// ---- changer d'email : envoie une (ou deux, selon les réglages Supabase) confirmation(s)
// par email avant que le changement ne prenne effet ----
el.accountEmailForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.accountEmailStatus.hidden = true;
  const newEmail = el.accountEmailInput.value.trim();
  const { error } = await sb.auth.updateUser({ email: newEmail });
  if (error) {
    el.accountEmailStatus.textContent = error.message;
    el.accountEmailStatus.hidden = false;
    return;
  }
  el.accountEmailStatus.textContent = "Vérifie ta boîte mail : un lien de confirmation a été envoyé (à la nouvelle adresse, et parfois aussi à l'ancienne selon les réglages).";
  el.accountEmailStatus.hidden = false;
});

// ---- suppression du compte : export préalable optionnel, puis appel à la edge function
// "delete-account" (seule capable de supprimer le compte auth.users lui-même, la clé anonyme
// ne le permettant pas) ----
el.accountExportBeforeDeleteBtn.addEventListener("click", async () => {
  const { data: entries } = await sb
    .from("collection_entries")
    .select("*, items(*, categories(*))")
    .eq("user_id", currentUser.id);
  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();
  const data = {
    compte: { email: currentUser.email, id: currentUser.id },
    profil: profile ?? null,
    collection: (entries ?? []).map((e) => ({
      titre: e.items.title,
      categorie: e.items.categories.name,
      statut: e.status,
      etat: e.condition,
      prix_paye: e.price_paid,
      prix_demande: e.asking_price,
      date_acquisition: e.acquired_at,
      notes: e.notes,
      attributs: e.items.attributes,
    })),
  };
  triggerDownload(JSON.stringify(data, null, 2), "mes-donnees-collect-me.json", "application/json;charset=utf-8;");
});

el.accountDeleteConfirmInput.addEventListener("input", () => {
  el.accountDeleteSubmitBtn.disabled = el.accountDeleteConfirmInput.value.trim() !== "SUPPRIMER";
});

el.accountDeleteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (el.accountDeleteConfirmInput.value.trim() !== "SUPPRIMER") return;
  if (!confirm("Dernière confirmation : supprimer définitivement ton compte et toutes tes données ?")) return;

  el.accountDeleteSubmitBtn.disabled = true;
  el.accountDeleteStatus.hidden = true;

  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      el.accountDeleteStatus.textContent = body.error || "Une erreur est survenue, réessaie plus tard.";
      el.accountDeleteStatus.hidden = false;
      el.accountDeleteSubmitBtn.disabled = false;
      return;
    }
    alert("Ton compte a bien été supprimé.");
    await sb.auth.signOut();
    location.href = location.origin + location.pathname;
  } catch (_e) {
    el.accountDeleteStatus.textContent = "Impossible de contacter le serveur, réessaie plus tard.";
    el.accountDeleteStatus.hidden = false;
    el.accountDeleteSubmitBtn.disabled = false;
  }
});

// ---- rendu de la vitrine publique pour un visiteur (pas besoin d'être connecté) ----
// accepte soit un user_id (lien historique ?showcase=), soit un pseudo (nouveau lien ?u=)
async function renderPublicShowcase({ userId, username }) {
  document.querySelector("header").hidden = true;
  document.querySelector("nav.main-nav").hidden = true;
  ["home-view", "catalogue-view", "collection-view", "stats-view", "fun-view", "detail-view", "creator-view"]
    .forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.hidden = true;
    });
  el.showcaseView.hidden = false;

  let profileQuery = sb
    .from("profiles")
    .select("id, display_name, public_showcase, username, bio, avatar_url, banner_url");
  profileQuery = username ? profileQuery.eq("username", username) : profileQuery.eq("id", userId);
  const { data: profile, error: profileError } = await profileQuery.maybeSingle();

  if (profileError || !profile || !profile.public_showcase) {
    el.showcaseTitle.textContent = "Profil introuvable";
    el.showcaseContent.innerHTML = "<p class='empty'>Ce profil n'existe pas ou n'est plus public.</p>";
    return;
  }
  userId = profile.id;

  el.showcaseTitle.textContent = profile.username
    ? `📚 @${escapeHtml(profile.username)}`
    : `📚 Collection de ${escapeHtml(profile.display_name || "un·e collectionneur·se")}`;

  if (profile.bio) {
    el.showcaseBio.textContent = profile.bio;
    el.showcaseBio.hidden = false;
  } else {
    el.showcaseBio.hidden = true;
  }
  if (profile.avatar_url) {
    el.showcaseAvatarImg.src = profile.avatar_url;
    el.showcaseAvatarImg.hidden = false;
  } else {
    el.showcaseAvatarImg.hidden = true;
  }
  if (profile.banner_url) {
    el.showcaseBannerImg.src = profile.banner_url;
    el.showcaseBanner.hidden = false;
  } else {
    el.showcaseBanner.hidden = true;
  }

  const [{ data: items, error }, { data: forSaleItems }] = await Promise.all([
    sb.from("public_showcase_items").select("*").eq("user_id", userId),
    sb.from("public_for_sale_items").select("*").eq("user_id", userId),
  ]);

  if (forSaleItems?.length) {
    el.showcaseForsaleSection.hidden = false;
    const forSaleGrid = document.createElement("div");
    forSaleGrid.className = "pokedex-grid";
    forSaleItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "pokedex-card owned";
      card.innerHTML = `
        <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
        <div class="pokedex-title">${item.category_icon ?? ""} ${escapeHtml(item.title)}</div>
        ${item.asking_price ? `<p class="empty recommendation-reason">${item.asking_price} €</p>` : ""}
      `;
      forSaleGrid.appendChild(card);
    });
    el.showcaseForsaleContent.innerHTML = "";
    el.showcaseForsaleContent.appendChild(forSaleGrid);
  } else {
    el.showcaseForsaleSection.hidden = true;
  }

  // fil d'activité : les derniers ajouts, façon Letterboxd — chaque exemplaire ajouté compte
  // comme un événement, y compris un doublon d'un item déjà présent
  if (items?.length) {
    const recent = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
    el.showcaseActivitySection.hidden = false;
    el.showcaseActivityContent.innerHTML = "";
    recent.forEach((item) => {
      const row = document.createElement("div");
      row.className = "activity-row";
      row.innerHTML = `
        <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
        <div class="activity-info">
          <span class="activity-title">${item.category_icon ?? ""} ${escapeHtml(item.title)}</span>
          <span class="activity-date">Ajouté le ${new Date(item.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
      `;
      el.showcaseActivityContent.appendChild(row);
    });
  } else {
    el.showcaseActivitySection.hidden = true;
  }

  if (error || !items?.length) {
    el.showcaseContent.innerHTML = "<p class='empty'>Rien à montrer pour l'instant.</p>";
    return;
  }

  const uniqueItems = [...new Map(items.map((i) => [i.item_id, i])).values()]
    .sort((a, b) => a.title.localeCompare(b.title));

  const grid = document.createElement("div");
  grid.className = "pokedex-grid";
  uniqueItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "pokedex-card owned";
    card.innerHTML = `
      <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="pokedex-title">${item.category_icon ?? ""} ${escapeHtml(item.title)}</div>
    `;
    grid.appendChild(card);
  });
  el.showcaseContent.innerHTML = "";
  el.showcaseContent.appendChild(grid);
}

// ---- frise chronologique : les items possédés, regroupés par décennie de sortie ----
function renderTimeline(entries) {
  el.timelineContent.innerHTML = "";
  const owned = entries.filter((e) => e.status === "owned");
  const uniqueItems = new Map();
  owned.forEach((e) => {
    if (!uniqueItems.has(e.item_id)) uniqueItems.set(e.item_id, e.items);
  });

  const withYear = [...uniqueItems.values()]
    .map((item) => ({ item, year: itemYear(item) }))
    .filter((x) => x.year);

  if (!withYear.length) {
    el.timelineContent.innerHTML =
      "<p class='empty'>Pas encore assez d'années de sortie renseignées pour tracer une frise.</p>";
    return;
  }

  const byDecade = new Map();
  withYear.forEach(({ item, year }) => {
    const decade = `${Math.floor(year / 10) * 10}s`;
    if (!byDecade.has(decade)) byDecade.set(decade, []);
    byDecade.get(decade).push({ item, year });
  });

  const track = document.createElement("div");
  track.className = "timeline-track";
  [...byDecade.entries()]
    .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
    .forEach(([decade, decadeItems]) => {
      const col = document.createElement("div");
      col.className = "timeline-decade";
      col.innerHTML = `<h4>${decade}</h4>`;
      const list = document.createElement("div");
      list.className = "timeline-items";
      decadeItems
        .sort((a, b) => a.year - b.year)
        .forEach(({ item, year }) => {
          const row = document.createElement("div");
          row.className = "timeline-item";
          row.innerHTML = `
            <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
            <span>${escapeHtml(item.title)} (${year})</span>
          `;
          attachItemBubble(row, item, item.categories);
          list.appendChild(row);
        });
      col.appendChild(list);
      track.appendChild(col);
    });
  el.timelineContent.appendChild(track);
}

// ---- roulette "quoi faire ce soir ?" : tire un item possédé au hasard, façon machine à sous ----
const ROULETTE_EXCLUDED_CATEGORIES = ["stamp", "coin"];

el.rouletteBtn.addEventListener("click", spinRoulette);

async function spinRoulette() {
  const entries = collectionEntriesCache.length ? collectionEntriesCache : await fetchCollectionEntries();
  const candidates = entries.filter(
    (e) => e.status === "owned" && !ROULETTE_EXCLUDED_CATEGORIES.includes(e.items.categories.slug)
  );
  if (!candidates.length) {
    el.rouletteResult.innerHTML =
      "<p class='empty'>Pas encore d'item possédé à te proposer — ajoute des choses à ta collection !</p>";
    return;
  }

  const card = document.createElement("div");
  card.className = "roulette-result-card spinning";
  card.innerHTML = `<img src="" alt="" /><div class="pokedex-title">Tirage en cours...</div>`;
  el.rouletteResult.innerHTML = "";
  el.rouletteResult.appendChild(card);
  const img = card.querySelector("img");

  let ticks = 0;
  const maxTicks = 12;
  const timer = setInterval(() => {
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    img.src = pick.items.cover_image_url ?? "";
    ticks++;
    if (ticks >= maxTicks) {
      clearInterval(timer);
      finalizeRoulette(card, pick);
    }
  }, 120);
}

function finalizeRoulette(card, entry) {
  const item = entry.items;
  card.classList.remove("spinning");
  card.innerHTML = `
    <img src="${item.cover_image_url ?? ""}" alt="" onerror="this.style.visibility='hidden'" />
    <div>
      <div class="pokedex-title">${item.categories.icon ?? ""} ${escapeHtml(item.title)}</div>
      <p class="empty" style="margin:0.3rem 0 0;">${escapeHtml(item.categories.name)}</p>
    </div>
  `;
  attachItemBubble(card, item, item.categories);
}

// ---- badges : quelques paliers calculés côté client à partir de la collection ----
const BADGE_DEFS = [
  { icon: "🥇", label: "Premier item", check: (s) => s.totalOwned >= 1 },
  { icon: "🔟", label: "10 exemplaires", check: (s) => s.totalOwned >= 10 },
  { icon: "💯", label: "50 exemplaires", check: (s) => s.totalOwned >= 50 },
  { icon: "🏛️", label: "100 exemplaires", check: (s) => s.totalOwned >= 100 },
  { icon: "🎯", label: "5 catégories différentes", check: (s) => s.categoriesOwned >= 5 },
  { icon: "🌈", label: "Toutes les catégories", check: (s) => s.categoriesTotal > 0 && s.categoriesOwned >= s.categoriesTotal },
  { icon: "🌟", label: "Une wantlist", check: (s) => s.totalWanted >= 1 },
  { icon: "💰", label: "Plus de 500 € suivis", check: (s) => s.totalSpent >= 500 },
  { icon: "📅", label: "Une décennie couverte", check: (s) => s.yearSpread >= 10 },
];

function computeBadgeStats(entries) {
  const owned = entries.filter((e) => e.status === "owned");
  const wanted = entries.filter((e) => e.status === "wanted");
  const categoriesOwned = new Set(owned.map((e) => e.items.categories.slug)).size;
  const totalSpent = owned.reduce((sum, e) => sum + (e.price_paid ? Number(e.price_paid) : 0), 0);
  const years = owned.map((e) => itemYear(e.items)).filter(Boolean);
  const yearSpread = years.length ? Math.max(...years) - Math.min(...years) : 0;
  return {
    totalOwned: owned.length,
    totalWanted: wanted.length,
    categoriesOwned,
    categoriesTotal: categories.length,
    totalSpent,
    yearSpread,
  };
}

function renderBadges(entries) {
  const stats = computeBadgeStats(entries);
  el.badgesContent.innerHTML = "";
  BADGE_DEFS.forEach((badge) => {
    const unlocked = badge.check(stats);
    const card = document.createElement("div");
    card.className = `badge-card ${unlocked ? "unlocked" : ""}`;
    card.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-label">${badge.label}</div>
    `;
    el.badgesContent.appendChild(card);
  });
}

// ---- quiz tracklist : devine l'album vinyle/CD possédé à partir de 3 titres de pistes ----
el.quizStartBtn.addEventListener("click", startQuiz);

async function startQuiz() {
  const entries = collectionEntriesCache.length ? collectionEntriesCache : await fetchCollectionEntries();
  const discogsOwned = entries.filter(
    (e) =>
      e.status === "owned" &&
      DISCOGS_CATEGORIES.includes(e.items.categories.slug) &&
      e.items.external_ids?.discogs_id
  );
  const uniqueByItem = [...new Map(discogsOwned.map((e) => [e.item_id, e])).values()];

  if (uniqueByItem.length < 2) {
    el.quizQuestion.innerHTML =
      "<p class='empty'>Il te faut au moins 2 vinyles/CD possédés pour lancer le quiz.</p>";
    return;
  }

  el.quizQuestion.innerHTML = "<p class='empty'>Préparation de la question...</p>";

  const target = uniqueByItem[Math.floor(Math.random() * uniqueByItem.length)];
  const { data: { session } } = await sb.auth.getSession();
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/discogs-search?id=${encodeURIComponent(target.items.external_ids.discogs_id)}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );
  const payload = await res.json();
  const tracklist = payload.detail?.tracklist ?? [];
  if (!res.ok || tracklist.length < 2) {
    el.quizQuestion.innerHTML = "<p class='empty'>Pas assez d'informations de tracklist pour cet album, réessaie.</p>";
    return;
  }

  const sampleTracks = [...tracklist].sort(() => Math.random() - 0.5).slice(0, 3);
  const distractors = uniqueByItem
    .filter((e) => e.item_id !== target.item_id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((e) => e.items.title);
  const options = [...distractors, target.items.title].sort(() => Math.random() - 0.5);

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <p>Quel album regroupe ces titres ?</p>
    <ul class="quiz-tracks">${sampleTracks.map((t) => `<li>🎵 ${escapeHtml(t.title)}</li>`).join("")}</ul>
    <div class="quiz-options"></div>
  `;
  const optionsWrap = wrapper.querySelector(".quiz-options");
  options.forEach((title) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option-btn";
    btn.textContent = title;
    btn.onclick = () => {
      [...optionsWrap.children].forEach((b) => { b.disabled = true; });
      if (title === target.items.title) {
        btn.classList.add("correct");
      } else {
        btn.classList.add("incorrect");
        [...optionsWrap.children]
          .find((b) => b.textContent === target.items.title)
          ?.classList.add("correct");
      }
      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "quiz-next-btn";
      nextBtn.textContent = "Question suivante";
      nextBtn.onclick = startQuiz;
      wrapper.appendChild(nextBtn);
    };
    optionsWrap.appendChild(btn);
  });

  el.quizQuestion.innerHTML = "";
  el.quizQuestion.appendChild(wrapper);
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

  const shareActions = document.createElement("div");
  shareActions.className = "actions detail-actions";
  shareActions.appendChild(buildShareButton(item.id));
  el.detailContent.appendChild(shareActions);

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

// bouton "Partager" réutilisé sur la fiche locale et la fiche externe riche : copie un lien
// ?item=<id> qui rouvre toujours la fiche LOCALE (jamais d'appel API externe), donc utilisable
// par un visiteur non connecté sans déclencher l'exigence d'authentification des recherches externes
function buildShareButton(itemId) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "🔗 Partager cette fiche";
  btn.onclick = async () => {
    const url = `${location.origin}${location.pathname}?item=${itemId}`;
    try {
      await navigator.clipboard.writeText(url);
      const original = btn.textContent;
      btn.textContent = "Copié !";
      setTimeout(() => { btn.textContent = original; }, 1500);
    } catch (_e) {
      prompt("Copie ce lien :", url);
    }
  };
  return btn;
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
  renderCreatorFollowButton(cat, name, artistId);

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

// ---- suivre un créateur : bouton bascule sur sa page, alimente le digest de nouveautés
// dans "Découvrir" (voir loadCreatorDigest) ----
async function renderCreatorFollowButton(cat, name, artistId) {
  el.creatorFollowRow.innerHTML = "";
  if (!currentUser) return;

  const { data: existing } = await sb
    .from("followed_creators")
    .select("id")
    .eq("user_id", currentUser.id)
    .eq("category_slug", cat.slug)
    .eq("creator_name", name)
    .maybeSingle();

  let followRowId = existing?.id ?? null;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tab";
  btn.textContent = followRowId ? "🔕 Ne plus suivre" : "🔔 Suivre ce créateur";
  btn.onclick = async () => {
    if (followRowId) {
      const { error } = await sb.from("followed_creators").delete().eq("id", followRowId);
      if (error) return alert(error.message);
      followRowId = null;
      btn.textContent = "🔔 Suivre ce créateur";
    } else {
      const { data, error } = await sb
        .from("followed_creators")
        .insert({
          user_id: currentUser.id,
          category_slug: cat.slug,
          creator_id: artistId || null,
          creator_name: name,
        })
        .select()
        .single();
      if (error) return alert(error.message);
      followRowId = data.id;
      btn.textContent = "🔕 Ne plus suivre";
    }
  };
  el.creatorFollowRow.appendChild(btn);
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
  if (currentDetail.localItemId) {
    actions.appendChild(buildShareButton(currentDetail.localItemId));
  }
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

// ---------- partage d'une fiche unique ----------
// Toujours la fiche LOCALE (jamais openDetail/l'API externe) : elle contient déjà tout ce
// qui a été mis en cache à l'ajout (titre, visuel, attributs) et ne nécessite pas d'être
// connecté ni d'appeler une API tierce payante/limitée — contrairement à la recherche externe.
async function openSharedItem(itemId) {
  const { data: item, error } = await sb
    .from("items")
    .select("*, categories(*)")
    .eq("id", itemId)
    .maybeSingle();
  if (error || !item) {
    alert("Cet item n'existe pas ou plus dans le catalogue.");
    return;
  }
  const cat = item.categories;
  selectCategory(cat.slug);
  renderLocalItemDetail(item, cat);
}

// ---------- boot ----------
const showcaseUserId = new URLSearchParams(location.search).get("showcase");
const showcaseUsername = new URLSearchParams(location.search).get("u");
const sharedItemId = new URLSearchParams(location.search).get("item");
if (showcaseUserId || showcaseUsername) {
  // lien de profil public (historique ?showcase=<id> ou nouveau ?u=<pseudo>) : pas d'auth,
  // pas de catalogue — juste le profil et la collection exposée
  renderPublicShowcase({ userId: showcaseUserId, username: showcaseUsername });
} else {
  initAuth();
  loadCategories().then(() => {
    if (sharedItemId) openSharedItem(sharedItemId);
  });
}
