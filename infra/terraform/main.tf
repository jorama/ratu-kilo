terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "ratu-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# =========================
# VPC & NETWORKING
# =========================

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "ratu-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "ratu-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "ratu-private-${count.index + 1}"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# =========================
# RDS POSTGRESQL
# =========================

resource "aws_db_instance" "postgres" {
  identifier        = "ratu-postgres"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = var.db_instance_class
  allocated_storage = 100
  storage_encrypted = true

  db_name  = "ratu"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  skip_final_snapshot = var.environment != "production"

  tags = {
    Name        = "ratu-postgres"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "ratu-db-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "ratu-db-subnet-group"
  }
}

# =========================
# ELASTICACHE REDIS
# =========================

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "ratu-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.main.name

  tags = {
    Name        = "ratu-redis"
    Environment = var.environment
  }
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "ratu-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

# =========================
# SECURITY GROUPS
# =========================

resource "aws_security_group" "db" {
  name        = "ratu-db-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ratu-db-sg"
  }
}

resource "aws_security_group" "redis" {
  name        = "ratu-redis-sg"
  description = "Security group for Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ratu-redis-sg"
  }
}

# =========================
# OUTPUTS
# =========================

output "vpc_id" {
  value = aws_vpc.main.id
}

output "db_endpoint" {
  value     = aws_db_instance.postgres.endpoint
  sensitive = true
}

output "redis_endpoint" {
  value     = aws_elasticache_cluster.redis.cache_nodes[0].address
  sensitive = true
}