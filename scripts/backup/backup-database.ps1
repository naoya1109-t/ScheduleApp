<#
.SYNOPSIS
  SQL Server(10.194.5.57)上の本アプリ用データベースを日次バックアップする。

.DESCRIPTION
  sqlcmdでBACKUP DATABASEを実行し、生成された.bakファイルを本体サーバーとは
  物理的に別の場所(BackupDest)へコピーする。ローカルの一時ファイルは
  コピー後に削除する。

.PARAMETER SqlServer
  接続先SQL Server(既定: 環境変数 DB_SERVER)

.PARAMETER Database
  バックアップ対象データベース名(既定: 環境変数 DB_NAME)

.PARAMETER BackupUser / BackupPassword
  バックアップ専用のSQL Server認証アカウント(推奨)。未指定の場合は
  Windows統合認証(-E)を使用する。アプリの接続アカウント(DB_USER)とは
  権限分離することを推奨(BACKUP DATABASE権限が必要なため)。

.PARAMETER LocalTempDir
  .bak生成用のローカル一時ディレクトリ(SQL Server側から書き込み可能な必要がある)

.PARAMETER BackupDest
  バックアップ先ルートディレクトリ(必須。環境変数 BACKUP_DEST_DB でも指定可)。
  本体サーバー・DBサーバーとは物理的に別の場所を指定すること。

.PARAMETER RetentionDays
  保持日数(既定30日)
#>
param(
    [string]$SqlServer = $env:DB_SERVER,
    [string]$Database = $env:DB_NAME,
    [string]$BackupUser = $env:DB_BACKUP_USER,
    [string]$BackupPassword = $env:DB_BACKUP_PASSWORD,
    [string]$LocalTempDir = "C:\SqlBackupTemp",
    [string]$BackupDest = $env:BACKUP_DEST_DB,
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

if (-not $SqlServer -or -not $Database) {
    Write-Error "SqlServer, Database を指定してください(環境変数 DB_SERVER / DB_NAME でも可)。"
    exit 1
}
if (-not $BackupDest) {
    Write-Error "バックアップ先が指定されていません。-BackupDest か環境変数 BACKUP_DEST_DB を設定してください。"
    exit 1
}

New-Item -ItemType Directory -Force -Path $LocalTempDir | Out-Null
$dateStamp = Get-Date -Format "yyyyMMdd_HHmmss"
$bakFileName = "$Database`_$dateStamp.bak"
$bakFilePath = Join-Path $LocalTempDir $bakFileName

$query = "BACKUP DATABASE [$Database] TO DISK = N'$bakFilePath' WITH INIT, COMPRESSION;"

Write-Output "SQL Serverバックアップ開始: $SqlServer / $Database"
if ($BackupUser) {
    sqlcmd -S $SqlServer -U $BackupUser -P $BackupPassword -Q $query -b
} else {
    sqlcmd -S $SqlServer -E -Q $query -b
}
if ($LASTEXITCODE -ne 0) {
    Write-Error "sqlcmdによるバックアップが失敗しました(終了コード: $LASTEXITCODE)"
    exit 1
}

$destDir = Join-Path $BackupDest (Get-Date -Format "yyyyMMdd")
New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Copy-Item -Path $bakFilePath -Destination $destDir -Force
Remove-Item -Path $bakFilePath -Force

Get-ChildItem -Path $BackupDest -Directory -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match '^\d{8}$' -and [datetime]::ParseExact($_.Name, "yyyyMMdd", $null) -lt (Get-Date).AddDays(-$RetentionDays)
} | Remove-Item -Recurse -Force -Confirm:$false

Write-Output "SQL Serverバックアップ完了: $destDir\$bakFileName"
exit 0
