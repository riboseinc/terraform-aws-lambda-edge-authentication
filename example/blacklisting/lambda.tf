locals {
  bucket_name = "blacklisting.booppi.website.htaccess"
  bucket_key = "htaccess.json"
  basic_user = "test"
  basic_password = "test"
}

module "lambda" {
  source = "../../"

  bucket_name    = "${local.bucket_name}"
  bucket_key     = "${local.bucket_key}"
  basic_user     = "${local.basic_user}"
  basic_password = "${local.basic_password}"
}
