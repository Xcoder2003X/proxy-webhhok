# Webhook Shield — Harness de build (ChatGPT Desktop, offre gratuite)

Ce dossier est le « harness » : il transforme ChatGPT (même en free) en développeur suivant un process strict,
tâche par tâche, avec des tests à chaque étape. Le code du produit sera créé dans ce même dossier (`src/`, `tests/`).

## Contenu
- `AGENTS.md` — règles permanentes (colle-les dans les « instructions » d'un Projet ChatGPT si ton plan le permet, sinon elles sont déjà incluses dans chaque context pack).
- `docs/` — la vérité du produit : brief, architecture, modèle de données, API, conventions, sécurité, décisions, roadmap.
- `harness/tasks/` — 12 tâches T01→T12, chacune assez petite pour tenir dans un seul chat gratuit.
- `harness/prompts/` — les messages à envoyer à ChatGPT (bootstrap, plan, implement, review, debug, finalize).
- `harness/status.md` — la mémoire du projet : ce qui est fait, ce qui reste. Mets-le à jour après chaque tâche.
- `scripts/pack-context.sh` — assemble automatiquement le contexte d'une tâche dans un seul fichier à coller.

## Prérequis
Node LTS, Docker, Git. Sous Windows : Git Bash ou WSL pour lancer le script.

## La boucle (à répéter pour chaque tâche)
1. `git init` (une fois), puis `./scripts/pack-context.sh T01` -> crée `.context/T01.md` (et le copie dans le presse-papiers si possible).
2. **Nouveau chat** ChatGPT. Colle `harness/prompts/00-bootstrap.md`, puis le contenu de `.context/T01.md`.
3. Envoie `harness/prompts/plan-task.md`. Relis le plan, corrige si besoin, réponds `GO`.
4. ChatGPT donne les fichiers complets. Copie-les dans le projet, lance les commandes indiquées.
5. Erreur ? Utilise `harness/prompts/debug-task.md` (commande + erreur complète + fichier concerné).
6. Tests verts ? Envoie `harness/prompts/review-task.md` avec ton diff (`git diff`), applique les points critiques.
7. `harness/prompts/finalize-task.md` -> message de commit + mise à jour de `status.md`. `git commit`. Tâche suivante.

## Conseils pour l'offre gratuite
- **Un chat = une tâche.** Les chats longs dégradent la qualité et consomment ton quota.
- Garde chaque context pack sous ~40 000 caractères (le script t'avertit).
- Si tu atteins la limite de messages : arrête, reviens plus tard. `status.md` + le script reconstruisent tout le contexte en 10 secondes.
- ChatGPT ne lance pas ton code : c'est toi qui exécutes `npm test` et qui colles les erreurs. C'est normal, c'est ce qui rend le process fiable.
- Ne saute jamais la revue (étape 6) sur T04, T05, T06 et T08 : c'est là que sont les risques sécurité.
