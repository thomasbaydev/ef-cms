provider "aws" {
  alias = "us-east-1"
}

provider "aws" {
  alias = "us-west-1"
}


module "ui-public-certificate" {
  source = "../../../iam/terraform/shared/certificates"

  domain_name               = var.dns_domain
  hosted_zone_name          = "${var.zone_name}."
  subject_alternative_names = ["*.${var.dns_domain}"]
  certificate_name          = var.dns_domain
  environment               = var.environment
  description               = "Certificate for public facing ${var.dns_domain}"
  product_domain            = "EFCMS"
}

module "ui-certificate" {
  source = "../../../iam/terraform/shared/certificates"

  domain_name               = "*.${var.dns_domain}"
  hosted_zone_name          = "${var.zone_name}."
  certificate_name          = "wildcard.${var.dns_domain}"
  environment               = var.environment
  description               = "Certificate for wildcard.${var.dns_domain}"
  product_domain            = "EFCMS"
}

module "ui-green" {
  source                 = "../ui"
  current_color          = "green"
  environment            = var.environment
  dns_domain             = var.dns_domain
  cloudfront_max_ttl     = var.cloudfront_max_ttl
  cloudfront_default_ttl = var.cloudfront_default_ttl
  zone_name              = var.zone_name
  header_security_arn    = aws_lambda_function.header_security_lambda.qualified_arn
  strip_basepath_arn     = aws_lambda_function.strip_basepath_lambda.qualified_arn
  public_certificate     = module.ui-public-certificate
  private_certificate    = module.ui-certificate
  providers = {
    aws.us-east-1 = aws.us-east-1
    aws.us-west-1 = aws.us-west-1
  }
}

module "ui-blue" {
  source                 = "../ui"
  current_color          = "blue"
  environment            = var.environment
  dns_domain             = var.dns_domain
  cloudfront_max_ttl     = var.cloudfront_max_ttl
  cloudfront_default_ttl = var.cloudfront_default_ttl
  zone_name              = var.zone_name
  header_security_arn    = aws_lambda_function.header_security_lambda.qualified_arn
  strip_basepath_arn     = aws_lambda_function.strip_basepath_lambda.qualified_arn
  public_certificate     = module.ui-public-certificate
  private_certificate    = module.ui-certificate
  providers = {
    aws.us-east-1 = aws.us-east-1
    aws.us-west-1 = aws.us-west-1
  }
}
