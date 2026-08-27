# ScheduleApp(ケアマックス グループウェア)

株式会社ケアマックスコーポレーション(親会社、利用者約120名)向けに、現行のサイボウズOfficeで実際に使われている機能(お知らせ・掲示板/個人・チームカレンダー/ファイル共有)に絞って自社開発する軽量グループウェア。会議室予約、Googleカレンダー個人同期(双方向)、会議候補日時の自動抽出、トップ画面(ポータル)、利用者管理も対象に含む。

目的はコスト削減(TCO最適化)であり、スコープ外の機能(ワークフロー・承認、勤怠管理、メール、報告書、ToDoリスト、プロジェクト管理等)は安易に追加しない。

## ドキュメント構成

本プロジェクトは `CLAUDE.md` の運用ルールに従い、ドキュメントを2種類に分けて管理する。

- `docs/` — 永続的ドキュメント(基本設計。頻繁には更新しない)
  - [product-requirements.md](docs/product-requirements.md) — プロダクト要求定義書
  - [functional-design.md](docs/functional-design.md) — 機能設計書(システム構成図・ER図・画面遷移図等)
  - [architecture.md](docs/architecture.md) — 技術仕様書
  - [repository-structure.md](docs/repository-structure.md) — リポジトリ構造定義書
  - [development-guidelines.md](docs/development-guidelines.md) — 開発ガイドライン
  - [glossary.md](docs/glossary.md) — ユビキタス言語定義(用語集)
  - `docs/mockups/` — 画面モックアップ(HTML)
- `.steering/[YYYYMMDD]-[開発タイトル]/` — 作業単位のドキュメント(要求・設計・タスクリスト)
  - `.steering/20260827-initial-implementation/` — 初回実装

要件定義の原本は [`casemax_groupware_requirements.md`](casemax_groupware_requirements.md) を参照。

## 開発の進め方

新しい機能追加・修正を行う際は、`.steering/` に新しい作業ディレクトリを作成し、要求→設計→タスクリストの順にドキュメントを整備してから実装する。詳細は `CLAUDE.md` を参照。

## ステータス

現在はドキュメント整備フェーズが完了し、初回実装(MVP)に着手する段階(2026-08-27時点)。技術スタックは `docs/architecture.md` に提案として記載しているが未確定。
