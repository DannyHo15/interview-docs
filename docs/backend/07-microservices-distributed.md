# 🏗️ 07 — Microservices & Distributed Systems (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. Monolith vs Microservices? Trade-off? 🔥

**Ngắn:**
- **Monolith:** toàn bộ app là **1 đơn vị deploy** (mọi module chung codebase, chung DB). Đơn giản lúc đầu.
- **Microservices:** chia app thành **nhiều service nhỏ độc lập**, mỗi service **deploy riêng**, thường **DB riêng**, giao tiếp qua network (HTTP/gRPC/messaging).

**Trade-off:**
| Tiêu chí | Monolith | Microservices |
|----------|----------|----------------|
| Phức tạp ban đầu | Thấp | **Cao** (network, deploy, observability) |
| Scale | Toàn app (scale nguyên khối) | **Per-service** (chỉ scale cái cần) |
| Deploy | Cả app | Độc lập per service |
| Tech stack | Đồng nhất | Đa dạng (polyglot) |
| Team | Nhỏ, cùng repo | **Nhiều team** song song |
| Failure | 1 bug có thể sập cả app | Cô lập per service |
| Data | Shared DB dễ query/transaction | **DB riêng → khó join/transaction** |
| Latency | In-process call (ns) | Network call (ms) |

**Đào sâu — khi nào chọn:**
- **Monolith** = start-up, team nhỏ (< 5 dev), domain chưa rõ → "monolith-first" khuyến nghị.
- **Microservices** = org lớn, nhiều team, scale các phần rất khác nhau, cần deploy độc lập.
- **Modular monolith** = trung gian: code module hóa rõ nhưng deploy 1 khối — đang được ưa chuộng lại.

**Gotcha:**
- **"Distributed monolith"** = bê nguyên nhược điểm cả hai: tách service nhưng **coupling chặt** (deploy phải đồng bộ, gọi chéo đồng bộ) → KHÔNG nhận được lợi ích. Đây là anti-pattern phổ biến.
- Follow-up: *"Tại sao không chia luôn từ đầu?"* → microservices có **overhead** khổng lồ (CI/CD, observability, network); nếu domain chưa rõ, chia sai = tech debt nặng hơn monolith.

---

## 2. API Gateway là gì? Tại sao cần?

**Ngắn:** **API Gateway** = điểm vào **duy nhất** (single entry point) cho client → điều hướng request tới các backend service. Như "tiền sảnh" của hệ thống.

**Trách nhiệm thường gặp:**
- **Routing** request → service.
- **Authentication / Authorization** (validate token 1 chỗ).
- **Rate limiting / throttling**.
- **Load balancing**.
- **Logging / metrics / tracing**.
- **Request/response transformation** (aggregation, version adapter).
- **TLS termination**.

**Đào sâu:**
- Đỡ cho client: 1 request gateway → **gộp** gọi nhiều service (API composition/BFF — Backend for Frontend).
- Phân biệt **API Gateway vs Load Balancer**: LB chỉ phân tải; Gateway thêm **logic app** (auth, rate limit, transform).
- Tools: Kong, AWS API Gateway, Nginx, Envoy, APISIX.

**Gotcha:**
- Gateway là **SPOF** → cần HA (multi-instance) + lại **không** được thành bottleneck (một số logic đẩy về service).
- **BFF (Backend for Frontend):** gateway riêng per-client (web BFF, mobile BFF) → mỗi client nhận đúng data shape.
- Follow-up: *"Auth ở gateway hay service?"* → validate token ở gateway (chặn sớm), **authorization chi tiết** vẫn ở service (service là nguồn sự thật về quyền của nó).

---

## 3. Service discovery / registry?

**Ngắn:** Trong microservices, instance sinh-diệt liên tục (autoscale, crash) → IP đổi. **Service discovery** = cơ chế để service **tìm nhau** mà không hardcode IP.

**2 mô hình:**
- **Client-side discovery:** client query **service registry** (Consul, Eureka) → lấy list instance → tự chọn (load balance).
- **Server-side discovery:** client gọi **load balancer** (vd AWS ALB, Envoy), balancer hỏi registry rồi forward.

**Đào sâu:**
- **Service registry** = DB động ghi `(service name → list instance + health)`.
- **Health check:** registry ping instance định kỳ → gỡ instance chết khỏi list ( Consul, Eureka heartbeat).
- **DNS-based** (Kubernetes Service) = đơn giản, client chỉ resolve DNS.
- Trong Kubernetes: **Service + kube-dns/CoreDNS** + **kube-proxy** (server-side).

**Gotcha:**
- **Stale entry**: instance đã chết nhưng registry chưa kịp gỡ → cần **retry** + **circuit breaker** ở client.
- Follow-up: *"Service mesh là gì?"* = sidecar proxy (Istio, Linkerd) lo **discovery + mTLS + tracing + retry** thay vì app tự code → tách concern ra khỏi code.

---

## 4. Distributed transactions: Saga vs 2PC? 🔥

**Vấn đề:** 1 nghiệp vụ chạm **nhiều service** (vd đặt hàng: payment + inventory + shipping), mỗi service DB riêng → **không có transaction chéo DB**. Cần đảm bảo **toàn vẹn** (hoặc tất cả thành, hoặc rollback).

### 2PC (Two-Phase Commit)
- **Phase 1 (Prepare):** coordinator hỏi tất cả participant *"sẵn sàng commit không?"*
- **Phase 2 (Commit/Rollback):** tất cả OK → commit; 1 cái No → rollback.
- ✅ **ACID** (strong consistency).
- ❌ **Block**: coordinator chết = toàn bộ kẹt; chậm; không scale → **ít dùng microservices**.

### Saga
- Chia nghiệp vụ thành **chuỗi local transaction** (mỗi service 1 tx nội bộ).
- Nếu 1 bước fail → chạy **compensating transaction** (undo) cho các bước đã thành.
- ✅ **Không block**, scale được, eventual consistency.
- ❌ Phức tạp (phải thiết kế undo); **không isolate** giữa saga (tx trung gian visible).

**2 kiểu Saga:**
- **Choreography:** service phát event (Kafka) → service khác nghe & tiếp → **decentralized**, dễ rối khi nhiều bước.
- **Orchestration:** 1 **orchestrator** điều phối → dễ nhìn flow, là **SPOF** (cần HA).

**Ví dụ (order saga):**
```
1. Payment: charge OK
2. Inventory: reserve OK
3. Shipping: FAIL ❌
→ Compensate ngược:
   - Inventory: release
   - Payment: refund
```

**Gotcha:**
- Saga **không rollback tự nhiên** = phải **code compensating action** cho mỗi bước (refund, release, cancel) → đây là phần khó.
- **Idempotency** bắt buộc (compensating có thể retry).
- Follow-up: *"Khi nào dùng 2PC?"* → gần như chỉ khi **strong consistency tuyệt đối** (financial ledger) và participant ít; ngược lại Saga + idempotency là default.

---

## 5. Circuit Breaker (và Bulkhead, Retry)?

**Vấn đề:** service phụ thuộc sập → caller **chờ timeout** → thread/connection cạn → **cascade failure** (sập lan).

**Circuit Breaker:** giống **cầu dao điện** — khi gọi service phụ thuộc **fail liên tục** → "ngắt mạch", **không gọi nữa** (return fallback ngay) → cho service nghỉ → thử lại sau.

**3 trạng thái:**
- **Closed:** gọi bình thường, đếm failure.
- **Open:** thất bại quá threshold → **ngắt ngay** (fail-fast), không gọi.
- **Half-open:** sau thời gian → cho **1 thử** → thành công → Closed, fail → Open lại.

**Patterns đi kèm:**
- **Bulkhead:** **cô lập** resource (pool riêng per service phụ thuộc) → 1 service sập không cạn kiệt pool chung.
- **Timeout:** mỗi call có deadline, không chờ vô hạn.
- **Retry + backoff:** thử lại lỗi tạm thời (xem [Reliability](./08-reliability-scalability.md)).

**Gotcha:**
- **Circuit breaker vs retry** trái ngược: retry = cố thêm, breaker = bỏ cuộc → kết hợp: retry ít lần + breaker khi fail nhiều.
- **Fallback** = trả giá trị mặc định / cached / degraded thay vì lỗi.
- Follow-up: tool? Resilience4j (Java), opossum (Node), Polly (.NET), Istio (service mesh level).

---

## 6. Eventual consistency & khi nào chấp nhận?

**Ngắn:** **Eventual consistency** = hệ thống không nhất quán **ngay**, nhưng **sẽ** nhất quán sau thời gian (khi các update lan truyền).

**Khi nào chấp nhận:**
- Khi business cho phép **trễ vài giây/phút** (feed, notification, search index).
- Khi cần **availability + scale** (CAP → chọn AP).

**Khi nào KHÔNG:**
- **Financial** (số dư tài khoản), **inventory critical**, **booking seat** → cần **strong consistency**.

**Đào sâu:**
- Mô hình đạt eventual: **async messaging** (saga), **replication**, **CQRS read model rebuild**.
- **Saga isolation** thiếu → tx trung gian visible → cần thiết kế cẩn (vd lock resource qua duration).

**Gotcha:**
- "Eventual" **không phải** "có thể sai mãi" — phải **hội tụ** (converge). Nếu không → bug.
- Follow-up: *"User đọc ngay sau khi ghi, thấy data cũ?"* → **read-after-write consistency**: routing read về primary trong cửa sổ ngắn, hoặc client đợi ack trước khi read.

---

## 7. Idempotency trong hệ phân tán? 🔥

**Ngắn:** Idempotent = xử lý **cùng message/request nhiều lần → kết quả như 1 lần**. **Bắt buộc** trong distributed vì: **at-least-once delivery** (message có thể gửi 2 lần), **retry** (mạng).

**Cách thực hiện:**
- **Idempotency key**: mỗi operation có ID unique → store `(key → result)`; nếu gặp lại key → trả kết quả cũ, **không xử lý lại**.
- **DB unique constraint** trên key → chặn duplicate ở tầng DB.
- **State machine**: entity có status (PENDING → PAID); xử lý lại khi đã PAID → no-op.

**Đào sâu — ở đâu cần idempotency:**
- **API POST** (Idempotency-Key header — Stripe).
- **Message consumer** (Kafka at-least-once → consumer idempotent).
- **Payment** (tránh double charge).
- **Saga compensating action** (retry-safe).

**Gotcha:**
- **Idempotency không miễn phí**: cần lưu key (Redis/DB) + xử lý race (lock).
- Phân biệt **idempotent vs exactly-once delivery**: Kafka **không** exactly-once mặc định → producer transaction + **idempotent consumer** mới đạt "exactly-once effect".
- Follow-up: *"DELETE idempotent?"* → đúng (xóa lần 2 vẫn "đã xóa"), nhưng **POST tạo** thì KHÔNG → cần key.

---

## 8. Message queue patterns (CQRS, event sourcing — khái niệm)?

- **CQRS (Command Query Responsibility Segregation):** tách **write model** (command: optimize write, normalized) vs **read model** (query: optimize read, denormalized). Đồng bộ qua **events**.
  - ✅ scale read/write độc lập, read model tối ưu per use-case.
  - ❌ phức tạp, eventual consistency giữa 2 model.
- **Event Sourcing:** lưu **toàn bộ sự kiện thay đổi** (không chỉ state cuối) → state hiện tại = replay events.
  - ✅ audit đầy đủ, rebuild any time, time-travel.
  - ❌ storage, replay cost, schema evolution khó.
- **Outbox pattern:** khi service commit DB → cũng ghi event vào **outbox table** (cùng tx) → separate process đọc outbox → publish Kafka → **giải quyết dual-write** (DB + Kafka không atomic).

**Gotcha:**
- **CQRS + Event Sourcing thường đi cùng** nhưng **không bắt buộc** — CQRS đơn giản hơn, dùng nhiều hơn.
- **Outbox** = pattern **must-know** khi publish event sau khi DB write (tránh mất event nếu Kafka down).
- Follow-up: *"Khi nào dùng Event Sourcing?"* → financial/audit-heavy domain; đa số app **không cần** — overhead lớn.

---
🔗 [Quay lại README backend](./index.md)
