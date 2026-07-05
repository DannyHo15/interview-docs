# 🛡️ 08 — Reliability & Scalability (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. Load balancing algorithms? 🔥

**Ngắn:** **Load balancer (LB)** phân phối traffic qua nhiều server để **không quá tải 1 máy** + **HA**.

| Algorithm | Cách | Khi nào |
|-----------|------|---------|
| **Round-robin** | Xoay vòng đều | Server đồng nhất |
| **Weighted round-robin** | Theo trọng số (máy mạnh nhận nhiều hơn) | Server khác sức mạnh |
| **Least connections** | Gửi tới server ít kết nối nhất | Request dài/khác nhau (chat, upload) |
| **IP hash** | Hash client IP → cùng server | Cần **sticky session** |
| **Least response time** | Máy phản hồi nhanh nhất | Khi đo được latency |
| **Consistent hashing** | Hash key vào vòng | **Sharding cache/data** (ít move khi add node) |
| **Random** | Ngẫu nhiên | Đơn giản, ít dùng |

**Đào sâu:**
- **L4 (transport)** vs **L7 (application)**: L4 (TCP/UDP, nhanh, NAT) vs L7 (HTTP, quyết theo header/URL, TLS terminate, chậm hơn).
- **Health check**: LB ping server định kỳ → gỡ server chết khỏi pool.
- **Session affinity (sticky)**: cùng user → cùng server (cho session in-memory), nhưng gây imbalance.

**Gotcha:**
- **Sticky session** = anti-pattern cho scale (khó rebalance, server chết mất session) → ưu tiên **stateless** + external session/token store.
- **Consistent hashing** khác round-robin: hash **theo key** (data) chứ không theo request → minimize move khi add/remove server (cho cache/shard).
- Follow-up: *"LB bản thân nó SPOF?"* → dùng **multi-LB + VIP/floating IP** (VRRP) hoặc DNS-based.

---

## 2. Retry với exponential backoff + jitter? 🔥

**Ngắn:** Khi gọi service thất bại **tạm thời** (timeout, 5xx, network blip) → **thử lại**, nhưng **không ngay lập tức** (gây thêm tải) → **backoff tăng dần** + **jitter** ngẫu nhiên.

**Exponential backoff:**
```
retry 1: chờ 1s
retry 2: chờ 2s
retry 3: chờ 4s
retry 4: chờ 8s   (cap tại max, vd 30s)
```

**Jitter (thêm ngẫu nhiên):**
```
retry 1: chờ 1s + random(0, 1s)
retry 2: chờ 2s + random(0, 2s)
```
→ Tránh **thundering herd**: nếu 100 client cùng retry cùng lúc (vd service vừa lên lại) → lại sập. Jitter dàn đều.

**Đào sâu:**
- **Retry budget / max attempts** (vd 3–5) → không retry vô hạn.
- **Retry chỉ cho lỗi tạm thời** (5xx, timeout, 429) — **không** retry 4xx (lỗi logic, retry cũng vậy).
- **429 Too Many Requests**: tôn trọng header **`Retry-After`** của server.
- **Circuit breaker** kết hợp: retry nhiều lần fail → mở circuit, ngừng gọi hẳn (xem [Microservices #5](./07-microservices-distributed.md)).

**Gotcha:**
- **Retry khuếch đại tải**: N client retry khi service overload → càng sập sâu hơn → **backoff + jitter + circuit breaker** bắt buộc.
- **Idempotent mới retry an toàn**: retry POST không idempotent = double effect → cần idempotency key (xem [Microservices #7](./07-microservices-distributed.md)).
- Follow-up: *"Timeout nên set bao lâu?"* → ngắn hơn deadline tổng của request; dùng **deadline propagation** (gRPC context).

---

## 3. Circuit breaker pattern?

(Chi tiết ở [Microservices #5](./07-microservices-distributed.md) — phần này góc nhìn reliability.)

**Ngắn:** Khi service phụ thuộc **fail liên tục** → **ngắt mạch**, không gọi nữa (fail-fast + fallback) → tránh **cascade failure**.

**3 trạng thái:** Closed → (fail nhiều) → Open → (sau cooldown) → Half-open → (test) → Closed/Open.

**Vai trò trong reliability:**
- Ngăn **sập lan** (1 service sập → cạn thread pool → sập cả caller).
- Cho service phụ thuộc **thời gian phục hồi** (thay vì bị đâm liên tục).
- **Fallback**: trả cached/default/degraded thay vì error.

**Gotcha:**
- Cấu hình threshold quan trọng: quá nhạy = ngắt sớm (giả báo); quá dung túng = không bảo vệ. Tune theo SLO.
- Ở **service mesh level** (Istio) → áp dụng cho mọi service không code.

---

## 4. Idempotency & retry-safe operations?

(Nền tảng ở [Microservices #7](./07-microservices-distributed.md).)

**Ngắn:** Operation **retry-safe** = có thể retry mà **không gây side-effect lặp**. Idempotency = cách đạt retry-safe.

**Rule of thumb:**
- **GET, PUT, DELETE** = idempotent → retry an toàn.
- **POST** = không → cần **idempotency key** trước khi retry.
- **Payment, create order, send email** = phải idempotent (double charge/đơn/email = tai họa).

**Cài đặt:**
```ts
POST /payments  Headers: Idempotency-Key: <uuid>
// Redis: SETNX key → lock; store (key → result) TTL 24h
// Request trùng key → trả result cũ, KHÔNG xử lý lại
```

**Gotcha:**
- **Idempotency key phải do CLIENT sinh** (server không biết đâu là "lần thử lại" của cùng intent).
- **Combine** với **DB unique constraint** để an toàn 2 lớp (race giữa 2 request gần như nhau).
- Follow-up: *"Idempotency + concurrency?"* → 2 request cùng key tới gần nhau → lock + chỉ 1 xử lý, request kia đợi kết quả.

---

## 5. Graceful degradation / fallback?

**Ngắn:** Khi 1 phần hệ thống sập → thay vì **crash toàn bộ**, **giảm chức năng** một cách **có chủ đích** → vẫn phục vụ phần còn lại.

**Ví dụ:**
- Recommendation service sập → hiển thị **sản phẩm phổ biến** (cached) thay vì lỗi.
- Search service sập → fallback **DB LIKE query** (chậm hơn nhưng vẫn chạy).
- Payment sập → cho phép "đặt hàng, thanh toán sau".

**Patterns:**
- **Fallback function** (circuit breaker): lỗi → trả default/cached.
- **Feature flag**: tắt tính năng phụ thuộc động, giữ phần chính chạy.
- **Cached response** cho read khi DB chậm.
- **Static fallback page** khi frontend sập.

**Gotcha:**
- **Graceful shutdown**: khi deploy/terminate → server **ngừng nhận request mới**, **hoàn thành request đang chạy**, rồi exit → không drop request (xem câu 7).
- Follow-up: *"Degraded mode vẫn phải an toàn"* → fallback không được **bypass security** (vd đừng skip auth khi auth service sập → fail secure).

---

## 6. Health check (liveness vs readiness)? 🔥

**Ngắn:** 2 loại probe (Kubernetes dùng nhiều):
- **Liveness probe:** *"process còn sống không?"* → nếu fail → **restart** container (kill & lại).
- **Readiness probe:** *"sẵn sàng nhận traffic không?"* → nếu fail → **LB gỡ ra** (không gửi request), nhưng **không restart**.

**Phân biệt (rất hay bị hỏi):**
| | Liveness | Readiness |
|---|----------|-----------|
| Hỏi | App sống? | App sẵn sàng serve? |
| Fail → | **Restart** | **Gỡ khỏi LB** (không traffic) |
| Khi dùng | Process deadlock, leak | Đang warm-up, DB/dep down |
| Sai lầm phổ biến | Restart liên tục (thrash) | Restart khi chỉ nên gỡ traffic |

**Ví dụ:**
- App khởi động cần load cache 30s → readiness fail trong 30s (chưa nhận traffic), liveness OK (process sống).
- App deadlock (event loop kẹt) → liveness fail → restart.

**Gotcha:**
- **Liveness không được phụ thuộc** service ngoài (DB down → liveness fail → restart vòng lặp, càng sập). Liveness = check **bản thân process**.
- **Startup probe** (K8s thứ 3): cho app khởi động chậm — OK mới bắt đầu check liveness/readiness.
- Follow-up: *"Health endpoint nên trả gì?"* → `200 OK` (sống) / `503` (không sẵn sàng); check dependency có **timeout ngắn** (đừng treo).

---

## 7. Backpressure?

**Ngắn:** Khi **producer** gửi nhanh hơn **consumer** xử lý được → **backpressure** = tín hiệu "chậm lại" từ consumer ngược về producer → tránh **overflow/OOM**.

**Cách xử lý:**
- **Reactive streams** (Node stream, RxJS, reactive spec): consumer báo capacity, producer chỉ gửi khi có demand.
- **Bounded queue**: khi queue đầy → **block** producer hoặc **drop/reject**.
- **Rate limit**: producer giảm tốc.
- **Load shedding**: bỏ bớt request thấp ưu tiên khi quá tải.

**Đào sâu:**
- **Lossless** (block producer) vs **lossy** (drop) — trade-off.
- **TCP flow control** = backpressure ở tầng transport (sliding window).
- Ở microservices: message queue (Kafka) **buffer** → tách producer/consumer; nhưng consumer chậm → lag → cần scale consumer hoặc drop.

**Gotcha:**
- **Unbounded queue = bom nổ chậm** → memory tăng → OOM → crash. **Luôn có bound + policy** (drop oldest, reject, block).
- Follow-up: *"Load shedding"* = chủ động **từ chối** request thấp ưu tiên khi quá tải → giữ phần quan trọng sống (ví dụ: e-commerce quá tải Black Friday → reject browse, giữ checkout).

---

## 8. SPOF & failover?

- **SPOF (Single Point of Failure):** 1 thành phần chết → **toàn hệ thống chết**. Mục tiêu: **loại bỏ SPOF**.
  - VD: 1 DB primary, 1 LB, 1 redis, 1 AZ.
- **Failover:** khi primary chết → **tự động chuyển** sang standby/replica.

**Chiến lược:**
| | Active-Passive | Active-Active |
|---|-----------------|---------------|
| Mô tả | 1 chạy, 1 standby chờ | Cả 2 cùng serve |
| Failover | Promote standby | Traffic dồn sang cái còn sống |
| Phức tạp | Vừa | Cao (sync 2 chiều, conflict) |
| Cost | Vừa | Cao |

- **Multi-AZ** (Availability Zone) → 1 AZ sập vẫn chạy.
- **Multi-region** → cả region sập (disaster recovery) vẫn serve; trade-off: replication latency, conflict resolution.
- **RPO / RTO**: RPO = dung lượng data mất tối đa (đo bằng thời gian); RTO = thời gian phục hồi tối đa.

**Đào sâu:**
- **DB failover**: primary chết → promote replica (async replication → có thể **mất vài giao dịch cuối** = RPO > 0).
- **Split-brain**: 2 node cùng tưởng mình primary → **data divergence** → cần **quorum/fencing** (Raft/Paxos).

**Gotcha:**
- **"HA = không SPOF"** nhưng **100% HA không tồn tại** → thiết kế **RTO/RPO** theo business (vd RTO 15 phút, RPO 1 phút cho critical).
- Failover phải **được test** (Chaos Engineering — Netflix Chaos Monkey) — failover chưa test = có thể không chạy lúc thật.
- Follow-up: *"DNS failover multi-region?"* → health-check + **route DNS** sang region còn sống (TTL ngắn để nhanh fail).

---
🔗 [Quay lại README backend](./index.md)
