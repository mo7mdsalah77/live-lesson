# Run once as administrator to create a local Nour add-in catalog.
$ErrorActionPreference = 'Stop'
$nourFolder = Join-Path $PSScriptRoot 'NourCatalog'
$nourAccount = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
if (-not (Test-Path -LiteralPath $nourFolder -PathType Container)) { throw 'NourCatalog is missing. Keep the installer files together.' }
$nourShare = Get-SmbShare -Name 'NourAddins' -ErrorAction SilentlyContinue
if ($nourShare -and $nourShare.Path -ne $nourFolder) { throw 'NourAddins already points to another folder. No changes were made.' }
if (-not $nourShare) { New-SmbShare -Name 'NourAddins' -Path $nourFolder -FullAccess $nourAccount -FolderEnumerationMode AccessBased | Out-Null }
$nourCatalogId = '{a858a89e-aa93-49ec-89e7-0cb2f8bec2f7}'
$nourKey = 'HKCU:\Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\' + $nourCatalogId
New-Item -Path $nourKey -Force | Out-Null
New-ItemProperty -Path $nourKey -Name Id -Value $nourCatalogId -PropertyType String -Force | Out-Null
New-ItemProperty -Path $nourKey -Name Url -Value '\\localhost\NourAddins' -PropertyType String -Force | Out-Null
New-ItemProperty -Path $nourKey -Name Flags -Value 1 -PropertyType DWord -Force | Out-Null
Write-Host 'Nour catalog installed. Restart PowerPoint, then Home > Add-ins > Advanced > SHARED FOLDER > Nour > Add.'
