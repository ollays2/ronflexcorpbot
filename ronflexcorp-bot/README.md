# RonflexCorp Bot — Gestion du site depuis Discord

Bot Discord qui te permet de mettre à jour `pokemon.json`, `team.json`, `stats.json`,
`pokeshop.json`, `itemshop.json` et `serviceshop.json` directement avec des commandes
slash Discord (`/pokemon add`, `/shop add`, etc.). Chaque commande crée un commit sur
ton dépôt GitHub, ce qui déclenche automatiquement un redéploiement Vercel — le site se
met à jour en quelques secondes, sans jamais toucher à GitHub toi-même.

## Commandes disponibles

- `/pokemon add|remove|disponibilite|list` — gérer la Pension
- `/team add|remove|list` — gérer les responsables (section Contact)
- `/stats set|add|list` — gérer les statistiques du Hero
- `/shop add|remove|list` (boutique: PokeShop / ItemShop / ServiceShop)
- `/setup-roles` — crée automatiquement les 13 rôles RonflexCorp (direction, grades RP,
  cosmétiques) avec leurs couleurs et dans le bon ordre hiérarchique. Réservé aux
  administrateurs du serveur. Peut être relancée sans risque : les rôles déjà existants
  sont détectés et ignorés (pas de doublons).

## Étape 1 — Créer l'application Discord

1. Va sur [discord.com/developers/applications](https://discord.com/developers/applications)
2. **New Application** → nomme-la "RonflexCorp Bot"
3. Onglet **Bot** → **Reset Token** → copie ce token (tu ne le reverras plus après)
4. Toujours sur l'onglet **Bot**, désactive tous les "Privileged Gateway Intents" (le bot
   n'en a besoin d'aucun)
5. Onglet **OAuth2 → URL Generator** :
   - Scopes : `bot`, `applications.commands`
   - Bot permissions : `Send Messages`, `Embed Links`, `Use Slash Commands`, `Manage Roles`
   - Copie l'URL générée en bas, ouvre-la dans ton navigateur, choisis ton serveur
     RonflexCorp, **Authorize**
6. **Important pour `/setup-roles`** : une fois le bot ajouté, va dans `Réglages du
   serveur → Rôles` et fais glisser le rôle du bot (il apparaît dans la liste, nommé comme
   ton application) **tout en haut**, juste en dessous de ton propre rôle d'administrateur.
   Discord interdit à un bot de créer ou réordonner des rôles au-dessus de son propre rôle
   — c'est une limite de sécurité normale, pas un bug.

## Étape 2 — Récupérer les IDs nécessaires

- **Application ID** : onglet "General Information" de ton application Discord
- **ID de ton serveur** : active le mode développeur Discord (`Réglages utilisateur →
  Avancés → Mode développeur`), puis clic droit sur l'icône du serveur → "Copier l'ID"
- **ID des rôles autorisés** (Fondateur, Co-Gardien, etc.) : clic droit sur chaque rôle
  dans `Réglages du serveur → Rôles` → "Copier l'ID"

## Étape 3 — Créer un token GitHub

1. [github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta) → **Generate new token**
2. Restreins-le au dépôt `ronflexcorp` uniquement (**Only select repositories**)
3. Permissions → **Contents: Read and write**
4. Génère et copie le token

## Étape 4 — Configurer le bot

1. Copie `.env.example` en `.env`
2. Remplis toutes les valeurs (token Discord, IDs, token GitHub...)

## Étape 5 — Installer et lancer en local (pour tester)

```bash
npm install
npm run deploy-commands   # enregistre les commandes slash sur ton serveur (à refaire si tu modifies une commande)
npm start                 # démarre le bot
```

Si tu vois `✅ [NomDuBot] est en ligne...` dans le terminal, c'est bon — teste
`/stats list` sur ton serveur Discord.

## Étape 6 — Héberger le bot 24h/24 (obligatoire pour un usage réel)

Un bot Discord doit tourner en permanence pour répondre aux commandes. Ton ordinateur
personnel ne suffit pas (il faudrait le laisser allumé en continu). Options gratuites ou
peu chères, du plus simple au plus robuste :

- **[Railway.app](https://railway.app)** (recommandé, le plus simple) : connecte ton
  compte GitHub, crée un nouveau projet à partir de ce dossier `discord-bot`, ajoute tes
  variables d'environnement dans l'onglet "Variables", et c'est lancé automatiquement.
  Gratuit avec un petit crédit mensuel, largement suffisant pour ce bot.
- **[Render.com](https://render.com)** : similaire à Railway, "Background Worker" gratuit.
- Un petit VPS (ex. 3-4€/mois) avec `pm2` pour garder le process actif en arrière-plan.

## Sécurité — à ne jamais faire

- Ne mets **jamais** ton fichier `.env` sur GitHub (il est déjà exclu via `.gitignore`)
- Le token GitHub donne un accès en écriture à ton dépôt : restreins-le à ce seul dépôt
  (étape 3) et ne le partage avec personne
- Renseigne bien `ALLOWED_ROLE_IDS` dans `.env` — sans ça, **n'importe quel membre** du
  serveur peut ajouter/supprimer des Pokémon ou des articles

## Étendre le bot

Chaque fichier dans `commands/` est une commande indépendante. Pour en ajouter une
nouvelle (ex. gérer les grades), copie la structure de `commands/team.js` en l'adaptant,
puis relance `npm run deploy-commands`.
