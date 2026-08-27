# 初回実装 設計

作成日: 2026-08-27
参照元: `docs/functional-design.md`、`docs/architecture.md`、`docs/repository-structure.md`、`.steering/20260827-initial-implementation/requirements.md`
ステータス: ドラフト(要承認)

---

## 1. 実装アプローチ

新規開発(グリーンフィールド)であり、既存コードベースは存在しない。要件定義書6章の方針(フェーズ分けせず一括MVP開発)に沿い、**リリースは一括**とするが、**実装順序は依存関係の少ないものから積み上げる**。以下の順で進める。

1. **基盤構築**: リポジトリ雛形(`docs/repository-structure.md`準拠)、CI(lint/型チェック/テスト)、Tailwind設定、DB接続・マイグレーション基盤
2. **DBスキーマ**: `functional-design.md` のER図を基にテーブル作成(USER, GROUP, USER_GROUP から着手)
3. **認証・利用者管理**: ログイン、パスワードハッシュ化、権限区分、利用者CRUD、論理削除(退職処理の土台)
4. **お知らせ・掲示板**: 投稿CRUD、リッチテキスト+サニタイズ、コメント、既読管理、操作ログ基盤(他機能でも再利用)
5. **カレンダー(個人予定)**: 予定CRUD、公開対象(自分/全員)、非表示チェック、繰り返し予定
6. **共通休日設定**: 祝日管理画面(HOLIDAYマスタ)、会社休日(カレンダー機能の再利用)
7. **トップ画面**: 週間ガント(表示グループ切替、ナビゲーション5ボタン、月表示ボタン導線)、掲示板/ファイルウィジェット
8. **会議室予約**: MEETING_ROOM・ROOM_RESERVATION、二重予約防止ロジック
9. **ファイル共有**: フォルダ階層、アップロード/ダウンロード、バージョン管理(操作ログは4で構築した基盤を再利用)
10. **固定リンク**: 掲示板・ファイル詳細への固定URL発行、未ログイン時のリダイレクト
11. **会議候補日時の自動抽出**: free/busy計算ロジック、部署→メンバー選択UI、テキストコピー機能(既存カレンダー・会議室データに依存するため後段に配置)
12. **Googleカレンダー同期**: OAuth連携、セカンダリカレンダー、双方向同期、Webhook、退職時の自動解除(本プロジェクトで最も複雑な機能のため最終段に配置し、OAuthアプリ審査の申請はこの着手前に開始する)
13. **管理設定の仕上げ**: トップ表示件数設定、グループメンバー表示順設定、掲示板一括削除(プレビュー→実行)
14. **バックアップ運用**: 日次バックアップの物理的分離先の設定(インフラ確定後)

各ステップの完了ごとに、対応する受け入れ条件(`requirements.md` 3章)を満たしているかを確認する。

## 2. 変更するコンポーネント

新規開発のため「変更」ではなく「新規作成」となる。`docs/functional-design.md` 3章のコンポーネント設計に対応する以下を新規実装する。

**フロントエンド(`frontend/src/pages/`)**: top, board(list/detail/new)、files(list/detail/upload)、schedule(week-gantt/month-view/meeting-finder)、admin(users/holidays/top-settings/group-order/bulk-delete)

**バックエンド(`backend/src/modules/`)**: auth, users, board, calendar, holidays, rooms, google-sync, meeting-finder, files, logs, top-page

## 3. データ構造の変更

`docs/functional-design.md` 2章のER図を初回実装のスキーマ確定版とする。実装順序に合わせ、マイグレーションを以下の単位で分割する。

| マイグレーション単位 | 対象テーブル |
|---|---|
| 01_users_groups | USER, GROUP, USER_GROUP |
| 02_board | POST, COMMENT, ATTACHMENT |
| 03_calendar | CALENDAR_EVENT |
| 04_holidays | HOLIDAY |
| 05_top_page | TOP_PAGE_SETTING, GROUP_MEMBER_ORDER |
| 06_rooms | MEETING_ROOM, ROOM_RESERVATION |
| 07_files | FOLDER, FILE_ITEM, FILE_VERSION |
| 08_logs | OPERATION_LOG |
| 09_google_sync | GOOGLE_CALENDAR_LINK |

`PERMALINK_SLUG` は02(POST)・07(FILE_ITEM)のマイグレーションに含める。

## 4. 影響範囲の分析

- 新規システムのため既存システムへの影響はない。ただし現行サイボウズOfficeからのデータ移行(掲示板投稿・カレンダー予定・ファイル)を行う場合、移行範囲(全件/直近分)が確定してから移行スクリプト(`scripts/`)を設計する必要がある(未確定事項)。
- Googleカレンダー同期(手順12)は外部サービス(Google API)への依存が発生するため、OAuthアプリ審査のスケジュールを他の実装と並行して早期に着手する。
- 会議室予約とGoogleカレンダー同期は「会議室予約は双方向同期の対象外」という設計上の分離が必須(要件3-1章①)。実装時にモジュール間の依存を誤らないよう、`rooms` モジュールと `google-sync` モジュールは疎結合に保つ。
- 操作ログ(`logs`)は掲示板・ファイルの両方から呼び出される横断的機能のため、4章(掲示板)の実装時に汎用的なインターフェースとして設計し、9章(ファイル共有)で再利用する。

---

## 未確定事項

- データ移行(全件/直近分)の範囲確定後、移行スクリプトの設計を追加する。
- Google OAuthアプリ審査の要否・所要期間(実装時に最新のGoogleポリシーを確認)。
