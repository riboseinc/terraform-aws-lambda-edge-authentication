//resource "template_file" "this" {
//  template = file("${path.module}/src/params.json")
//
//  vars = {
//    BUCKET_NAME   = var.bucketName
//    BUCKET_KEY    = var.bucketKey
//    COOKIE_DOMAIN = var.cookieDomain
//  }
//}

resource "local_file" "params" {
//  content  = template_file.this.rendered
  content = templatefile("${path.module}/src/params.json", {
        BUCKET_NAME   = var.bucketName
        BUCKET_KEY    = var.bucketKey
        COOKIE_DOMAIN = var.cookieDomain
  })

  filename = "${path.module}/.archive/params.json"
}

data "local_file" "mainjs" {
  filename = "${path.module}/src/main.js"
}

resource "local_file" "mainjs" {
  content  = data.local_file.mainjs.content
  filename = "${path.module}/.archive/main.js"
}

data "archive_file" "this" {
  depends_on = [
    local_file.params,
    local_file.mainjs,
  ]

  type        = "zip"
  output_path = "${path.module}/.archive.zip"
  source_dir  = "${path.module}/.archive"
}

resource "aws_lambda_function" "this" {
  description = "Basic HTTP authentication module/function"
  role        = aws_iam_role.this.arn
  runtime     = "nodejs8.10"

  filename         = data.archive_file.this.output_path
  source_code_hash = data.archive_file.this.output_base64sha256

  function_name = var.name
  handler       = "main.handler"

  timeout     = var.fn_timeout
  memory_size = var.fn_memory_size
  publish     = true
}

