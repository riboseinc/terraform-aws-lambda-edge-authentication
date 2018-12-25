resource "aws_s3_bucket_object" "object" {
  bucket = "${var.config_bucket_name}"
  key    = "${var.config_bucket_key}"
  source = "${path.module}/config.json"
}
