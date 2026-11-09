<p align="center">
  <img src="assets/branding/dsh-code-review-banner.png" alt="DSH Code Review" width="100%">
</p>

<div align="center">

# DSH Code Review

**カレントセッションでレビューを開始し、独立した Agent がコードを検査してレポートを返します**

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

[開発ドキュメント](docs/00-交接入口/00-阅读导航.md) · [更新履歴](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-code-review)
[![DSH 0.2.2-rc.1 まで対応](https://img.shields.io/badge/DSH-up%20to%200.2.2--rc.1-2563eb.svg)](#ホスト互換性)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.19.0-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

DSH Code Review は、DeepSeek Harness 向けのコミュニティコードレビュープラグイン（パッケージ名 `@michengai/dsh-code-review`）です。カレントセッションで `/review` と入力し、範囲を選択するか要件を入力すると、ネイティブの独立したサブ Agent が Git、ソースコード、呼び出し元、テストを自動検査し、メインセッションにレポートを返します。Codex のインストールは不要です。

## ホスト互换性

ホスト対応範囲：DeepSeek Harness `0.2.x` 全シリーズ（`>=0.2.0-rc.1 <0.3.0-0`）。`0.2.0-rc.1`、`0.2.0-rc.2`、`0.2.1-rc.1`〜`0.2.1-rc.5`、`0.2.2-rc.1` で検証済みであり、以降のすべての 0.2.x RC バージョンに自動対応します。初期バージョンおよび `0.3.0` 世代の破壊的変更はバージョンゲートで遮断されます。`dsh.bundle.patch` 経由で読み込まれます。ネイティブ `spawn` プロバイダー、`userQuestions` サービス、実行環境の質問回答器、およびツール呼び出しに対応したモデルが必要です。

npm からインストールするか、ソースからビルドできます。オフラインホストとパッケージリンクは検証済みです。実際のモデルのレビュー品質、言語遵守、異なるプラットフォームでの操作性は実際の検証が必要です。

## 主な機能

- **レビュー範囲の選択**：ベースブランチとの比較、未コミットの変更の検査、特定のコミットの選択、またはカスタム指示の入力。
- **Agent による自律的な証拠収集**：独立したコンテキストで Git、関連コード、テストを読み取り、事前に全コードのスナップショットを注入しません。
- **メインセッションで結果を確認**：優先度、ファイルパス、行番号付きの指摘事項を受信。プレーンテキストのモデル応答も保持されます。
- **多言語レポート対応**：Codex 英文仕様を保持しながら、独立した言語コンテキストでホストの言語設定（8 つの公式言語に対応）に追従。
- **状態確認またはキャンセル**：最新のレポートの復元、または範囲選択と進行中のレビューのキャンセル。

## 環境要件

- DeepSeek Harness がインストールされており、PowerShell で `dsh` が実行可能であること。
- Node.js ≥ `22.19.0`、npm、および Git。Node.js はインストールされている DSH の要件も満たす必要があります。
- 例では `web` プロファイルを使用しています。実際に DSH を実行しているプロファイルに置き換えてください。

## DSH プロダクトエコシステム

デスクトップワークベンチを利用したい場合は [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases) をダウンロードしてください。既存の [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 環境がある場合は、各プロジェクトの README に従って必要に応じてインストールできます。以下に 11 個の自社製プラグインを記載します。デスクトップ同梱範囲は該当バージョンのリリースノートと組み込みカタログに準じます。

| プラグイン | できること |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | プロジェクトとセッションの整理、タスク検索、対話ターンの切り替え |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | タスクに応じて専門エージェントを選択して呼び出し |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | ローカルスキルの検索、有効化/無効化、作成、インポートを一元管理 |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | アーカイブ済みセッションの検索、復元、クリーンアップ |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | メッセージングプラットフォームからのタスク送信と返信受信 |
| [Automation](https://github.com/MichengAI/dsh-automation) | スケジュールに従ってタスクを実行し、各実行結果を確認 |
| [BTW](https://github.com/MichengAI/dsh-btw) | メインタスクを中断せずにカレントコンテキストで一時的な質問を行う |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | `/simplify` で Git 変更範囲内のコードを整理 |
| [PUA](https://github.com/MichengAI/dsh-pua) | 失敗時にアプローチ変更と原因調査を促し、完了前に結果を検証 |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | `/review` で独立 Agent コードレビューを開始し、セッションでレポートを受信 |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | デスクトップペットを通じてセッション通知を確認し、ツール承認や質問に回答 |

## インストール

### Agent にインストールを依頼（推奨）

ローカル端末へのアクセス権を持つ Agent に以下の指示を送信します：

```text
DSH プラグイン @michengai/dsh-code-review をローカルの web プロファイルにインストールしてください：dsh plugin --profile web add @michengai/dsh-code-review@latest --registry=https://registry.npmjs.org/ を実行し、次に dsh --profile web --dump-config を実行してプラグインが読み込まれていることを確認し、DSH の再起動方法と /review の使用方法を説明してください。いずれかのステップが失敗した場合は停止して原因を報告してください。
```

### 手動インストール

次のコマンドを実行します：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-code-review@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

各ステップの成功を確認してから次へ進んでください。実際に実行している DSH バックエンドを再起動し、`/review` を入力します。これはネイティブプラグインであり、手動で `lib` をコピーする必要はなく、`SKILL.md` スキルバンドルでもありません。

## 使い方

| 目的 | 入力 |
| --- | --- |
| 範囲選択を開く | `/review` |
| カスタムレビュー重点の指定 | `/review 前回のコミットの権限回帰を検査` |
| 進捗状況または最新レポートの確認 | `/review-status` |
| 選択または実行中のレビューのキャンセル | `/review-cancel` |

空入力では、ベースブランチの比較、未コミット変更のレビュー、特定コミットのレビュー、カスタム指示の 4 つのオプションが提示されます。未コミット範囲にはステージング、未ステージング、未追跡ファイルが含まれます。ベースメニューにはローカルブランチが一覧表示され、コミットメニューには最新 100 件のコミットが表示されます。他の参照を自由に入力することもできます。

コマンド以降の全テキストはカスタム指示として扱われ、CLI フラグとしては解析されません。`--base main`、`.`、`status` は通常のテキストとして渡されます。レビュー範囲と必要なコンテキストはサブ Agent が自律的に判断・取得します。「プロジェクト全体をレビュー」もそのまま渡されますが、全ファイルの完全網羅が検証されたことを意味するものではありません。

## 設定とレポート

| オプション設定 | 動作 |
| --- | --- |
| `reviewModel` | 同一モデルプロバイダー下のレビューモデル名。省略時は現在のモデル設定を継承 |
| `reportDirectory` | レポート保存先の絶対パス。デフォルトは `$DSH_HOME/code-review`、DSH_HOME 未設定時は `~/.dsh/code-review` |

言語設定はホストの `locale.preference` に従います：全 8 つの公式言語（`zh` / `en` / `ja` / `es` / `fr` / `de` / `ru` / `pt`）に対応しています。`settings.describe()` が返す `locale` 構成項目を読み取ります。各ラウンドの開始時に言語が固定され、次回ラウンドで新しい設定が読み込まれます。スラッシュメニューのテキストは言語切り替え時に即時反映され、サーバーで登録されたコマンドの説明はプラグイン読み込み時に決定されます。設定未保存時や読み取り失敗時はデフォルトで中国語となり、ブラウザ側のみで自動検出された言語をバックエンドが取得することはできません。

セッションごとに最新のレポートがアトミックに保存されます。セッションに渡されるレポートには、DSH でレンダリング可能な GitHub Flavored Markdown が使用されます：状態見出し、指摘見出し、行番号付きローカルファイルリンク、段落。過去のレポート本文は自動翻訳されません。JSON キー、列挙値、コード、パスは元のまま保持されます。ホスト終了後に未完了のレビューが自動再開されることはありません。ステータス確認、キャンセル、レポート保存は DSH プラグインが提供する機能です。

## よくある質問

### Codex と完全に同じですか？

レビュー仕様とタスクテンプレートは固定のコミット `a592c38c16cdd7623dacc9168926ebccedfb67d3` に基づいています。質問インターフェース、ツール、権限、イベント表示は DSH ネイティブ機能を使用しており、Codex Desktop のピクセル単位のクローンではありません。モデルによって指摘事項が異なる場合があります。

### レビューでコードは変更されますか？

レビュー指示では修正の生成は要求されませんが、ツール層が完全に読み取り専用に強制されているわけではありません。実行方式は Agency エキスパートと同一です：ネイティブ `spawn` を通じてレビュー用のペルソナが注入され、ホストのその他のシステムプロンプトとツールは維持されますが、再帰的なコードレビューおよびエキスパート呼び出しツールのみ無効化されます。権限はホストへの委任時に決定され、プラグインが承認ポリシーを変更したり子セッションの承認を転送したりすることはありません。権限外の操作はホストによって拒否され、レビュー Agent は証拠とテストの制約を説明したレポートを返します。

Git コマンドで Windows サンドボックスの準備失敗が報告された場合や、テストで `spawn EPERM` が発生した場合は、メインセッション側でホスト環境または権限を処理してからレビューを再実行する必要があります。レポートの「完了」は Agent が返答したことを意味し、すべての diff を取得できたことやテストが成功したことを保証するものではありません。具体的な制約はレポート本文をご確認ください。

### インストール後に出力がない場合はどうすればよいですか？

インストールと実行で同じプロファイルが使用されていることを確認し、DSH バックエンドを再起動した上で、`dsh --profile web --dump-config` にプラグインが含まれていることを確認してください。空の `/review` にはホストの質問回答器が必要であり、メインモデルも `dsh_code_review` ツール呼び出しに対応している必要があります。`/review-status` で記録を確認できます。「リクエスト送信完了」をレビュー完了と混同しないでください。

### 他の言語が表示される場合があるのはなぜですか？

ホスト設定で対象の言語を明示的に選択してください。モデルの出力言語はプロンプトの指示で制御されますが、完全な遵守を保証することはできません。外部ツールの未加工エラー、コード、過去のレポートは自動翻訳されません。

## 開発とコントリビューション

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
npm ci --ignore-scripts
npm run check
npm run verify:package
dsh plugin --profile web add .\michengai-dsh-code-review-0.1.3.tgz --ignore-scripts
```

`check` には、TypeScript、プロンプトハッシュ、タスク定義、オフラインモデルによる実際の AgentLoop 回帰テスト、およびドキュメントリンクチェックが含まれます。`verify:package` は隔離されたプロファイルでバンドル、peer、インストールパッケージのホストリンクを検証します。これらのチェックはオンラインモデル検証の代替ではありません。GitHub と npm の両方にそのまま実行可能な `lib` が含まれています。ソースコード変更後はコミット前に `npm run build` を実行してください。

| エントリ | 責務 |
| --- | --- |
| [src/index.ts](src/index.ts) | コマンド、メインセッションツール、レポート返却 |
| [src/selection.ts](src/selection.ts) | ネイティブ範囲選択 |
| [src/runtime.ts](src/runtime.ts) | 独立レビュー Agent とツール制約 |
| [src/request.ts](src/request.ts) | Codex 短文タスクとベース参照の解決 |
| [src/i18n.ts](src/i18n.ts) | ホスト言語と出力言語コンテキスト |
| [src/report.ts](src/report.ts) | JSON、抽出 JSON、プレーンテキストの順次フォールバック |

完全な引き継ぎ記録は[閲覧ナビゲーション](docs/00-交接入口/00-阅读导航.md)を参照してください。ロールバックは、以前保持したローカルパッケージを再インストールして DSH を再起動することで行えます。セッションやレポートは削除されません。

## ソースとライセンス

[Apache License 2.0](LICENSE) に基づいて公開されています。Codex の原文およびソース情報については [rubric](assets/codex/review/rubric.md)、[source.json](assets/codex/review/source.json)、および [NOTICE](NOTICE) を参照してください。

上流ソース：[タスクテンプレート](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/prompts/src/review_request.rs) · [レビュー実行](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/core/src/tasks/review.rs) · [範囲選択](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/tui/src/chatwidget/review_popups.rs) · [ベースブランチ解決](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/git-utils/src/branch.rs)。
