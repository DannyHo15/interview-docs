# 02 — CI/CD Pipelines

> CI/CD giúp đội ngũ release nhanh, an toàn, và có thể rollback khi cần.

---

## 1. CI vs CD

| | CI (Continuous Integration) | CD (Continuous Delivery/Deployment) |
|---|------------------------------|-------------------------------------|
| Mục tiêu | Merge code thường xuyên, tự động test | Tự động deploy lên staging/production |
| Hoạt động | Build, lint, unit test, integration test | Deploy, smoke test, rollback |
| Công cụ | GitHub Actions, GitLab CI, CircleCI, Jenkins | ArgoCD, Spinnaker, GitHub Actions |

---

## 2. Pipeline stages chuẩn

```
[Code Push]
    ↓
[Lint + Format]
    ↓
[Unit Tests]
    ↓
[Build Docker Image]
    ↓
[Integration/E2E Tests]
    ↓
[Push Image to Registry]
    ↓
[Deploy to Staging]
    ↓
[Manual Approval]
    ↓
[Deploy to Production]
```

---

## 3. GitHub Actions example

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run test:ci
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker push myapp:${{ github.sha }}
      - name: Deploy to production
        run: ./scripts/deploy.sh ${{ github.sha }}
```

---

## 4. Deployment strategies

| Strategy | Mô tả | Khi nào dùng |
|----------|-------|--------------|
| **Rolling** | Thay thế instance dần dần | Đơn giản, zero-downtime |
| **Blue-Green** | 2 môi trường giống hệt, switch traffic | Cần instant rollback |
| **Canary** | Release cho 1% user, tăng dần | Giảm risk |
| **Feature Flag** | Bật/tắt feature mà không deploy | A/B test, kill switch |

---

## 5. Rollback

- **Image-based rollback**: deploy lại version cũ từ container registry.
- **Database rollback**: migration phải reversible; luôn có backup.
- **Feature flag rollback**: tắt feature ngay lập tức.

---

## Câu hỏi kinh điển

- **CI khác CD như thế nào?**
- **Pipeline của bạn gồm những bước nào?**
- **Rolling deployment khác blue-green như thế nào?**
- **Làm sao rollback khi deploy lỗi?**
- **Feature flag có lợi gì?**
