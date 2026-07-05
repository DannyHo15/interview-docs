# 03 — Design a Rate Limiter 🔥 MẪU

> **Loại:** Easy–Medium · **Tần suất:** 🔥🔥🔥 (thường gặp dưới dạng *"thêm rate limit vào API"*).
> Áp dụng đúng [khung 6 bước](../00-solving-framework.md).

---

## Bước 1 — Clarify Requirements

### Functional
- Giới hạn số request mỗi user/IP được gửi trong khoảng thời gian (vd **100 req/phút**).
- Hỗ trợ nhiều loại limit: per-user, per-IP, global, per-API.
- Khi vượt → trả **HTTP 429 Too Many Requests** kèm `Retry-After`.

### Non-functional
- **Low latency** — kiểm tra rate limit phải < 1ms (nằm trên hot path mọi request).
- **High availability** — nếu rate limiter chết, toàn hệ thống chết → phải HA.
- **Tối thiểu memory** (đếm được nhiều key).
- Phân tán (distributed) — nhiều instance server chia sẻ state.

### Scope (chốt)
- Server-side rate limiter (không phải client).
- Distributed, dùng shared store (Redis).

---

## Bước 2 — Estimation

- Giả sử **1M QPS** tổng → rate limiter phải xử lý 1M check/giây.
- Latency thêm phải **< 1ms** (nếu chậm → ảnh hưởng mọi request).
- Memory: lưu counter cho ~10M active user/IP. Mỗi entry ~ vài chục byte → vài trăm MB → RAM Redis đủ.

> ✅ Kết luận: thiết kế **cực kỳ nhạy với latency**, phải **in-memory**, tránh disk round-trip trên hot path.

---

## Bước 3 — High-Level Design

```
[Client] → [API Gateway] ──> [Rate Limiter Middleware] ──allow──> [App Server]
                                  │  deny → 429
                                  ↓
                           [Redis (distributed counter store)]
```

Vị trí: thường đặt ở **API Gateway** hoặc **middleware** (trước khi tới app logic) — tiết kiệm tài nguyên app server.

### API / Interface
```
bool allowRequest(key)   // key = user_id | ip | api+user
→ true/false + remaining quota + reset_time
```

---

## Bước 4 — Deep Dive — TRỌNG TÂM: Thuật toán giới hạn tốc độ

### 4 thuật toán kinh điển (phải biết tất cả + trade-off):

| Thuật toán | Cách hoạt động | Ưu | Nhược |
|-----------|----------------|-----|--------|
| **1. Fixed Window Counter** | Đếm số req trong cửa sổ cố định (vd mỗi phút `00–59`) | Đơn giản, ít memory | **Burst ở biên cửa sổ**: 99 req ở giây 59 + 99 req ở giây 60 = ~200 req trong 2s (vượt 2x) |
| **2. Sliding Window Counter** | Fixed window + weight của cửa sổ trước | Mượt hơn, chính xác | Hơi phức tạp hơn 1 chút |
| **3. Token Bucket** 🔥 | Bucket chứa N token, refill R token/s. Mỗi request tốn 1 token. | **Cho phép burst** (đến N), linh hoạt, dùng nhiều nhất (AWS/GitHub) | Cần tune N & R |
| **4. Leaky Bucket** | Request vào queue, rò rỉ ra với tốc độ cố định | Output **mượt tuyệt đối** (smooth) | Burst bị queue đầy → drop; memory cho queue |

> 💡 **Token Bucket** là lựa chọn mặc định phổ biến nhất (Stripe, AWS, GitHub API). Cho phép burst ngắn mà vẫn giữ rate trung bình.

### Implement Token Bucket với Redis (atomic)

Vấn đề: check-then-decrement ở nhiều server phải **atomic**, nếu không sẽ race condition (đếm sai). Dùng **Redis Lua script** (atomic):

```lua
-- key = bucket, capacity, refill_rate, now, requested
local tokens = tonumber(redis.call("get", key)) or capacity
-- (tính refill theo thời gian trôi qua...)
if tokens >= requested then
  redis.call("set", key, tokens - requested, "px", ttl)
  return 1  -- allowed
else
  return 0  -- denied
end
```

→ Toàn bộ read-modify-write chạy **atomic** trong Redis → đúng trong môi trường phân tán.

### Distributed considerations
- **Shared Redis** = correctness (mọi instance thấy chung counter).
- **Trade-off**: nếu Redis chậm/down → fallback: local counter (chấp nhận không chính xác hoàn toàn) hoặc fail-open (cho qua, ưu tiên availability) vs fail-closed (chặn hết, ưu tiên bảo vệ backend). **Thường chọn fail-open** cho user-facing, fail-closed cho bảo vệ tài nguyên nội bộ.

### Headers chuẩn trả về (tốt cho interview nhắc tới)
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1620000000
Retry-After: 30            (khi 429)
```

---

## Bước 5 — Bottlenecks, Scaling & Trade-offs

### Bottlenecks
- **Redis là SPOF** → dùng Redis Cluster (sharded) + replica. Nếu Redis down → fallback local (xem trên).
- **Hot key** (1 user/IP quá hot) → Redis single shard chịu tải → xử lý bằng **local pre-fetch** (mỗi server lấy 1 quota batch rồi đếm local, định kỳ sync) — giảm load Redis.

### Trade-offs chính
- **Correctness vs availability** — Redis shared chính xác nhưng phụ thuộc Redis; local counter available hơn nhưng lỏng.
- **Memory vs precision** — Sliding window log (lưu mọi timestamp) chính xác nhất nhưng tốn RAM; counter compact hơn.
- **Burst-friendly (token bucket) vs smooth (leaky bucket)** — tuỳ nghiệp vụ.

---

## Bước 6 — Wrap-up

### Monitoring
- **Denial rate** (tỉ lệ 429) theo key/API → phát hiện滥用 hoặc rule quá khắt.
- Latency rate-limiter p99, Redis hit/errors.
- Alert khi Redis lag hoặc denial rate tăng đột biến (có thể bị DDoS).

### Follow-up
- **Throttling vs hard limit:** thay vì 429, có thể **degrade** (cho vào queue chậm) cho worker jobs.
- **Hierarchical limits:** 100/min AND 1000/hour AND 10000/day — đa tầng.
- **Per-tier (free/pro)**: limit khác nhau theo gói subscription.
- **Global rate limit** (DDoS shield) ở CDN/edge (Cloudflare) + per-user ở gateway.

---

## 📌 Takeaway gọn
> *"Tôi đặt rate limiter ở API gateway. Dùng **Token Bucket** cho phép burst linh hoạt, implement bằng **Redis Lua script** để atomic trong môi trường phân tán. Trả 429 + Retry-After khi vượt. Redis Cluster + replica cho HA, fallback local counter khi Redis down. Trade-off chính là correctness (shared) vs availability (local) và chọn thuật toán phù hợp nghiệp vụ."*

---
🔗 Quay lại [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
