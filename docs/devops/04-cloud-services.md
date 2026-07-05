# 04 — Cloud Services (AWS-focused)

> Bạn không cần biết tất cả dịch vụ cloud, nhưng cần hiểu các dịch vụ phổ biến và khi nào dùng.

---

## 1. Compute

| Service | Use case |
|---------|----------|
| **EC2** | Virtual server, full control |
| **Lambda** | Serverless functions, event-driven |
| **ECS / EKS** | Container orchestration |
| **Elastic Beanstalk** | PaaS đơn giản, ít control |

### Khi nào dùng Lambda?
- Tác vụ ngắn (< 15 phút), ít chạy liên tục.
- Webhook handler, image resize, scheduled jobs.
- Không phù hợp: long-running process, yêu cầu low latency consistent.

---

## 2. Storage

| Service | Use case |
|---------|----------|
| **S3** | Object storage: images, videos, backups |
| **EBS** | Block storage gắn vào EC2 |
| **EFS** | Shared file system |
| **Glacier** | Cold archive |

### S3 classes
- **Standard**: frequently accessed.
- **Intelligent-Tiering**: tự động chuyển tier.
- **Glacier**: archive, rẻ nhưng retrieval chậm.

---

## 3. Database

| Service | Use case |
|---------|----------|
| **RDS** | Managed PostgreSQL/MySQL/MariaDB/SQL Server/Oracle |
| **DynamoDB** | NoSQL key-value/document, low latency |
| **ElastiCache** | Managed Redis/Memcached |
| **DocumentDB** | MongoDB-compatible |

### RDS vs DynamoDB
| | RDS | DynamoDB |
|---|-----|----------|
| Model | Relational | Key-value / document |
| Query | SQL linh hoạt | Key-based, cần thiết kế access pattern trước |
| Scale | Vertical + read replicas | Horizontal tự động |
| Use case | Complex queries, transactions | High throughput, simple lookups |

---

## 4. Networking & CDN

| Service | Use case |
|---------|----------|
| **VPC** | Private network isolation |
| **ALB / NLB** | Application/Network load balancer |
| **CloudFront** | CDN |
| **Route 53** | DNS |
| **API Gateway** | Managed API endpoint, rate limiting |

---

## 5. Messaging & Queue

| Service | Use case |
|---------|----------|
| **SQS** | Managed message queue |
| **SNS** | Pub/sub notifications |
| **EventBridge** | Serverless event bus |
| **Kinesis** | Real-time data streaming |

---

## 6. Security

| Service | Use case |
|---------|----------|
| **IAM** | Quản lý user/role/permissions |
| **KMS** | Key management, encryption |
| **Secrets Manager** | Lưu secrets (DB password, API keys) |
| **WAF** | Web application firewall |

---

## Câu hỏi kinh điển

- **EC2 khác Lambda như thế nào?**
- **Khi nào dùng RDS, khi nào dùng DynamoDB?**
- **S3 là gì? Các storage class?**
- **SQS khác SNS như thế nào?**
- **IAM là gì? Principle of least privilege?**
