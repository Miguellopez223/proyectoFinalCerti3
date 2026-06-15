$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$apiModule = Join-Path $projectRoot "ecommerce-api"
$targetDir = Join-Path $apiModule "target"
$deployDir = Join-Path $projectRoot "deployment\\produccion"
$configDir = Join-Path $deployDir "config"

if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    throw "No se encontro 'javac'. Instala y configura un JDK 21 antes de ejecutar este script."
}

try {
    $javacVersionOutput = & javac -version 2>&1
} catch {
    throw "No se pudo ejecutar 'javac'. Verifica JAVA_HOME y el PATH."
}

if ($javacVersionOutput -notmatch "21") {
    throw "Se detecto '$javacVersionOutput'. El proyecto requiere JDK 21."
}

Write-Host "Empaquetando ecommerce-api..."
& (Join-Path $projectRoot "mvnw.cmd") -pl ecommerce-api -am clean package -DskipTests

if ($LASTEXITCODE -ne 0) {
    throw "Fallo el empaquetado Maven."
}

$jar = Get-ChildItem -Path $targetDir -Filter "*.jar" |
    Where-Object { $_.Name -notlike "original-*" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $jar) {
    throw "No se encontro el jar generado en $targetDir."
}

New-Item -ItemType Directory -Force -Path $configDir | Out-Null
Copy-Item -LiteralPath $jar.FullName -Destination (Join-Path $deployDir "ecommerce-api.jar") -Force

Write-Host ""
Write-Host "Listo."
Write-Host "Jar copiado a: $deployDir\ecommerce-api.jar"
Write-Host "Configuracion externa: $configDir\application.properties"
Write-Host ""
Write-Host "Para ejecutar:"
Write-Host "  cd $deployDir"
Write-Host "  java -jar .\ecommerce-api.jar"
