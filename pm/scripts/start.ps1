Push-Location (Join-Path $PSScriptRoot '..')
try {
    docker compose up --build --wait
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
