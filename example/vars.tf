# Variables
variable "fqdn" {
  description = "The fully-qualified domain name of the resulting S3 website."
  default     = "mysite.booppi.website"
}

variable "domain" {
  description = "The domain name / ."
  default     = "booppi.website"
}

# Allowed IPs that can directly access the S3 bucket
variable "allowed_ips" {
  type = "list"
  default = [ "0.0.0.0/0" ]
}

variable "config_bucket_name" {
  default = "mysite.htaccess"
}

variable "config_bucket_key" {
  default = "config.json"
}

variable "lambda_basic_username" {
  default = "test"
}

variable "lambda_basic_password" {
  default = "test"
}