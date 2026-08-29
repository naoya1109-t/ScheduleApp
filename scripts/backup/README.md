# 日次バックアップ運用

DB(SQL Server)とファイル共有の実体(`storage/`)を、本体Webサーバーとは物理的に別の場所へ日次バックアップするためのスクリプト。

## スクリプト一覧

- `backup-files.ps1` — `storage/`をrobocopyでミラーコピーする(`.tmp/`は除外)
- `backup-database.ps1` — `sqlcmd`で`BACKUP DATABASE`を実行し、生成された`.bak`をバックアップ先へコピーする
- `register-scheduled-tasks.ps1` — 上記2本を毎日自動実行するWindowsタスクスケジューラのタスクを登録する(要管理者権限)

## 前提条件・環境変数

**重要**: `BACKUP_DEST_FILES` / `BACKUP_DEST_DB` は、本体Webサーバーとは**物理的に別の場所**(別ドライブ・NAS・別サーバーのネットワーク共有等)を指定すること。同一ディスク内の別フォルダでは、サーバー自体の故障(ディスク破損・火災等)に対応できない(要件定義書6-1章・8章)。

| 環境変数 | 用途 | 例 |
|---|---|---|
| `BACKUP_DEST_FILES` | ファイルバックアップ先 | `\\backup-nas\schedule-app\files` |
| `BACKUP_DEST_DB` | DBバックアップ先 | `\\backup-nas\schedule-app\db` |
| `DB_SERVER` | 接続先SQL Server | `10.194.5.57`(backend/.envと共通) |
| `DB_NAME` | バックアップ対象DB名 | `schedule_app` |
| `DB_BACKUP_USER` / `DB_BACKUP_PASSWORD` | バックアップ専用のSQL Server認証アカウント(推奨) | - |

**DB_BACKUP_USERについて**: アプリの通常接続アカウント(`DB_USER`)とは別に、`BACKUP DATABASE`権限を持つ専用アカウントを払い出すことを推奨する(最小権限の原則)。未指定の場合はWindows統合認証(`sqlcmd -E`)にフォールバックするが、その場合はタスク実行アカウント(既定はSYSTEM)にSQL Server側の権限付与が必要。

## 手動実行(動作確認用)

```powershell
$env:BACKUP_DEST_FILES = "\\backup-nas\schedule-app\files"
.\backup-files.ps1

$env:BACKUP_DEST_DB = "\\backup-nas\schedule-app\db"
$env:DB_SERVER = "10.194.5.57"
$env:DB_NAME = "schedule_app"
.\backup-database.ps1
```

## 自動実行の登録

本番Windows Serverで、上記の環境変数をシステム環境変数として設定した上で、管理者権限のPowerShellから実行する。

```powershell
.\register-scheduled-tasks.ps1
```

既定では毎日2:00(ファイル)・2:30(DB)に実行される。登録後はタスクスケジューラ(`taskschd.msc`)で確認できる。

## 未確認事項

- `BACKUP_DEST_FILES` / `BACKUP_DEST_DB` の実際の保存先(NAS/別サーバー等)
- `DB_BACKUP_USER`用のSQL Server専用アカウントの払い出し(現状は本アプリの通常接続アカウントとは別権限が必要)
- 保持日数(既定30日)の妥当性
