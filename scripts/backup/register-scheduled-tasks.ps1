<#
.SYNOPSIS
  日次バックアップ2本(DB・ファイル実体)をWindowsタスクスケジューラに登録する。

.DESCRIPTION
  本番Windows Server上で管理者権限のPowerShellから実行する。
  環境変数(BACKUP_DEST_FILES, BACKUP_DEST_DB, DB_SERVER, DB_NAME,
  DB_BACKUP_USER, DB_BACKUP_PASSWORD)はタスク実行時のシステム環境変数として
  事前に設定しておくこと(このスクリプトでは設定しない)。

.EXAMPLE
  管理者権限のPowerShellで実行:
  .\register-scheduled-tasks.ps1
#>
param(
    [string]$ScriptDir = $PSScriptRoot,
    [string]$FilesBackupTime = "02:00",
    [string]$DbBackupTime = "02:30"
)

$ErrorActionPreference = "Stop"

function Register-BackupTask {
    param(
        [string]$TaskName,
        [string]$ScriptPath,
        [string]$StartTime
    )

    $action = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
    $trigger = New-ScheduledTaskTrigger -Daily -At $StartTime
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
        -Settings $settings -Principal $principal -Force | Out-Null
    Write-Output "登録しました: $TaskName ($StartTime, $ScriptPath)"
}

Register-BackupTask -TaskName "ScheduleApp-Backup-Files" `
    -ScriptPath (Join-Path $ScriptDir "backup-files.ps1") -StartTime $FilesBackupTime

Register-BackupTask -TaskName "ScheduleApp-Backup-Database" `
    -ScriptPath (Join-Path $ScriptDir "backup-database.ps1") -StartTime $DbBackupTime

Write-Output ""
Write-Output "登録完了。タスクスケジューラで確認: taskschd.msc"
Write-Output "動作確認は Start-ScheduledTask -TaskName ScheduleApp-Backup-Files で手動実行できる。"
