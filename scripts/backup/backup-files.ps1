<#
.SYNOPSIS
  ファイル共有の実体(storage/)を日次バックアップする。

.DESCRIPTION
  robocopyでミラーコピーし、日付ごとのフォルダに保存する。
  BackupDestは本体Webサーバーとは物理的に別の場所(別ドライブ・NAS・
  別サーバーのネットワーク共有等)を指定すること。同一ディスク内の
  別フォルダを指定しても、サーバー自体の故障には対応できない。

.PARAMETER SourceDir
  バックアップ対象(既定: リポジトリ直下のstorage/)

.PARAMETER BackupDest
  バックアップ先ルートディレクトリ(必須。環境変数 BACKUP_DEST_FILES でも指定可)

.PARAMETER RetentionDays
  保持日数(既定30日)。これより古い日付フォルダは削除する。
#>
param(
    [string]$SourceDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..\storage")),
    [string]$BackupDest = $env:BACKUP_DEST_FILES,
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

if (-not $BackupDest) {
    Write-Error "バックアップ先が指定されていません。-BackupDest か環境変数 BACKUP_DEST_FILES を設定してください。"
    exit 1
}

if (-not (Test-Path $SourceDir)) {
    Write-Error "バックアップ元が存在しません: $SourceDir"
    exit 1
}

$dateStamp = Get-Date -Format "yyyyMMdd"
$destPath = Join-Path $BackupDest $dateStamp

Write-Output "ファイルバックアップ開始: $SourceDir -> $destPath"
robocopy $SourceDir $destPath /MIR /R:2 /W:5 /NFL /NDL /NP /XD ".tmp" | Out-Null

# robocopyの終了コードは0-7が正常(8以上が失敗)
if ($LASTEXITCODE -ge 8) {
    Write-Error "robocopyが失敗しました(終了コード: $LASTEXITCODE)"
    exit 1
}

Get-ChildItem -Path $BackupDest -Directory -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match '^\d{8}$' -and [datetime]::ParseExact($_.Name, "yyyyMMdd", $null) -lt (Get-Date).AddDays(-$RetentionDays)
} | Remove-Item -Recurse -Force -Confirm:$false

Write-Output "ファイルバックアップ完了: $destPath"
# robocopyの成功終了コード(0-7)がそのままスクリプトの終了コードとして残り、
# タスクスケジューラに「失敗」と誤判定されないよう、正常終了を明示する
exit 0
