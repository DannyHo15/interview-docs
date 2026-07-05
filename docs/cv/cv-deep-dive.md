# 📄 CV Deep-Dive — Hồ Thành Danh (Câu hỏi xoay quanh CV)

> Câu hỏi experience + deep-dive từng project. Mỗi câu: **câu hỏi interviewer (EN) → gợi ý trả lời (VN) → follow-up có thể bị đào.** 🔥 = gần như chắc chắn hỏi.

---

## 1. Behavioral / Experience (STAR method) 🔥

### 1.1 🔥 "Tell me about yourself." / "Walk me through your resume."

**Gợi ý trả lời (VN — điểm cần cover, ~90 giây):**
- Mở: 4 năm Full-Stack SWE, backend-heavy nhưng ship end-to-end (web + mobile + web3/AI).
- Quan trọng nhất: **khả năng owning một product line end-to-end** — đã sole-engineer trên **InspectAI** (real-time NLP trên Google Meet, K8s) và **AI Communication Backend** (Elysia/Bun).
- Backend mạnh: **NestJS + CQRS** (Avatar48 — 38+ modules), **Bun/Elysia** (LoLamBenhAn — EMR), microservices RabbitMQ (GenCodify).
- Frontend: **Next.js 15**, React Native (TypingAstro — RN 0.79/Expo 53, Clean Architecture).
- Enterprise: **EVN GENCO3** — dashboard 25+ modules, RBAC, OIDC SSO.
- Đóng: "Đang tìm role Frontend + React Native Mid-Senior để kết hợp tư duy product + nền backend vững."

**Follow-up:** interviewer sẽ chốt vào 1-2 project để drill → xem phần 2.

---

### 1.2 🔥 "Why this company / this role?"

**Gợi ý:**
- Nghiên cứu trước: **product field** + **tech stack** của họ khớp phần nào trong CV (mobile RN / Next.js / real-time).
- Nói cụ thể: "Role này match vì [RN cho product-facing app] + [team có người giỏi để học hỏi architecture]."
- Tránh: trả lời chung chung "đây là công ty tốt".

**Follow-up đào:** "Anh đã tìm hiểu sản phẩm X của chúng tôi chưa? Nếu được refactor thì anh đổi gì?"

---

### 1.3 🔥 "Why are you leaving your current job?"

**Gợi ý (luôn positive):**
- NNG: học được enterprise-scale + lead team 4, nhưng muốn quay sang **product-focused + mobile/RN**.
- Đừng nói xấu công ty cũ → xoay sang "tìm scope rộng hơn / closer to product / mobile-focused".

**Follow-up:** "Tại sao không ở lại NNG để lên Senior internal?" → trả lời: scope NNG tập trung enterprise outsource, không có product mobile own-by-me.

---

### 1.4 🔥 "What's the biggest technical challenge you've faced and how did you solve it?"

**Gợi ý (chọn 1 — mạnh nhất):**
- **Avatar48** — bonding curve + real-time Solana trades, xử lý race condition giữa QuickNode webhook và Socket.IO broadcast.
  - **Action**: queue BullMQ + idempotency key, snapshot trade vào Redis rồi broadcast.
  - **Result**: 0 duplicate trades, live latency < 200ms.
- **HOẶC** **NNG e-commerce** — render 8s → 1s.
  - **Action**: lazy-load module, virtualization, memoize heavy selectors, CDN + HTTP cache, code-splitting theo route.
  - **Result**: -87% load time.

**Follow-up:** "Làm sao anh đo được 8s→1s? Metric nào? Lighthouse? Web Vitals?"

---

### 1.5 🔥 "Tell me about a time you led a team." (NNG team of 4)

**Gợi ý (STAR):**
- **Situation:** NNG — pen-test báo 3 high / 13 medium / 8 low vulnerabilities trên 1 project enterprise.
- **Task:** lead team 4, fix toàn bộ trong 2 tuần trước go-live.
- **Action:**
  - Phân loại theo severity + CVSS → high trước.
  - Chia ticket theo owner + skill (XSS vs SSRF vs SQLi).
  - Daily standup 15p tracking, pair programming cho bug khó.
  - Thêm regression test cho mỗi fix.
- **Result:** 100% close before deadline, 0 regression.

**Follow-up:** "Có ai trong team không đồng ý cách fix của anh không? Anh xử lý thế nào?"

---

### 1.6 "Tell me about a mistake or failure and what you learned."

**Gợi ý:**
- Thực tế: ship feature mà quên edge case (vd: IAP restore purchase ở TypingAstro) → user khiếu nại.
- Lesson: luôn viết checklist edge-case cho payment/IAP + QA trên thiết bị thật (không chỉ simulator).
- Quan trọng: **show growth**, không đổ lỗi.

**Follow-up:** "Bài học đó thay đổi workflow của anh thế nào đến giờ?"

---

### 1.7 "Describe a conflict with a teammate or PM."

**Gợi ý:**
- PM yêu cầu feature nhanh, mình muốn code đúng (test + refactor).
- **Resolution:** đề NSW compromise — ship MVP nhanh với feature flag, plan refactor ngay sprint sau.
- Khẳng định: data-driven (đưa số liệu debt), không cảm tính.

---

### 1.8 🔥 "What's the project you're most proud of and why?"

**Gợi ý (chọn Avatar48 hoặc InspectAI):**
- **Avatar48**: vì phức tạp nhất — CQRS 38+ modules, real-time Solana, multi-chain swap router. Tự học Web3 từ con số 0.
- **InspectAI**: vì **sole engineer** end-to-end — từ architecture → K8s deploy → Gemini NLP pipeline. Tự quyết mọi technical decision.

**Follow-up:** "Điều gì anh sẽ làm khác nếu làm lại?"

---

### 1.9 "Solo (InspectAI / AI Communication) vs Team (NNG, Avatar48) — which do you prefer?"

**Gợi ý:**
- Cả hai đều có giá trị: solo dạy **ownership + architecture decision**, team dạy **communication + code review discipline**.
- Mid-Senior cần cả hai → mình cân bằng được.

---

### 1.10 "What are your strengths and weaknesses?"

**Gợi ý:**
- **Strengths:** breadth (web/mobile/backend/web3/AI), ownership, học nhanh domain mới (chứng minh bằng Web3 từ 0).
- **Weaknesses (thành thật):** đôi khi over-engineer (vd: Clean Architecture cho app nhỏ) → đã tự nhận thức + balance với YAGNI.

---

### 1.11 "Where do you see yourself in 3 years?"

**Gợi ý:**
- Senior Frontend/RN, owns 1 product line end-to-end.
- Mentor junior + có thể làm tech lead nhỏ.
- Tránh: "lên manager" (role này dev-track).

---

### 1.12 🔥 "What's your salary expectation?" (VN context)

**Gợi ý:**
- Nghiên cứu range market cho Mid-Senior RN ở HN/HCM (~$1500–$2500 net tùy công ty product/outsorce).
- Đưa **range** chứ không số cứng: "Tùy scope + benefit, em đang target khoảng X–Y. Nhưng flexible nếu môi trường + product match."
- Luôn hỏi lại: "Budget range của anh/chị cho role này là bao nhiêu?"

---

## 2. Project Deep-Dive (interviewer sẽ drill) 🔥

### 2.1 🔥 Avatar48 — AI Agent Token Launchpad (Solana)

**Stack:** NestJS + CQRS (38+ modules), Solana Web3/Metaplex/Raydium, bonding curve, Uniswap Smart Order Router, QuickNode webhook → BullMQ, Socket.IO, Next.js 15 (Privy, TradingView, OKX DEX, React Query + Zustand, GSAP), i18n 4 locales.

**Q1. 🔥 "Why CQRS? Isn't it overkill for a token launchpad?"**
**Điểm cần cover:**
- CQRS tách **write path** (mint/buy/sell — cần validation, event sourcing) với **read path** (orderbook, trade history, charts — cần query nhanh).
- Write → commands → handlers → event store; Read → projections (materialized views) Redis/Postgres.
- Lợi ích: scale read độc lập (real-time chart reads gấp 100x writes), audit log mọi transaction, dễ replay state.
- Trade-off: complexity, eventual consistency giữa write & read model → cần idempotent projections.

**Follow-up hiểm:** "Eventual consistency giữa write và read — user vừa buy xong nhưng UI chưa update, anh xử lý?" → optimistic UI + Socket.IO broadcast sau khi projection catch up.

---

**Q2. 🔥 "Explain the bonding curve. How does it work and what are the risks?"**
**Điểm cần cover:**
- Bonding curve = function `price = f(supply)` — buy mint token tại price theo curve, sell cũng theo curve (always liquidity).
- Constant product / linear / exponential — Avatar48 dùng loại nào (nêu rõ công thức nếu nhớ).
- **Risks:**
  - Sniper bot front-run buy ở price thấp → cần anti-bot (whitelist, rate limit, slippage).
  - Death spiral: sell cascade → price sập → panic.
  - Migration lên Raydium khi đạt market cap threshold (gradual liquidity).
- Smart contract audit (nếu có) + on-chain validation.

**Follow-up:** "Làm sao chống bot snipe lúc launch?" →commit-reveal, holder whitelist, tx priority fee,QuickNode dedicated RPC.

---

**Q3. 🔥 "How do you scale real-time trades with Socket.IO?"**
**Điểm cần cover:**
- Adapter Redis (pub/sub) → multiple Node instances broadcast đồng bộ.
- Room per token (user subscribe token A chỉ nhận events của A) → tránh fan-out toàn server.
- Backpressure: batching events (vd: 100ms window gộp nhiều trades thành 1 broadcast).
- Connection scale: sticky session + horizontal scaling, Heartbeat/ping.

**Follow-up:** "10k concurrent users subscribe 1 token, broadcast chokes — anh tối ưu gì?" → batching, sampling, drop non-critical events.

---

**Q4. 🔥 "How does QuickNode webhook → BullMQ work?"**
**Điểm cần cover:**
- QuickNode webhook fire on Solana event (token transfer, swap) → POST vào NestJS endpoint.
- Endpoint validate signature (Helius/QuickNode secret) → push job vào BullMQ (Redis-backed) → return 200 ngay (non-blocking).
- BullMQ worker process: update projection, broadcast Socket.IO, calc bonding curve price.
- Idempotency: dùng tx signature làm dedup key → retry webhook không double-process.

**Follow-up:** "Webhook tới nhưng Redis down → mất job?" → DLQ (dead letter queue) + retry + persist raw webhook vào Postgres trước khi queue.

---

**Q5. "How does multi-chain swap routing work? (Uniswap Smart Order Router)"**
**Điểm cần cover:**
- SOR query nhiều pool/DEX (Uniswap V2/V3, Sushi, Pancake) → tìm path có best price + lowest gas.
- Split trade across pools nếu lợi hơn (multi-hop).
- Slippage tolerance + deadline check on-chain.
- Cache pool reserves (Redis, TTL ngắn) → giảm RPC call.

**Follow-up:** "MEV bot sandwich — anh chống thế nào?" → slippage thấp, private mempool (Flashbots Protect), split large order.

---

### 2.2 🔥 InspectAI — Real-time Meeting Language Monitoring (SOLE ENGINEER)

**Stack:** NestJS 11, TypeORM, Redis, BullMQ, Gemini, GCP Natural Language, Next.js 15, Socket.IO, K8s.

**Q1. 🔥 "You were the sole engineer. Walk me through your workflow and decision-making."**
**Điểm cần cover:**
- Quy trình: requirement từ stakeholder → spec doc (RFC ngắn) → architecture diagram → review với advisor/PM → implement → deploy → monitor.
- Technical decisions tự quyết: stack choice (NestJS vs bare Express — chọn NestJS vì module + DI), DB (Postgres + Redis cache), deploy (K8s vì cần scale worker NLP độc lập với API).
- Trade-off documented trong ADR (Architecture Decision Records).
- Hạn chế sole: không có reviewer → tự self-review + dùng Claude Code/Cursor audit + automated test.

**Follow-up:** "Sole engineer thì ai challenge architecture của anh?" → thú nhận: đây là risk → đọc blog, ask community, ADR cho mọi quyết định lớn.

---

**Q2. 🔥 "Architecture of the real-time NLP pipeline?"**
**Điểm cần cover:**
- Audio stream từ Google Meet (Capture API / extension) → stream tới backend qua WebSocket.
- Worker: STT (speech-to-text) streaming → chunk text → Gemini/GCP NLP analyze (toxicity, sentiment, policy violation).
- BullMQ queue: tách audio ingestion (latency-sensitive) khỏi NLP analysis (CPU-heavy).
- Socket.IO push flagged events tới dashboard Next.js real-time.
- Latency target: < 2s từ speak → flag.

**Follow-up:** "NLP analysis chậm, queue backlog → flag trễ — anh xử lý?" → priority queue (urgent cho toxicity), backpressure drop non-critical, scale worker HPA K8s.

---

**Q3. "K8s deployment decisions — why K8s for a single-engineer project?"**
**Điểm cần cover:**
- Lý do: tách 3 workload (API server / WebSocket gateway / NLP worker) thành deployment riêng → scale độc lập.
- HPA trên queue depth (worker scale khi backlog tăng).
- Ingress + cert-manager auto TLS.
- Trade-off: complexity ops cao → dùng Helm chart + GitOps (ArgoCD nếu có).

**Follow-up:** "Overkill không? Docker compose không đủ?" → thành thật: với MVP thì compose đủ; K8s đáng giá khi multi-tenant + scale predict được.

---

**Q4. "How did you handle real-time latency for live monitoring?"**
**Điểm cần cover:**
- Streaming STT (không batch) — chunk audio 250ms.
- Pipeline parallel: STT + NLP chạy concurrent, không block.
- Cache model response cho câu common (LRU).
- Coalesce events: nếu nhiều flag trong 1s → gộp 1 broadcast.

---

### 2.3 🔥 TypingAstro — React Native (Clean Architecture)

**Stack:** RN 0.79, Expo 53, Clean Architecture (entity/repo/usecase), IAP, biometric, Firebase Auth + App Check, EAS multi-env, Sentry.

**Q1. 🔥 "Why Clean Architecture for a mobile app? Isn't it over-engineering?"**
**Điểm cần cover:**
- Phòng thủ: thành thật — CA có thể overkill cho UI-heavy app đơn giản. Nhưng TypingAstro có: IAP (platform diff), biometric, remote config, multi-env → nhiều side-effect cần testable.
- Lợi ích thực: swap implementation (vd: đổi Firebase Auth sang custom) không ảnh hưởng UI; unit test usecase không cần mock React Native.
- Trade-off: boilerplate nhiều → balance bằng cách chỉ apply CA ở domain layer, UI giữ đơn giản.

**Follow-up:** "Overhead maintain có đáng không?" → trả lời: với team 1-2 người thì có thể skip; với team cần onboard người mới + long-term maintain thì đáng.

---

**Q2. 🔥 "IAP edge cases — restore purchase, refund, platform differences?"**
**Điểm cần cover:**
- **Restore purchase:** App Store / Play Store cung cấp API restore → cần idempotent (không charge lại, chỉ re-grant entitlement).
- **Refund:** webhook server-side (App Store Server Notifications V2 / Play RTDN) → revoke entitlement.
- **Platform diff:** iOS sandbox account test, Android test track; receipt validation server-side cho cả 2.
- **Edge cases:** family sharing, intro offer abuse, expired card → sync entitlement state qua Firebase custom claims.
- **Receipt fraud:** validate server-side, không trust client.

**Follow-up:** "User claim đã mua nhưng entitlement không có — debug thế nào?" → check receipt, server log, App Store/Play Console order lookup.

---

**Q3. "What problem does Firebase App Check solve?"**
**Điểm cần cover:**
- App Check = attestation device thật + app signed → chặn bot/spam call Firestore/Functions từ outside app.
- Protect: Firestore, Storage, Functions, RTDB.
- Trade-off: có thể block user dùng custom ROM → cần debug token + fallback attestation provider.

**Follow-up:** "App Check break production lần nào chưa?" → test kỹ trên TestFlight / Internal test trước rollout; debug token cho QA.

---

**Q4. "EAS multi-env setup — how?"**
**Điểm cần cover:**
- EAS profiles (development / staging / production) trong `eas.json`.
- Env var per profile (EAS Environment Variables + `.env` files dùng `babel-plugin-transform-inline-environment-variables`).
- App identifier / bundle ID khác nhau per env để cài song song.
- Build channel + Update channel khác nhau → OTA update targeted.

**Follow-up:** "Làm sao đảm bảo secret không leak vào client bundle?" → secret nhạy cảm (server API key) giữ server-side (Functions), client chỉ nhận short-lived token.

---

**Q5. "Performance — typing app cần smooth. Tối ưu chart/stats thế nào?"**
**Điểm cần cover:**
- Reanimated 3 cho animation 60fps off UI thread.
- FlashList thay FlatList cho long list.
- Memo + useCallback cho WPM calculation (heavy math).
- Charts: Victory Native / React Native Charts → avoid re-render bằng `pure` + data diffing.
- Sentry performance monitoring + JS thread FPS.

---

### 2.4 🔥 EVN GENCO3 — Enterprise Dashboard (25+ modules)

**Stack:** Ant Design Pro, ECharts, OIDC SSO, RBAC, multi-tab keep-alive, Zustand, i18next (3 ngôn ngữ).

**Q1. 🔥 "RBAC design — how?"**
**Điểm cần cover:**
- Role → permissions (action × resource): `["report:read", "user:write"]`.
- Frontend: route guard + component-level directive (`<HasPermission action="user:write">`).
- Backend: middleware check permission per API.
- Source of truth: server trả permissions trong user profile → cache Zustand.
- Granularity: role + permission tách bạch (tránh hardcode role trong code).

**Follow-up:** "User có 2 role conflict permission — anh resolve thế nào?" → union permission (deny-by-default → allow nếu 1 role có).

---

**Q2. 🔥 "OIDC SSO flow — walk me through."**
**Điểm cần cover:**
- Authorization Code flow + PKCE.
- Redirect → IdP login → callback với code → exchange token → store access/refresh token (httpOnly cookie hoặc secure storage).
- Silent refresh token trước expiry.
- Logout: RP-initiated logout → clear session IdP + local.

**Follow-up:** "Token expired giữa session — anh refresh thế nào mà không disrupt user?" → silent refresh via iframe/refresh token, interceptor retry 401.

---

**Q3. 🔥 "Multi-tab keep-alive — how do you implement it?"**
**Điểm cần cover:**
- Tab management: Zustand store list of active tabs (path, label, key).
- Component cache: `<KeepAlive>` wrapper (dùng `react-activation` hoặc custom portal) → unmount tab không destroy DOM, chỉ ẩn.
- Memory trade-off: giới hạn max tab cached (vd 10) → LRU evict.
- Scroll position restore + form state preserve.

**Follow-up:** "10 tab cached → memory leak — anh xử lý?" → evict policy + cleanup listeners (socket, interval) khi unmount thật.

---

**Q4. "State management for 25+ modules — why Zustand over Redux?"**
**Điểm cần cover:**
- Zustand: less boilerplate, slice per module, no provider hell.
- Composable: hook-based, TS-friendly.
- Selectors để tránh re-render thừa.
- Trade-off: Redux có DevTools + middleware ecosystem mạnh hơn, nhưng overhead không đáng cho dashboard này.

---

**Q5. "i18n — 3 languages, how is it organized?"**
**Điểm cần cover:**
- `react-i18next` + namespace per module → lazy load namespace khi vào route.
- Key naming: `module.submodule.key`.
- Switch language không reload app → `i18n.changeLanguage`.
- Number/date format qua `Intl` (currency VND/USD, date locale).

---

### 2.5 🔥 GenCodify — Micro-frontend + Realtime Collab

**Stack:** Nx Module Federation, CraftJS drag-drop, Yjs CRDT + Hocuspocus, NestJS microservices RabbitMQ, publisher deploy S3 + CDN.

**Q1. 🔥 "How does Yjs CRDT realtime collab work? Conflict resolution?"**
**Điểm cần cover:**
- Yjs = CRDT (Conflict-free Replicated Data Type) → mỗi client giữ local state, merge deterministically không cần central authority.
- Update dạng binary diff broadcast qua Hocuspocus (WebSocket server) → all peers apply.
- Conflict: CRDT guarantee convergence (cuối cùng mọi client cùng state) — ví dụ Y.Text dùng insertion index + client ID để break tie.
- Awareness: cursor position, presence (ai đang typing) — broadcast riêng, không persist.
- Undo/redo: Y.UndoManager.

**Follow-up:** "2 user sửa cùng 1 element thuộc tính khác nhau — final state?" → CRDT merge từng key, cuối cùng = last-write-wins per key (có timestamp/clientID tiebreak).

---

**Q2. 🔥 "Module Federation micro-frontend — trade-offs?"**
**Điểm cần cover:**
- Lợi ích: deploy độc lập từng micro-app, team chia theo domain, shared deps (React) không duplicate.
- Trade-offs:
  - Version mismatch shared dep (React 17 vs 18) → strict shared config.
  - Build complexity (webpack 5 MF config + Nx orchestration).
  - Runtime error nếu remote app down → fallback UI.
  - Type sharing khó → dùng `@module-federation/typescript`.
- Khi nào dùng: large team, multi-domain, independent release cadence.

**Follow-up:** "Remote app deploy breaking change làm host crash — rollback thế nào?" → contract test + version pin remote URL + canary deploy.

---

**Q3. "Publisher service deploy flow — S3 + CDN?"**
**Điểm cần cover:**
- User click Publish → service pack build output (HTML/CSS/JS) → upload S3 với unique hash folder.
- Invalidate CloudFront CDN cho path đó.
- Return public URL cho user.
- Async: BullMQ queue cho build/publish, webhook notify khi xong.
- Cleanup: lifecycle policy S3 xóa preview cũ sau N ngày.

**Follow-up:** "Build fail giữa chừng — partial upload — anh xử lý?" → upload staging folder, atomic move khi xong; hoặc S3 multipart + complete chỉ khi all parts OK.

---

### 2.6 🔥 LoLamBenhAn — EMR (Elysia + Next.js)

**Stack:** Bun/Elysia, Next.js 15, React Hook Form + Zod, WebSocket multi-clinician, DDD, Drizzle ORM.

**Q1. "Dynamic form builder — how did you design it?"**
**Điểm cần cover:**
- Form schema (JSON) define field type, validation, conditional logic → store DB.
- Renderer: React Hook Form + Zod schema generate dynamic từ JSON schema.
- Validation: Zod infer type từ schema → type-safe cả client + server.
- Extensibility: plugin field type (text/select/table/signature).

---

**Q2. 🔥 "WebSocket multi-clinician collaboration — conflict handling?"**
**Điểm cần cover:**
- Mỗi form instance = 1 room WebSocket.
- Broadcast field change tới all peers (như Google Docs).
- Conflict: last-write-wins + presence (ai đang sửa field nào) → highlight.
- Persistence: debounce save → server, optimistic update client.
- Alternative nâng cao: Yjs CRDT cho EMR (như GenCodify) → nhưng overhead, last-write-wins đủ cho medical form.

**Follow-up:** "2 bác sĩ sửa cùng 1 field — ai win?" → last-write-wins + audit log (ai sửa lúc nào) cho compliance.

---

**Q3. "DDD in Elysia — how does it fit?"**
**Điểm cần cover:**
- Elysia không ép architecture → tự organize folder: domain/ (entity, value object), application/ (use case), infrastructure/ (Drizzle repo impl), interface/ (controller).
- Domain entity thuần logic không dep framework.
- Use case orchestrate repo + entity.
- Benefit: test domain logic không cần HTTP context.

---

### 2.7 🔥 NNG Achievements (drill-specific)

**Q1. 🔥 "E-commerce load 8s → 1s. Specifically — what algorithm / lazy / caching?"**
**Điểm cần cover (nêu CỤ THỂ):**
- **Lazy load:** route-level code splitting (`React.lazy` + Suspense), heavy module (chart, map) load on demand.
- **Virtualization:** `react-window` cho long list (product list 1000+ items) → render chỉ visible items.
- **Memoization:** `useMemo` cho expensive selectors (filter/sort), `React.memo` cho pure components.
- **Caching:**
  - HTTP cache: `Cache-Control` immutable cho static assets, CDN (Cloudflare) cho image.
  - API cache: stale-while-revalidate (React Query) cho product list.
  - Service Worker cache offline (PWA).
- **Bundle:** tree-shaking, dynamic import thư viện heavy (lodash → lodash-es per-method).
- **Image:** WebP + responsive `srcset`, lazyload below-fold.
- **Metrics:** Lighthouse, Web Vitals (LCP, FID, CLS) trước/sau.

**Follow-up:** "8s chủ yếu do bước nào? TTFB hay client render?" → profile Lighthouse, xác định bottleneck (thường bundle size + API waterfall).

---

**Q2. 🔥 "Led team 4 to fix pen-test 3 high / 13 medium / 8 low — process?"**
**Điểm cần cover:**
- Triage theo CVSS + exploitability → high trước (SQLi, SSRF, RCE).
- Mỗi vuln: root cause analysis → fix pattern + regression test.
- Phân công theo skill (XSS cho junior, auth bypass cho senior).
- Daily standup 15p tracking burndown.
- Re-scan + retest trước close.
- Kết quả: 0 regression, pass pen-test lần 2.

**Follow-up:** "Vuln nào khó nhất? Chi tiết fix?" → chuẩn bị 1 case study (vd: SSRF qua webhook → whitelist URL + DNS pinning).

---

**Q3. 🔥 "Offline map server (OpenStreetMap/MapBox/Node) for data security — why?"**
**Điểm cần cover:**
- Context: data nhạy cảm (vd: vị trí asset enterprise) → không gửi ra cloud (Google Maps).
- Self-host: tile server từ OpenStreetMap data → render map trong internal network.
- Stack: `tileserver-gl` (vector tile) + MapLibre GL JS client (open-source fork MapBox).
- Node proxy layer auth + audit log mỗi map request.
- Lợi ích: 0 data leak, full control data sovereignty.

**Follow-up:** "Trade-off vs Google Maps?" → không có POI rich data, cần maintain tile server, nhưng security + cost (không pay-per-request) lợi hơn.

---

**Q4. "Angular multi-repo → Nx monorepo — migration strategy?"**
**Điểm cần cover:**
- Lý do: shared code duplicate giữa repo, dependency version drift, CI per repo chậm.
- Strategy:
  - Audit repo → extract shared library (ui-kit, utils, types).
  - Tạo Nx workspace + import từng repo giữ git history (git filter-repo).
  - Define dependency graph (`nx.json`), boundary linting.
  - CI incremental build (`nx affected`) → chỉ build changed.
- Migration gradual: không big-bang, từng app migrate.
- Result: build time -60%, share code dễ, dep consistent.

---

## 3. Câu hỏi "tricky" / phòng thủ (trả lời trước khi bị hỏi) 🔥

### 3.1 🔥 "Your CV has many projects, but only TypingAstro is React Native. Are you confident for an RN role?"

**Gợi ý (thành thật + xoay điểm mạnh):**
- Thú nhận: số lượng RN project ít hơn web/backend.
- Bù: TypingAstro là RN production-grade — Clean Architecture, IAP, biometric, EAS multi-env, Sentry → không phải demo toy.
- Background: 4 năm TypeScript + React → RN cùng ecosystem, chuyển rất nhanh.
- Đang actively invest thời gian vào RN (side project mới / contribute open-source RN).
- **Khép:** "Em tự tin vì đã ship 1 RN app end-to-end + nền React/TS vững. 2-3 tháng đầu em sẽ ramp-up nhanh."

---

### 3.2 🔥 "Your CV is heavy Web3/AI, but this is a stable product role. Won't you get bored?"

**Gợi ý:**
- Web3/AI là **stretch project** mình chủ động pick để học — không phải core identity.
- Core: **product engineering** — build app stable, maintainable, user-facing. EVN GENCO3, NNG, LoLamBenhAn đều là product enterprise.
- Mình thích stability + depth hơn hype → role này match.

---

### 3.3 🔥 "You have many side projects. Are you dedicated / focused?"

**Gợi ý:**
- Side project = cách mình học domain mới nhanh (Web3 qua Avatar48, RN qua TypingAstro) — không phải distraction.
- Tất cả đều **shipped** (production) → chứng minh finisher, không chỉ starter.
- Job chính luôn là priority — side project ngoài giờ.

---

### 3.4 🔥 "You use AI-augmented dev (Claude Code / Cursor). Do you actually code, or just prompt?"

**Gợi ý (rất quan trọng — interviewer sợ "prompt engineer"):**
- AI là **multiplier**, không thay thế. Mình vẫn:
  - Design architecture (CQRS, Clean Arch, DDD) → AI không tự nghĩ ra được.
  - Review mọi code AI generate → biết read code, không blind accept.
  - Debug khi AI sai → hiểu root cause.
- Bằng chứng: NNG pen-test fix, Avatar48 bonding curve logic — đều cần human reasoning.
- Khép: "AI giúp mình ship nhanh 2-3x, nhưng judgment + accountability vẫn là mình."

---

### 3.5 🔥 "4 years experience but you've been a lead — is that self-proclaimed?"

**Gợi ý:**
- Thành thật: "lead" ở NNG = **tech lead team 4 trên 1 project**, không phải whole-company CTO.
- Scope: technical decisions + code review + ticket assignment + mentor 3 junior.
- Không over-claim → nói rõ scope để build trust.
- Khép: "Em hiểu Senior/Lead cần scope rộng hơn, đó là lý do em tìm role này để grow đúng trajectory."

---

### 3.6 🔥 "Why job hopping? (nhiều project trong thời gian ngắn)"

**Gợi ý:**
- Phân biệt: nhiều project KHÔNG phải = nhiều employer. Có thể 1 employer nhiều project (outsource/product company).
- Nếu thực có switch: lý do clear (scope, product fit, learning) — không phải conflict.
- Khép: "Hiện tại em tìm nơi ở dài hạn 2-3 năm để deepen expertise."

---

### 3.7 "Explain the gap between [X] and [Y] in your timeline."

**Gợi ý:**
- Thành thật: học nghề / side project / family → không giấu.
- Nếu học: nói rõ đã học gì (RN, Web3) → biến gap thành upskill.

---

### 3.8 "Your English level?"

**Gợi ý:**
- Self-assess: B2 / IELTS nếu có.
- Trả lời: "Đọc/viết technical fluent, nói ở mức intermediate — em đang improve qua [course/practice]."
- Không over-claim → interviewer sẽ test ngay.

---

## 4. Câu hỏi nên HỎI LẠI interviewer

> Hỏi lại thông minh = +điểm lớn. Tránh hỏi generic ("culture thế nào"). Hỏi specific, technical, growth.

### 4.1 Technical / Architecture

**Q: "What's the most challenging technical problem the team is currently facing?"**
- **Tại sao hay:** show interest thực + biết được pain point → match skill của mình với problem.

**Q: "How is the codebase organized — monorepo, multi-repo? What's the testing strategy?"**
- **Tại sao hay:** signaling mình quan tâm engineering quality, đồng thời thu thập thông tin về môi trường mình sẽ vào.

---

### 4.2 Team / Process

**Q: "What does a typical sprint look like? How are decisions made — top-down or consensus?"**
- **Tại sao hay:** biết autonomy level + process fit.

**Q: "How big is the team I'd be joining? What's the ratio of senior to junior?"**
- **Tại sao hay:** biết mentorship dynamic + room để grow.

**Q: "How does code review work here? Who reviews the senior's code?"**
- **Tại sao hay:** show mình care about quality + reveal engineering culture (nếu không ai review senior → red flag).

---

### 4.3 Growth / Career

**Q: "What does success look like for this role in the first 6 months?"**
- **Tại sao hay:** clear expectation + show mình outcome-oriented.

**Q: "What's the typical career path for someone in this role — is there a Staff/Principal track, or is it management-only beyond Senior?"**
- **Tại sao hay:** show long-term thinking + biết công ty có IC track hay không.

---

### 4.4 Product / Business

**Q: "What's the biggest product challenge right now — user growth, retention, monetization?"**
- **Tại sao hay:** show mình nghĩ như product engineer, không chỉ code monkey.

**Q: "How do you measure the impact of an engineer here — LOC, features shipped, or business metrics?"**
- **Tại sao hay:** reveal culture (output vs outcome) + show mình care about impact.

---

## Ghi chú cuối

- File này = **bản đồ đào sâu**, không phải kịch bản học thuộc. Trước mỗi câu, **nói chuyện tự nhiên**, dùng bullet làm checklist điểm cần cover.
- Numbers (8s→1s, 25 modules, 4 team members, 3/13/8 vulns) → **phải nhớ chính xác**, interviewer sẽ cross-check.
- Mỗi project deep-dive → chọn 1-2 điểm mạnh nhất drill sâu, đừng lan man.
- STAR cho behavioral, **specific numbers** cho achievements, **honest + pivot** cho tricky.

---

🔗 [Quay lại danh sách folder](../)
