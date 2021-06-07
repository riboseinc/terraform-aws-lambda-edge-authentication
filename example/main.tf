module "lambda" {
  source = "../"

  # default key is "config.json"
  bucketName   = var.bucketName
  bucketKey    = var.bucketKey
  cookieDomain = var.cookieDomain
}
/*


module "s3-cloudfront-website" {
  source  = "riboseinc/s3-cloudfront-website/aws"
  version = "1.1.0"
  # insert the 4 required variables here
}

*/
module "main" {
  source  = "riboseinc/s3-cloudfront-website/aws"
  version = "1.1.0"

  fqdn                = var.fqdn
  ssl_certificate_arn = aws_acm_certificate_validation.cert.certificate_arn
  allowed_ips         = var.allowed_ips

  index_document = "index.html"
  error_document = "404.html"

  refer_secret = base64sha512("REFER-SECRET-19265125-${var.fqdn}-52865926")

  force_destroy = "true"

  providers = {
    aws.main       = aws.main
    aws.cloudfront = aws.cloudfront
  }

  lambda_edges = [
    {
      event_type = "viewer-request"
      lambda_arn = "${module.lambda.arn}:${module.lambda.version}"
    }
  ]
//  lambda_edge_enabled     = "true"
//  lambda_edge_arn_version = "${module.lambda.arn}:${module.lambda.version}"
}

