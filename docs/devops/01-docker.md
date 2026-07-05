# 01 — Docker & Container Fundamentals

> Container là nền tảng của modern deployment. Cần hiểu image, layer, volume, network, và best practices.

---

## 1. Container vs VM

| | Container | VM |
|---|-----------|-----|
| OS | Share host kernel | Mỗi VM có OS riêng |
| Size | Nhẹ (MB) | Nặng (GB) |
| Startup | Giây | Phút |
| Isolation | Process-level | Hardware-level |

> Container nhẹ hơn VM vì nó dùng chung kernel với host, chỉ đóng gói app + dependencies.

---

## 2. Docker Image & Dockerfile

### Dockerfile best practices
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Tips
- Dùng **multi-stage build** để giảm image size.
- Dùng **specific tag** (`node:20-alpine`) thay vì `latest`.
- Đặt `NODE_ENV=production`.
- Chạy container dưới **non-root user**.

---

## 3. Docker Layer & Cache

- Mỗi instruction trong Dockerfile tạo 1 layer.
- Docker cache layer nếu instruction và context không đổi.
- Đặt instruction ít thay đổi lên trước (vd `COPY package.json` trước `COPY .`).

---

## 4. Volume & Network

- **Volume**: lưu data persistence ngoài container lifecycle.
- **Bind mount**: mount file/folder từ host vào container (dev mode).
- **Network**: container trong cùng network có thể gọi nhau bằng container name.

```bash
# Volume
 docker volume create pgdata
 docker run -v pgdata:/var/lib/postgresql/data postgres

# Network
 docker network create mynet
 docker run --network mynet --name api myapi
 docker run --network mynet --name db postgres
# từ api container: connect db:5432
```

---

## 5. Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://db:5432/mydb
    depends_on:
      - db
  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=mydb
volumes:
  pgdata:
```

---

## Câu hỏi kinh điển

- **Container khác VM như thế nào?**
- **Tại sao dùng multi-stage build?**
- **Làm sao giảm Docker image size?**
- **Volume khác bind mount như thế nào?**
- **Docker layer cache hoạt động thế nào?**
