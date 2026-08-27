# リポジトリ構造定義書

作成日: 2026-08-27
参照元: `docs/architecture.md`(技術スタック)、CLAUDE.md(ドキュメント運用ルール)
ステータス: ドラフト(要承認。技術スタックが `architecture.md` の提案から変更された場合、本構造も追随して見直す)

---

## 1. 全体方針

- `architecture.md` の提案スタック(フロントエンド: React + TypeScript、バックエンド: Node.js + TypeScript)を前提に、**フロントエンド・バックエンドを1つのリポジトリで管理するモノレポ構成**とする。
- CLAUDE.mdが定義する `docs/`(永続的ドキュメント)と `.steering/`(作業単位ドキュメント)の分離ルールをリポジトリ直下にそのまま適用する。
- 図表・ダイアグラムは独立フォルダを作らず、関連する `docs/` 内のMarkdownにMermaid記法で直接記載する(CLAUDE.md原則)。モックアップHTMLのみ実体ファイルとして `docs/mockups/` に置く。

---

## 2. ディレクトリ構成

```
ScApp/
├── CLAUDE.md                      # プロジェクトメモリ(開発ルール)
├── casemax_groupware_requirements.md  # 要件定義ドラフト(原本)
│
├── docs/                          # 永続的ドキュメント
│   ├── product-requirements.md
│   ├── functional-design.md
│   ├── architecture.md
│   ├── repository-structure.md
│   ├── development-guidelines.md
│   ├── glossary.md
│   └── mockups/                   # HTMLモックアップ実体(画面確認用)
│       ├── casemax_mockup_top.html
│       └── casemax_mockup_meeting_finder.html
│
├── .steering/                     # 作業単位のステアリングファイル
│   └── [YYYYMMDD]-[開発タイトル]/
│       ├── requirements.md
│       ├── design.md
│       └── tasklist.md
│
├── frontend/                      # React + TypeScript アプリケーション
│   ├── public/
│   └── src/
│       ├── pages/                 # 画面単位(トップ/掲示板/ファイル/スケジュール/管理設定 等)
│       │   ├── top/
│       │   ├── board/
│       │   ├── files/
│       │   ├── schedule/
│       │   │   ├── week-gantt/
│       │   │   ├── month-view/
│       │   │   └── meeting-finder/
│       │   └── admin/
│       │       ├── users/
│       │       ├── holidays/
│       │       └── top-settings/
│       ├── components/            # 画面横断の共通UIコンポーネント(カード・週間ガント表・ボタン等)
│       ├── hooks/                 # カスタムフック
│       ├── api/                   # バックエンドAPI呼び出しクライアント
│       ├── types/                 # フロントエンド用の型定義
│       └── styles/                # Tailwind設定・共通デザイントークン
│
├── backend/                       # Node.js + TypeScript API
│   ├── src/
│   │   ├── modules/               # 機能モジュール(コンポーネント設計に対応)
│   │   │   ├── auth/
│   │   │   ├── users/             # 利用者管理
│   │   │   ├── board/             # 掲示板
│   │   │   ├── calendar/          # 個人・チームカレンダー
│   │   │   ├── holidays/          # 祝日・会社休日
│   │   │   ├── rooms/             # 会議室予約
│   │   │   ├── google-sync/       # Googleカレンダー連携
│   │   │   ├── meeting-finder/    # 会議候補日時の自動抽出
│   │   │   ├── files/             # ファイル共有
│   │   │   ├── logs/              # 操作ログ
│   │   │   └── top-page/          # トップ画面集約API
│   │   ├── db/                    # スキーマ定義・マイグレーション
│   │   ├── middleware/            # 認証・エラーハンドリング等
│   │   └── config/                # 環境設定
│   └── tests/
│
├── shared/                        # フロントエンド・バックエンド共通の型定義(必要な場合のみ)
│
├── storage/                       # ファイル共有の実体(ローカルディスク保存先、.gitignore対象)
│
├── scripts/                       # 運用・移行スクリプト(データ移行、バックアップ等)
│
├── deploy/                        # 本番デプロイ関連(IIS: web.config、Windowsサービス登録スクリプト等)
│   ├── iis/
│   │   ├── frontend.web.config    # 静的配信+SPAフォールバック用URL Rewrite
│   │   └── backend.web.config     # ARRリバースプロキシ設定(/api/* → Node.jsプロセス)
│   └── service/                   # Node.jsを常駐化するWindowsサービス登録スクリプト
│
└── docker/                        # ローカル開発用のコンテナ構成(任意、本番では未使用)
```

---

## 3. ディレクトリの役割

| ディレクトリ | 役割 |
|---|---|
| `docs/` | プロダクト全体の恒久的な設計方針。基本設計が変わらない限り更新しない |
| `docs/mockups/` | 確認・合意用のHTMLモックアップ実体。画面デザインの正として参照する |
| `.steering/` | 個別の開発作業(機能追加・修正)ごとの要求・設計・タスク管理。作業完了後も履歴として保持 |
| `frontend/src/pages/` | 画面単位の実装。`functional-design.md` の画面遷移図の各ノードに対応させる |
| `frontend/src/components/` | 複数画面で使う共通UI(週間ガント表・カード・ボタン等)。モックアップのデザイントークンをここに集約 |
| `backend/src/modules/` | `functional-design.md` の「バックエンドモジュール構成」に対応する機能単位のディレクトリ |
| `backend/src/db/` | ER図(`functional-design.md`)に対応するスキーマ・マイグレーション |
| `storage/` | ファイル共有機能がアップロードされたファイル実体を保存する場所(DBにはメタデータのみ保持) |
| `scripts/` | データ移行・バックアップ運用など、アプリケーション本体に含めない補助スクリプト |
| `deploy/iis/` | 本番Windows Server + IISでの配置に使う`web.config`テンプレート(静的配信+SPAフォールバック、ARRリバースプロキシ設定)。`docs/architecture.md` 1-3章の構成に対応 |
| `deploy/service/` | Node.jsバックエンドをWindowsサービスとして常駐化するための登録・起動スクリプト |

---

## 4. ファイル配置ルール

- 新しい画面を追加する場合は `frontend/src/pages/[機能名]/` 配下に画面単位でディレクトリを作成する。
- 新しいバックエンド機能を追加する場合は `backend/src/modules/[機能名]/` 配下にモジュールを作成し、`functional-design.md` のAPI設計表にエンドポイントを追記してから実装する。
- ファイル共有機能がアップロードするファイル実体は `storage/` 配下に保存し、リポジトリのバージョン管理対象外(`.gitignore`)とする。
- モックアップを追加・更新する場合は `docs/mockups/` に配置し、`functional-design.md` の「ワイヤフレーム」節から参照する。
- 作業単位のドキュメント(要求・設計・タスクリスト)は必ず `.steering/[YYYYMMDD]-[開発タイトル]/` に作成し、`docs/` 直下には置かない。
- 図表・ダイアグラムは新規フォルダを作らず、関連する `docs/*.md` にMermaid記法で直接埋め込む(CLAUDE.md原則)。

---

## 未確定事項

- モノレポ運用でよいか、将来的にフロントエンド・バックエンドをリポジトリ分割する可能性があるか
- `storage/` (ファイル実体の保存先)を本リポジトリと同一サーバー内の別ディレクトリにするか、独立したパス・別ボリュームにするか(バックアップの物理分離要件と合わせて基本設計で確定)
