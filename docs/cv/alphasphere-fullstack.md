# 🎯 AlphaSphere — Full Stack Software Developer (Mid/Senior) — Prep File

> File prep riêng cho role **Full Stack Software Developer (Mid/Senior)** tại **AlphaSphere**.
> Đây là bản ôn để nắm ý và dẫn chứng. Câu kinh nghiệm/hành vi được viết ở ngôi "tôi" dựa trên CV — hãy đối chiếu cho khớp sự thật và rút gọn khi nói. Câu lý thuyết nên trả lời theo công thức: **khái niệm → trade-off → ví dụ thật từ dự án của bạn**.
>
> ⚠️ **Lưu ý trung thực:** JD yêu cầu 5+ năm, bạn có ~4 năm nhưng mật độ dự án rất cao (Web3, microservices, real-time, K8s). Đừng phóng đại số năm — hãy bù bằng chiều sâu và phạm vi end-to-end.

---

## A. Sàng lọc & kinh nghiệm tổng quát

**1. Giới thiệu bản thân & dự án tâm đắc nhất**
Tôi là kỹ sư full-stack 4 năm, làm chủ yếu trên TypeScript xuyên suốt stack — Next.js, NestJS, React Native — và sở trường ở Web3 (Solana, EVM) và tích hợp AI. Dự án tôi tâm đắc nhất là **Avatar48** — launchpad token AI-agent trên Solana. Tôi làm gần như end-to-end: backend NestJS theo CQRS với 38+ module (bonding curve, tokenization, theo dõi holder, lịch sử giao dịch), tích hợp Solana Web3 (Metaplex, Raydium) và Uniswap Smart Order Router cho swap đa chain, stream on-chain event qua QuickNode webhook vào BullMQ, đẩy trade realtime lên UI bằng Socket.IO; phía front-end là DApp Next.js 15 với Privy wallet auth, TradingView chart custom datafeed, OKX DEX widget. Tôi thích nó vì nó vừa khó về kỹ thuật (đồng bộ on-chain ↔ off-chain), vừa phải ship nhanh ra production.

**2. Nghiêng FE hay BE? Điểm yếu đang cải thiện?**
Tôi cân bằng cả hai nhưng nếu phải chọn, tôi mạnh hơn ở backend/architecture — thiết kế module, message queue, deploy K8s. Phía front-end tôi vẫn vững (React/Next, Angular, React Native). Điểm tôi đang chủ động cải thiện là **chiều sâu về performance/observability ở quy mô lớn** (load testing có hệ thống, tuning DB ở mức triệu bản ghi) và **Go** cho các service cần throughput cao — tôi đã bắt đầu dùng Gin cho vài service nội bộ.

**3. Dự án "concept to production"**
Với **InspectAI** (giám sát ngôn ngữ realtime trong Google Meet) tôi là kỹ sư duy nhất đi từ ý tưởng tới production: chốt scope với stakeholder → thiết kế kiến trúc (NestJS 11 + TypeORM + Redis + BullMQ, NLP bằng Gemini và Google Cloud Natural Language) → dựng Google Meet add-on bằng Next.js 15 + Socket.IO → tự viết manifest và deploy lên Kubernetes. Tôi quyết định trade-off ở từng khâu: dùng BullMQ để tách phần xử lý NLP nặng khỏi luồng realtime để UI không bị giật.

**4. Quy mô team & quy trình**
Tôi từng làm cả ở team nhỏ (1 người end-to-end như InspectAI) lẫn dẫn nhóm 4 người ở NNG. Quy trình quen thuộc: Scrum/Kanban, branch + PR review bắt buộc, CI tự chạy test/lint trước merge, release theo sprint. Ở Avatar48 tôi gắn OpenTelemetry để có trace xuyên suốt giúp review production sau mỗi lần ship.

---

## B. Front-end (React / Angular, TypeScript)

**5. Re-render quá nhiều — debug & tối ưu**
Đầu tiên tôi xác định *vì sao* re-render bằng React DevTools Profiler (xem component nào render và lý do — props/state/context đổi). Nguyên nhân thường là **reference mới mỗi render** (object/array/function literal) phá vỡ so sánh tham chiếu. Cách xử lý theo thứ tự: nâng state đúng chỗ / tách component → `React.memo` cho component con thuần → `useMemo`/`useCallback` để giữ ổn định reference truyền xuống. **Lạm dụng phản tác dụng** vì bản thân memo cũng tốn so sánh + giữ dependency array; với component rẻ thì memo hóa còn chậm hơn render lại. Ở **Avatar48**, bảng trade realtime cập nhật liên tục qua Socket.IO nên tôi memo hóa row và virtualize danh sách để tránh re-render toàn bảng.

**6. So sánh quản lý state**
- **Server-state** (TanStack/React Query): dữ liệu từ API có caching, refetch, stale time — tôi dùng ở Avatar48 và EVN GENCO3.
- **Client/global state** (Zustand): state UI thuần như filter, theme, wallet state — nhẹ, không boilerplate như Redux.
- **Context**: chỉ cho giá trị ít đổi (theme, auth) vì đổi context làm re-render cả cây.

Nguyên tắc của tôi: **đừng nhồi server-data vào global store**. Dữ liệu server để React Query quản lý (cache + invalidation), global store chỉ giữ state thuần client. Điều này tránh được cảnh tự viết lại logic cache/refetch.

**7. Angular change detection & RxJS**
Angular mặc định check toàn cây mỗi event; tối ưu bằng `ChangeDetectionStrategy.OnPush` (chỉ check khi input reference đổi / event / async pipe phát) và `trackBy` trong `*ngFor`. **RxJS** giải quyết các luồng giá trị theo thời gian (stream) mà Promise không tiện: debounce ô search, hủy request cũ (`switchMap`), gộp nhiều nguồn (`combineLatest`). Tôi dùng Angular cho **CMS của Avatar48** và migrate nhiều project Angular sang Nx monorepo ở NNG.

**8. TypeScript: generic + utility type**
Ví dụ thật: tôi định nghĩa kiểu DTO cập nhật là `Partial<Pick<Entity, EditableKeys>>` để form chỉ nhận đúng field được sửa, và một generic API wrapper `ApiResponse<T>` để mọi endpoint có cùng shape `{ data: T; meta }`. Conditional/mapped type giúp tôi sinh kiểu form từ schema Zod (`z.infer`) ở LoLamBenhAn — type và validation luôn đồng bộ, đổi schema là TS báo lỗi ngay nơi dùng sai.

**9. Accessibility, responsive, performance**
Performance: code-splitting theo route, lazy load component nặng (chart, editor), `next/image`, prefetch hợp lý — chính cách này giúp tôi tối ưu trang ở NNG. Responsive: Tailwind breakpoint + thiết kế mobile-first. A11y: semantic HTML, focus management cho modal, aria cho widget custom. Tôi theo dõi Core Web Vitals (LCP/CLS/INP) bằng Lighthouse và đo thực tế.

---

## C. Back-end (Node.js, Express, NestJS)

**10. Event loop & CPU-bound**
Node single-thread cho JS, dùng libuv để I/O non-blocking; event loop chạy theo các phase (timers → pending → poll → check → close), microtask (Promise) chạy xen giữa các phase. Tác vụ **CPU nặng** (hash, parse lớn, tính toán) sẽ *block* event loop → mọi request khác bị treo. Cách xử lý: đẩy ra `worker_threads`, hoặc tốt hơn là **offload sang queue** (BullMQ) để worker riêng xử lý — đúng mô hình tôi dùng ở Avatar48/InspectAI: webhook on-chain và NLP nặng đều đẩy vào BullMQ thay vì chặn luồng HTTP.

**11. Express vs NestJS**
Express tối giản, linh hoạt, nhưng để team lớn thì dễ mỗi người một kiểu. **NestJS** áp một kiến trúc có DI, module, decorator, và pipeline guard/interceptor/pipe — rất hợp dự án nhiều module như Avatar48 (38+ module, CQRS). Cái giá: học curve cao hơn, nhiều boilerplate, và lớp abstraction đôi khi che mất chuyện gì đang chạy. Với service nhỏ/siêu nhẹ tôi lại chọn **Elysia/Bun** (LoLamBenhAn, AI Communication) cho tốc độ và đơn giản.

**12. Thiết kế REST API**
Tôi theo: danh từ số nhiều cho resource, versioning qua URI (`/v1`), pagination cursor cho list lớn, error format thống nhất (`{ code, message, details }`), validation ở biên bằng DTO (class-validator/Zod), và **idempotency key** cho thao tác tạo/thanh toán để retry không nhân đôi. Ở Avatar48 các thao tác liên quan tiền bắt buộc idempotent.

**13. Endpoint thỉnh thoảng chậm 5–10s**
Trình tự của tôi: (1) xem **trace** (OpenTelemetry) để biết thời gian nằm ở đâu — app, DB hay external call; (2) kiểm tra **slow query log** và connection pool cạn kiệt; (3) xem GC/heap nếu nghi memory; (4) kiểm tra external dependency (RPC node, third-party) — đây hay là thủ phạm "thỉnh thoảng". Pattern "tự khỏi" thường là **pool exhaustion** hoặc **lock chờ**. Có trace là tôi khoanh vùng được trong vài phút thay vì đoán.

**14. Auth & bảo mật**
JWT access token ngắn hạn + refresh token (lưu httpOnly cookie / rotate) cho web; session khi cần revoke tức thì. Phân quyền RBAC — tôi đã làm RBAC + OIDC SSO đầy đủ ở EVN GENCO3. Về OWASP: tôi phòng injection (parameterized query/ORM), XSS (escape + CSP), CSRF (SameSite cookie), broken access control (check quyền ở server, không tin client). Ở NNG tôi **dẫn team xử lý pen-test**, nên các lỗ hổng này tôi gặp và vá thực tế chứ không chỉ lý thuyết.

---

## D. Cơ sở dữ liệu

**15. Chọn SQL vs NoSQL**
Tôi nhìn vào: dữ liệu có quan hệ chặt & cần transaction/consistency không, schema có ổn định không, pattern truy vấn ra sao, và yêu cầu scale. Quan hệ + cần ACID → PostgreSQL (mặc định của tôi). Schema linh hoạt, document lồng nhau, đọc nhiều → MongoDB. Ví dụ: ở Avatar48 dữ liệu giao dịch/holder cần nhất quán nên dùng quan hệ; còn cấu hình động dạng tài liệu thì hợp NoSQL. Tôi không ngại **dùng cả hai** trong một hệ thống đúng chỗ.

**16. Query chậm & N+1**
Tôi chạy `EXPLAIN (ANALYZE)` để xem có seq scan không, thêm index đúng cột lọc/sort (cân nhắc composite index theo thứ tự cột), và tránh `SELECT *`. **N+1**: lặp query con cho từng bản ghi cha (ví dụ lấy 100 user rồi query order cho từng người → 101 query). Khử bằng eager loading/JOIN, `IN (...)` gộp, hoặc DataLoader batch. Ở EVN GENCO3 với nhiều bảng quan hệ tôi đặc biệt để ý N+1 khi build dashboard.

**17. Transaction & race condition**
Một ví dụ: ở Avatar48, hai webhook on-chain đến gần như đồng thời cùng cập nhật số dư/holder của một token → nếu đọc-sửa-ghi tuần tự sẽ ghi đè lẫn nhau. Tôi xử lý bằng cập nhật nguyên tử trong **transaction** (hoặc `UPDATE ... SET balance = balance + delta` thay vì đọc rồi ghi), kết hợp **distributed lock bằng Redis** hoặc `SELECT ... FOR UPDATE` khi cần. Về isolation: hiểu Read Committed (mặc định Postgres) vs Repeatable Read/Serializable, đánh đổi giữa độ nhất quán và throughput.

**18. Redis ngoài cache**
Tôi dùng Redis cho: **rate limiting** (token bucket), **pub/sub** và backplane cho Socket.IO khi scale nhiều instance, **distributed lock**, và **queue** (BullMQ chạy trên Redis) — chính là backbone xử lý async ở Avatar48/InspectAI/GenCodify. Rủi ro **cache ↔ DB lệch**: tôi đặt TTL hợp lý, dùng chiến lược invalidate khi ghi (write-through hoặc xoá key sau update), và chấp nhận eventual consistency ở chỗ không nhạy cảm.

**19. MongoDB embed vs reference**
Embed khi dữ liệu con luôn đi cùng cha, ít thay đổi độc lập và không quá lớn (1-to-few). Reference khi con dùng chung nhiều nơi, lớn, hoặc cần query độc lập (1-to-many lớn). Aggregation pipeline tôi dùng cho thống kê/nhóm dữ liệu (`$match → $group → $sort`). Tôi cũng dùng DynamoDB ở vài hệ AWS nên quen tư duy thiết kế theo access pattern của NoSQL.

---

## E. System design & kiến trúc

**20. Design real-time collaboration (đây là sở trường — tôi đã làm)**
Tôi từng dựng đúng bài này ở **GenCodify** (Yjs CRDT) và **LoLamBenhAn** (WebSocket multi-clinician). Hướng thiết kế:
- **Data model:** tài liệu = cây node; mỗi thay đổi là một thao tác nhỏ.
- **Đồng bộ:** dùng **CRDT (Yjs)** để các client merge thay đổi mà không cần server transform; transport qua WebSocket (Hocuspocus).
- **Conflict resolution:** CRDT đảm bảo hội tụ (eventual consistency) không cần khoá — phù hợp edit đồng thời.
- **Scale:** mỗi document là một "room"; dùng Redis pub/sub làm backplane để nhiều WS server đồng bộ; sticky session hoặc consistent hashing theo roomId.
- **Persistence:** snapshot định kỳ + lưu update log; awareness (con trỏ người dùng) giữ trong bộ nhớ, không persist.

Tôi sẽ nêu trade-off: CRDT đơn giản hoá conflict nhưng tốn metadata; OT nhẹ hơn về lưu trữ nhưng phức tạp về thuật toán và phụ thuộc server.

**21. Khi nào microservices / khi nào KHÔNG**
Tách khi: các phần có vòng đời deploy, scale, hoặc team khác nhau rõ rệt — như GenCodify (7 service: identity, AI, project, asset, design, webhook, worker) vì service AI nặng cần scale riêng. **KHÔNG nên** khi team nhỏ / sản phẩm chưa rõ domain: cái giá ẩn là độ phức tạp vận hành (network, eventual consistency, distributed tracing, deploy nhiều service, debug khó). Tôi luôn khuyên **bắt đầu monolith mô-đun hoá tốt** rồi tách khi có lý do thật.

**22. Message queue: ordering, at-least-once, idempotency**
Queue (tôi dùng RabbitMQ và BullMQ) để tách tác vụ nặng/async và chịu tải đỉnh. Vì hầu hết là **at-least-once**, message có thể đến trùng → tôi đảm bảo **idempotency**: mỗi message có khoá tự nhiên (vd transaction signature on-chain ở Avatar48), xử lý xong ghi dấu để lần sau bỏ qua. **Ordering**: dùng partition/queue theo key (cùng token vào cùng queue) khi cần thứ tự; chấp nhận xử lý song song chỗ không cần. Retry có backoff + dead-letter queue cho message hỏng.

**23. Chiến lược scale một API tăng tải**
Thứ tự tôi ưu tiên: (1) **đo** trước để biết nút thắt; (2) **caching** (Redis, CDN cho static) — rẻ và hiệu quả nhất; (3) **tối ưu DB** + read replica cho đọc nhiều; (4) **horizontal scale** stateless service sau load balancer; (5) tách async nặng ra queue. CDN/cache trước vì chi phí thấp; chỉ scale ngang khi đã loại trừ nút thắt DB, nếu không là "nhân bản cái chậm".

**24. CI/CD, Docker, K8s**
Tôi đóng gói service bằng Docker multi-stage, deploy K8s bằng manifest tự viết — đã làm ở GenCodify (Rancher, 3 namespace, StatefulSet cho Postgres/RabbitMQ/Redis) và InspectAI. Pipeline: GitLab CI chạy lint/test/build image → push lên registry (Google Artifact Registry) → deploy. **Zero-downtime** nhờ rolling update + readiness/liveness probe; **rollback** bằng giữ image version trước và `kubectl rollout undo`.

---

## F. Coding & xử lý vấn đề

**25. Gộp theo userId, top N theo tổng giá trị**
```js
function topUsersByValue(transactions, n) {
  const totals = new Map();
  for (const tx of transactions) {
    if (!tx || tx.userId == null || typeof tx.value !== "number") continue; // edge case
    totals.set(tx.userId, (totals.get(tx.userId) ?? 0) + tx.value);
  }
  return [...totals.entries()]
    .map(([userId, total]) => ({ userId, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n);
}
```
Độ phức tạp: O(m) gộp + O(u log u) sort (u = số user). Edge case: mảng rỗng, n > số user, value âm, field thiếu. Nếu u rất lớn còn n nhỏ, dùng **min-heap** kích thước n để còn O(u log n).

**26. Chạy tối đa K promise song song (không thư viện)**
```js
async function mapWithLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(runners);
  return results;
}
```
Giữ nguyên thứ tự kết quả, luôn có tối đa `limit` tác vụ chạy. Đúng mô hình tôi cần khi gọi RPC/AI hàng loạt mà không muốn rate-limit đánh chặn.

**27. Bug tinh vi — phát hiện & sửa**
*Bug 1 — `await` trong `forEach`:*
```js
items.forEach(async (item) => { await save(item); }); // SAI: forEach không đợi, hàm ngoài chạy tiếp
// Tuần tự:
for (const item of items) await save(item);
// Song song:
await Promise.all(items.map(save));
```
`forEach` bỏ qua promise trả về nên không "đợi" được, lỗi cũng không bắt được.

*Bug 2 — closure với `var`:*
```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // in 3,3,3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // in 0,1,2 (let tạo binding mới mỗi vòng)
```

---

## G. Hành vi, teamwork & sản phẩm

**28. Bất đồng với PM/designer**
Ở một dự án, designer muốn animation chuyển trang phức tạp nhưng nó làm tụt performance trên mobile. Thay vì nói "không làm được", tôi dựng nhanh hai bản prototype và đo số liệu (FPS, LCP) cho cả hai xem. Dựa trên data, chúng tôi chọn phương án nhẹ hơn nhưng vẫn giữ được "cảm giác" mong muốn. Nguyên tắc của tôi: tranh luận bằng dữ liệu, không bằng cảm tính.

**29. Advocate công nghệ mới**
Ở NNG tôi đề xuất migrate nhiều project Angular từ **multi-repo sang Nx monorepo**. Tôi thuyết phục bằng cách chỉ ra cụ thể: chia sẻ code chung, build có cache, dễ refactor xuyên project; rủi ro được kiểm soát bằng migrate dần từng project chứ không "big bang". Kết quả giảm trùng lặp và thời gian build. Tôi cũng là người đưa **AI-augmented workflow** (Claude Code, Cursor) vào quy trình của mình.

**30. Trade-off "ship nhanh" vs "code sạch"**
Triết lý của tôi khớp với AlphaSphere: viết code sạch nhưng **không over-engineer**. Khi cần ship MVP nhanh (như landing/CMS Avatar48), tôi chấp nhận một số nợ kỹ thuật *có chủ đích* và ghi chú lại (TODO/issue) để trả sau. Chỗ nào là lõi (tiền, on-chain) thì tôi không cắt góc. Quan trọng là **nợ có ý thức**, không phải bừa bãi.

**31. Mentor junior**
Tôi từng dẫn nhóm 4 người xử lý pen-test ở NNG. Cách tôi làm: chia việc theo mức độ rủi ro, pair-review các fix bảo mật để mọi người hiểu *vì sao* chứ không chỉ vá, và viết lại bài học chung. Tôi cũng hay viết `CLAUDE.md`/`AGENTS.md` và tài liệu spec để cả người lẫn AI tool trong team làm việc nhất quán.

**32. Yêu cầu mơ hồ từ stakeholder**
Trước khi code tôi làm rõ: vấn đề người dùng thật sự là gì, định nghĩa "xong" (acceptance criteria), ràng buộc (deadline, scale), và edge case. Tôi thường vẽ nhanh data flow hoặc dựng prototype nhỏ để cùng stakeholder chốt scope — tránh build sai thứ rồi làm lại.

---

## H. Đào sâu theo CV (Avatar48, GenCodify, NNG, DevOps/AI)

**33. Vì sao CQRS cho Avatar48?**
Vì miền giao dịch on-chain có **mô hình đọc và ghi rất khác nhau**: phía ghi là command theo nghiệp vụ (tạo bonding curve, tokenize agent, ghi nhận trade) cần rõ ràng và nhất quán; phía đọc là leaderboard, holder, lịch sử — cần tối ưu truy vấn và có thể dựng từ projection/event. CQRS giúp tách hai mặt này, đặc biệt khi event on-chain bơm vào liên tục. **Đáng dùng** ở các context giao dịch/leaderboard; **over-engineering** nếu áp cho CRUD đơn giản như cấu hình — chỗ đó tôi giữ service thường. Tôi không CQRS hoá toàn bộ 38 module một cách máy móc.

**34. Webhook QuickNode → BullMQ: idempotency, ordering, reorg**
- **Idempotency:** mỗi event định danh bằng **transaction signature**; xử lý xong tôi ghi dấu (Redis/DB) để event trùng (webhook có thể gửi lại) bị bỏ qua.
- **Ordering:** với cùng một token/pool tôi route vào cùng queue/partition để giữ thứ tự; giữa các token thì xử lý song song.
- **Reorg/độ tin cậy trên Solana:** tôi không tin event ở mức `processed` cho việc tính tiền/reward; chờ commitment `confirmed`/`finalized` đủ sâu rồi mới chốt leaderboard. Nếu một slot bị bỏ trước khi finalize, projection được dựng lại từ nguồn on-chain. Mục tiêu là **off-chain luôn hội tụ về sự thật on-chain**.

**35. Bonding curve & multi-chain swap (Uniswap SOR) — phần khó nhất**
Khó nhất là **độ chính xác số học và đồng bộ giá**: tính toán bonding curve và định tuyến swap qua Smart Order Router phải dùng số nguyên lớn (BigInt) đúng decimals của từng token, tránh sai số floating-point — sai một chỗ là sai tiền thật. Tôi xử lý bằng cách dùng kiểu số chính xác, viết test cho các mốc giá/khối lượng biên, và đối chiếu kết quả tính off-chain với on-chain trước khi hiển thị.

**36. Yjs CRDT vs OT, scale WebSocket (GenCodify)**
**CRDT** (Yjs dùng thuật toán YATA) cho phép mỗi client áp thay đổi cục bộ rồi merge tự động, đảm bảo mọi bản sao **hội tụ** mà không cần server làm trọng tài transform. **OT** thì phải transform thao tác này so với thao tác đồng thời kia, thường cần server tập trung và logic phức tạp. Tôi chọn CRDT vì hợp editor drag-and-drop CraftJS nhiều người sửa. **Scale:** mỗi tài liệu là một room qua Hocuspocus/WebSocket; nhiều WS server đồng bộ qua backplane; state được snapshot + lưu update để load lại. Đánh đổi: CRDT tốn metadata hơn, nhưng đổi lại đơn giản và bền với mạng kém.

**37. Phân ranh giới 7 service (GenCodify)**
Tôi tách theo **bounded context và nhịp scale**: identity (auth), AI (nặng, scale riêng), project, asset, design, webhook, worker — cộng API Gateway, giao tiếp qua RabbitMQ. Tiêu chí: mỗi service sở hữu dữ liệu riêng, ít coupling đồng bộ. Nhìn lại, vài service nhỏ (vd webhook/worker) lẽ ra có thể gộp giai đoạn đầu để giảm chi phí vận hành, rồi tách sau khi tải tăng — đó là bài học về việc đừng tách quá sớm.

**38. 8s → 1s ở NNG (đo & nút thắt)**
Tôi đo bằng Lighthouse và Network panel để khoanh vùng. Nút thắt thật nằm ở: tải toàn bộ dữ liệu/sản phẩm một lần + bundle nặng + truy vấn chưa tối ưu. Ba thay đổi mang lại nhiều nhất: **tối ưu thuật toán/truy vấn** (bỏ tính toán thừa, gọn data trả về), **lazy loading** (ảnh + component dưới màn hình + code-split), và **caching** (cache kết quả hay dùng). Tôi luôn đo trước–sau để biết thay đổi nào thực sự hiệu quả, không tối ưu theo cảm tính.

**39. Pen-test: ưu tiên fix thế nào**
Dự án IoT nước/năng lượng cho khách Singapore (Flotech): 3 high, 13 medium, 8 low. Tôi ưu tiên theo **mức rủi ro × khả năng bị khai thác × độ nhạy dữ liệu** — high trước, đặc biệt các lỗi access control và injection. Một high điển hình là **broken access control** (truy cập tài nguyên không thuộc quyền): tôi vá bằng kiểm tra quyền ở server theo từng resource thay vì tin vào ẩn UI ở client, và thêm test để chống tái diễn.

**40. Sự cố production trên K8s (lần ra nguyên nhân)**
Tôi instrument bằng **OpenTelemetry** nên có trace xuyên service. Quy trình: bắt đầu từ **trace** của request lỗi để biết nó chậm/fail ở service nào → xem **metric** (CPU/mem, latency, error rate, queue depth) để biết tài nguyên hay phụ thuộc → cuối cùng đọc **log** đúng span để tìm nguyên nhân gốc. Kết hợp readiness/liveness probe và `kubectl rollout undo` để cô lập và phục hồi nhanh trong khi điều tra.

**41. Tin AI vs verify tay**
Tôi dùng Claude Code, Codex, Cursor, Copilot hằng ngày và viết `CLAUDE.md`/`AGENTS.md`, tích hợp MCP, delegate subagent, làm spec-driven/TDD. **Tin** AI ở: code boilerplate, refactor cơ học, viết test theo spec rõ, tra cứu API. **Bắt buộc verify tay** ở: logic nghiệp vụ lõi (nhất là tiền/on-chain ở Avatar48), bảo mật, và số liệu — vì AI hay "tự tin sai". Một lần Cursor đề xuất tính toán swap dùng số float gọn đẹp nhưng sai về độ chính xác decimals — tôi phát hiện nhờ test biên và đổi sang BigInt. Nguyên tắc của tôi: **AI để tăng tốc, không thay phán đoán**; chỗ rủi ro cao thì luôn có test và review của con người.

---

## Phụ lục — Câu hỏi bạn nên hỏi ngược nhà tuyển dụng

- Sản phẩm chính của AlphaSphere đang ở giai đoạn nào, team kỹ thuật quy mô ra sao?
- Stack chủ đạo là React hay Angular, NestJS hay Express? Có dùng microservices không?
- Quy trình review, CI/CD, và mức độ tự chủ của một engineer mid/senior?
- Kỳ vọng cho 3–6 tháng đầu của vị trí này là gì?
- Lộ trình phát triển lên Tech Lead/Senior như thế nào?