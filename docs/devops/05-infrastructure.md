# 05 — Infrastructure as Code & Kubernetes Basics

> Phần bonus cho fullstack senior muốn hiểu sâu hơn về infrastructure.

---

## 1. Infrastructure as Code (IaC)

- Định nghĩa infrastructure bằng code thay vì click console.
- Lợi ích: version control, reproducible, reviewable, automation.

### Công cụ
| Tool | Mô tả |
|------|-------|
| **Terraform** | Cloud-agnostic, declarative |
| **AWS CloudFormation** | Native AWS |
| **Pulumi** | IaC bằng ngôn ngữ lập trình |

### Terraform example
```hcl
resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t3.micro"

  tags = {
    Name = "web-server"
  }
}
```

---

## 2. Kubernetes Basics

### Core concepts
| Concept | Giải thích |
|---------|------------|
| **Pod** | Nhóm container chạy cùng nhau |
| **Deployment** | Quản lý replicas, rollout, rollback |
| **Service** | Expose pods (ClusterIP, NodePort, LoadBalancer) |
| **Ingress** | HTTP/HTTPS routing vào cluster |
| **ConfigMap / Secret** | Cấu hình và secrets |
| **PersistentVolume** | Storage cho pod |

### K8s deployment example
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapp:latest
          ports:
            - containerPort: 3000
```

---

## 3. K8s Service types

| Type | Khi nào dùng |
|------|--------------|
| **ClusterIP** | Internal traffic trong cluster |
| **NodePort** | Expose qua port của node |
| **LoadBalancer** | Expose ra ngoài qua cloud LB |
| **Ingress** | Routing HTTP dựa trên host/path |

---

## Câu hỏi kinh điển

- **IaC là gì? Lợi ích?**
- **Pod khác container như thế nào?**
- **Deployment khác Service như thế nào?**
- **K8s service types: ClusterIP, NodePort, LoadBalancer, Ingress?**
- **ConfigMap khác Secret như thế nào?**
