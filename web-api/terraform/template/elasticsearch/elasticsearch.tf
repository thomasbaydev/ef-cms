resource "aws_cloudwatch_log_group" "elasticsearch_application_logs" {
  name = "/aws/aes/debug_${var.domain_name}"
}

resource "aws_cloudwatch_log_resource_policy" "allow_elasticsearch_to_write_logs" {
  policy_name = "allow_elasticsearch_to_write_logs"

  policy_document = <<CONFIG
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "es.amazonaws.com"
      },
      "Action": [
        "logs:PutLogEvents",
        "logs:PutLogEventsBatch",
        "logs:CreateLogStream"
      ],
      "Resource": "arn:aws:logs:*"
    }
  ]
}
CONFIG
}

resource "aws_elasticsearch_domain" "efcms-search" {
  domain_name           = var.domain_name
  elasticsearch_version = "7.4"

  cluster_config {
    instance_type  = var.es_instance_type
    instance_count = var.es_instance_count == "" ? "1" : var.es_instance_count
  }

  ebs_options {
    ebs_enabled = true
    volume_size = var.es_volume_size
  }

  snapshot_options {
    automated_snapshot_start_hour = 23
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.elasticsearch_application_logs.arn
    log_type                 = "ES_APPLICATION_LOGS"
  }
}

locals {
  instance_size_in_mb = aws_elasticsearch_domain.efcms-search.ebs_options[0].volume_size * 1000
}

module "logs_alarms" {
  # temporarily using this fork which removes a defaulted variable from the module due to a terraform import bug -
  # this can be set back to github.com/dubiety/terraform-aws-elasticsearch-cloudwatch-sns-alarms.git?ref=v1.0.4
  # after the terraform import has been run on all environments
  source                       = "github.com/rachaelparris/terraform-aws-elasticsearch-cloudwatch-sns-alarms.git?ref=dont-default-variables"
  domain_name                  = aws_elasticsearch_domain.efcms-search.domain_name
  alarm_name_prefix            = "${aws_elasticsearch_domain.efcms-search.domain_name}: "
  free_storage_space_threshold = local.instance_size_in_mb * 0.25
  create_sns_topic             = false
  sns_topic                    = var.alert_sns_topic_arn
}
