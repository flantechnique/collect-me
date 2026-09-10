# Glanure

Site de suivi de collections façon Discogs, généralisé à tous types d'objets (vinyles, jeux vidéo pour le MVP ; DVD/steelbooks, CD, timbres, monnaies, livres, affiches de films à ajouter progressivement).

Domaine en ligne : **[glanure.com](https://glanure.com)**.

## État actuel

- Backend Supabase créé (projet `collect-me`, région `eu-west-1`), schéma appliqué :
  - `categories` (catalogue des types de collection + leurs attributs attendus, en JSONB)
  - `items` (catalogue des objets de référence)
  - `collection_entries` (ce que chaque utilisateur possède/recherche)
  - RLS activé : catalogue en lecture publique, collection personnelle strictement privée à chaque utilisateur
  - 2 catégories seedées : Vinyles (`vinyl`) et Jeux vidéo (`video_game`)
- Profils utilisateurs façon Discogs/Letterboxd : pseudo personnalisé, avatar/bannière, bio, page publique `?u=<pseudo>`, connexion email + mot de passe (liable à un compte Google existant), gestion du mot de passe, couleur de thème personnalisable, suppression de compte (edge function `delete-account`).
- Recherche globale (full-text `tsvector` français), vitrine publique avec objets à vendre, alertes sur liste de recherche, duel de collections entre amis, fil d'activité, export CSV réimportable, sélection multiple/actions groupées, récap "On this day" et "Wrapped" annuel.
- Frontend statique minimal dans ce dossier (`index.html` + `assets/`) : auth Google, parcours du catalogue par catégorie, ajout manuel d'un item, ajout à sa collection (possédé/recherché), vue "Ma collection" filtrable.
- **Déployé** sur GitHub Pages et connecté au domaine `glanure.com` (DNS chez OVH).
- Pas encore fait : import automatique depuis Discogs/IGDB (recherche externe au lieu de saisie manuelle).

## Déploiement (fait)

- Frontend statique déployé sur **GitHub Pages** (repo `flantechnique/collect-me`, branche `main`, dossier `/ (root)`).
- Domaine **glanure.com** acheté chez OVH, connecté en tant que "Custom domain" dans Settings → Pages (le fichier `CNAME` à la racine contient `glanure.com`).
- Zone DNS OVH configurée : 4 enregistrements `A` + 4 `AAAA` sur `@` vers GitHub Pages, `CNAME` `www` → `flantechnique.github.io.`. Les enregistrements mail existants (MX, SPF, autodiscover/autoconfig, DKIM) ont été conservés.

## À faire

### 1. Activer la connexion Google dans Supabase

Dans le dashboard Supabase du projet `collect-me` → **Authentication → Providers → Google** :
1. Créer des identifiants OAuth côté Google Cloud Console (type "Web application").
2. Renseigner Client ID / Client Secret dans Supabase.
3. Dans **Authentication → URL Configuration**, mettre le Site URL et les Redirect URLs sur `https://glanure.com` (garder l'ancienne URL en Redirect URL secondaire pendant la transition si besoin).

(Comme pour Top YouTube, ces identifiants Google sont à créer une fois puis réutilisables.)

### 1bis. Connexion email + mot de passe (profil façon Discogs/Letterboxd)

En plus de Google, le site propose une connexion par email + mot de passe, et un profil personnalisable (pseudo, avatar, bannière, bio, page publique `?u=<pseudo>`). Le provider "Email" est activé par défaut sur un projet Supabase — rien à configurer sauf si tu veux ajuster **Authentication → Providers → Email** (ex. désactiver la confirmation par email pour des tests plus rapides) ou activer **Authentication → Providers → Email → Leaked password protection** (recommandé maintenant que des mots de passe existent ; nécessite un plan Supabase Pro ou plus).

### 2. Renommer le dépôt (optionnel)

Le dépôt GitHub s'appelle encore `collect-me` — il peut être renommé en `glanure` dans Settings → Repository name si souhaité (GitHub redirige automatiquement les anciennes URLs).

## Prochaines étapes produit

- Intégrer la recherche Discogs (vinyles) et IGDB (jeux vidéo) via une edge function Supabase, pour remplacer la saisie manuelle par un import direct.
- Ajouter les catégories suivantes (DVD/steelbooks, CD, livres, timbres, monnaies, affiches de films) — il suffit d'insérer une nouvelle ligne dans `categories` avec son `attribute_schema`, aucune migration de schéma nécessaire.
- Fiche item détaillée (qui d'autre le possède, façon Discogs).
