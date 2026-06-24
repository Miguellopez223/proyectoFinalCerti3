# Despliegue AWS con Terraform

Esta plantilla crea:

- RDS PostgreSQL
- Elastic Beanstalk para el backend Spring Boot
- S3 + CloudFront para el frontend React/Vite

## Requisitos

Instalar Terraform:

```powershell
winget install Hashicorp.Terraform
```

Cerrar y abrir PowerShell, luego verificar:

```powershell
terraform version
```

Configurar AWS CLI:

```powershell
aws configure
aws sts get-caller-identity
```

Tu usuario necesita permisos para RDS, Elastic Beanstalk, S3, CloudFront, EC2/VPC, IAM y CloudWatch.

## Preparar artefactos

Desde la raiz del proyecto:

```powershell
mvn clean package -DskipTests
cd frontend
npm run build
cd ..
```

## Variables

Crear un archivo real desde el ejemplo:

```powershell
Copy-Item terraform\terraform.tfvars.example terraform\terraform.tfvars
```

Editar `terraform/terraform.tfvars` y cambiar `db_password`.

## Ejecutar Terraform

```powershell
cd terraform
terraform init
terraform plan
terraform apply
```

Al terminar, Terraform mostrara:

- `backend_health_url`
- `frontend_url`
- `rds_endpoint`

Agrega el `frontend_url` en Google Cloud Console como Authorized JavaScript origin para que funcione el login con Google.
