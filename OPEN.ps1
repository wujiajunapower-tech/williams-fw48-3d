param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$previewUrl = 'http://127.0.0.1:5180/'

# Use a direct loopback request even when a system proxy is configured. This
# works in both Windows PowerShell 5.1 and PowerShell 7 without extra modules.
function Test-Preview {
    try {
        $request = [System.Net.HttpWebRequest]::Create($previewUrl)
        $request.Proxy = $null
        $request.Timeout = 1800
        $response = $request.GetResponse()
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        try { return $reader.ReadToEnd().Contains('FW48') }
        finally { $reader.Dispose(); $response.Dispose() }
    } catch { return $false }
}

if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'dist/index.html'))) {
    throw 'The web build is missing. Run npm run build from this folder first.'
}
if (-not (Test-Preview)) {
    $nodeCommand = Get-Command node -ErrorAction Stop
    $logDirectory = Join-Path $PSScriptRoot '.viewer'
    New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
    # Keep the viewer alive independently of this launcher, without a console.
    $server = Start-Process -FilePath $nodeCommand.Source -ArgumentList 'preview.mjs' `
        -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $logDirectory 'server.stdout.log') `
        -RedirectStandardError (Join-Path $logDirectory 'server.stderr.log')
    @{pid=$server.Id;url=$previewUrl;project=$PSScriptRoot} | ConvertTo-Json |
        Set-Content -Encoding utf8 -LiteralPath (Join-Path $logDirectory 'server.json')
    $ready = $false
    for ($i=0; $i -lt 30; $i++) {
        if (Test-Preview) { $ready=$true; break }
        if ($server.HasExited) { break }
        Start-Sleep -Milliseconds 200
    }
    if (-not $ready) {
        throw "The viewer did not start. Inspect $logDirectory/server.stderr.log."
    }
}
Write-Host "FW48 viewer ready: $previewUrl"
if (-not $NoBrowser) { Start-Process $previewUrl }
