# Ejecutar todos los seeds en orden
# Uso: .\db\seeds\run_all.ps1
# Requiere: $env:DATABASE_URL o conexión configurada en Supabase

$ErrorActionPreference = "Stop"
$seeds = @(
  "001_ag_variedades.sql",
  "002_ag_parametros_altitud.sql",
  "003_ag_parametros_fenologicos.sql",
  "004_ag_reglas_suelo_ruleset_1_0_0.sql",
  "005_ag_ruleset_versions.sql"
)

$baseDir = Split-Path -Parent $PSScriptRoot
$seedsDir = Join-Path $baseDir "db\seeds"

if (-not $env:DATABASE_URL) {
  Write-Host "DATABASE_URL no definido. Usar: `$env:DATABASE_URL = 'postgresql://...'" -ForegroundColor Yellow
  Write-Host "O ejecutar con Supabase: npx supabase db execute -f db/seeds/001_ag_variedades.sql" -ForegroundColor Yellow
  exit 1
}

foreach ($f in $seeds) {
  $path = Join-Path $seedsDir $f
  Write-Host "Ejecutando $f..." -ForegroundColor Cyan
  psql $env:DATABASE_URL -f $path
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
Write-Host "Seeds completados." -ForegroundColor Green
