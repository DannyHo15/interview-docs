# 🚀 DevOps & Cloud — Fullstack Essentials

> Phần này tập trung những kiến thức **DevOps/Cloud cần biết** cho vị trí fullstack senior: Docker, CI/CD, monitoring, logging, và các dịch vụ cloud phổ biến.

---

## 📂 Cấu trúc thư mục

```
devops/
├── index.md              ← bạn đang ở đây
├── 01-docker.md          ← Container fundamentals
├── 02-cicd.md            ← CI/CD pipelines
├── 03-monitoring.md      ← Observability: metrics, logs, traces
├── 04-cloud-services.md  ← AWS/GCP/Azure essentials
└── 05-infrastructure.md  ← IaC, K8s basics
```

---

## 📋 Catalog câu hỏi

| Chủ đề | Mức độ | File | Mấu chốt |
|--------|--------|------|----------|
| Docker / Container | 🔥🔥🔥 | `01` | Image, layer, volume, network |
| CI/CD | 🔥🔥🔥 | `02` | Build, test, deploy, rollback |
| Monitoring & Logging | 🔥🔥 | `03` | Metrics, logs, traces, alerting |
| Cloud Services | 🔥🔥 | `04` | EC2, S3, RDS, Lambda, CDN |
| Infrastructure / K8s | 🔥 | `05` | IaC, pods, deployments, services |

---

## 🗺️ Lộ trình ôn

### Level 1 — Must-know
`Docker` → `CI/CD`
> Mọi fullstack senior cần biết container hoá và tự động hoá deploy.

### Level 2 — Senior
`Monitoring` → `Cloud Services`
> Thiết kế hệ thống production-ready cần observability và chọn đúng cloud service.

### Level 3 — Bonus
`Infrastructure` / `K8s`
> Nếu công ty dùng K8s hoặc bạn muốn deepen thêm.

---

## ✍️ Mẹo trả lờí

- Kết nối với kinh nghiệm thực tế: "Ở dự án X tôi dùng GitHub Actions build Docker image và deploy lên ECS."
- Nêu trade-off: managed service tiện nhưng đắt; self-hosted rẻ nhưng tốn công maintain.
- Đừng học thuộc lòng tất cả dịch vụ; tập trung vào các dịch vụ phổ biến và use case.
