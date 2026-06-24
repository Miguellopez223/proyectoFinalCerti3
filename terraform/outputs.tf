output "backend_url" {
  description = "Elastic Beanstalk backend URL."
  value       = "http://${aws_elastic_beanstalk_environment.api.cname}"
}

output "backend_health_url" {
  description = "Backend health check URL."
  value       = "http://${aws_elastic_beanstalk_environment.api.cname}/actuator/health"
}

output "frontend_url" {
  description = "CloudFront frontend URL."
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "rds_endpoint" {
  description = "PostgreSQL endpoint."
  value       = aws_db_instance.postgres.address
}
