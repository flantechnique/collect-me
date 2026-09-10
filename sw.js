// Service worker "Glanure" : rend le site installable et consultable hors-ligne.
//
// Deux stratégies distinctes :
// - App shell (HTML/CSS/JS/icônes, même origine) : cache en priorité, réseau en secours —
//   l'app s'ouvre instantanément et fonctionne même sans réseau.
// - Lectures Supabase (/rest/v1/...) : réseau en priorité (toujours les données les plus
//   fraîches si on est en ligne), cache en secours si le réseau échoue — on peut donc
//   reconsulter sa collection telle qu'elle était lors de la dernière visite en ligne.
// Tout le reste (écritures, auth, edge functions, images externes) n'est jamais intercepté :
// on ne veut ni cacher une réponse d'authentification, ni servir une vieille recherche
// externe à la place d'un résultat frais.

const SHELL_CACHE = "collect-me-shell-v1";
const DATA_CACHE = "collect-me-data-v1";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/app.js",
  "./assets/style.css",
  "./assets/config.js",
  "./assets/library-bg.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/logo-mark.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // jamais intercepter les écritures

  const url = new URL(request.url);
  const isSupabaseRead = url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/v1/");

  if (isSupabaseRead) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
  // autres origines (auth, edge functions, pochettes d'albums...) : réseau normal, non intercepté
});
