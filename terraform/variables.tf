variable "aws_region" {
  description = "AWS region where the application will be deployed."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short lowercase name used to prefix AWS resources."
  type        = string
  default     = "ecommerce-upb"
}

variable "backend_jar_path" {
  description = "Path to the packaged Spring Boot JAR."
  type        = string
  default     = "../ecommerce-api/target/ecommerce-api-0.0.1-SNAPSHOT.jar"
}

variable "frontend_dist_path" {
  description = "Path to the Vite production build folder."
  type        = string
  default     = "../frontend/dist"
}

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "ecommerce"
}

variable "db_username" {
  description = "PostgreSQL admin username."
  type        = string
  default     = "postgre"
}

variable "db_password" {
  description = "PostgreSQL admin password."
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_publicly_accessible" {
  description = "Whether RDS receives a public endpoint. Keep false unless you need psql from your PC."
  type        = bool
  default     = false
}

variable "allowed_db_cidr" {
  description = "Optional CIDR allowed to connect to PostgreSQL, e.g. your.ip.address/32. Leave empty for backend-only DB access."
  type        = string
  default     = ""
}

variable "jwt_secret_key" {
  description = "Base64 JWT secret used by the backend."
  type        = string
  sensitive   = true
  default     = "ZWNvbW1lcmNlU2VjcmV0S2V5MjAyNVVQQkNlcnRpZmljYWNpb24="
}

variable "google_client_id" {
  description = "Google OAuth Client ID."
  type        = string
  default     = "921525415797-dbv55t80id7h4m5ek563bnbivqrc4v4r.apps.googleusercontent.com"
}

variable "stereum_api_key" {
  description = "Stereum API key."
  type        = string
  sensitive   = true
  default     = "0b370ed6-7e86-4db3-bcba-313ee6f34e9b"
}

variable "stereum_account_id" {
  description = "Stereum collecting account id."
  type        = string
  sensitive   = true
  default     = "efd8122f-5508-40ab-b149-ddfc873a8bc0"
}

variable "quartz_initialize_schema" {
  description = "Quartz JDBC schema initialization mode for the deployed backend. Use always for the first deployment to an empty RDS, then never if you want to preserve scheduled jobs across restarts."
  type        = string
  default     = "always"
}
