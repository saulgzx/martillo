$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot
Set-Location ..

# Force stable mode (clean + build + start) to avoid Next dev chunk flakiness on Windows/OneDrive.
$env:MARTILLO_FRONTEND_MODE = 'stable'

npm run dev:frontend

