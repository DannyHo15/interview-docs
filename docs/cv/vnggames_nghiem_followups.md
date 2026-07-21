# VNGGames AIT — 3 câu anh Nhuận đào lại (technical follow-ups)

> 3 câu technical anh Nhuận hỏi ở vòng trước mà mình trả lời chưa rõ. Mỗi câu: **ngắn gọn → đào sâu từng layer → code/pattern → câu nói trong phỏng vấn → follow-up có thể bị hỏi lại**.
> Nguyên tắc: neo về **project thật** (Avatar48 = Privy + NestJS + Solana; AI Communication/InspectAI = LLM product), không trả lời lý thuyết suông.

---

## Câu 1 — Chatbot: user nhập input quá dài thì handle thế nào? 🔥

**Ngắn:** Đây là bài toán **chống input quá giới hạn ở nhiều layer** — không phải chỉ giới hạn ô input. Mình xử lý ở **4 tầng**: FE (UX + hard cap) → transport → backend (validate + tính tiền) → LLM (context window + cost). Lõi: **input của user là KHÔNG tin cậy**, phải validate như trust boundary.

### Tại sao phải để ý (impact nếu bỏ qua)

- **Context window tràn** → LLM báo lỗi `context_length_exceeded` hoặc tự **truncate mất đầu/đuôi** → trả lời bậy.
- **Cost spike**: input dài = input token đắt, user dán 1MB text → mỗi request tốn $.
- **DoS nhẹ**: attacker (hoặc user vô tình) spam text khổng lồ → queue/backend nghẽn.
- **Latency**: prompt dài → time-to-first-token chậm, UX streaming xấu.

### 4 tầng xử lý (neo Avatar48 / AI Communication)

| Tầng | Làm gì | Lý do |
|---|---|---|
| **1. FE (UX)** | `maxLength` trên input/textarea; **đếm ký tự + ước lượng token** (≈ chars/4 cho English, chars/2 tiếng Việt); disable nút Send khi vượt; **cảnh báo mềm** trước limit ("còn ~X ký tự") | Chặn sớm, đỡ request vô nghĩa, UX minh bạch |
| **2. Transport** | Limit body size ở gateway/proxy (NestJS `app.use(json({ limit: '1mb' }))`, nginx `client_max_body_size`) | Chặn payload khổng lồ trước khi vào app logic |
| **3. Backend** | **Validate hard cap** (`class-validator` `@MaxLength`/Zod); **đếm token thật** bằng `tiktoken` (OpenAI) trước khi gọi LLM; nếu vượt → trả `413`/`400` thay vì forward | Trust boundary — FE có thể bị bypass, backend là checkpoint cuối |
| **4. LLM layer** | Vượt limit hợp lệ → **chunk + summarize** (map-reduce) hoặc **RAG** (chỉ lấy top-k đoạn liên quan) thay vì nhồi hết vào prompt; set `max_tokens` output | Đưa text dài vào RAG là pattern đúng, không nhồi context |

### Pattern "đếm token đúng" (đừng dùng `text.length`)

```ts
import { encoding_for_model } from "tiktoken";
const enc = encoding_for_model("gpt-4o");
const tokenCount = enc.encode(userInput).length;   // số token THẬT
if (tokenCount > MAX_INPUT_TOKENS) return badRequest("input too long");
```

> **Gotcha:** ký tự ≠ token. Tiếng Việt/emoji tốn nhiều token hơn English. Đếm theo `text.length` sẽ **sai lệch** → validate hỏng. Phải đếm token bằng tokenizer của provider.

### Khi input dài là HỢP LỆ (ví dụ dán cả email dài để AI tóm tắt)

Đừng reject — **chia để trị**:
- **Chunking**: chia theo boundary (paragraph/heading) + overlap; **map-reduce summarize** (summarize từng chunk → gộp).
- **RAG**: embed các đoạn → query lấy top-k liên quan → chỉ đưa top-k vào prompt. Đây là cách GenCodify/Avatar48 xử lý "knowledge base dài".
- Streaming kết hợp: với output dài, dùng `streamText` + `AbortController` để FE không block.

**Câu mẫu:**
> "Em không chỉ giới hạn ô input. Em validate ở 4 tầng: FE đếm token + hard cap cho UX, backend đếm token thật bằng `tiktoken` rồi chặn trước khi gọi LLM — vì FE bypass được. Nếu input dài mà hợp lệ, em không reject mà cho vào RAG/chunk-summarize thay vì nhồi vào context — nhồi vào sẽ tràn window + đắt + chậm."

**Follow-up anticipate:**
- *"Đếm token mỗi request có tốn CPU không?"* → tokenizer nhanh (µs–ms); cache nếu cùng input. Trade-off rẻ hơn nhiều so với gọi LLM rồi mới lỗi.
- *"User upload file thay vì paste text?"* → parse file backend, **extract text + validate kích thước + scan malware**, rồi mới vào cùng pipeline chunk/RAG. File = trust boundary nặng hơn.
- *"Limit bao nhiêu là hợp lý?"* → phụ thuộc model context window (để buffer cho system prompt + output): ví dụ GPT-4o 128k → em set input cap ~80k token, giữ buffer.

---

## Câu 2 — Luồng authen của Avatar48 hoạt động như thế nào? 🔥

**Ngắn:** Avatar48 là **DApp trên Solana** nên auth **không phải user/password truyền thống** — mình dùng **Privy** (Web3 auth provider) ở FE, rồi **bridge sang JWT của NestJS** ở backend. 2 giai đoạn: (1) **Privy xác thực + cấp identity token**, (2) **NestJS verify token Privy rồi cấp JWT app** (access + refresh).

### Vì sao dùng Privy (không tự build wallet auth)

- **Onboard user non-crypto**: Privy cho login bằng **email/social/embedded wallet** → user không cần cài Phantom hay giữ seed phrase. Đúng tinh thần "AI agent launchpad cho user phổ thông".
- **Privy lo phần khó**: quản lý wallet (MPC/embedded), session, signature → mình **consume** chứ không reinvent (đúng mindset JD "consume service, focus product").
- **Bridge sang session app**: NestJS cần biết "ai đang gọi API" để authorize (rate limit, ownership token) → không thể để Privy token làm mọi thứ, cần JWT app ngắn hạn.

### Flow chi tiết

```
┌────────┐  1. login (email/social/wallet)   ┌───────┐
│  User  │ ─────────────────────────────────► │ Privy │
└────────┘                                    └───┬───┘
    ▲                                             │ 2. identityToken (JWT ký bởi Privy)
    │   6. app JWT (access short + refresh)       │    + Privy access token
    │                                             ▼
┌────────┼───────────────────────────┐    ┌──────────────┐
│   FE (Next.js)                      │    │   Privy SDK  │
│  - lưu token (Zustand + cookie)     │    └──────────────┘
│  - axios gắn Bearer                 │
└──────────┬──────────────────────────┘
           │ 3. POST /auth/privy  { identityToken }
           ▼
┌──────────────────────────────────┐
│  NestJS backend                  │
│  4. verify identityToken:        │
│     - fetch Privy JWKS (public key)
│     - verify signature + exp + aud
│     - lấy did (Privy user id)     │
│  5. mint JWT app:                │
│     - access (15') + refresh (7d)│
│     - bind did → user record     │
│     - link wallet address        │
└──────────────────────────────────┘
           │ 7. request API mang access JWT
           ▼  → NestJS guard verify JWT app (không gọi Privy nữa)
```

### 2 bước khóa

**Bước verify Privy token ở NestJS** (đây là trust boundary — không tin FE):
```ts
// Privy ký identityToken bằng RSA, public key lấy từ Privy JWKS endpoint
const claims = await privyClient.verifyIdentityToken(identityToken);
// claims.userId (did) = định danh ổn định của user trên Privy
const user = await users.upsert({ privyDid: claims.userId, wallet });
const { access, refresh } = mintAppJwt(user);   // access ngắn, refresh dài
```

**Bước authorize request thường** (sau login, NestJS chỉ verify JWT app, không depend Privy):
```ts
// JWT guard: verify chữ ký app secret, check exp → gắn req.user
@UseGuards(JwtAuthGuard)
@Get('agents/:id')
getAgent(@Req() req, @Param('id') id: string) {
  return this.query.execute({ id, ownerId: req.user.id }); // CQRS query
}
```

> **Lưu ý ownership:** AI agent / token thuộc về 1 user (Privy did). Mọi query/mutation (CQRS) đều **filter theo `ownerId: req.user.id`** → user A không xem/sửa agent của user B. Đây là authorization thật sự, không chỉ authentication.

**Câu mẫu:**
> "Avatar48 là DApp nên em dùng Privy để onboard — user login bằng email/wallet, Privy cấp identity token. FE forward token đó sang NestJS, backend verify chữ ký Privy bằng JWKS rồi mới mint JWT app riêng (access 15 phút + refresh 7 ngày). Sau đó mọi API request chỉ verify JWT app, không phụ thuộc Privy nữa — vì Privy chỉ là IdP, session app do mình nắm. Authorization thì bind agent/token theo `ownerId` từ JWT, user A không đụng được resource của user B."

**Follow-up anticipate:**
- *"Tại sao không dùng thẳng Privy token cho mọi API?"* → Privy token phục vụ identity, không có claims app (role, ownership, rate limit bucket). JWT app mình kiểm soát được revoke + claims → linh hoạt cho CQRS authorization.
- *"Refresh flow thế nào?"* → access hết hạn → axios interceptor bắt 401 → gọi `/auth/refresh` với refresh token → nhận access mới → retry request gốc (xem Câu 3).
- *"Wallet address liên kết user thế nào?"* → khi user connect/sign, lấy address từ Privy, lưu vào user record; on-chain action (swap/create token) **ký bằng wallet qua Privy**, NestJS chỉ verify action hợp lệ + authorize session — đúng tinh thần "on-chain chỉ là transport".
- *"Token lưu đâu?"* → access trong memory/Zustand (không localStorage nếu sợ XSS), refresh trong **HttpOnly cookie** (chống XSS) — trade-off CSRF thì dùng `SameSite`. ([backend/06-security.md](../backend/06-security.md) §2)

---

## Câu 3 — Axios interceptor: user spam refresh token / spam API thì sao? 🔥🔥

**Ngắn:** Đây là **2 lỗ hổng thật** của interceptor refresh: (a) **thundering herd** — N request gặp 401 cùng lúc → trigger N lần call refresh → race + waste; (b) **attacker spam** endpoint refresh hoặc API → brute-force/DoS. Fix phải **cả FE lẫn backend** — interceptor chỉ là nửa câu trả lời.

### Lỗ hổng A — Thundering herd khi refresh (FE)

**Triệu chứng:** access token hết hạn đúng lúc user mở page load 10 API song song → 10 request đều 401 → interceptor gọi `/auth/refresh` **10 lần** → refresh token bị **rotate 10 lần**, có khi invalid nhau → user bị logout bất ngờ. Hoặc thừa request.

**Fix: singleton refresh promise (dedupe).** Lưu **1 promise đang chạy**, mọi request 401 cùng lúc `await` chung promise đó:
```ts
let refreshing: Promise<string> | null = null;

async function refreshOnce(): Promise<string> {
  // ponytail: dùng 1 promise chung để dedupe — mọi caller chia sẻ kết quả
  if (refreshing) return refreshing;
  refreshing = doRefresh()                       // gọi /auth/refresh 1 LẦN
    .finally(() => { refreshing = null; });
  return refreshing;
}

instance.interceptors.response.use(undefined, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && !original._retried && !original.skipAuth) {
    original._retried = true;                     // chống loop vô hạn
    try {
      const token = await refreshOnce();          // dedupe N request → 1 call
      original.headers.Authorization = `Bearer ${token}`;
      return instance(original);                  // retry request gốc
    } catch {
      useAuthStore.getState().logout();           // refresh fail → logout sạch
      return Promise.reject(error);
    }
  }
  return Promise.reject(error);
});
```
3 mấu chốt: **(1)** dedupe qua shared promise, **(2)** cờ `_retried` chống **infinite loop** (refresh cũng 401 → đệ quy), **(3)** refresh fail phải **logout + clear store** (đừng retry mù).

### Lỗ hổng B — Spam refresh / spam API (backend, quan trọng hơn)

FE dedupe chỉ chống waste **trong 1 tab hợp lệ**. Attacker **bypass FE, gọi thẳng `/auth/refresh`** hoặc API hàng nghìn lần/giây. Đây là lúc **backend phải bảo**:

| Phòng tuyến | Làm gì | Lý do |
|---|---|---|
| **Rate limit /auth/refresh** | Giới hạn **per-user** (theo did/userId) + **per-IP** (vd 10 refresh/phút/user, 30/phút/IP); quá → `429` | Refresh là endpoint nhạy cảm, không cần tần cao |
| **Refresh token rotation + reuse detection** | Mỗi refresh → phát token **mới**, token cũ **hết sức**; nếu token cũ bị dùng lại → **revoke toàn family** (báo hiệu bị đánh cắp) | Spam bằng token cũ → tự động khóa, phát hiện theft |
| **Short-lived access** | Access 15' → dù lộ cũng tự chết nhanh; giảm phụ thuộc refresh | Giảm blast radius |
| **Global rate limit API** | per-user token bucket/leaky bucket ở gateway (NestJS `@nestjs/throttler`, Redis) | Chống spam API thường, fairness |
| **Anomaly detection** | N request 401 đột biến / refresh từ nhiều IP / user → flag + revoke | Bot pattern |
| **WAF + bot mitigation** (Cloudflare) | L7 layer, challenge traffic bất thường | Chống botnet nhiều IP (rate per-IP vô dụng với botnet) |

> **Reuse detection là vũ khí chính chống spam refresh:** attacker cướp refresh token, dùng nó → server thấy **token đã rotate** bị dùng lần 2 → **revoke cả chain** → attacker mất quyền, user được bảo. ([OWASP OAuth2 best practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics))

**Tại sao phải cả 2 đầu:**
- Chỉ FE dedupe → attacker bypass FE, vẫn spam backend.
- Chỉ backend rate-limit → trong app thật vẫn waste request + UX race (thundering herd).
- **Cả hai** → FE sạch UX, backend cứng bảo vệ. Đây là câu trả lời "senior": hiểu interceptor **không đủ**, trust boundary nằm ở backend.

**Câu mẫu:**
> "Em chia làm 2 lỗ hổng. Trong app: N request 401 cùng lúc gọi refresh N lần → em dedupe bằng 1 shared promise, mọi caller `await` chung, thêm cờ `_retried` chống loop. Nhưng FE bypass được nên backend mới là trust boundary: em **rate limit `/auth/refresh` per-user + per-IP**, kết hợp **refresh token rotation + reuse detection** — ai dùng token đã rotate sẽ revoke cả chain, đó là cách phát hiện token bị đánh cắp. Access token em để ngắn 15 phút giảm blast radius. Tóm lại: interceptor lo UX, backend lo security, thiếu 1 trong 2 là hở."

**Follow-up anticipate:**
- *"Rate limit per-IP vô dụng với botnet thì sao?"* → đúng, nên có **behavioral/global detection** + WAF challenge, không chỉ per-IP. ([backend/06-security.md](../backend/06-security.md) §7)
- *"Rotation + reuse detection có khó không?"* → cần lưu token family (current + revoked set) ở Redis/DB; phức tạp hơn nhưng là best practice. Nếu chưa làm, nói thẳng "em biết pattern, chưa apply ở project cũ — đây là thứ em sẽ thêm".
- *"Refresh token lưu đâu để chống XSS?"* → **HttpOnly + SameSite cookie**, KHÔNG localStorage (XSS steal được). Access có thể in-memory.
- *"Nếu 2 tab cùng refresh?"* → shared promise chỉ trong 1 tab; cross-tab dùng **BroadcastChannel/storage event** để 1 tab refresh, tab kia nhận token mới — hoặc đơn giản nhất: refresh token rotation + cả 2 tab retry, backend reuse-detection sẽ tự xử lý.

---

## Chốt chung cho 3 câu

Cả 3 câu cùng 1 triết lý: **input/identity đến từ client đều KHÔNG tin cậy** → validate/authorize ở backend (trust boundary), FE chỉ lo UX + giảm waste. Đây đúng mindset "secure by default" + "consume service, focus product" mà AIT tìm. Khi trả lời: **luôn tách "phần em đã làm" vs "pattern em biết sẽ apply"** — thành thật về scope ăn điểm culture fit với anh Nhuận.