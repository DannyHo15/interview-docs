# 🌐 03 — Networking & HTTP (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. TCP vs UDP? 3-way handshake? 🔥

**Ngắn:**
- **TCP:** **connection-oriented**, **đáng tin cậy** (reliable), có thứ tự, có kiểm soát tắc nghẽn. Dùng cho: HTTP, email, file transfer.
- **UDP:** **connectionless**, **không đảm bảo** (có thể mất/giao sai thứ tự), nhẹ, nhanh. Dùng cho: video call, DNS, gaming, QUIC.

**TCP 3-way handshake (thiết lập kết nối):**
```
Client → SYN         → Server
Client ← SYN-ACK     ← Server
Client → ACK         → Server     (kết nối established)
```
- Đóng kết nối: **4-way** (FIN/ACK) — có `TIME_WAIT` để đợi packet lề.

**Đào sâu:**
- TCP tin cậy nhờ: **sequence number**, **ACK**, **retransmit**, **sliding window** (flow control), **congestion control** (TCP Reno/Cubic).
- UDP không có gì trong số đó → overhead thấp → latency thấp (nhưng app phải tự xử lý loss nếu cần).

**Gotcha:**
- "TCP chậm vì handshake" → **QUIC (HTTP/3)** giải bằng UDP + 0-RTT, gộp transport + crypto handshake.
- Follow-up: *"Khi nào chọn UDP?"* → real-time (latency quan trọng hơn độ chính xác), broadcast/multicast.

---

## 2. HTTP/1.1 vs HTTP/2 vs HTTP/3? 🔥

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|----------|--------|--------|
| Transport | TCP | TCP | **QUIC (UDP)** |
| Multiplexing | ❌ (pipeline ít dùng) | ✅ nhiều stream 1 connection | ✅ |
| Head-of-line blocking | Ở **TCP** & app | Còn ở **TCP** | ❌ không có (UDP) |
| Header compression | ❌ text | ✅ HPACK | ✅ QPACK |
| Server push | ❌ | ✅ (ít dùng, đang bỏ) | ✅ (tùy chọn) |
| Kết nối mới | Mỗi request 1 conn (hoặc keep-alive) | 1 conn nhiều stream | 1 conn, 0-RTT resume |

**Đào sâu:**
- **HTTP/1.1:** mỗi request cần 1 TCP conn (hoặc keep-alive) → **head-of-line blocking** (request sau chờ request trước). Domain sharding + sprite để workaround.
- **HTTP/2:** binary framing + **multiplexing** (nhiều request song song trên 1 conn) + HPACK nén header. Nhưng **1 packet TCP mất = chặn hết stream** (TCP HoL blocking).
- **HTTP/3:** chạy **QUIC** trên UDP → mất packet chỉ ảnh hưởng 1 stream, không chặn cả connection. 0-RTT cho kết nối lại nhanh.

**Gotcha:**
- HTTP/2 cần **HTTPS (TLS)** trong thực tế (browser bắt buộc).
- Follow-up: *"Tại sao multiplexing vẫn HoL?"* → vì TCP không biết "stream", mất segment chặn toàn conn; QUIC fix bằng stream-level ACK.

---

## 3. HTTPS / TLS handshake diễn ra thế nào? 🔥

**Ngắn:** HTTPS = HTTP + **TLS** (Transport Layer Security, tiền身 SSL). TLS **mã hóa** giao tiếp + **xác thực** server (certificate) + **toàn vẹn** (MAC).

**TLS handshake (đơn giản hóa, TLS 1.2/1.3):**
1. **ClientHello:** client gửi supported cipher suites + random.
2. **ServerHello + Certificate:** server chọn cipher, gửi **certificate** (chứa public key) + random.
3. **Key exchange:** client tạo **pre-master secret**, mã hóa bằng public key của server gửi đi (RSA) — hoặc DHE/ECDHE (cả 2 bên tính chung secret).
4. Cả hai tính ra **session key** (symmetric).
5. Từ đây: **mã hóa symmetric** (AES) cho application data.

**Đào sâu:**
- Dùng **asymmetric** (RSA/ECDHE) chỉ cho handshake (đắt) → sau đó chuyển sang **symmetric** (nhanh) cho bulk.
- **TLS 1.3** rút gọn handshake (1-RTT, có 0-RTT) + bỏ thuật toán yếu + bắt buộc (EC)DHE → **forward secrecy** (không decrypt được sau này dù key bị lộ).
- **Certificate chain:** server cert → intermediate CA → root CA (trusted bởi browser).

**Gotcha:**
- **Forward secrecy** = quan trọng: nếu attacker ghi lại traffic hôm nay, ăn cắp private key năm sau **vẫn không decrypt được** (vì session key ephemeral).
- Follow-up: *"Symmetric vs Asymmetric khi nào?"* — asym cho trao đổi key/ảnh hiệu (ít, chậm), sym cho dữ liệu lớn (nhiều, nhanh).

---

## 4. HTTP status codes quan trọng? 🔥

**5 nhóm theo chữ số đầu:**
- **1xx Informational** — hiếm.
- **2xx Success:** **200 OK**, **201 Created**, **204 No Content**.
- **3xx Redirect:** **301 Moved Permanently** (browser cache), **302 Found** (temp, không cache), **304 Not Modified** (dùng cache).
- **4xx Client error:** **400 Bad Request**, **401 Unauthorized** (chưa login), **403 Forbidden** (login rồi nhưng không có quyền), **404 Not Found**, **409 Conflict**, **429 Too Many Requests** (rate limit).
- **5xx Server error:** **500 Internal Server Error**, **502 Bad Gateway**, **503 Service Unavailable**, **504 Gateway Timeout**.

**Phân biệt hay bị hỏi:**
- **401 vs 403:** 401 = *"bạn là ai?"* (chưa auth); 403 = *"tôi biết bạn, nhưng bạn không được phép"* (đã auth, thiếu quyền).
- **301 vs 302:** 301 = vĩnh viễn (cache, SEO chuyển domain); 302 = tạm (analytics như Bitly).
- **502 vs 503 vs 504:** 502 = proxy nhận response sai từ upstream; 503 = service overload/đang bảo trì; 504 = upstream quá thời gian trả lời.

**Gotcha:**
- **401** phải kèm header `WWW-Authenticate`; **429** nên kèm `Retry-After`.
- Follow-up: *"API tạo resource trả gì?"* → **201 Created** (có body) hoặc **202 Accepted** (xử lý async, chưa xong).

---

## 5. CORS là gì? Tại sao & cách xử lý? 🔥

**Ngắn:** **CORS (Cross-Origin Resource Sharing)** = cơ chế browser **chặn** request cross-origin (khác scheme/domain/port) để bảo vệ user. Server phải trả header `Access-Control-Allow-Origin` thì browser mới cho qua.

**Tại sao:** ngăn **malicious site** dùng session cookie của user để gọi API cross-site (giống CSRF nhưng ở cấp browser).

**Đào sâu:**
- Browser chia **simple request** (GET/POST form cơ bản) vs **preflight** (`OPTIONS` pre-check cho method/header nhạy cảm như `PUT`, custom header, `Authorization`).
- Server trả: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Credentials`.
- **`Allow-Origin: *` không dùng được khi có credentials** → phải chỉ rõ origin cụ thể.

**Gotcha:**
- CORS **chỉ ở browser**, không phải server; gọi bằng Postman/curl không bị CORS → đừng debug CORS bằng Postman.
- **Preflight `OPTIONS`** cache bằng `Access-Control-Max-Age` để giảm round-trip.
- Follow-up: *"Credentials + wildcard?"* → không kết hợp được; phải dùng origin cụ thể + `Allow-Credentials: true`.

---

## 6. WebSocket vs SSE vs Polling/Long-polling?

| | Polling | Long-polling | SSE | WebSocket |
|---|---------|--------------|-----|-----------|
| Direction | Client→Server | Client→Server (giả) | **Server→Client** | **2-way (full-duplex)** |
| Protocol | HTTP | HTTP | HTTP | WS (over TCP) |
| Overhead | Cao (request lặp) | Vừa | Thấp (1 conn) | Thấp nhất |
| Use case | Đơn giản, ít data | Chat cũ | Feed, noti server push | Chat, real-time game |

**Đào sâu:**
- **Polling:** client hỏi server mỗi N giây → đơn giản nhưng lãng phí + latency cao.
- **Long-polling:** server giữ request mở tới khi có data → giảm request, vẫn HTTP.
- **SSE (Server-Sent Events):** 1 HTTP connection, server push liên tục → **một chiều**, tốt cho noti/feed.
- **WebSocket:** kết nối **2 chiều** persistent, binary + text → chat, game.

**Gotcha:**
- **WebSocket** khó hơn qua load balancer/proxy (cần sticky session, upgrade header); SSE/HTTP đơn giản hơn.
- Follow-up: *"Chat dùng cái nào?"* → WebSocket (cần cả gửi lẫn nhận real-time).

---

## 7. Cookie / Session / Token khác nhau thế nào?

- **Cookie:** dữ liệu browser lưu, **tự động gửi** mỗi request tới domain. Dùng cho auth session, tracking. Có cờ `HttpOnly` (chặn JS truy cập, chống XSS), `Secure` (chỉ HTTPS), `SameSite` (chống CSRF).
- **Session (server-side):** server lưu state, gửi **session ID** qua cookie. → Có state ở server (memory/Redis).
- **Token (JWT):** **stateless** — server ký token, client lưu (localStorage/cookie) và gửi mỗi request. Server **không lưu** state, verify chữ ký.

**Đào sâu:**
- **Session** = dễ revoke (xóa ở server), nhưng scale khó (cần shared session store).
- **JWT** = stateless, scale dễ, nhưng **khó revoke** (token còn hạn thì dùng được) → cần refresh token + blacklist ngắn.
- Lưu JWT trong **localStorage** = dễ **XSS steal**; trong **HttpOnly cookie** = an toàn XSS hơn nhưng dễ **CSRF** (cần SameSite/CSRF token).

**Gotcha:** Đây là cầu nối tới câu [Security → JWT vs Session](./06-security.md). Chọn theo trade-off stateful vs stateless.

---

## 8. Idempotency trong HTTP? Phương thức nào idempotent?

**Định nghĩa:** Request **idempotent** = gọi 1 lần hay nhiều lần → **kết quả giống nhau** (không có side-effect lặp).

| Method | Idempotent? | Safe (không đổi state)? |
|--------|:-----------:|:-----------------------:|
| GET | ✅ | ✅ |
| PUT | ✅ | ❌ (overwrite) |
| DELETE | ✅ | ❌ (xóa lần 2 = vẫn đã xóa) |
| POST | ❌ | ❌ |
| PATCH | ❌ (thường) | ❌ |

**Đào sâu:**
- **PUT** = thay thế toàn bộ resource → idempotent (đặt `{a:1}` 10 lần vẫn `{a:1}`).
- **POST** = tạo mới → gọi 2 lần = 2 resource → **không idempotent** → cần **idempotency key** để chống duplicate khi retry.
- **DELETE** idempotent vì "đã xóa" = trạng thái ổn định.

**Gotcha:**
- Mạng unreliable → client retry → POST không idempotent = **double charge**. Giải: **Idempotency-Key header** (Stripe, GitHub) → server lưu key, trả kết quả cũ nếu trùng.
- Follow-up: xem [API Design → idempotent API](./04-api-design.md).

---
🔗 [Quay lại README backend](./index.md)
