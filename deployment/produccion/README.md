# Despliegue local

Esta carpeta replica la estructura de despliegue externa:

```text
produccion/
  config/
    application.properties
  ecommerce-api.jar
```

## Preparar la carpeta

Desde la raiz del proyecto:

```powershell
.\scripts\prepare-production.ps1
```

Requisito previo: tener `JDK 21` instalado y `javac` disponible en `PATH`.

## Ejecutar la aplicacion

Desde esta carpeta:

```powershell
java -jar .\ecommerce-api.jar
```

Spring Boot cargara primero la configuracion externa ubicada en `.\config\application.properties`.

## Nota

Antes de ejecutar, revisa `config/application.properties` y completa credenciales, URLs y secretos reales.
