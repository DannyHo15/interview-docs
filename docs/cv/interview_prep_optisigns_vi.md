# Chuẩn bị phỏng vấn — OptiSigns (Full-Stack Developer, Mid/Senior)
## HCMC · bảo vệ bài take-home (megatronbot) + full-stack + behavioral

> **Ghi chú entity:** AlphaSphere là công ty con của OptiSigns — JD nộp dưới entity AlphaSphere nhưng công việc là sản phẩm OptiSigns (vì vậy take-home mang tên "OptiSigns – OptiBot"). Pitch thẳng **OptiSigns** (digital-signage SaaS; Houston + HCMC + Munich; 30.500 khách hàng, 121 quốc gia). Cùng một hệ công ty.

---

## 0. Hình thức phỏng vấn — đọc trước

Đây KHÔNG phải cuộc chat CV thông thường. Bạn đã nộp bài take-home (`megatronbot`). Dự kiến **~70% thời gian phỏng vấn là bảo vệ đoạn code đó** — từng quyết định kiến trúc, từng trade-off, các câu hỏi mở rộng quy mô (scaling), và vài câu "em sẽ làm khác thế nào". Phần còn lại là câu hỏi full-stack theo JD + behavioral.

**Fact mạnh nhất của bạn:** spec yêu cầu scrape ≥30 bài trong ~10 tiếng. Bạn đã ship **401 bài**, delta sync, upload song song, retry, 18 test, deploy trên DigitalOcean kèm observability công khai. Bạn deliver vượt mà không over-engineer. Hãy giữ năng lượng đó — bình tĩnh, tự tin: "đây là em đã build, và đây là lý do mỗi phần như vậy."

---

## 1. megatronbot — bảo vệ từng quyết định

Cho mỗi quyết định dưới đây: **làm gì → tại sao → trade-off thật thà.** Đừng bao giờ bảo vệ một lựa chọn là hoàn hảo; senior engineer luôn nói rõ cái giá của nó.

### 1.1 State store = attributes file của OpenAI Vector Store (không dùng DB)
- **Làm gì:** mỗi file upload mang `attributes = {article_id, hash, url}`. `load_remote_state()` list các file đó lúc đầu run để build lại delta map.
- **Tại sao:** container **stateless**, chạy trên ephemeral worker của DigitalOcean. Vector store vốn *đã là* source of truth — một DB riêng chỉ là bản sao thứ hai có thể lệch (drift).
- **Trade-off (phải nói):** list toàn bộ file mỗi run là O(n) API call. Ok ở 401 bài; tới ~10k+ thì em sẽ thêm local index/cache để khỏi list lại toàn bộ mỗi run.

### 1.2 Delta key = SHA-256 của markdown đã clean (KHÔNG dùng `edited_at`)
- **Làm gì:** key ra quyết định là hash của phần markdown đã clean.
- **Tại sao:** em quan sát thấy `edited_at = 2021` trên những bài có `updated_at = 2026`. Timestamp Zendesk không đáng tin làm tín hiệu skip. Hash thì chính xác theo content — byte đổi thì sync, không đổi thì skip.
- **Trade-off:** không skip được ở lúc *fetch* — vẫn phải download + clean mọi bài để hash. Nhưng clean rẻ; embedding mới là phần đắt, và đó là chỗ delta phát huy tác dụng (quan sát `{skipped: 401}` trong ~12s).

### 1.3 Một lời gọi Zendesk list trả sẵn toàn bộ HTML body
- **Làm gì:** một call tới `/api/v2/help_center/<locale>/articles.json`; response đã chứa sẵn body bài viết. Không có loop fetch từng bài.
- **Tại sao:** tránh N round-trip và rủi ro rate-limit đi kèm. Cho thấy em đọc API thật, không crawl HTML mù.

### 1.4 Cleaning: BeautifulSoup `decompose()` + markdownify
- **Làm gì:** strip `script, style, nav, header, footer, aside` bằng `decompose()`, rồi `markdownify`. Giữ heading, code block, relative link.
- **Tại sao:** `decompose()` gỡ node khỏi parse tree hẳn (thay vì hide), nên không rỉ vào markdown. Output là doc sạch để embedding hiểu được.

### 1.5 Thiết kế citation: YAML front-matter + dòng `Article URL:` hiển thị
- **Làm gì:** mỗi `.md` có front-matter VÀ một dòng `Article URL:` nhìn thấy được (cho người và LLM).
- **Tại sao:** system prompt dặn bot cite tối đa 3 dòng `Article URL:`. Đặt trong body file (không chỉ metadata) giúp model lấy dễ dàng lúc trả lời.

### 1.6 Upload song song: `ThreadPoolExecutor` (8 worker), KHÔNG dùng asyncio
- **Làm gì:** upload chạy trong thread pool; 80 phút → ~10 phút cho fresh load. Tune được bằng `MAX_UPLOAD_WORKERS`.
- **Tại sao:** OpenAI client dùng httpx và **thread-safe**; mỗi upload là I/O-bound, chờ embedding. Thread overlap thời gian chờ với độ phức tạp code thấp hơn nhiều so với viết lại async. 8 là điểm tối ưu trước khi rủi ro rate-limit.
- **Trade-off (phải nói):** ở quy mô lớn hơn nhiều, async sẽ hiệu quả hơn trên mỗi connection. Em chọn thread vì phần thắng là overlap embedding wait, và 8 worker nằm dưới mọi rate limit. `MAX_UPLOAD_WORKERS` tune bằng env để ops có thể throttle nếu tier đổi.

### 1.7 Hai pass: classify-rồi-upload
- **Làm gì:** Pass 1 sequential (hash, classify, write markdown — rẻ; các bài skip finalize ở đây). Pass 2 song song (chỉ phần upload đắt). Pass 3 song song xóa orphan.
- **Tại sao:** finalize skip rẻ sớm và giữ `counts` không race; chỉ song song hóa phần thực sự đắt. Lỗi đầu tiên cancel future đang chờ (`cancel_futures=True`) để thoát nhanh thay vì để nửa upload.

### 1.8 OpenAI 404 race (câu chuyện "edge case sâu" hay nhất của bạn)
- **Làm gì:** dưới tải song song, poll post-attach thỉnh thoảng đua với eventual consistency của OpenAI và **trả 404 cho một file vừa tạo**. `vector_store.upload()` retry tối đa 3× với backoff và **xóa object orphan trên Files-API trước mỗi retry** để tránh leak.
- **Vì sao quan trọng:** cho thấy em thực sự chạy thứ này ở concurrency, dính bug distributed-systems thật, và fix tận gốc (orphan leak) thay vì retry mù. **Dẫn câu này nếu họ hỏi "bug khó nhất."**

### 1.9 Không có replace file in-place
- **Làm gì:** update thì delete-rồi-upload.
- **Tại sao:** Files API của OpenAI không có replace in-place. Biết giới hạn platform = tín hiệu senior.

### 1.10 Zendesk retry: `Retry-After` khi 429, exp backoff khi 5xx
- **Làm gì:** `_get_with_retry()` tôn trọng `Retry-After`, exponential backoff cho 5xx, cap 5 lần.
- **Tại sao:** Zendesk rate-limit cloud IP khá gắt — em dính ngay lần deploy DigitalOcean đầu. Handle cho nên daily job mới thực sự ổn định.

### 1.11 `chunks_embedded` là con số ước lượng (trung thực trí tuệ)
- **Làm gì:** `1 + ceil((tokens − 800) / 400)`, `tokens ≈ chars / 4`. Báo là estimate, ~1129 trên set demo.
- **Tại sao:** `vector_stores.files.content()` trả nguyên file là một entry, không phải per-chunk — không có số per-chunk chính xác để query. **Em chọn ghi là estimate thay vì giả vờ chính xác.** Nếu họ hỏi "số này exact không?" — "Không, và em đã ghi rõ lý do."

### 1.12 Exit code + public run log + Better Stack (trưởng thành về ops)
- **Exit 0 khi thành công, non-zero khi lỗi** để cron run được đánh dấu fail.
- **Artefact run-log công khai đẩy lên nhánh `logs` của repo** + Better Stack live tail. Reviewer kiểm tra run cuối cùng mà không cần credential DO/Better Stack.
- Cho thấy em nghĩ về operability và trải nghiệm của *reviewer*, không chỉ code.

### 1.13 18 test
- Cover: slug stability, markdown cleaning (decompose script/nav), delta classification, chunk-count estimate, Zendesk 429/5xx retry, OpenAI 404 race + orphan cleanup.

---

## 2. Câu hỏi scaling & "what-if" (họ sẽ hỏi)

| Câu hỏi | Trả lời |
|---|---|
| Cái gì gãy ở 10.000 bài? | `load_remote_state()` list mọi file mỗi run sẽ nặng. Thêm local index/cache `{article_id → file_id, hash}` và chỉ re-list khi lệch. Phân trang (pagination) bên Zendesk nữa. |
| Làm sao cho real-time thay vì daily? | Chuyển từ batch sang **Zendesk webhook** khi article create/update/delete → event-driven, chỉ xử lý cái đổi. Logic delta đã handle add/update/remove gọn rồi. |
| Multi-locale? | Đã scrape per-locale; delta key cần thêm locale để cùng một bài EN vs ZH không đụng. |
| Nếu OpenAI rate-limit upload? | `MAX_UPLOAD_WORKERS` tune bằng env — ops throttle xuống. Đã handle backoff kiểu 429 ở phía read; cùng pattern cho write nếu cần. |
| Vector store hỏng — re-embed toàn bộ? | Thiết kế stateless nên fresh load chạy ngay — quan sát `{added: 401}` cold. Không có local state để reconcile. |
| Làm sao biết câu trả lời của bot *tốt*? | (gap thật) Em test thủ công ("Làm sao thêm video YouTube?" → đúng + cite). Ở quy mô production em sẽ thêm **eval harness** (kiểu RAGAS: faithfulness, citation accuracy, refusal-when-unknown) và alert khi regression. |

### "Em sẽ làm khác / với thêm thời gian thế nào?"
> "Ba thứ, theo thứ tự: (1) eval harness để chất lượng câu trả lời được đo, không phải nhìn mắt — đó là rủi ro lớn nhất cho support bot. (2) Event-driven qua Zendesk webhook thay vì batch daily, để thay đổi live trong vài phút. (3) Local state cache để việc list remote-state không scale tuyến tính. Em sẽ *chưa* thêm semantic chunking — với support doc, static chunk 800/400 cite sạch và lợi ích biên không đáng so với độ phức tạp, trừ khi evals nói khác."

---

## 3. Câu "tại sao Python?" — chủ động đặt trước

Toàn bộ CV em là TypeScript; megatronbot là Python. **Họ sẽ hỏi.** Trả lời tốt:
> "Công cụ đúng cho việc đúng. Đây là script scrape-clean-sync — ecosystem BeautifulSoup + markdownify + pytest của Python rất hợp, và OpenAI SDK first-class. Còn **service OptiBot production trong stack OptiSigns** — Node/NestJS/React theo JD — thì em sẽ build bằng TypeScript, và kinh nghiệm NestJS của em (backend 38+ module ở Metagrit) chuyển tiếp trực tiếp. Em chọn ngôn ngữ phù hợp vấn đề."

Câu này biến điểm yếu thành tín hiệu linh hoạt + thực dụng.

---

## 4. Câu hỏi full-stack theo JD (ngắn gọn — CV em mạnh chỗ này)

JD muốn React/Angular + Node/Express/NestJS + SQL/NoSQL. Hit nhanh, đều có thật trong công việc em làm:

- **React vs Angular?** Ship cả hai — Angular (NNG, migrate multi-repo → Nx monorepo) và React/Next.js (EVN GENCO3, Avatar48, InspectAI). Prefer React/Next.js cho project mới; Angular khi codebase đã là Angular.
- **NestJS quy mô lớn?** Avatar48 = backend NestJS + CQRS 38+ module; Clean Architecture/DDD để business rule unit-test được.
- **SQL vs NoSQL?** Postgres/MySQL cho relational integrity, Redis cho cache/queue, MongoDB cho doc linh hoạt, DynamoDB cho key-value scale.
- **State management?** Zustand cho client UI state, TanStack Query cho server state.
- **Performance?** Trang sản phẩm e-commerce 8s → 1s bằng cách profile trước (fix N+1, lazy load, cache).

---

## 5. Behavioral

| Câu hỏi | Dẫn bằng |
|---|---|
| Giới thiệu về bản thân | 4 năm full-stack TS xuyên suốt NestJS + Next.js/React; gần đây làm product tích hợp AI end-to-end; vừa ship bot sync RAG 401 bài cho bài take-home của anh/chị — sẵn sàng đi qua bất kỳ phần nào. |
| Tại sao OptiSigns? | Product SaaS ở quy mô thật (30.500 khách, 121 nước), một bề mặt AI/RAG thực sự (OptiBot — đó là lý do bài take-home hấp dẫn em), và một engineering hub HCMC thật sự. Em muốn làm product với tầm vóc toàn cầu, không phải outsourcing. |
| JD ghi 5+ năm; em có 4. | Reframe theo scope: product sole-engineer (InspectAI), backend 38+ module, frontend enterprise 25+ module, dẫn đội 4 người đóng 24 lỗi bảo mật. Quản lý ownership cấp senior xuyên suốt. |
| Tại sao rời công ty hiện tại? | Tích cực thôi. Tìm product SaaS với bề mặt AI mạnh và khách hàng toàn cầu. Không bao giờ nói xấu Metagrit/NNG. |
| Bug khó nhất? | **OpenAI 404 race** dưới upload song song — eventual consistency trả 404 cho file vừa tạo; fix bằng retry + orphan cleanup để retry không leak file. (§1.8) |
| Lúc em over-engineer / under-engineer? | Thật thà: con số ước lượng chunk — em từng cân nhắc query chunk chính xác, thấy API trả nguyên file, nên chọn *ước lượng và ghi nhãn rõ* thay vì giả chính xác. Biết khi nào không build là senior. |

---

## 6. Câu hỏi nên hỏi ngược lại họ

1. Team sở hữu OptiBot trông thế nào — quy mô, và HCMC collaborate với Houston/Munich ra sao?
2. OptiBot đã production chưa, và khoảng cách giữa bài take-home này với hệ thống thật là gì?
3. Stack thực tế ngày làm việc ngoài JD — Node/NestJS? Vector store / RAG pipeline chạy trong prod thế nào?
4. Các anh/chị đo chất lượng câu trả lời của bot hôm nay ra sao — đã có eval harness chưa, hay đây là thứ role này sẽ build?
5. Thành công trong 3–6 tháng đầu trông như thế nào?
6. (Vòng HR) lộ thăng tiến từ mid lên senior ở đây.

> Đừng hỏi lương/nghỉ phép ở vòng kỹ thuật — để HR/offer.

---

## 7. Checklist ngày phỏng vấn

- [ ] Nắm entity: AlphaSphere = công ty con OptiSigns. Pitch OptiSigns từ đầu đến cuối.
- [ ] Đọc lại `megatronbot/README.md` + `main.py` của chính mình cho thuộc — biết từng dòng.
- [ ] Tập nói chuyện 404-race (§1.8) thành tiếng — đó là khoảnh khắc "em dính bug thật và fix tận gốc" mạnh nhất.
- [ ] Có sẵn câu trả lời §2 "làm khác thế nào" — dẫn bằng evals (thể hiện tư duy sản phẩm).
- [ ] Chủ động câu "tại sao Python" (§3) — đừng đợi họ hỏi, lồng luôn vào.
- [ ] Chuẩn bị reframe 5+ năm → scope (§5).
- [ ] Mang theo 3–4 câu hỏi ngược (§6).
- [ ] Biết mức lương sàn trước vòng HR.
