Push-Location (Join-Path $PSScriptRoot '..')
try {
    docker compose down
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
