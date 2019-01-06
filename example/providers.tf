# AWS Region for S3 and other resources
provider "aws" {
  region = "us-west-2"
  alias = "main"
}


# AWS Region for Cloudfront (ACM certs only supports us-east-1)
provider "aws" {
  region = "us-east-1"
  alias = "cloudfront"
}

