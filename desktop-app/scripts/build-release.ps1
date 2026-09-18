$ErrorActionPreference = 'Stop'

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command,

    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

$appRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $appRoot

try {
  try {
    Invoke-Checked -Command 'node' -Arguments @('scripts/prepare-release-config.cjs')
    Invoke-Checked -Command 'npm' -Arguments @('run', 'build:renderer')
  }
  finally {
    # The relay key is compiled into the renderer. Never retain its temporary
    # plaintext .env input after the renderer attempt, including on failure.
    Invoke-Checked -Command 'node' -Arguments @('scripts/cleanup-release-config.cjs')
  }

  Invoke-Checked -Command 'npx' -Arguments @('--no-install', 'electron-builder', '--win', '--x64', '--publish', 'never')
  Invoke-Checked -Command 'npx' -Arguments @('--no-install', 'electron-builder', '--win', '--dir', '--x64', '--publish', 'never')
  Invoke-Checked -Command 'npm' -Arguments @('run', 'package:portable')
  Invoke-Checked -Command 'npm' -Arguments @('run', 'inspect:release')
}
finally {
  Pop-Location
}
