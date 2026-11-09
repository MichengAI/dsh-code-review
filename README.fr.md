<p align="center">
  <img src="assets/branding/dsh-code-review-banner.png" alt="DSH Code Review" width="100%">
</p>

<div align="center">

# DSH Code Review

**Lancez une revue dans votre conversation : un agent indépendant inspecte le code et renvoie les conclusions**

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

[Journal des modifications](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![Licence : Apache-2.0](https://img.shields.io/badge/Licence-Apache--2.0-blue.svg)](LICENSE)
[![Plugin DSH](https://img.shields.io/badge/DSH-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-code-review)
[![Compatible DSH jusqu'à 0.2.2-rc.1](https://img.shields.io/badge/DSH-jusqu'%C3%A0%200.2.2--rc.1-2563eb.svg)](#compatibilité-avec-lhôte)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.19.0-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

DSH Code Review est un plugin communautaire de revue de code pour DeepSeek Harness (nom de paquet `@michengai/dsh-code-review`). Saisissez `/review` dans la conversation courante, sélectionnez un périmètre ou exprimez vos exigences ; un sous-agent natif et autonome inspecte Git, le code source, les dépendances et les tests avant de renvoyer le rapport dans la session principale. Aucune installation de Codex n'est requise.

## Compatibilité avec l'hôte

Périmètre de prise en charge de l'hôte : ensemble de la série DeepSeek Harness `0.2.x` (`>=0.2.0-rc.1 <0.3.0-0`), vérifié avec `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`～`0.2.1-rc.5`, `0.2.2-rc.1`, et compatible automatiquement avec toutes les versions RC ultérieures de 0.2.x. Les anciennes versions et les ruptures de génération `0.3.0` sont bloquées par la porte de version. Chargé via `dsh.bundle.patch`. Nécessite le fournisseur natif `spawn`, le service `userQuestions`, un répondeur aux questions pour votre environnement, et un modèle compatible avec les appels d'outils.

Peut être installé depuis npm ou compilé à partir des sources. Les tests hors ligne de l'hôte et de la chaîne de paquets ont été validés.

## Ce que vous pouvez faire

- **Choisir le périmètre de la revue** : comparer à une branche de base, inspecter les modifications non validées, cibler un commit particulier ou saisir des instructions personnalisées.
- **Collecte autonome des preuves par l'agent** : lit Git, le code source et les tests dans un contexte autonome sans injecter au préalable un instantané complet du dépôt.
- **Consulter les résultats dans la conversation principale** : recevez des observations avec priorité, chemin de fichier et numéro de ligne. Les réponses en texte brut du modèle sont préservées.
- **Rapports multilingues** : suit la préférence linguistique de l'hôte (compatible avec les 8 langues officielles) via un contexte dédié tout en préservant la spécification originale de Codex en anglais.
- **Consulter l'état ou annuler** : récupérez le rapport le plus récent ou annulez la sélection de périmètre et la revue en cours.

## Prérequis

- DeepSeek Harness installé, commande `dsh` accessible dans PowerShell.
- Node.js ≥ `22.19.0`, npm et Git ; Node.js doit également respecter les exigences de la version de DSH installée.
- Les exemples utilisent le profil `web` ; adaptez selon le profil sur lequel DSH s'exécute.

## Écosystème de produits DSH

Pour utiliser l'espace de travail de bureau, téléchargez [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases) ; si vous disposez déjà d'un environnement [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), installez les plugins selon le README de chaque projet. Voici les 11 plugins conçus en interne :

| Plugin | Ce que vous pouvez faire |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organiser projets et sessions, rechercher des tâches, naviguer entre les tours |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Sélectionner et convoquer des experts dédiés selon la tâche |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Rechercher, activer, créer et importer les compétences locales |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Rechercher, restaurer ou nettoyer les sessions archivées |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Envoyer des tâches et recevoir des réponses depuis les plateformes de messagerie |
| [Automation](https://github.com/MichengAI/dsh-automation) | Planifier des tâches et consulter les résultats de chaque exécution |
| [BTW](https://github.com/MichengAI/dsh-btw) | Poser des questions annexes dans le contexte sans interrompre la tâche principale |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Utiliser `/simplify` pour nettoyer le code dans le périmètre des modifications Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Guider l'agent pour changer de méthode en cas d'échec et vérifier avant clôture |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Lancer une revue par agent autonome avec `/review` et recevoir le rapport |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Consulter les notifications de session et gérer les approbations via l'animal de bureau |

## Installation

### Confier l'installation à un agent (recommandé)

Envoyez l'instruction suivante à un agent disposant d'un accès au terminal local :

```text
Veuillez installer le plugin DSH @michengai/dsh-code-review sur le profil web local : exécutez dsh plugin --profile web add @michengai/dsh-code-review@latest --registry=https://registry.npmjs.org/, puis dsh --profile web --dump-config pour confirmer son chargement, et expliquez comment redémarrer DSH et utiliser /review. En cas d'échec à n'importe quelle étape, arrêtez-vous et indiquez la cause.
```

### Installation manuelle

Exécutez les commandes suivantes :

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-code-review@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Ne poursuivez qu'après le succès de chaque étape. Redémarrez le backend DSH en cours d'exécution, puis saisissez `/review`. Il s'agit d'un plugin natif, sans nécessité de copier manuellement `lib`, et non d'un paquet de compétences `SKILL.md`.

## Utilisation

| Objectif | Saisie |
| --- | --- |
| Ouvrir la sélection du périmètre | `/review` |
| Préciser un axe d'examen personnalisé | `/review Vérifier les régressions de permissions du dernier commit` |
| Consulter l'avancement ou le dernier rapport | `/review-status` |
| Annuler la sélection ou la revue en cours | `/review-cancel` |

Une saisie vide propose quatre options : comparer à une branche de base, examiner les modifications non validées, examiner un commit particulier ou saisir des instructions personnalisées. Le périmètre non validé couvre les fichiers indexés, non indexés et non suivis. Le menu de base répertorie les branches locales ; le menu des commits affiche les 100 plus récents.

Tout texte suivant la commande est interprété comme instruction personnalisée et non comme options CLI. Les arguments comme `--base main`, `.`, et `status` sont transmis comme texte ordinaire.

## Configuration et rapports

| Paramètre facultatif | Comportement |
| --- | --- |
| `reviewModel` | Nom du modèle de revue au sein du même fournisseur ; hérite de la configuration du modèle actif si omis |
| `reportDirectory` | Répertoire absolu d'enregistrement des rapports ; `$DSH_HOME/code-review` par défaut, ou `~/.dsh/code-review` si non défini |

La langue respecte la préférence `locale.preference` de l'hôte : prise en charge des 8 langues officielles (`zh` / `en` / `ja` / `es` / `fr` / `de` / `ru` / `pt`). Lit la configuration `locale` renvoyée par `settings.describe()`. La langue est figée au début de chaque session de revue ; les textes du menu de commandes sont mis à jour immédiatement lors du changement de langue, tandis que les descriptions enregistrées sur le serveur sont fixées au chargement du plugin. Si une langue non officielle non prise en charge est explicitement sélectionnée, l'interface et les rapports basculent en anglais comme l'hôte ; sans préférence enregistrée, le backend utilise le chinois par défaut tandis que le menu reflète la langue détectée par le frontend de l'hôte.

Le rapport le plus récent de chaque session est sauvegardé de manière atomique au format GitHub Flavored Markdown exploitable par DSH. Les rapports archivés ne sont pas traduits rétroactivement.

## Foire aux questions

### Est-ce strictement identique à Codex ?

La grille d'évaluation et les modèles de tâches courtes sont alignés sur le commit figé `a592c38c16cdd7623dacc9168926ebccedfb67d3`. L'interface de dialogue, les outils, les autorisations et les événements s'appuient sur les fonctionnalités natives de DSH.

### La revue modifie-t-elle le code source ?

Les instructions de revue ne génèrent pas de correctifs directs, bien que la couche d'outils ne soit pas universellement bridée en lecture seule. L'exécution repose sur le mécanisme natif `spawn` avec injection du profil de réviseur, en conservant les outils et instructions de l'hôte tout en interdisant la récursion et les outils d'invocation d'experts. Les autorisations sont fixées par l'hôte lors de la délégation ; le plugin ne modifie pas les politiques d'approbation et ne transmet pas les demandes d'approbation du sous-agent. Les opérations hors périmètre sont rejetées par l'hôte, et le réviseur renvoie un rapport précisant les limites des preuves et des tests.

Si Git échoue lors de la préparation du bac à sable Windows ou si les tests renvoient `spawn EPERM`, la session parente doit traiter l'environnement de l'hôte ou les autorisations avant de relancer une revue. La mention « Terminé » indique que l'agent a renvoyé un rapport ; elle ne garantit pas que chaque diff a été inspecté ou que les tests ont réussi. Consultez le rapport pour connaître ces limitations.

### Que faire en l'absence de réponse après installation ?

Vérifiez que l'installation et l'exécution utilisent le même profil, redémarrez le backend DSH et assurez-vous que `dsh --profile web --dump-config` liste bien le plugin.

### Pourquoi une autre langue peut-elle apparaître ?

Sélectionnez explicitement la langue cible dans les paramètres de l'hôte. La langue générée par le modèle dépend des consignes fournies et ne peut être garantie à 100 %. Les erreurs brutes des outils externes et le code source ne sont pas traduits.

## Développement et contribution

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
npm ci --ignore-scripts
npm run check
npm run verify:package
dsh plugin --profile web add .\michengai-dsh-code-review-0.1.3.tgz --ignore-scripts
```

`check` inclut TypeScript, le contrôle des empreintes de prompts, les tâches et les tests de régression réels avec l'AgentLoop hors ligne, ainsi que la validation des liens. Avant tout commit de code source, exécutez `npm run build`.

| Point d'entrée | Responsabilité |
| --- | --- |
| [src/index.ts](src/index.ts) | Commandes, outil de session principale et restitution du rapport |
| [src/selection.ts](src/selection.ts) | Sélection native du périmètre |
| [src/runtime.ts](src/runtime.ts) | Sous-agent de revue autonome et restrictions d'outils |
| [src/request.ts](src/request.ts) | Tâches concises Codex et résolution des références de base |
| [src/i18n.ts](src/i18n.ts) | Langue de l'hôte et contexte de langue de sortie |
| [src/report.ts](src/report.ts) | Repli séquentiel JSON complet, JSON extrait et texte brut |

Pour le journal complet de transmission, consultez le [Guide de lecture](docs/00-交接入口/00-阅读导航.md). Pour annuler, réinstallez le paquet local précédent et redémarrez DSH.

## Sources et licence

Publié sous [Licence Apache 2.0](LICENSE). Consultez la grille originale de Codex dans [rubric](assets/codex/review/rubric.md), [source.json](assets/codex/review/source.json) et [NOTICE](NOTICE).

Sources amont : [Modèles de tâches](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/prompts/src/review_request.rs) · [Exécution de revue](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/core/src/tasks/review.rs) · [Sélection du périmètre](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/tui/src/chatwidget/review_popups.rs) · [Résolution de branche de base](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/git-utils/src/branch.rs).
