variable "name" {
  default = "terraform-aws-lambda-edge-authentication"
}

// Lambda limits https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html
variable "fn_timeout" {
  default = 3
}

variable "fn_memory_size" {
  default = 128
}

variable "bucket_name" {
}

variable "bucket_key" {
}

variable "basic_user" {
}

variable "basic_password" {
}
