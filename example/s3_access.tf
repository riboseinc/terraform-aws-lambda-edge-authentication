resource "aws_s3_bucket_object" "object" {
  bucket = "${var.s3_access_name}"
  key    = "${var.s3_access_key}"
  source = "${path.module}/htaccess.json"
  etag   = "${md5(file("path/to/file"))}"
}
