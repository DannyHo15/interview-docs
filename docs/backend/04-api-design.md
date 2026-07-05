# 🧩 04 — API Design (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. REST principles? RESTful là gì? 🔥

**Ngắn:** **REST (Representational State Transfer)** = kiến trúc API dùng **HTTP verbs** thao tác trên **resource (noun)**, mỗi resource có **URL**, **stateless**.

**6 ràng buộc REST** (phải thoả mãn mới "RESTful"):
1. **Client–Server** — tách UI và data storage.
2. **Stateless** — mỗi request **tự chứa**, server không lưu session giữa các request.
3. **Cacheable** — response khai báo được có cache được không.
4. **Uniform interface** — resource định danh bằng URL, manip qua representation.
5. **Layered system** — client không biết có qua proxy/LB hay không.
6. *(Code-on-demand — tùy chọn)*

**HTTP verb → action:**
| Verb | Mục đích | Idempotent |
|------|----------|:---:|
| GET | Đọc | ✅ |
| POST | Tạo mới | ❌ |
| PUT | Thay thế toàn resource | ✅ |
| PATCH | Sửa 1 phần | ❌ |
| DELETE | Xóa | ✅ |

**Ví dụ RESTful:**
```
GET    /users          → list
POST   /users          → create
GET    /users/123      → detail
PATCH  /users/123      → update
DELETE /users/123      → delete
GET    /users/123/orders → nested resource
```

**Gotcha:**
- **URL là danh từ, không phải động từ.** ❌ `/getUser` · ✅ `GET /users`.
- **Stateless** → không lưu session ở server (mở đường cho scale ngang).
- REST **không có** spec chính thức — nhiều người hiểu "REST" khác nhau (đó là lý do xuất hiện GraphQL/gRPC).

---

## 2. REST vs GraphQL vs gRPC? Khi nào dùng cái nào? 🔥

| | REST | GraphQL | gRPC |
|---|------|---------|------|
| Protocol | HTTP/JSON | HTTP/JSON | **HTTP/2 + Protobuf** |
| Format | JSON (text) | JSON (text) | **Binary (compact)** |
| Style | Resource + verb | **Query** lấy đúng field | **RPC** (gọi hàm) |
| Over-fetch/Under-fetch | ❌ có | ✅ client chọn field | ❌ |
| Contract | (lỏng, OpenAPI) | Schema (type system) | **.proto** (strict) |
| Streaming | ❌ | ⚠️ (subscriptions) | ✅ bi-directional |
| Tốt cho | Public API, web, đơn giản | App mobile/SPA cần data linh hoạt | **Internal service-to-service** (hiệu năng cao) |

**Đào sâu — khi nào dùng:**
- **REST:** default cho **public API**, browser-friendly, dễ debug (curl), cache HTTP tự nhiên.
- **GraphQL:** khi client cần **linh hoạt data shape** (mobile app gọn), tránh nhiều round-trip (gộp nhiều query 1 request). Nhược: 1 endpoint khó cache, N+1 ở server.
- **gRPC:** **internal microservices** cần **hiệu năng + contract chặt**; binary nhỏ, streaming, codegen đa ngôn ngữ. Nhược: browser không gọi trực tiếp dễ (cần grpc-web).

**Gotcha:**
- **gRPC không thay REST** — gRPC mạnh cho backend↔backend; REST vẫn tốt cho public/client-facing.
- GraphQL **không phải luôn tốt**: schema phức tạp, **vấn đề N+1** (DataLoader giải), query sâu có thể DoS.
- Follow-up: *"Hệ thống microservices dùng gì giao tiếp nội bộ?"* → gRPC (nhanh, typed) hoặc Kafka (async).

---

## 3. Cách versioning API? 🔥

**Ngắn:** Khi breaking change (đổi field, xóa endpoint), giữ backward compat bằng cách **đánh version** để client cũ không vỡ.

**4 cách phổ biến:**
| Cách | Ví dụ | Ưu | Nhược |
|------|-------|-----|--------|
| **URI path** | `/v1/users`, `/v2/users` | Rõ ràng, dễ route, cache tốt | URL đổi |
| **Header** | `Accept: application/vnd.api.v2+json` | URL sạch | Khó debug, khó cache |
| **Query param** | `/?version=2` | Đơn giản | Dễ quên, lẫn lộn |
| **Hostname** | `api2.example.com` | Tách hạ tầng | Rườm rà DNS |

**Đào sâu:**
- **Path versioning `/v1`** = phổ biến nhất (GitHub, Twitter), dễ cache + route ở gateway.
- **Semantic versioning** cho contract: `MAJOR.MINOR.PATCH` — breaking = bump MAJOR.
- **Deprecation policy:** giữ version cũ + header `Sunset`/`Deprecation`, thông báo, rồi remove sau N tháng.

**Gotcha:**
- **Đừng version mỗi thay đổi nhỏ** — thêm field optional = backward compat, không cần v2.
- Follow-up: *"Làm sao migrate client từ v1→v2?"* — gateway **adapter** map response, hoặc song song chạy 2 version, sun-set dần.

---

## 4. Pagination — offset vs cursor? Khi nào dùng cái nào? 🔥

**Ngắn:** Khi list lớn, không trả hết → chia trang.

| | **Offset pagination** | **Cursor pagination** |
|---|----------------------|----------------------|
| Cú pháp | `?page=3&size=20` (SKIP 40, LIMIT 20) | `?cursor=eyJpZCI6MTIzfQ&size=20` |
| Cài đặt | Đơn giản (`OFFSET/LIMIT`) | Phức hơn (cần sort key ổn định) |
| Hiệu năng | ❌ `OFFSET 1M000` = **vẫn scan 1M dòng** | ✅ `WHERE id > cursor` dùng index |
| Dữ liệu đổi giữa trang | ❌ **lệch/trùng** (item mới chèn vào đầu) | ✅ ổn định |
| Nhảy trang tuỳ ý | ✅ có thể | ❌ chỉ next/prev |

**Đào sâu:**
- **Offset** = tốt cho data tĩnh, ít dòng, cần "đi tới trang 5".
- **Cursor** = tốt cho **infinite scroll / feed** (Twitter, Facebook) — dùng `id` hoặc `(created_at, id)` làm cursor.
- **Keyset pagination** (`WHERE (created_at, id) < (?, ?) ORDER BY ...`) = dạng cursor hiệu năng cao nhất.
- **Deep pagination problem:** `LIMIT 1000000, 20` = DB scan 1M rồi bỏ → chậm → bắt buộc cursor.

**Gotcha:**
- Trả về **cursor tiếp theo** (encoded base64) thay vì số trang.
- Follow-up: *"Total count có cần không?"* — tốn query `COUNT(*)` đắt; thường **ước lượng** hoặc bỏ, trả `has_more`.

---

## 5. Thiết kế Idempotent API? 🔥

**Ngắn:** Idempotent = gọi nhiều lần → **kết quả như 1 lần**. Cần cho POST (không idempotent mặc định) để chống **duplicate** khi retry (mạng).

**Cách làm — Idempotency Key:**
```
POST /payments
Headers: Idempotency-Key: <uuid>
Body: { order_id, amount }

Server:
  - Lưu (key → response) trong TTL store (Redis)
  - Nếu key đã tồn tại → trả lại response cũ (không tạo payment mới)
  - Nếu mới → xử lý + lưu response
```

**Đào sâu:**
- Key phải **unique per client intent** — client sinh UUID cho mỗi "lần user bấm thanh toán".
- Lưu trong **Redis với TTL** (vd 24h) + value = response (status, body).
- **Race condition:** 2 request cùng key tới gần như nhau → dùng **lock** (Redis SETNX) để chỉ 1 xử lý, request kia chờ.
- Kết hợp với **DB unique constraint** trên `(idempotency_key)` để bảo vệ tầng dưới.

**Gotcha:**
- Idempotency **không chỉ cho POST** — cũng dùng cho webhook retry, event processing.
- Follow-up: *"Stripe làm sao?"* → đúng pattern Idempotency-Key header — tham khảo chuẩn.

---

## 6. Rate limiting ở API layer?

**Ngắn:** Giới hạn số request mỗi client/IP trong khoảng thời gian để **bảo vệ backend** và **fairness**. Vượt → **429 + Retry-After**. (Chi tiết thuật toán: [system_design/03-rate-limiter](../system-design/questions/03-rate-limiter.md).)

**Vị trí:** thường ở **API Gateway / middleware** (trước app logic).

**Headers chuẩn:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1620000000
Retry-After: 30        (khi 429)
```

**Gotcha:**
- **Distributed** rate limit cần shared store (Redis) — nhiều instance phải thấy chung counter.
- Follow-up: *"Fail-open hay fail-closed khi Redis down?"* — user-facing thường **fail-open** (cho qua, ưu tiên availability); bảo vệ resource nội bộ **fail-closed**.

---

## 7. REST error handling & status code chuẩn?

**Ngắn:** Dùng đúng **HTTP status code** + **body có cấu trúc** để client xử lý được.

**Body chuẩn (như project này):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email is required",
    "details": [{ "field": "email", "issue": "missing" }]
  },
  "timestamp": "2026-06-29T09:00:00Z"
}
```

**Quy ước:**
- Lỗi client (4xx): validation → 400; auth thiếu → 401; không đủ quyền → 403; không tìm thấy → 404; conflict → 409; rate → 429.
- Lỗi server (5xx): bug → 500; upstream sai → 502; overload → 503; timeout → 504.
- **Không lộ chi tiết kỹ thuật** (stack trace) cho client → leak info bảo mật.

**Gotcha:**
- **Dùng error code** chuẩn hoá (`USER_NOT_FOUND`) thay vì chỉ message → client switch dễ, hỗ trợ i18n.
- Follow-up: *"Validation lỗi trả 400 hay 422?"* — 400 (Bad Request) phổ biến; 422 (Unprocessable Entity) khi format đúng nhưng semantic sai — tuỳ convention.

---
🔗 [Quay lại README backend](./index.md)
