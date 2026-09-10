# Collect Me

Site de suivi de collections façon Discogs, généralisé à tous types d'objets (vinyles, jeux vidéo pour le MVP ; DVD/steelbooks, CD, timbres, monnaies, livres, affiches de films à ajouter progressivement).

## État actuel

- Backend Supabase créé (projet `collect-me`, région `eu-west-1`), schéma appliqué :
  - `categories` (catalogue des types de collection + leurs attributs attendus, en JSONB)
  - `items` (catalogue des objets de référence)
  - `collection_entries` (ce que chaque utilisateur possède/recherche)
  - RLS activé : catalogue en lecture publique, collection personnelle strictement privée à chaque utilisateur
  - 2 catégories seedées : Vinyles (`vinyl`) et Jeux vidéo (`video_game`)
- Frontend statique minimal dans ce dossier (`index.html` + `assets/`) : auth Google, parcours du catalogue par catégorie, ajout manuel d'un item, ajout à sa collection (possédé/recherché), vue "Ma collection" filtrable.
- Pas encore fait : import automatique depuis Discogs/IGDB (recherche externe au lieu de saisie manuelle), déploiement, domaine, nouvelles catégories.

## À faire pour que le site soit en ligne

### 1. Activer la connexion Google dans Supabase

Dans le dashboard Supabase du projet `collect-me` → **Authentication → Providers → Google** :
1. Créer des identifiants OAuth côté Google Cloud Console (type "Web application").
2. Renseigner Client ID / Client Secret dans Supabase.
3. Dans **Authentication → URL Configuration**, mettre le Site URL et les Redirect URLs sur l'adresse où le site sera servi (ex. `https://<toncompte>.github.io/collect-me/` en attendant un domaine dédié).

(Comme pour Top YouTube, ces identifiants Google sont à créer une fois puis réutilisables.)

### 2. Déployer sur GitHub Pages

```bash
# depuis ce dossier
git remote add origin git@github.com:<toncompte>/collect-me.git
git add -A
git commit -m "Initial scaffold: schéma Supabase + frontend MVP"
git push -u origin main
```

Puis dans les Settings du repo GitHub → **Pages** → source = branche `main`, dossier `/ (root)`.

### 3. Domaine (optionnel, plus tard)

Même schéma que topyoutube.fr : CNAME vers `<toncompte>.github.io`, à ajouter dans les Settings → Pages du repo une fois le nom choisi.

## Prochaines étapes produit

- Intégrer la recherche Discogs (vinyles) et IGDB (jeux vidéo) via une edge function Supabase, pour remplacer la saisie manuelle par un import direct.
- Ajouter les catégories suivantes (DVD/steelbooks, CD, livres, timbres, monnaies, affiches de films) — il suffit d'insérer une nouvelle ligne dans `categories` avec son `attribute_schema`, aucune migration de schéma nécessaire.
- Fiche item détaillée (qui d'autre le possède, façon Discogs).
