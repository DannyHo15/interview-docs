# 💾 Case 6 — Cache invalidation & cache stampede

> **Loại:** Backend / Caching · **Tần suất:** 🔥🔥🔥 (cit. "hai điều khó nhất: cache invalidation và đặt tên biến").
> **Câu hỏi mẫu:** *"Hot key trong Redis hết hạn, 1000 request cùng lúc, tất cả đập vào DB — xử lý sao?"*

---

## Đặt vấn đề

Cache (Redis) giảm tải DB. Nhưng cache có **TTL** — khi hết hạn:

```
Cache expire
   ↓
Request 1: miss → query DB (2s) → set cache
Request 2: miss (vẫn đang query) → query DB (2s) → set cache
...
Request 1000: miss → query DB (2s) → set cache
```

→ **1000 request cùng đập DB** trong 2s window (cache-aside mặc định). DB quá tải, latency tăng vọt. Đây gọi là **cache stampede** (hay *thundering herd*, *dog-pile*).

**Mục tiêu:** khi cache miss, **chỉ 1 request** đi xuống DB, các request còn lại **chờ kết quả** hoặc dùng stale data.

---

## Bước 1 — Recap cache strategies

| Strategy | Flow | Khi nào |
|---|---|---|
| **Cache-aside** (lazy loading) | App check cache → miss → query DB → set cache | Phổ biến nhất, read-heavy |
| **Write-through** | App ghi cache + DB cùng lúc | Cần consistency cao, chịu write chậm |
| **Write-back** (write-behind) | App ghi cache → async sync DB | Write-heavy, chấp nhận rủi ro mất dữ liệu |
| **Refresh-ahead** | Cache tự refresh trước khi expire | Hot key, không muốn miss |

> Cache stampede xảy ra chủ yếu với **cache-aside** vì TTL là điểm "tất cả cùng miss".

---

## Bước 2 — Giải pháp cache stampede

### 1. Request coalescing / singleflight

Chỉ 1 request đi xuống DB, request cùng key **chờ promise chung**:

```js
const inflight = new Map();  // key → Promise

async function getWithCache(key) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Đang có request khác query cùng key? → chờ chung
  if (inflight.has(key)) return inflight.get(key);

  const promise = queryDB(key).then(async (data) => {
    await redis.setex(key, 300, JSON.stringify(data));
    inflight.delete(key);
    return data;
  });
  inflight.set(key, promise);
  return promise;
}
```

→ 1000 request cùng key → chỉ 1 query DB, 999 cái chờ promise → DB chỉ nhận 1 query.

**Hạn chế:** chỉ hoạt động trong **1 instance BE**. Nhiều instance → mỗi instance vẫn 1 query (n instance = n query). Cần distributed lock (xem #3).

### 2. Mutex / distributed lock (Redis)

```js
async function getWithLock(key) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Thử lấy lock
  const lockAcquired = await redis.set(`lock:${key}`, '1', 'NX', 'EX', 10);
  if (!lockAcquired) {
    // Người khác đang query → chờ rồi retry cache
    await sleep(100);
    return getWithLock(key);  // recursive retry
  }

  try {
    // Double-check sau khi lock (có thể đã được fill)
    const cached2 = await redis.get(key);
    if (cached2) return JSON.parse(cached2);

    const data = await queryDB(key);
    await redis.setex(key, 300, JSON.stringify(data));
    return data;
  } finally {
    await redis.del(`lock:${key}`);
  }
}
```

→ Dùng cho **đa instance**: chỉ 1 instance giữ lock → query DB. Các instance khác rớt lock → chờ → retry cache (lúc này đã được fill).

### 3. Early expiration (XFetch / probabilistic early refresh)

Refresh cache **trước khi expire** để user không bao giờ thấy miss:

```js
const TTL = 300;
const beta = 1;

async function getSmart(key) {
  const { value, ttl } = await redis.getWithTTL(key);
  if (value) {
    // Probabilistic early refresh: càng gần expire, xác suất refresh càng cao
    const delta = -beta * ttl * Math.log(Math.random());
    if (delta > 0) {
      // Refresh nền, vẫn trả stale value cho user
      refreshInBackground(key);
    }
    return JSON.parse(value);
  }
  // Miss thật → query + lock
  return getWithLock(key);
}
```

→ User luôn thấy **stale data** (từ cache) trong khi BE refresh nền. Không bao giờ miss. Đây là thuật toán **XFetch** (dùng ở Netflix, Reddit).

### 4. Bloom filter (cho "key chắc chắn không có")

Trước khi query DB, check **bloom filter** (bộ nhớ siêu nhỏ) xem key có tồn tại không. Nếu bloom nói "không" → trả 404 ngay, đừng đập DB.

→ Giữa **cache penetration** (attacker query key không tồn tại để đánh DB).

---

## Bước 3 — Bảng chọn giải pháp

| Vấn đề | Giải pháp |
|---|---|
| Cache stampede (hot key expire) | Mutex/singleflight + early refresh |
| Cache penetration (query key không tồn tại) | Bloom filter hoặc cache negative result (`null` có TTL ngắn) |
| Cache breakdown (1 key chết) | Distributed lock, fallback stale |
| Cache avalanche (nhiều key cùng expire) | **Jitter TTL** (thêm random ±10%) để không cùng lúc expire |
| Cold start (DB mới lên, cache rỗng) | Warm up cache trước khi open traffic |

---

## Bước 4 — Cache invalidation: khó nhất

"Cache invalidation is hard" — biết khi nào cache **cũ** để xóa/vô hiệu:

### Khi nào invalidate?

| Trigger | Ví dụ |
|---|---|
| **Write-through** | Mỗi khi ghi DB → ghi đè cache. Consistent, chậm. |
| **Event-driven** | DB change (CDC/trigger) → event → xóa cache. Tự động. |
| **TTL** | Đợi hết hạn. Đơn giản, có window inconsistency. |
| **Manual** | Admin API xóa cache. Cho hot fix. |

### Vấn đề kinh điển: race condition invalidate

```
T1: update DB
T2: (cache vẫn cũ)
T3: xóa cache
T4: request đến, cache miss → query DB (đã update) → set cache (mới) ✅
```

Nhưng nếu thứ tự bị đảo:

```
T1: xóa cache
T2: request đến, miss → query DB (CŨ, chưa update) → set cache (CŨ)
T3: update DB
T4: cache giờ chứa data CŨ, DB chứa data MỚI → MISMATCH!
```

→ **Cache-aside** có window inconsistency. Giải pháp: **delayed double-delete**:

```
1. Xóa cache
2. Update DB
3. Sleep một chút (vd 500ms)
4. Xóa cache lần 2 (bắt trường hợp T2 set cache cũ)
```

Hoặc dùng **version/etag** trên cache entry — chỉ accept cache nếu version khớp.

---

## Bước 5 — Trade-off consistency

| Yêu cầu | Strategy | Trade-off |
|---|---|---|
| **Strong consistency** | Write-through + lock | Chậm write, phức tạp |
| **Eventual (vài giây lag)** | TTL + cache-aside | Đơn giản, phổ biến |
| **Best-effort** (UX ưu tiên) | Stale-while-revalidate | Luôn trả cache, refresh nền |

> 💡 **Thực tế:** 90% case chấp nhận **eventual consistency vài giây**. Đừng strong-consistency mọi thứ — phức tạp + chậm.

---

## Bẫy thường gặp

- **TTL không jitter** → 1000 key cùng expire lúc 12:00:00 → avalanche. Thêm random ±10%.
- **Cache miss mà không lock** → stampede. Có singleflight/lock.
- **Quên invalidate khi update** → user thấy data cũ hoài. Wire write event → clear cache.
- **Cache "vô hạn"** (không TTL) → memory leak, data stale vĩnh viễn. Luôn có TTL + LRU eviction.
- **Tin cache là chân lý** → cache có thể lỗi/cũ. Critical logic phải verify với DB (vd check tồn kho trước khi thanh toán).

---

## Câu hỏi nối tiếp

- *"Cache Redis sập thì sao?"* → Circuit breaker: nếu Redis down, BE **fallback** thẳng DB (accept chậm hơn) hoặc trả stale từ local memory. Đừng để Redis sập kéo theo toàn app.
- *"Stale-while-revalidate là gì?"* → Trả stale cache ngay lập tức (nhanh), đồng thời refresh nền. Lần sau user thấy data mới. Trade-off: user có thể thấy data cũ 1 lần, nhưng không bao giờ miss.
- *"Cache local (in-process) hay Redis?"* → Local (Map/LRU) cho **read-only tĩnh** (config, dictionary) — không có consistency cross-instance. Redis cho data shared, có TTL, có eviction.
- *"Khi nào KHÔNG nên cache?"* → Data thay đổi liên tục (cache luôn cũ), hoặc query rất nhẹ (cache overhead > lợi). Caching có cost — đừng cache mặc định.

> **Câu chốt phỏng vấn:** "Cache stampede là khi hot key expire, mọi request đập DB cùng lúc. Em dùng **distributed lock + singleflight** để chỉ 1 request xuống DB, cộng **XFetch early refresh** để user không bao giờ thấy miss. Phía invalidation, em chấp nhận eventual consistency với TTL có jitter tránh avalanche, và dùng double-delete cho write-after-read race. Cache là tối ưu — luôn có fallback khi nó sai."
