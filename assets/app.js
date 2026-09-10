import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- state ----------
let currentUser = null;
let categories = [];
let activeCategorySlug = null;

// ---------- elements ----------
const el = {
  authArea: document.getElementById("auth-area"),
  categoryTabs: document.getElementById("category-tabs"),
  viewCatalogueBtn: document.getElementById("view-catalogue"),
  viewCollectionBtn: document.getElementById("view-collection"),
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
  externalSearchBtn: document.getElementById("external-search-btn"),
  externalSearchResults: document.getElementById("external-search-results"),
};

// Catégories pour lesquelles une edge function de recherche externe existe.
// Ajouter une entrée ici active automatiquement le bloc de recherche pour la catégorie.
const CATEGORY_SEARCH_FUNCTIONS = {
  vinyl: "discogs-search",
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
  el.categoryTabs.innerHTML = "";
  el.collectionFilter.innerHTML = '<option value="">Toutes les catégories</option>';

  categories.forEach((cat) => {
    const tab = document.createElement("button");
    tab.className = "tab";
    tab.textContent = `${cat.icon ?? ""} ${cat.name}`.trim();
    tab.onclick = () => selectCategory(cat.slug);
    el.categoryTabs.appendChild(tab);

    const opt = document.createElement("option");
    opt.value = cat.slug;
    opt.textContent = cat.name;
    el.collectionFilter.appendChild(opt);
  });

  if (categories.length) selectCategory(categories[0].slug);
}

function currentCategory() {
  return categories.find((c) => c.slug === activeCategorySlug);
}

function selectCategory(slug) {
  activeCategorySlug = slug;
  [...el.categoryTabs.children].forEach((btn, i) => {
    btn.classList.toggle("active", categories[i].slug === slug);
  });
  renderAddItemFields();
  loadCatalogue();

  const hasExternalSearch = Boolean(CATEGORY_SEARCH_FUNCTIONS[slug]);
  el.externalSearch.hidden = !hasExternalSearch;
  el.externalSearchResults.innerHTML = "";
  el.externalSearchInput.value = "";
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
  let query = sb
    .from("collection_entries")
    .select("*, items(*, categories(*))")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return console.error(error);

  const filterSlug = el.collectionFilter.value;
  const rows = filterSlug ? data.filter((r) => r.items.categories.slug === filterSlug) : data;

  el.collectionList.innerHTML = "";
  if (!rows.length) {
    el.collectionList.innerHTML = "<p class='empty'>Rien ici pour l'instant.</p>";
    return;
  }
  rows.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${entry.items.categories.icon ?? ""} ${entry.items.title}</h3>
      <p class="status status-${entry.status}">${statusLabel(entry.status)}</p>
    `;
    el.collectionList.appendChild(card);
  });
}

function statusLabel(status) {
  return { owned: "Possédé", wanted: "Recherché", for_sale: "À vendre" }[status] ?? status;
}

el.collectionFilter.addEventListener("change", loadMyCollection);

// ---------- view switching ----------
el.viewCatalogueBtn.addEventListener("click", () => switchView("catalogue"));
el.viewCollectionBtn.addEventListener("click", () => switchView("collection"));

function switchView(view) {
  el.catalogueView.hidden = view !== "catalogue";
  el.collectionView.hidden = view !== "collection";
  el.viewCatalogueBtn.classList.toggle("active", view === "catalogue");
  el.viewCollectionBtn.classList.toggle("active", view === "collection");
  if (view === "collection") loadMyCollection();
}

// ---------- recherche externe (Discogs, IGDB...) ----------
async function searchExternal() {
  const cat = currentCategory();
  const fnName = CATEGORY_SEARCH_FUNCTIONS[cat.slug];
  const query = el.externalSearchInput.value.trim();
  if (!fnName || !query) return;

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    alert("Connecte-toi pour rechercher.");
    return;
  }

  el.externalSearchResults.innerHTML = "<p class='empty'>Recherche...</p>";
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/${fnName}?q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );
  const payload = await res.json();
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
  results.forEach((r) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${r.title}</h3>
      <ul class="attrs">
        ${r.label ? `<li>Label : ${r.label}</li>` : ""}
        ${r.year ? `<li>Année : ${r.year}</li>` : ""}
        ${r.format ? `<li>Format : ${r.format}</li>` : ""}
      </ul>
    `;
    const btn = document.createElement("button");
    btn.textContent = "Importer dans le catalogue";
    btn.onclick = () => importExternalResult(r, cat);
    card.appendChild(btn);
    el.externalSearchResults.appendChild(card);
  });
}

async function importExternalResult(r, cat) {
  const attributes = {};
  if (r.label) attributes.label = r.label;
  if (r.year) attributes.pressing_year = r.year;
  if (r.format) attributes.format = r.format;

  const { data, error } = await sb
    .from("items")
    .insert({
      category_id: cat.id,
      title: r.title,
      cover_image_url: r.cover_image ?? null,
      external_ids: { discogs_id: r.discogs_id },
      attributes,
      source: "external_api",
      created_by: currentUser.id,
    })
    .select()
    .single();

  if (error) return alert(error.message);

  el.externalSearchResults.innerHTML = "";
  el.externalSearchInput.value = "";
  loadCatalogue();
  addToCollection(data.id, "owned");
}

el.externalSearchBtn.addEventListener("click", searchExternal);
el.externalSearchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchExternal();
  }
});

// ---------- boot ----------
initAuth();
loadCategories();
