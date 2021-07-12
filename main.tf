resource "local_file" "params" {
  content = templatefile("${path.module}/src/params.json", {
        BUCKET_NAME   = var.bucketName
        BUCKET_KEY    = var.bucketKey
        COOKIE_DOMAIN = var.cookieDomain
  })

  filename = "${path.module}/src-lamda/params.json"
}

//data "local_file" "mainjs" {
//  filename = "${path.module}/src/main.js"
//}

//resource "local_file" "mainjs" {
//  content  = data.local_file.mainjs.content
//  filename = "${path.module}/src-lamda/main.js"
//}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/lambda/${var.name}"
  retention_in_days = 7
}

//data "archive_file" "this" {
//  depends_on = [
//    local_file.params,
//    local_file.mainjs,
//  ]
//
//  type        = "zip"
//  output_path = "${path.module}/src-lamda.zip"
//  source_dir  = "${path.module}/src-lamda"
//}

resource "null_resource" "zip" {
  depends_on = [
    local_file.params
  ]

  provisioner "local-exec" {
    command = <<EOT
      zip -r "${path.module}/src-lamda.zip" "${path.module}/src-lamda"
    EOT
  }

  triggers = {
    uuid = uuid()
  }
}

resource "aws_lambda_function" "this" {
  depends_on = [
    null_resource.zip
  ]

  description = "Basic HTTP authentication module/function"
  role        = aws_iam_role.this.arn
  runtime     = "nodejs10.x"

  filename         = "${path.module}/src-lamda.zip"
  source_code_hash = filebase64sha256("${path.module}/src-lamda/main.js")

  function_name = var.name
  handler       = "main.handler"

  timeout     = var.fn_timeout
  memory_size = var.fn_memory_size
  publish     = true

//  environment {
//    variables = {
//      BUCKET_NAME   = var.bucketName
//      BUCKET_KEY    = var.bucketKey
//      COOKIE_DOMAIN = var.cookieDomain
//    }
//  }
}

