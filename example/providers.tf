provider "aws" {
//  region = "us-east-1"
  region = "us-west-2"
  alias  = "main"
}

provider "aws" {
  region = "us-east-1"
  alias  = "cloudfront"
}

