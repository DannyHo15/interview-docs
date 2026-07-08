# Chuẩn bị phỏng vấn — OptiSigns (Full-Stack Developer, Mid/Senior)
## HCMC · Bảo vệ bài take-home (megatronbot) + Full-stack + Behavioral

> **Lưu ý về entity:** AlphaSphere là công ty con của OptiSigns — tin tuyển dụng đứng tên AlphaSphere nhưng công việc thực chất là làm sản phẩm OptiSigns (vì vậy bài take-home mang tên "OptiSigns – OptiBot"). Khi trả lời, cứ pitch thẳng **OptiSigns**: SaaS digital-signage, văn phòng ở Houston, HCMC, Munich, phục vụ 30.500 khách hàng tại 121 quốc gia. Đây vẫn là cùng một hệ công ty.

---

## 0. Hình thức phỏng vấn — đọc kỹ trước khi vào

Đây không phải buổi nói chuyện xoay quanh CV thông thường. Bạn đã nộp bài take-home (`megatronbot`), nên nhiều khả năng **khoảng 70% thời gian sẽ dành để bảo vệ đoạn code đó** — từng quyết định kiến trúc, từng trade-off, các câu hỏi mở rộng quy mô (scaling), và kiểu câu "nếu làm lại thì em sẽ đổi gì". Phần còn lại là câu hỏi full-stack bám theo JD và vài câu behavioral.

**Con át chủ bài của bạn:** đề bài chỉ yêu cầu scrape tối thiểu 30 bài viết trong khoảng 10 tiếng, còn bạn đã hoàn thành **401 bài**, kèm delta sync, upload song song, cơ chế retry, 18 test, và deploy thật trên DigitalOcean có observability công khai cho người review xem. Bạn đã làm vượt yêu cầu mà không sa đà over-engineering. Giữ tinh thần đó khi trả lời — bình tĩnh, tự tin, đại loại như: "đây là những gì em đã build, và đây là lý do vì sao từng phần lại như vậy."

---

## 1. megatronbot — bảo vệ từng quyết định

Với mỗi mục dưới đây, trình bày theo cấu trúc: **làm gì → vì sao → trade-off nói thật.** Đừng bao giờ bảo vệ một lựa chọn như thể nó hoàn hảo — kỹ sư senior luôn biết cái giá phải trả cho quyết định của mình và nói thẳng ra.

### 1.1 Dùng attributes của OpenAI Vector Store làm state store (không dùng DB riêng)
- **Làm gì:** mỗi file upload lên đều mang theo `attributes = {article_id, hash, url}`. Hàm `load_remote_state()` list toàn bộ các file này khi bắt đầu chạy để dựng lại delta map.
- **Vì sao:** container chạy **stateless**, trên worker ephemeral của DigitalOcean. Vector store vốn dĩ *đã là* nguồn dữ liệu gốc (source of truth) — nếu có thêm một DB riêng thì đó chỉ là bản sao thứ hai, và bản sao thì luôn có nguy cơ lệch (drift) với bản gốc.
- **Trade-off (phải nói ra):** mỗi lần chạy phải list toàn bộ file, độ phức tạp O(n) theo số lượng API call. Với 401 bài thì ổn, nhưng lên tới khoảng 10.000+ bài em sẽ cần thêm một local index/cache để không phải list lại từ đầu mỗi lần.

### 1.2 Delta key = SHA-256 của markdown đã làm sạch (không dùng `edited_at`)
- **Làm gì:** quyết định có sync hay không dựa trên hash của phần markdown đã clean, chứ không dựa trên timestamp.
- **Vì sao:** em từng quan sát thấy trường hợp `edited_at = 2021` trong khi `updated_at = 2026` trên cùng một bài. Timestamp của Zendesk không đáng tin để làm tín hiệu skip. Hash thì bám sát nội dung thật — byte nào đổi thì sync, không đổi gì thì skip, không thể sai.
- **Trade-off:** cách này không giúp bỏ qua bước *fetch* — vẫn phải download và clean mọi bài để tính hash. Nhưng bước clean rất rẻ, còn embedding mới là phần tốn kém, và đó chính là chỗ delta phát huy tác dụng (thực tế quan sát được `{skipped: 401}` chỉ trong khoảng 12 giây).

### 1.3 Một lần gọi Zendesk là lấy được toàn bộ HTML body
- **Làm gì:** chỉ một call duy nhất tới `/api/v2/help_center/<locale>/articles.json`, response đã có sẵn nội dung bài viết. Không cần loop để fetch từng bài riêng lẻ.
- **Vì sao:** tránh được N lần round-trip và rủi ro bị rate-limit đi kèm. Đây cũng là cách chứng minh mình đọc kỹ API thật, chứ không phải crawl HTML một cách mù quáng.

### 1.4 Làm sạch nội dung: BeautifulSoup `decompose()` + markdownify
- **Làm gì:** dùng `decompose()` để loại bỏ các thẻ `script, style, nav, header, footer, aside`, sau đó convert bằng `markdownify`. Vẫn giữ nguyên heading, code block, và các link tương đối.
- **Vì sao:** `decompose()` gỡ hẳn node đó ra khỏi parse tree (chứ không chỉ ẩn đi), nên nó không thể rò rỉ vào markdown output. Kết quả là một document sạch, phù hợp để đưa vào embedding.

### 1.5 Thiết kế citation: vừa có YAML front-matter, vừa có dòng `Article URL:` hiển thị
- **Làm gì:** mỗi file `.md` có cả front-matter lẫn một dòng `Article URL:` hiển thị rõ ràng trong nội dung — để cả người đọc lẫn LLM đều thấy được.
- **Vì sao:** system prompt yêu cầu bot trích dẫn tối đa 3 dòng `Article URL:` khi trả lời. Đặt thông tin này ngay trong nội dung file (chứ không chỉ nằm trong metadata) giúp model dễ dàng lấy ra khi cần cite.

### 1.6 Upload song song bằng `ThreadPoolExecutor` (8 worker), không dùng asyncio
- **Làm gì:** phần upload chạy trong thread pool, giúp rút thời gian từ 80 phút xuống còn khoảng 10 phút cho một lần load từ đầu (fresh load). Số lượng worker tune được qua biến `MAX_UPLOAD_WORKERS`.
- **Vì sao:** OpenAI client dùng httpx và **thread-safe**; mỗi lượt upload là tác vụ I/O-bound, phần lớn thời gian là chờ embedding xử lý. Dùng thread giúp các lượt chờ này chồng lấn lên nhau, với độ phức tạp code thấp hơn nhiều so với viết lại toàn bộ bằng async. Con số 8 là điểm cân bằng tốt trước khi có nguy cơ chạm rate-limit.
- **Trade-off (phải nói ra):** ở quy mô lớn hơn nhiều, async sẽ hiệu quả hơn tính trên từng connection. Em chọn thread vì lợi ích chính nằm ở việc chồng lấn thời gian chờ embedding, và 8 worker vẫn nằm dưới mọi ngưỡng rate limit hiện tại. Biến `MAX_UPLOAD_WORKERS` được đưa ra ngoài qua env để đội ops có thể throttle lại nếu tier thay đổi.

### 1.7 Chia hai pass: classify trước, upload sau
- **Làm gì:** Pass 1 chạy tuần tự (hash, classify, ghi markdown — các thao tác rẻ; bài nào bị skip thì finalize luôn ở bước này). Pass 2 chạy song song (chỉ phần upload, vốn tốn kém). Pass 3 chạy song song để xóa các file orphan.
- **Vì sao:** việc finalize sớm các bài bị skip vừa rẻ vừa giữ cho biến đếm `counts` không bị race condition; chỉ phần thực sự tốn kém mới được song song hóa. Lỗi đầu tiên xảy ra sẽ cancel các future đang chờ (`cancel_futures=True`) để thoát nhanh, thay vì để lại một mớ upload dở dang.

### 1.8 Race condition 404 của OpenAI (câu chuyện "edge case sâu" hay nhất của bạn)
- **Làm gì:** dưới tải song song, thao tác poll sau khi attach thỉnh thoảng đụng phải độ trễ eventual-consistency của OpenAI và **trả về 404 cho một file vừa mới tạo**. Hàm `vector_store.upload()` retry tối đa 3 lần với backoff, và **xóa object orphan trên Files-API trước mỗi lần retry** để tránh leak.
- **Vì sao đáng nói:** đây là bằng chứng cho thấy em thực sự chạy hệ thống này ở mức concurrency thật, gặp phải một bug distributed-systems có thật, và xử lý tận gốc (dọn orphan) thay vì chỉ retry một cách mù quáng. **Nên dẫn câu chuyện này nếu được hỏi "bug khó nhất em từng gặp là gì".**

### 1.9 Không replace file in-place
- **Làm gì:** khi cần update, cách làm là xóa file cũ rồi upload lại file mới.
- **Vì sao:** Files API của OpenAI không hỗ trợ replace in-place. Biết rõ giới hạn của platform mình đang dùng cũng là một tín hiệu senior.

### 1.10 Cơ chế retry với Zendesk: tôn trọng `Retry-After` khi 429, backoff lũy tiến khi 5xx
- **Làm gì:** hàm `_get_with_retry()` tôn trọng header `Retry-After`, dùng exponential backoff cho lỗi 5xx, và giới hạn tối đa 5 lần retry.
- **Vì sao:** Zendesk rate-limit các IP cloud khá gắt gao — em gặp ngay trong lần deploy đầu tiên trên DigitalOcean. Xử lý được vấn đề này thì job chạy hàng ngày mới thực sự ổn định.

### 1.11 `chunks_embedded` là con số ước lượng (thể hiện sự trung thực)
- **Làm gì:** công thức ước lượng là `1 + ceil((tokens − 800) / 400)`, với `tokens ≈ chars / 4`. Con số này luôn được ghi rõ là ước lượng, khoảng 1129 trên bộ dữ liệu demo.
- **Vì sao:** `vector_stores.files.content()` trả về nguyên cả file như một entry duy nhất, không tách theo từng chunk — nên không có cách nào query ra con số chunk chính xác. **Em chọn ghi rõ đây là ước lượng, thay vì giả vờ nó chính xác.** Nếu được hỏi "con số này có exact không?" — câu trả lời là: "Không, và em đã ghi rõ lý do ngay trong output."

### 1.12 Exit code + run log công khai + Better Stack (thể hiện sự trưởng thành về ops)
- **Exit code 0 khi thành công, khác 0 khi có lỗi**, để cron job đánh dấu đúng trạng thái fail.
- **Artefact run-log được đẩy công khai lên nhánh `logs` của repo**, cộng thêm Better Stack live tail — người review có thể xem log của lần chạy gần nhất mà không cần credential của DigitalOcean hay Better Stack.
- Điều này cho thấy em nghĩ đến khả năng vận hành (operability) và trải nghiệm của *người review*, chứ không chỉ dừng lại ở việc viết code chạy được.

### 1.13 18 test case
- Bao phủ: tính ổn định của slug, làm sạch markdown (decompose script/nav), phân loại delta, ước lượng số chunk, retry 429/5xx của Zendesk, và race condition 404 của OpenAI kèm dọn orphan.

---

## 2. Câu hỏi về scaling & tình huống giả định (rất có thể sẽ gặp)

| Câu hỏi | Trả lời |
|---|---|
| Cái gì sẽ gãy khi lên 10.000 bài viết? | `load_remote_state()` list toàn bộ file mỗi lần chạy sẽ trở nên nặng nề. Em sẽ thêm local index/cache dạng `{article_id → file_id, hash}`, chỉ re-list khi phát hiện lệch dữ liệu. Ngoài ra cũng cần xử lý phân trang (pagination) phía Zendesk. |
| Làm sao chuyển từ chạy daily sang real-time? | Chuyển từ mô hình batch sang **Zendesk webhook**, kích hoạt khi bài viết được tạo/sửa/xóa — tức là event-driven, chỉ xử lý đúng phần vừa thay đổi. Logic delta hiện tại đã xử lý tốt cả ba trường hợp add/update/remove nên gần như tái sử dụng được luôn. |
| Nếu có nhiều locale? | Hiện đã scrape theo từng locale riêng; chỉ cần thêm locale vào delta key để bài tiếng Anh và bài tiếng Trung của cùng một nội dung không bị đụng nhau. |
| Nếu OpenAI rate-limit phần upload? | `MAX_UPLOAD_WORKERS` đã có thể tune qua env để đội ops throttle xuống khi cần. Phía đọc dữ liệu đã có xử lý backoff kiểu 429; nếu cần, áp dụng đúng pattern đó cho phía ghi. |
| Nếu vector store bị hỏng, có cần re-embed toàn bộ không? | Nhờ thiết kế stateless, một lần fresh load sẽ chạy ngay lập tức — thực tế quan sát được `{added: 401}` khi chạy nguội (cold start). Không có local state nào cần reconcile lại. |
| Làm sao biết câu trả lời của bot là *tốt*? | (đây là khoảng trống thật) Hiện em mới test thủ công, ví dụ hỏi "Làm sao thêm video YouTube?" và kiểm tra câu trả lời đúng, có trích dẫn đầy đủ. Ở quy mô production, em sẽ bổ sung một **eval harness** (kiểu RAGAS: đo faithfulness, độ chính xác citation, khả năng từ chối khi không biết) và có cảnh báo khi phát hiện regression. |

### "Nếu có thêm thời gian, em sẽ làm khác thế nào?"
> "Ba việc, theo đúng thứ tự ưu tiên: (1) Xây eval harness để đo được chất lượng câu trả lời bằng số liệu, chứ không chỉ nhìn mắt — đây là rủi ro lớn nhất đối với một support bot. (2) Chuyển sang event-driven qua Zendesk webhook thay vì chạy batch hàng ngày, để thay đổi được phản ánh chỉ sau vài phút. (3) Thêm local state cache để việc list remote-state không còn scale tuyến tính theo số bài viết. Còn phần em *sẽ chưa* làm là semantic chunking — với loại tài liệu support này, static chunk 800/400 đã cho kết quả cite sạch, và lợi ích tăng thêm không đáng so với độ phức tạp phải trả, trừ khi số liệu eval cho thấy điều ngược lại."

---

## 3. Câu "tại sao lại chọn Python?" — nên chủ động nói trước

Toàn bộ CV của bạn là TypeScript, còn megatronbot lại viết bằng Python. **Gần như chắc chắn họ sẽ hỏi điều này.** Một câu trả lời tốt:
> "Công cụ nào phù hợp với việc đó thì dùng công cụ đó. Đây là một script scrape-clean-sync, và hệ sinh thái Python với BeautifulSoup, markdownify, pytest rất hợp cho việc này, chưa kể OpenAI SDK cho Python cũng là first-class. Còn với **service OptiBot chạy trong production trên stack của OptiSigns** — tức Node/NestJS/React như JD mô tả — em sẽ build bằng TypeScript, và kinh nghiệm NestJS của em (từng làm backend hơn 38 module ở Metagrit) áp dụng trực tiếp được luôn. Em chọn ngôn ngữ dựa trên bài toán, không phải dựa trên thói quen."

Câu trả lời này biến một điểm có vẻ là điểm yếu thành tín hiệu cho thấy bạn linh hoạt và thực dụng.

---

## 4. Câu hỏi full-stack theo JD (phần này CV của bạn vốn đã mạnh, nên trả lời gọn)

JD yêu cầu React/Angular, Node/Express/NestJS, và SQL/NoSQL. Đây là những câu trả lời nhanh, đều dựa trên kinh nghiệm thật:

- **React hay Angular?** Đã làm cả hai — Angular ở dự án NNG (migrate từ multi-repo sang Nx monorepo), React/Next.js ở EVN GENCO3, Avatar48, InspectAI. Ưu tiên React/Next.js cho dự án mới; dùng Angular khi codebase sẵn đã là Angular.
- **NestJS ở quy mô lớn?** Avatar48 là backend NestJS theo CQRS với hơn 38 module; áp dụng Clean Architecture/DDD để business rule có thể unit-test được.
- **SQL hay NoSQL?** Postgres/MySQL cho các bài toán cần relational integrity, Redis cho cache/queue, MongoDB cho dữ liệu dạng document linh hoạt, DynamoDB cho key-value ở quy mô lớn.
- **State management?** Zustand cho state phía client UI, TanStack Query cho state phía server.
- **Performance?** Từng tối ưu trang sản phẩm e-commerce từ 8 giây xuống còn 1 giây, bằng cách profile trước rồi mới fix — sửa N+1 query, lazy load, và thêm cache.

---

## 5. Behavioral

| Câu hỏi | Nên dẫn bằng |
|---|---|
| Giới thiệu bản thân | 4 năm làm full-stack với TypeScript xuyên suốt, chủ yếu NestJS + Next.js/React; gần đây làm sản phẩm tích hợp AI end-to-end; vừa ship xong bot sync RAG cho 401 bài viết trong bài take-home của anh/chị — sẵn sàng đi sâu vào bất kỳ phần nào. |
| Vì sao chọn OptiSigns? | Một sản phẩm SaaS đang vận hành ở quy mô thật (30.500 khách hàng, 121 quốc gia), có một bề mặt AI/RAG thực sự (OptiBot — đây cũng là lý do bài take-home hấp dẫn), và một engineering hub thật sự ở HCMC. Em muốn làm sản phẩm có tầm vóc toàn cầu, chứ không phải làm outsourcing. |
| JD yêu cầu 5+ năm, em chỉ có 4 năm. | Nên reframe theo scope công việc: từng là sole engineer của cả sản phẩm (InspectAI), làm backend hơn 38 module, frontend enterprise hơn 25 module, và từng dẫn một đội 4 người xử lý 24 lỗi bảo mật. Mức độ ownership xuyên suốt vốn đã ở tầm senior. |
| Vì sao rời công ty hiện tại? | Giữ tinh thần tích cực. Đang tìm một sản phẩm SaaS có bề mặt AI mạnh và khách hàng toàn cầu. Tuyệt đối không nói xấu Metagrit hay NNG. |
| Bug khó nhất từng gặp? | **Race condition 404 của OpenAI** khi upload song song — do eventual consistency mà một file vừa tạo lại bị trả về 404; xử lý bằng retry kết hợp dọn orphan để việc retry không gây leak file (xem mục 1.8). |
| Từng over-engineer / under-engineer lúc nào chưa? | Trả lời thật: con số ước lượng chunk. Em từng cân nhắc query ra số chunk chính xác, nhưng thấy API chỉ trả về nguyên cả file, nên quyết định *ghi rõ đây là ước lượng* thay vì giả vờ nó chính xác. Biết lúc nào không nên build thêm cũng là một dấu hiệu của senior. |

---

## 6. Câu hỏi nên hỏi ngược lại nhà tuyển dụng

1. Đội đang phụ trách OptiBot có quy mô thế nào, và HCMC phối hợp với Houston/Munich ra sao?
2. OptiBot đã lên production chưa, và khoảng cách giữa bài take-home này với hệ thống thật lớn cỡ nào?
3. Stack thực tế dùng hàng ngày ngoài những gì JD nêu — có phải Node/NestJS không? Vector store / RAG pipeline chạy trong production như thế nào?
4. Hiện tại đội đang đo chất lượng câu trả lời của bot bằng cách nào — đã có eval harness chưa, hay đây là việc role này sẽ phải xây dựng?
5. Thành công trong 3–6 tháng đầu tiên trông như thế nào?
6. (Dành cho vòng HR) Lộ trình thăng tiến từ mid lên senior ở công ty này ra sao.

> Đừng hỏi về lương hay chế độ nghỉ phép ở vòng phỏng vấn kỹ thuật — để dành cho vòng HR/offer.

---

## 7. Checklist ngày phỏng vấn

- [ ] Nắm chắc về entity: AlphaSphere là công ty con của OptiSigns. Pitch OptiSigns xuyên suốt từ đầu đến cuối.
- [ ] Đọc lại `megatronbot/README.md` và `main.py` của chính mình cho thật kỹ — nắm từng dòng.
- [ ] Tập nói to câu chuyện race condition 404 (mục 1.8) — đây là khoảnh khắc "em gặp bug thật và xử lý tận gốc" mạnh nhất.
- [ ] Chuẩn bị sẵn câu trả lời cho mục 2 "nếu làm lại sẽ khác thế nào" — dẫn bằng eval harness để thể hiện tư duy sản phẩm.
- [ ] Chủ động nói về "vì sao chọn Python" (mục 3) — đừng đợi họ hỏi, lồng ghép luôn vào phần giới thiệu.
- [ ] Chuẩn bị cách reframe yêu cầu 5+ năm kinh nghiệm sang góc độ scope công việc (mục 5).
- [ ] Mang theo 3–4 câu hỏi để hỏi ngược lại (mục 6).
- [ ] Biết trước mức lương sàn của mình trước khi vào vòng HR.
