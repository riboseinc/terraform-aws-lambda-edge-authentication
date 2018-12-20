module "lambda" {
  source = "../"

  bucket_name    = "${var.s3_access_name}"
  bucket_key     = "${var.s3_access_key}"
  basic_user     = "${var.lambda_basic_username}"
  basic_password = "${var.lambda_basic_password}"
}


module "main" {
  // PR for lambda enabled need to merged
  source = "https://github.com/riboseinc/terraform-aws-s3-cloudfront-website"

  fqdn = "${var.fqdn}"
  ssl_certificate_arn = "${aws_acm_certificate_validation.cert.certificate_arn}"
  allowed_ips = "${var.allowed_ips}"

  index_document = "index.html"
  error_document = "404.html"

  refer_secret = "${base64sha512("REFER-SECRET-19265125-${var.fqdn}-52865926")}"

  force_destroy = "true"

  providers {
    "aws.main" = "aws.main"
    "aws.cloudfront" = "aws.cloudfront"
  }

  lambda_edge_enabled = "true"
  lambda_edge_event_type = "viewer-request"
  lambda_edge_arn_version = "${module.lambda.arn}:${module.lambda.version}"
}
