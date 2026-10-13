param([int]$Port = 8000)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDirectory = Join-Path $ProjectRoot "frontend"
$BackendDirectory = Join-Path $ProjectRoot "backend"
$PythonExecutable = Join-Path $BackendDirectory "venv\Scripts\python.exe"

Push-Location $FrontendDirectory
npm run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    exit $LASTEXITCODE
}
Pop-Location

if (-not (Test-Path $PythonExecutable)) {
    $PythonExecutable = "python"
}

Push-Location $BackendDirectory
Write-Host "Starting the notification scheduler..."
$SchedulerProcess = Start-Process -FilePath $PythonExecutable `
    -ArgumentList @("manage.py", "run_notification_scheduler") `
    -WorkingDirectory $BackendDirectory -PassThru -NoNewWindow
try {
    & $PythonExecutable manage.py runserver "127.0.0.1:$Port"
    $ServerExitCode = $LASTEXITCODE
}
finally {
    if ($SchedulerProcess -and -not $SchedulerProcess.HasExited) {
        Stop-Process -Id $SchedulerProcess.Id
    }
}
Pop-Location
exit $ServerExitCode