# Restore the development registration before opening the Nour starter template.
$ErrorActionPreference = 'Stop'
$nourTools = 'office-addin-dev-settings@4.0.1'
$nourLog = Join-Path $PSScriptRoot 'launch-nour.log'
try {
  foreach ($nourFile in @('taskpane-manifest.xml', 'manifest.xml')) {
    $nourManifest = Join-Path $PSScriptRoot $nourFile
    if (-not (Test-Path -LiteralPath $nourManifest)) { throw "Missing $nourFile. Keep the Nour files together." }
    & npx.cmd --yes $nourTools register $nourManifest 2>&1 | Out-File -FilePath $nourLog -Append
    if ($LASTEXITCODE -ne 0) { throw 'Nour registration failed. See launch-nour.log.' }
    & npx.cmd --yes $nourTools debugging $nourManifest --enable --debug-method direct 2>&1 | Out-File -FilePath $nourLog -Append
    if ($LASTEXITCODE -ne 0) { throw 'Nour development mode could not be enabled. See launch-nour.log.' }
  }
  Start-Process -FilePath (Join-Path $PSScriptRoot 'Nour.potx')
} catch { $_ | Out-File -FilePath $nourLog -Append }
