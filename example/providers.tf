variable "region" {
  description = "fix region empty issue of terraform v12"
  type        = string
  default     = "us-east-1"
}

# AWS Region for S3 and other resources
provider "aws" {
//  region = "us-east-1"
  region = "us-west-2"
  alias  = "main"
  version = "~> 2.9"
}

# AWS Region for Cloudfront (ACM certs only supports us-east-1)
provider "aws" {
  region = "us-east-1"
  alias  = "cloudfront"
  version = "~> 2.9"
}



provider "aws" {
  region = var.region
}
