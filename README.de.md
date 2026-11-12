<p align="center">
  <img src="assets/branding/dsh-code-review-banner.png" alt="DSH Code Review" width="100%">
</p>

<div align="center">

# DSH Code Review

**Starten Sie ein Code-Review in Ihrer Konversation: Ein unabhängiger Agent prüft den Code und liefert die Ergebnisse**

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

[Änderungsprotokoll](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![Lizenz: Apache-2.0](https://img.shields.io/badge/Lizenz-Apache--2.0-blue.svg)](LICENSE)
[![DSH-Plugin](https://img.shields.io/badge/DSH-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-code-review)
[![DSH bis 0.2.2-rc.2 unterstützt](https://img.shields.io/badge/DSH-bis%200.2.2--rc.2-2563eb.svg)](#host-kompatibilit%C3%A4t)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.19.0-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

DSH Code Review ist ein Community-Plugin zur Code-Überprüfung für DeepSeek Harness mit dem Paketnamen `@michengai/dsh-code-review`. Geben Sie `/review` in der aktuellen Sitzung ein, wählen Sie den Bereich oder formulieren Sie Ihre Anforderungen; ein nativer, unabhängiger Sub-Agent prüft Git, Quellcode, Aufrufer und Tests eigenständig und liefert den Bericht an die Hauptsitzung zurück. Keine Codex-Installation erforderlich.

## Host-Kompatibilität

Unterstützter Host-Bereich: Vollständige DeepSeek Harness `0.2.x`-Serie (`>=0.2.0-rc.1 <0.3.0-0`), verifiziert mit `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`～`0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2`, und automatisch kompatibel mit allen nachfolgenden 0.2.x-RC-Versionen. Frühere Versionen sowie inkompatible Neuerungen der `0.3.0`-Generation werden durch die Versionsprüfung blockiert. Geladen über `dsh.bundle.patch`. Erfordert nativen `spawn`-Provider, den `userQuestions`-Dienst, einen Fragenbeantworter Ihrer Plattform und ein Modell mit Tool-Calling-Unterstützung.

Installation über npm oder Build aus dem Quellcode möglich.

## Funktionsübersicht

- **Review-Bereich wählen**: Vergleich mit Basis-Branch, Prüfung nicht committeter Änderungen, Auswahl eines bestimmten Commits oder Eingabe eigener Vorgaben.
- **Autonome Beweiserhebung**: Liest Git, Quellcode und Tests in einem isolierten Kontext, ohne vorab einen kompletten Datei-Snapshot zu laden.
- **Ergebnisse in der Hauptsitzung**: Befunde mit Priorität, Dateipfad und Zeilennummer erhalten. Reine Textantworten des Modells bleiben im Original erhalten.
- **Mehrsprachige Berichte**: Folgt den Spracheinstellungen des Hosts (Unterstützung für alle 8 offiziellen Sprachen) über einen separaten Kontext unter Beibehaltung der englischen Codex-Originalspezifikationen.
- **Status prüfen oder abbrechen**: Letzten Bericht wiederherstellen oder Auswahl und laufende Reviews abbrechen.

## Systemvoraussetzungen

- Installiertes DeepSeek Harness, `dsh` in PowerShell verfügbar.
- Node.js ≥ `22.19.0`, npm und Git; Node.js muss zusätzlich den Anforderungen der DSH-Version entsprechen.
- Beispiele verwenden das Profil `web`; bitte an Ihr tatsächliches DSH-Profil anpassen.

## DSH-Produktökosystem

Für eine Desktop-Arbeitsumgebung laden Sie [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases) herunter. Bei bestehender [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)-Umgebung können Plugins nach Bedarf installiert werden:

| Plugin | Beschreibung |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Projekte und Sitzungen organisieren, Aufgaben suchen und Turns navigieren |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Fachspezialisten je nach Aufgabe auswählen und hinzuziehen |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Lokale Skills einheitlich suchen, aktivieren, erstellen und importieren |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Archivierte Sitzungen durchsuchen, wiederherstellen oder bereinigen |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Aufgaben über Messaging-Plattformen senden und Antworten empfangen |
| [Automation](https://github.com/MichengAI/dsh-automation) | Geplante Aufgaben ausführen und Ergebnisse protokollieren |
| [BTW](https://github.com/MichengAI/dsh-btw) | Nebenfragen im aktuellen Kontext stellen, ohne die Hauptaufgabe zu stören |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Code innerhalb geänderter Git-Bereiche mit `/simplify` aufräumen |
| [PUA](https://github.com/MichengAI/dsh-pua) | Agenten anleiten, bei Fehlern Alternativen zu prüfen und Ergebnisse vor Abschluss zu testen |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Unabhängiges Agent-Review mit `/review` starten und Bericht erhalten |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Benachrichtigungen und Tool-Freigaben über Desktop-Begleiter steuern |

## Installation

### Installation durch Agenten (empfohlen)

Senden Sie folgende Aufforderung an einen Agenten mit lokalem Terminalzugriff:

```text
Bitte installieren Sie das DSH-Plugin @michengai/dsh-code-review im lokalen web-Profil: Führen Sie dsh plugin --profile web add @michengai/dsh-code-review@latest --registry=https://registry.npmjs.org/ aus, gefolgt von dsh --profile web --dump-config, um zu bestätigen, dass das Plugin geladen wurde, und erklären Sie den Neustart von DSH sowie die Nutzung von /review. Stoppen Sie bei Fehlern und nennen Sie die Ursache.
```

### Manuelle Installation

Führen Sie folgende Befehle aus:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-code-review@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Erst nach erfolgreichem Abschluss fortfahren. Starten Sie das aktive DSH-Backend neu und geben Sie `/review` ein.

## Nutzung

| Ziel | Eingabe |
| --- | --- |
| Bereichsauswahl öffnen | `/review` |
| Benutzerdefinierten Schwerpunkt setzen | `/review Berechtigungsregressionen im letzten Commit prüfen` |
| Fortschritt oder letzten Bericht ansehen | `/review-status` |
| Auswahl oder aktives Review abbrechen | `/review-cancel` |

Eine leere Eingabe bietet vier Optionen: Vergleich mit Basis-Branch, Prüfung uncommitteter Änderungen, Prüfung eines Commits oder eigene Anweisungen.

Der gesamte Text nach dem Befehl wird als Anweisung übernommen und nicht als CLI-Parameter analysiert.

## Konfiguration und Berichte

| Optionale Einstellung | Verhalten |
| --- | --- |
| `reviewModel` | Name des Review-Modells beim selben Anbieter; erbt standardmäßig die aktive Modellkonfiguration |
| `reportDirectory` | Absoluter Speicherpfad der Berichte; Standard `$DSH_HOME/code-review`, bzw. `~/.dsh/code-review` |

Die Sprache richtet sich nach `locale.preference` des Hosts: Unterstützt alle 8 offiziellen Sprachen (`zh` / `en` / `ja` / `es` / `fr` / `de` / `ru` / `pt`). Liest den Konfigurationseintrag `locale` aus `settings.describe()`. Die Menütexte der Benutzeroberfläche werden bei einem Sprachwechsel sofort aktualisiert, während serverseitig registrierte Befehlsbeschreibungen beim Laden des Plugins festgelegt werden. Wird eine nicht unterstützte inoffizielle Sprache explizit gewählt, fallen Oberfläche und Berichte auf Englisch zurück (analog zum Host); ohne gespeicherte Einstellung nutzt das Backend standardmäßig Chinesisch, während das Menü die vom Frontend erkannte Sprache anzeigt.

Der jüngste Bericht jeder Sitzung wird atomar als GitHub Flavored Markdown gespeichert.

## Häufig gestellte Fragen

### Ist dies identisch mit Codex?

Das Schema und die Task-Vorlagen entsprechen dem Quellcode-Commit `a592c38c16cdd7623dacc9168926ebccedfb67d3`. Benutzeroberfläche, Tools und Rechte basieren auf den nativen DSH-Fähigkeiten.

### Verändert das Review den Quellcode?

Die Review-Anweisungen fordern keine Code-Modifikationen an, wenngleich die Tool-Ebene nicht universell schreibgeschützt ist. Die Ausführung folgt dem Agency-Muster: Natives `spawn` injiziert die Review-Persona unter Beibehaltung der übrigen System-Prompts und Tools des Hosts; lediglich rekursive Code-Reviews und Experten-Tools sind gesperrt. Berechtigungen werden vom Host bei der Delegation festgelegt; das Plugin überschreibt keine Richtlinien und leitet keine Genehmigungsanfragen von Sub-Agenten weiter. Vorgänge außerhalb der Berechtigungen werden vom Host abgelehnt.

Wenn Git bei der Vorbereitung der Windows-Sandbox fehlschlägt oder Tests mit `spawn EPERM` scheitern, muss die übergeordnete Sitzung die Host-Umgebung oder Berechtigungen anpassen, bevor ein neuer Review gestartet wird. „Abgeschlossen“ bedeutet, dass der Agent einen Bericht zurückgegeben hat; es garantiert nicht, dass jedes Diff geprüft wurde oder Tests bestanden wurden. Die genauen Einschränkungen sind dem Berichtstext zu entnehmen.

### Was tun, wenn nach der Installation keine Ausgabe erscheint?

Stellen Sie sicher, dass Installation und Ausführung dasselbe Profil nutzen, starten Sie das DSH-Backend neu und prüfen Sie `dsh --profile web --dump-config`.

### Warum sehe ich gelegentlich eine andere Sprache?

Wählen Sie die Zielsprache explizit in den Host-Einstellungen. Die Modellausgabe wird instruiert, kann jedoch nicht absolut garantiert werden. Rohe Fehlermeldungen externer Tools werden nicht übersetzt.

## Entwicklung und Mitwirken

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
npm ci --ignore-scripts
npm run check
npm run verify:package
dsh plugin --profile web add .\michengai-dsh-code-review-0.1.3.tgz --ignore-scripts
```

`check` umfasst TypeScript, Prompt-Hashes, Tasks sowie reale Regressionstests mit der AgentLoop offline. Führen Sie vor Commits `npm run build` aus.

| Einstiegspunkt | Aufgabe |
| --- | --- |
| [src/index.ts](src/index.ts) | Befehle und Berichterstellung |
| [src/selection.ts](src/selection.ts) | Native Bereichsauswahl |
| [src/runtime.ts](src/runtime.ts) | Unabhängiger Review-Sub-Agent und Tool-Einschränkungen |
| [src/request.ts](src/request.ts) | Codex-Tasks und Basis-Ref-Auflösung |
| [src/i18n.ts](src/i18n.ts) | Host-Sprache und Ausgabe-Sprachkontext |
| [src/report.ts](src/report.ts) | Sequenzieller Fallback: Voll-JSON, Teil-JSON und Klartext |

Vollständige Entwicklungs- und Übergabeaufzeichnungen finden Sie in der [Entwickler-Navigation](docs/00-交接入口/00-阅读导航.md). Für ein Rollback installieren Sie ein zuvor gesichertes lokales Paket erneut und starten DSH neu. Sitzungen und Berichte werden dabei nicht gelöscht.

## Quellen und Lizenz

Veröffentlicht unter [Apache-2.0-Lizenz](LICENSE). Siehe Codex-Originale in [rubric](assets/codex/review/rubric.md), [source.json](assets/codex/review/source.json) und [NOTICE](NOTICE).

Upstream: [Task-Vorlagen](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/prompts/src/review_request.rs) · [Review-Ausführung](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/core/src/tasks/review.rs) · [Bereichsauswahl](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/tui/src/chatwidget/review_popups.rs) · [Basis-Branch-Auflösung](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/git-utils/src/branch.rs).
