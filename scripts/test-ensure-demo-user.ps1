# Script para probar la Edge Function ensure-demo-user
# Uso: .\scripts\test-ensure-demo-user.ps1

$url = "https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/ensure-demo-user"
$apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFid21zYXJxZXd4anV3Z2tkZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDgyMjEsImV4cCI6MjA4MTMyNDIyMX0.fU8aFFLy07GaPZn_7namja1LLL2pCk4ohP-eJjEJUps"

$headers = @{
  "Content-Type" = "application/json"
  "apikey"     = $apikey
  "Authorization" = "Bearer $apikey"
}

$body = '{"role":"cooperativa"}'

Write-Host "Probando ensure-demo-user..." -ForegroundColor Cyan
try {
  $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
  Write-Host "Respuesta:" -ForegroundColor Green
  $response | ConvertTo-Json
} catch {
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    Write-Host $reader.ReadToEnd()
  }
}
