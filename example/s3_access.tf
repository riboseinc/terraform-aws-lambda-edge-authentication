resource "aws_s3_bucket_object" "object" {
  bucket = "${var.bucketName}"
  key    = "${var.bucketKey}"
  source = "${path.module}/config.json"
}
