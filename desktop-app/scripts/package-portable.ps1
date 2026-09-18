param(
  [string]$SourceDirectory,
  [string]$DestinationPath,
  [int64]$MinimumBytes = 1000000
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$appRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$distRoot = [System.IO.Path]::GetFullPath((Join-Path $appRoot 'dist'))
if ([string]::IsNullOrWhiteSpace($SourceDirectory)) {
  $SourceDirectory = Join-Path $distRoot 'win-unpacked'
}
if ([string]::IsNullOrWhiteSpace($DestinationPath)) {
  $DestinationPath = Join-Path $distRoot 'NEO-LIB-windows-portable.zip'
}

$source = [System.IO.Path]::GetFullPath($SourceDirectory)
$destination = [System.IO.Path]::GetFullPath($DestinationPath)
if (-not (Test-Path -LiteralPath $source -PathType Container)) {
  throw "Portable source folder is missing: $source"
}
if ($source -eq $destination -or $destination.StartsWith($source + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Portable ZIP destination must stay outside its source folder.'
}

$destinationDirectory = Split-Path -Parent $destination
New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
if (Test-Path -LiteralPath $destination) {
  Remove-Item -LiteralPath $destination -Force
}
[System.IO.Compression.ZipFile]::CreateFromDirectory(
  $source,
  $destination,
  [System.IO.Compression.CompressionLevel]::Optimal,
  $false
)
if (-not (Test-Path -LiteralPath $destination -PathType Leaf)) {
  throw 'Portable ZIP was not created.'
}
$bytes = (Get-Item -LiteralPath $destination).Length
if ($bytes -lt $MinimumBytes) {
  throw "Portable ZIP is unexpectedly small: $bytes bytes"
}
Write-Host "Portable ZIP ready: $destination ($bytes bytes)"
