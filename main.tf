resource "template_file" "this" {
  template = "${file("${path.module}/src/params.json")}"

  vars {
    BUCKET_NAME = "${var.bucket_name}"
    BUCKET_KEY  = "${var.bucket_key}"

//    BASIC_USER = "${var.basic_user}"
//    BASIC_PWD  = "${var.basic_password}"
  }
}

resource "local_file" "params" {
  content     = "${template_file.this.rendered}"
  filename = "${path.module}/.archive/params.json"
}

data "local_file" "mainjs" {
  filename = "${path.module}/src/main.js"
}

resource "local_file" "mainjs" {
  content     = "${data.local_file.mainjs.content}"
  filename = "${path.module}/.archive/main.js"
}

data "archive_file" "this" {
  depends_on = [
    "local_file.params", "local_file.mainjs"
  ]

  type        = "zip"
  output_path = "${path.module}/.archive.zip"
  source_dir  = "${path.module}/.archive"
}

resource "aws_lambda_function" "this" {
  description = "Basic HTTP authentication module/function"
  role        = "${aws_iam_role.this.arn}"
  runtime     = "nodejs8.10"

  filename         = "${data.archive_file.this.output_path}"
  source_code_hash = "${data.archive_file.this.output_base64sha256}"

  function_name = "${var.name}"
  handler       = "main.handler"

  timeout     = "${var.fn_timeout}"
  memory_size = "${var.fn_memory_size}"
  publish     = true
}
