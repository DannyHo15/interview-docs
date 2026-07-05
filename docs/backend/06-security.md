# 🔐 06 — Security (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. Authentication vs Authorization? 🔥

**Ngắn:**
- **Authentication (AuthN)** = *"bạn là ai?"* — xác minh **danh tính** (login, mật khẩu, OTP).
- **Authorization (AuthZ)** = *"bạn được làm gì?"* — kiểm tra **quyền** truy cập resource (role, permission).

**Đào sâu:**
- AuthN xảy ra **trước**, AuthZ **sau** (phải biết bạn là ai mới biết bạn được gì).
- **Models AuthZ:**
  - **RBAC (Role-Based):** gán role (admin, user) → quyền theo role.
  - **ABAC (Attribute-Based):** quyền dựa trên attribute (user + resource + env) — linh hoạt hơn.
  - **ACL:** danh sách quyền per-resource.

**Gotcha:**
- Nhiều hệ thống **401 (Unauthorized)** cho cả 2 trường hợp → **sai chuẩn**: 401 = AuthN fail, **403 (Forbidden)** = AuthZ fail.
- Follow-up: *"Phân quyền resource của chính mình vs người khác?"* → AuthZ phải check **ownership** (`resource.owner_id == user.id`), không chỉ role.

---

## 2. JWT vs Session cookie vs OAuth2? 🔥

| | Session (cookie) | JWT (token) | OAuth2 |
|---|------------------|-------------|--------|
| State | **Stateful** (server lưu session) | **Stateless** (server verify chữ ký) | Framework ủy quyền |
| Lưu ở đâu | Cookie (session ID) | localStorage / cookie / header | Token do IdP cấp |
| Scale | Khó (cần shared session store) | Dễ (stateless) | Phụ thuộc triển khai |
| Revoke | Dễ (xóa server-side) | **Khó** (phải blacklist) | Refresh token + revoke |
| Use case | Web truyền thống | API, SPA, microservices | **Login với Google/Facebook** (3rd-party) |

**Đào sâu:**
- **JWT cấu trúc:** `header.payload.signature` (base64) — `payload` chứa claims (sub, exp, role), `signature` = HMAC/RSA ký `header+payload` bằng secret. → **Không mã hóa**, chỉ ký → **đừng bỏ secret trong payload!**
- **OAuth2** = **authorization framework** ("để app X truy cập data của tôi trên service Y mà không đưa password"); **OIDC** = lớp authn trên OAuth2.
- **Refresh token + access token:** access (ngắn hạn, vd 15') + refresh (dài hạn, dùng lấy access mới) → giảm rủi ro nếu access bị lộ.

**Gotcha:**
- **JWT khó revoke** → workaround: **short-lived access token** + refresh + **blacklist** (vô hiệu stateless 🙁).
- **Lưu JWT ở đâu:** `localStorage` = dễ **XSS steal**; **HttpOnly cookie** = an toàn XSS nhưng cần chống **CSRF** (SameSite/CSRF token). Trade-off.
- Follow-up: *"Tại sao không mã hóa JWT?"* → JWT = integrity (chống sửa), không confidentiality; nếu cần ẩn payload, dùng **JWE** (encrypted).

---

## 3. Hash password đúng cách? Tại sao không MD5/SHA? 🔥

**Ngắn:** Password **không bao giờ lưu plaintext** và **không hash bằng hash thường** (MD5/SHA). Dùng **password hashing function chuyên dụng**: **bcrypt / argon2 / scrypt** + **salt**.

**Tại sao không MD5/SHA256:**
- **Nhanh quá** → attacker brute-force hàng tỷ/giây bằng GPU.
- **Không salt** → cùng password hash giống nhau → **rainbow table** crack hàng loạt.
- bcrypt/argon2 **cố ý chậm** (cost factor) + dùng memory → đắt cho attacker, vừa đủ cho login.

**Đào sâu:**
- **Salt:** random per-user thêm vào password trước khi hash → cùng password → hash khác nhau → vô hiệu rainbow table. Salt **không bí mật** (lưu cùng hash).
- **Pepper:** secret chung của server thêm vào (lưu ở env, tách DB) → dù DB bị lộ mà không có pepper vẫn không crack.
- **bcrypt cost** tăng theo phần cứng (Moore's law) — bump định kỳ.

```ts
// bcrypt (verifying)
hash = bcrypt.hash(password, saltRounds=12)   // lưu hash (đã chứa salt)
bcrypt.compare(inputPassword, storedHash)      // verify
```

**Gotcha:**
- **argon2id** = khuyến nghị hiện đại (2015 Password Hashing Competition winner) — chống GPU + memory-hard.
- **Rate limit + lockout** ở login → chống brute-force online.
- Follow-up: *"User quên password?"* → **không giải mã được** → đặt password mới (reset flow), không "gửi lại password cũ".

---

## 4. OWASP Top 10: SQL Injection, XSS, CSRF — giải thích & phòng tránh? 🔥

### a) SQL Injection (SQLi)
**Ngắn:** Attacker chèn SQL qua input → thay đổi query. VD `' OR 1=1 --` → login không cần password.

**Phòng tránh:**
- **Prepared statements / parameterized query** (luôn, không ngoại lệ):
  ```ts
  // ❌ Đừng bao giờ
  db.query(`SELECT * FROM users WHERE name = '${input}'`);
  // ✅ Parameterized
  db.query(`SELECT * FROM users WHERE name = $1`, [input]);
  ```
- **ORM** (Prisma, TypeORM) mặc định escape.
- **Least privilege** cho DB user; whitelist input.

### b) XSS (Cross-Site Scripting)
**Ngắn:** Attacker chèn **JavaScript** vào page → chạy trong browser của nạn nhân → **steal cookie/token**, redirect.

**Phòng tránh:**
- **Escape/encode output** theo context (HTML, JS, URL).
- **CSP (Content-Security-Policy)** — giới hạn script source.
- Cookie cờ **`HttpOnly`** → JS không đọc được.
- Dùng framework tự escape (React mặc định escape JSX).

### c) CSRF (Cross-Site Request Forgery)
**Ngắn:** Lừa user đã login thực hiện request tới site mình **từ site độc hại** (browser tự gửi cookie). VD form độc hại POST chuyển tiền.

**Phòng tránh:**
- **CSRF token** (synchronizer / double-submit).
- Cookie **`SameSite=Lax/Strict`** → browser không gửi cookie cross-site (hiện đại, hiệu quả).
- `Origin`/`Referer` check.

**Gotcha:**
- **XSS mạnh hơn CSRF**: XSS **bypass hết** CSRF token (JS đọc được token). Phòng XSS là nền tảng.
- Follow-up: *"SameSite đã đủ chống CSRF?"* — gần đủ cho cookie-based; **JWT trong header** tự nhiên miễn CSRF (vì không tự gửi cross-site) nhưng dễ XSS.

---

## 5. SQL Injection phòng tránh — chi tiết?

(Đã tóm tắt ở câu 4a — phần này đào sâu thêm.)

**Các dạng SQLi:**
- **In-band (classic):** kết quả trả về trực tiếp.
- **Blind (boolean/time-based):** không thấy kết quả → hỏi yes/no qua logic hoặc `SLEEP()` → chậm hơn nhưng vẫn khai thác được.
- **Union-based:** dùng `UNION SELECT` để lấy data khác table.

**Defense in depth:**
1. **Parameterized query** (primary).
2. **Input validation/whitelist** (secondary — đừng blacklist).
3. **ORM** tự escape.
4. **WAF** (Web Application Firewall) — lớp ngoài, không thay thế code an toàn.
5. **Least privilege DB user** — app không cần `DROP TABLE` quyền.

**Gotcha:**
- **DYNAMIC SQL với string concat** là nguồn SQLi #1 — tránh; nếu bắt buộc, dùng `quote_identifier`/whitelist.
- Follow-up: *"NoSQL có injection không?"* — có! MongoDB: `{ "$where": "..." }` cho chạy JS → cũng phải escape/validate.

---

## 6. HTTPS/encryption — at rest vs in transit?

- **In transit (đường truyền):** mã hóa dữ liệu khi **di chuyển** (TLS/HTTPS). → Chống **sniffing/MITM**. Bắt buộc cho mọi traffic.
- **At rest (lưu trữ):** mã hóa dữ liệu khi **lưu** (disk, DB, S3). → Chống lộ khi **disk/backup bị ăn cắp**. Thường DB/S3 hỗ trợ transparent encryption.

**Đào sâu:**
- **At rest** không thay thế **in transit** và ngược lại — cần **cả hai** (defense in depth).
- **Key management** (KMS): key mã hóa không nằm cùng data; rotate key định kỳ.
- **Field-level encryption**: mã hóa riêng field nhạy cảm (credit card) → ngay cả DBA cũng không thấy.

**Gotcha:**
- Mã hóa at rest **không chống** attacker đã có **app-level access** (app tự decrypt) → cần **RBAC** + audit.
- Follow-up: *"TLS đủ chưa?"* — TLS chống sniffing, nhưng nếu **cert bị fake** (CA xấu) hoặc client không verify → vẫn MITM. **Pin cert** cho app mobile để chắc hơn.

---

## 7. Rate limiting & DDoS mitigation?

**Ngắn:**
- **Rate limiting** (câu [API design #6](./04-api-design.md)): giới hạn **per-client** bình thường → bảo vệ backend, fairness.
- **DDoS mitigation:** chống tấn công **phân tán** (nhiều IP/botnet) **làm sập** hệ thống bằng volume.

**Đào sâu — lớp phòng thủ:**
1. **Edge/CDN** (Cloudflare, AWS Shield) — **absorb volumetric** (L3/L4) gần attacker, trước khi tới origin.
2. **Rate limit + WAF** ở gateway — L7 application attack.
3. **Autoscaling + redundancy** — chịu được spike.
4. **CAPTCHA / bot detection** cho suspected traffic.
5. **Anycast** — phân tán traffic.

**Gotcha:**
- **Rate limit per-IP** vô dụng với botnet (nhiều IP) → cần **behavioral/global** detection.
- **DDoS volumetric** (L3/L4 SYN flood, amplification) cần **ISP/edge** xử lý, app không chống được.
- Follow-up: *"Server overload dù không bị tấn công?"* → **backpressure** + **circuit breaker** + **graceful degradation** (xem [Reliability](./08-reliability-scalability.md)).

---
🔗 [Quay lại README backend](./index.md)
