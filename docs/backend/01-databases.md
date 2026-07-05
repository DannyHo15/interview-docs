# 🗄️ 01 — Databases (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. SQL vs NoSQL? Khi nào dùng cái nào? 🔥

**Ngắn:**
- **SQL (Relational / RDBMS):** dữ liệu có cấu trúc, bảng có **schema cố định**, dùng **SQL**, tuân thủ **ACID** (PostgreSQL, MySQL).
- **NoSQL:** không (hoặc ít) quan hệ, **schema linh hoạt**, trade-off consistency để scale. Có 4 loại chính: **Key-Value** (Redis), **Document** (MongoDB), **Column-family** (Cassandra), **Graph** (Neo4j).

**Đào sâu — khi nào dùng:**
| Tiêu chí | Chọn SQL khi… | Chọn NoSQL khi… |
|----------|---------------|-----------------|
| Dữ liệu | Quan hệ rõ, structured, ít đổi schema | Linh hoạt, document, thay đổi liên tục |
| Transaction | Cần **ACID** (banking, order) | Chấp nhận eventual consistency |
| Scale | Chủ yếu **vertical**, scale-up | **Horizontal** dễ, scale-out |
| Query | Join phức tạp, ad-hoc | Truy vấn theo key đơn giản, read-heavy |
| Consistency | Strong | Eventual (thường) |

**Gotcha:**
- **"NoSQL không có ACID"** — sai. Một số (MongoDB 4+, CockroachDB, Spanner) có ACID; Cassandra có *tunable consistency*.
- Interviewer hỏi ngược: *"Vậy tại sao nhiều công ty vẫn dùng Postgres cho mọi thứ?"* → vì **đa số hệ thống không cần scale tới mức phải NoSQL**, và SQL + tooling reif hơn. Đừng NoSQL vì trend.
- **NewSQL** (CockroachDB, TiDB) = ACID + horizontal scale — thứ 3 giữa SQL & NoSQL.

---

## 2. Giải thích ACID? 🔥

**Định nghĩa:** 4 thuộc tính đảm bảo transaction **đáng tin cậy**:
- **Atomicity (Tính nguyên tử):** transaction là **all-or-nothing** — hoặc toàn bộ commit, hoặc rollback sạch. Không có "nửa commit".
- **Consistency (Tính nhất quán):** sau transaction, DB chuyển từ trạng thái hợp lệ → hợp lệ (toàn vẹn constraints, foreign keys, triggers).
- **Isolation (Tính cô lập):** các transaction chạy concurrently **không can thiệp** lẫn nhau (như chạy tuần tự).
- **Durability (Tính bền vững):** sau khi commit, dữ liệu **không mất** dù sập nguồn (ghi ra disk/WAL).

**Đào sâu:**
- ACID **Isolation** thực tế có nhiều mức (xem câu 4) — Serializable là cô lập hoàn toàn nhưng chậm, mức thấp hơn nhanh hơn nhưng có hiện tượng lạ.
- **Durability** thực hiện qua **WAL (Write-Ahead Log)** — ghi log trước khi apply, nên crash cũng recover được.

**Gotcha:**
- "Consistency" trong ACID **khác** "Consistency" trong **CAP** (CAP = mọi replica thấy cùng dữ liệu). Đừng nhầm!
- ACID có "giá" → giảm throughput. NoSQL thường buông bớt để scale (BASE: Basically Available, Soft state, Eventual consistency).

---

## 3. Index là gì? B-tree hoạt động thế nào? Khi nào tạo index? 🔥

**Ngắn:** Index = **cấu trúc dữ liệu phụ** giúp tìm nhanh (O(log N) thay vì O(N) scan cả bảng), giống **mục lục** cuốn sách.

**Đào sâu — B-tree / B+ tree:**
- **B-tree** (cân bằng): mỗi node có nhiều key + con; tìm kiếm nhị phân mở rộng → tree thấp, ít disk I/O.
- **B+ tree** (đa số DB dùng): dữ liệu thực chỉ ở **leaf node** (liên kết thành linked list) → range query (`BETWEEN`, `>`) cực nhanh, chỉ duyệt leaf.
- **Hash index:** O(1) cho `=`, nhưng **không hỗ trợ range**.
- **Composite index:** index nhiều cột; tuân theo **leftmost prefix** (dùng được nếu query đi từ cột đầu).
- **Clustered vs Non-clustered:** clustered = data vật lý sắp theo index (thường PK); non-clustered = con trỏ tới data.

**Khi nào tạo index:**
- Cột dùng trong `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY`.
- **Tránh:** cột ít dùng, bảng nhỏ, cột hay UPDATE (index phải maintain → chậm write).

**Gotcha:**
- **Mỗi index = chi phí write + storage.** Đừng index mọi thứ.
- `EXPLAIN` để xem query có dùng index không — index mà không được dùng = vô dụng.
- **Index không dùng được khi:** `WHERE LOWER(col)` (wrap bằng function), leading wildcard `LIKE '%abc'` (chỉ `'abc%'` dùng được index).
- Follow-up: *"Làm sao tối ưu query chậm?"* → EXPLAIN → thêm/chỉnh index → tránh `SELECT *` → denormalize nếu cần.

---

## 4. Transaction isolation levels + các hiện tượng? 🔥

**4 mức (từ lỏng → chặt), chuẩn SQL:**

| Level | Dirty Read | Non-repeatable Read | Phantom Read | Hiệu năng |
|-------|:---:|:---:|:---:|---|
| **Read Uncommitted** | ❌ có | ❌ có | ❌ có | nhanh nhất |
| **Read Committed** (default PG/Oracle) | ✅ | ❌ có | ❌ có | vừa |
| **Repeatable Read** (default MySQL) | ✅ | ✅ | ❌ có* | chậm hơn |
| **Serializable** | ✅ | ✅ | ✅ | chậm nhất |

**Các hiện tượng (anomalies):**
- **Dirty read:** đọc được dữ liệu transaction khác **chưa commit** (rồi rollback → đọc bậy).
- **Non-repeatable read:** đọc cùng row 2 lần → giá trị **khác nhau** (do tx khác UPDATE+commit giữa chừng).
- **Phantom read:** query lại → thấy **số dòng khác** (do tx khác INSERT/DELETE).
- *MySQL InnoDB với RR **chống phantom** bằng next-key locking.

**Đào sâu:**
- Trade-off: **isolation cao = consistency tốt nhưng lock nhiều = throughput giảm.**
- **MVCC (Multi-Version Concurrency Control):** DB (PostgreSQL, MySQL InnoDB) giữ nhiều version của row → reader không block writer, dùng cho Read Committed/Repeatable Read.
- **Serializable** thực tế qua **SSI (Serializable Snapshot Isolation)** hoặc locking nặng.

**Gotcha:**
- Default isolation **khác nhau giữa DB**: PostgreSQL = Read Committed, MySQL InnoDB = Repeatable Read. Đừng giả định!
- Follow-up: *"Làm sao chọn?"* → đa số app: Read Committed đủ. Banking/đếm tồn kho: Repeatable Read hoặc Serializable + locking.

---

## 5. N+1 query problem là gì? Cách giải? 🔥

**Ngắn:** Khi query danh sách N bản ghi, rồi với mỗi bản ghi lại phát sinh 1 query con → **N+1 queries** thay vì 1. Gây **latency & tải DB cao**.

**Ví dụ (ORM pitfall):**
```ts
// ❌ N+1: 1 query lấy users, rồi 1 query/profile cho mỗi user
const users = await User.findAll();           // 1
for (const u of users) {
  const p = await u.getProfile();             // N queries!
}

// ✅ Giải: JOIN / eager load trong 1 query
const users = await User.findAll({ include: Profile });  // 1 query (JOIN)
```

**Cách giải:**
- **Eager loading / JOIN** (`INNER JOIN`, `LEFT JOIN`) — load relation cùng lúc.
- **Batch / IN query:** lấy tất cả relation theo 1 batch `WHERE user_id IN (...)`.
- **DataLoader pattern** (GraphQL): gom các request relation cùng tick → 1 batch query.

**Gotcha:**
- ORM (Prisma, TypeORM, Sequelize) **mặc định lazy-load** → dễ N+1 nếu không `include`/`populate`.
- Theo dõi bằng **query log** + **APM** (Datadog) để phát hiện N+1.
- Follow-up: *"JOIN luôn tốt à?"* → JOIN bảng lớn = cartesian explosion; đôi khi **denormalize** hoặc **2 query + gom trong app** tốt hơn.

---

## 6. Normalization vs Denormalization?

**Normalization:** chia bảng thành nhiều bảng nhỏ, loại **redundancy**, đảm bảo **data integrity** (1NF→3NF/BCNF). → Tốt cho **write** (update 1 chỗ), tệ cho **read** (nhiều JOIN).

**Denormalization:** chủ động **lưu trùng lặp** để giảm JOIN, tăng tốc read. → Tốt cho **read-heavy / analytics**, tốn storage + khó sync.

**Khi nào:**
- OLTP (transactional) → normalize.
- OLAP / dashboard / scale read → denormalize (hoặc dùng **materialized view**, **read replica**).

**Gotcha:** Denormalize = tự chịu trách nhiệm **sync dữ liệu** (đổi tên user → cập nhật ở mọi nơi) → cần **triggers** hoặc **event-driven update**. Đừng denormalize quá sớm.

---

## 7. CAP theorem? 🔥

**Định nghĩa:** Trong hệ phân tán, khi **network partition (P)** xảy ra, chỉ chọn được **1 trong 2**:
- **C**onsistency (mọi node thấy cùng dữ liệu ở 1 thời điểm)
- **A**vailability (mọi request đều nhận được response, không lỗi)

→ **CP** (chọn consistency, từ chối serve khi partition) hoặc **AP** (chọn availability, serve dữ liệu có thể cũ).

**Đào sâu:**
- **P thực tế không tránh được** (network luôn có thể đứt) → hệ thống thực sự chọn **CP** hoặc **AP**.
- **PACELC** (mở rộng): khi **không** partition (E) thì trade-off **Latency vs Consistency**. VD Cassandra = AP/EL, Spanner = CP/EC.
- **Strong vs Eventual consistency** — eventual vẫn "consistent" về lâu dài, chỉ không ngay.

**Gotcha:**
- Nhiều người hiểu sai CAP = "chọn 2 trong 3 mọi lúc". Sai: **P không phải tùy chọn**, chỉ hiện rõ khi partition.
- Follow-up: *"Hệ thống anh thiết kế chọn gì?"* → đa số web app = **AP** (eventual OK), banking = **CP**.

---

## 8. Optimistic vs Pessimistic Locking?

**Pessimistic (bi quan):** **khóa trước** row khi đọc (`SELECT ... FOR UPDATE`), các tx khác phải chờ. → Dùng khi **contention cao** (nhiều tx tranh cùng data).

**Optimistic (lạc quan):** **không khóa**; đọc kèm **version**; khi commit, kiểm tra version còn khớp không → nếu ai đã sửa → **reject/thử lại**. → Dùng khi **contention thấp** (đa số trường hợp).

```sql
-- Optimistic
UPDATE products SET stock = stock - 1, version = version + 1
WHERE id = 1 AND version = 5;   -- nếu != 5 → 0 row affected → retry
```

**Gotcha:**
- Optimistic **không block** → throughput cao hơn, nhưng **retry nhiều** khi tranh chấp cao = tệ.
- Follow-up: *"Cập nhật số dư tài khoản?"* → pessimistic (banking, contention cao, không được sai).

---

## 9. Sharding / Partitioning / Replication?

- **Partitioning:** chia 1 bảng lớn thành nhiều **partition** trong **cùng DB** (theo range/list/hash) — quản lý nội bộ, trong suốt với app.
- **Sharding:** chia data ra **nhiều DB server vật lý** (shard) — app/layer điều hướng (shard key). Scale **storage + write**.
- **Replication:** **copy** data sang server khác (read replica) — scale **read** + HA. Primary ghi, replica đọc.

**Sharding key:** chọn cột phân phối (vd `user_id`) — chọn sai = **hot shard** (1 shard quá tải) hoặc unbalanced.
**Resharding:** thêm shard phải re-distribute → dùng **consistent hashing** để move ít.

**Gotcha:**
- Sharding **phá JOIN / cross-shard transaction** (khó) → thường phải **denormalize** hoặc dùng **saga**.
- Follow-up: *"Tại sao không scale vertical mãi?"* → đắt + có giới hạn phần cứng; multi-tenant app cần shard để cách ly dữ liệu.

---

## 10. Connection Pool là gì? Tại sao cần?

**Ngắn:** Tập hợp các **DB connection được giữ sẵn** và tái sử dụng, thay vì mở/đóng mới mỗi request.

**Tại sao cần:**
- Mở TCP + auth connection tốn ~ **ms** → tốn kém nếu mỗi request 1 connection mới.
- Giới hạn connection của DB (Postgres default ~100) → mở quá nhiều = DB từ chối / chết.

**Đào sâu:**
- **Pool size:** không phải càng lớn càng tốt — quá lớn = DB quá tải + context switch; quy tắc kinh nghiệm: `pool_size ≈ (core_count × 2) + effective_spindle_count` (HikariCP).
- **Max connections / queue** khi pool đầy — request đợi (timeout) thay vì đánh sập DB.

**Gotcha:**
- Serverless (Lambda) → mỗi instance có pool riêng → tổng connection bùng nổ → dùng **PgBouncer/RDS Proxy** (connection pooler bên ngoài, multiplexing).
- Follow-up: *"Connection leak?"* → quên close connection → pool cạn → app treo. ORM thường tự quản lý; raw driver phải cẩn thận.

---
🔗 [Quay lại README backend](./index.md)
