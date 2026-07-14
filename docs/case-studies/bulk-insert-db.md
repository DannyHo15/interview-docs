# 🗄️ Case 2 — Thêm 10.000 dòng vào DB thế nào cho tối ưu?

> **Loại:** Backend / Database · **Tần suất:** 🔥🔥 (câu rất hay đi kèm sau khi hỏi về N+1, transaction, index).
> **Câu hỏi thật** từ một buổi phỏng vấn. Yêu cầu: chèn 10k row **nhanh**, **an toàn**, không khóa bảng, không làm sập DB production.

---

## Đặt vấn đề

Có 10.000 dòng dữ liệu cần insert vào DB. Cách "tự nhiên" nhất:

```js
for (const row of rows) {
  await db.query('INSERT INTO users (name, email) VALUES (?, ?)', [row.name, row.email]);
}
```

**Tại sao tệ?** Mỗi `INSERT` là:
- 1 **round-trip mạng** tới DB (latency × 10.000).
- 1 **transaction** riêng (implicit commit mỗi câu) → 10.000 lần ghi WAL + fsync.
- 10.000 lần cập nhật **index** (nếu có index trên email/name).

→ Chậm (có thể 30s–phút), tạo tải I/O lớn, và mỗi transaction riêng lẻ không atomic.

**Mục tiêu:** giảm từ ~10.000 câu query xuống **ít câu nhất có thể**, mỗi câu mang nhiều row, trong **một transaction**.

---

## Bước 1 — Sai lầm phổ biến & tại sao chậm

| Cách | Số câu | Số transaction | Vấn đề |
|---|---|---|---|
| **INSERT từng dòng** (loop) | 10.000 | 10.000 | Chậm nhất — 10k round-trip + 10k commit |
| **Multi-row INSERT** (1000/câu) | 10 | 10 | ✅ Tốt — giảm network + transaction |
| **COPY / bulk load** | 1 | 1 | ✅✅ Tối ưu nhất cho lượng lớn |

> 💡 **Quy tắc:** mỗi **transaction commit** = 1 lần `fsync` (đồng bộ đĩa) → đắt. Gom nhiều row vào **1 transaction** là đòn bẩy lớn nhất.

---

## Bước 2 — Lời giải: Multi-row INSERT (chạm tới mọi DB)

Thay vì 10.000 câu, dựng **1 câu** chứa nhiều `VALUES`:

```sql
INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@x.com'),
  ('Bob',   'bob@x.com'),
  ...
  (10.000 bộ giá trị);
```

### Bọc trong 1 transaction

```js
await db.tx(async (t) => {
  for (const batch of chunk(rows, 1000)) {        // chia 10 batch × 1000 row
    const values = batch.map((_, i) =>
      `($${i*2+1}, $${i*2+2})`).join(',');          // dựng placeholder
    await t.query(
      `INSERT INTO users (name, email) VALUES ${values}`,
      batch.flatMap(r => [r.name, r.email])
    );
  }
});
```

**Vì sao chia batch 1000 mà không nhét cả 10.000 vào 1 câu?**
- Một số DB có **giới hạn số placeholder** (Postgres tối đa 65.535 params, SQL Server 2100 params/query).
- Câu query quá dài → tốn memory parser, **vượt `max_allowed_packet`** (MySQL).
- Batch 500–5000 row là vùng ngọt — đủ lớn để giảm round-trip, đủ nhỏ để không quá giới hạn.

### Hiệu quả

- **Round-trip:** 10.000 → ~10.
- **Transaction:** 10.000 → 1 (atomic: hoặc tất cả vào, hoặc rollback sạch).
- **Tốc độ:** thường **10–100× nhanh hơn** so với loop từng dòng.

---

## Bước 3 — Tối ưu hơn nữa: Bulk load / COPY

Khi dữ liệu thật lớn (100k–1M row), multi-row INSERT vẫn chậm vì DB vẫn parse SQL + update index từng dòng. Dùng **bulk protocol** riêng của mỗi DB:

| DB | Lệnh bulk | Đặc điểm |
|---|---|---|
| **PostgreSQL** | `COPY FROM` (stdin/file/stream) | Bỏ qua SQL parser, ghi trực tiếp; **nhanh nhất** |
| **MySQL** | `LOAD DATA INFILE` | Tương tự, bỏ qua parser |
| **SQL Server** | `SqlBulkCopy` (ADO.NET) / bcp | Bulk protocol TDS |
| **MongoDB** | `insertMany` (ordered=false) | Batch insert, tiếp tục khi lỗi |

```js
// PostgreSQL — COPY từ stream
await db.copyFrom(
  'COPY users (name, email) FROM STDIN WITH (FORMAT csv)',
  csvStream   // stream text, mỗi dòng 1 row
);
```

**COPY nhanh hơn multi-row INSERT ~5–10×** vì:
- Không parse SQL (text → binary trực tiếp).
- Có thể **tắt index update tạm thời** (xem bước 4).

---

## Bước 4 — Kỹ thuật tối ưu khi bảng đã có dữ liệu & index

Đây là phần **senior sẽ đào tiếp**: *"Bảng users đã có 10 triệu dòng + index trên email. Bulk insert 10k row có chậm không?"*

### 1. Tạm tắt index (nếu bulk lớn)

```sql
-- Chỉ hợp lý khi insert lượng rất lớn (vd >10% bảng)
DROP INDEX idx_users_email;
-- ... bulk insert ...
CREATE INDEX idx_users_email;  -- xây lại 1 lần, rẻ hơn update từng dòng
```

- Update index **từng dòng** đắt O(N log N) mỗi lần.
- Xây index **một lần sau** khi insert xong rẻ hơn nhiều.
- **Trade-off:** trong lúc tắt index, query sẽ chậm → chỉ làm ở **cửa sổ bảo trì** hoặc bảng mới.

### 2. Tạm tắt constraint / trigger (cẩn thận!)

```sql
SET session_replication_role = 'replica';  -- Postgres: tắt trigger tạm thời
-- bulk insert
SET session_replication_role = 'origin';
```

⚠️ **Cực kỳ cẩn trọng** — tắt constraint nghĩa là dữ liệu bẩn có thể lọt vào. Chỉ làm khi bạn **đã validate ở tầng app** và hiểu rõ hậu quả.

### 3. WAL / durability trade-off

```sql
-- Postgres: giảm fsync cho bulk (chỉ khi chấp nhận mất dữ liệu nếu sập điện cùng lúc)
SET synchronous_commit = off;
-- bulk insert
SET synchronous_commit = on;
```

- Giảm `fsync` → nhanh hơn, nhưng commit có thể mất nếu DB crash ngay sau đó.
- Hợp lý cho **data tái tạo được** (log, cache), **không** cho dữ liệu giao dịch.

---

## Bước 5 — Xử lý lỗi: một dòng hỏng không làm hỏng cả batch

### ❌ Transaction nguyên tử: 1 dòng lỗi → rollback toàn bộ

```js
await db.tx(async (t) => {
  await t.query('INSERT ... 1000 rows');
  // Nếu row 999 trùng unique key → cả 1000 row bị rollback
});
```

### ✅ Insert với `ON CONFLICT` (upsert) — bỏ qua trùng lặp

```sql
INSERT INTO users (name, email) VALUES ... 
ON CONFLICT (email) DO NOTHING;   -- bỏ qua email đã có
```

```sql
-- Hoặc cập nhật nếu trùng
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
```

### ✅ Insert `ordered: false` (MongoDB) — tiếp tục khi lỗi

```js
db.users.insertMany(rows, { ordered: false });
// Dù vài doc lỗi (trùng _id), phần còn lại vẫn vào
```

### ✅ Tách batch + log lỗi

- Insert batch 1000, nếu lỗi → bắt exception, **thử lại từng dòng** trong batch đó để tìm row hỏng, log nó ra, tiếp tục batch kế.
- Kết thúc: `"inserted: 9.950, skipped: 50 (xem error log)"`.

---

## So sánh hiệu năng (ước lượng trên Postgres, 10k row đơn giản)

| Phương pháp | Thời gian | Tỷ lệ |
|---|---|---|
| Loop INSERT từng dòng | ~30–60s | 1× (baseline) |
| Multi-row INSERT (1000/batch, 1 tx) | ~1–3s | ~20–30× |
| COPY FROM | ~0.2–0.5s | ~100× |

> Con số thực tế phụ thuộc schema, index, phần cứng — nhưng **thứ tự ưu tiên** luôn ổn định.

---

## Bảng tóm tắt quyết định

| Tình huống | Nên dùng |
|---|---|
| 10k row, code đơn giản | Multi-row INSERT trong 1 transaction, batch 1000 |
| 100k+ row, cần tốc độ tối đa | COPY / bulk load |
| Dữ liệu có thể trùng | `ON CONFLICT DO NOTHING/UPDATE` |
| Bulk rất lớn lên bảng có index | Tạm tắt index → insert → tạo lại |
| Không được lỗi 1 dòng hỏng cả batch | Tách batch + `ordered:false` + log lỗi |

---

## Bẫy thường gặp

- **INSERT trong loop** mà không biết nó tạo 10k transaction → tưởng "DB chậm" nhưng thực ra là do kiến trúc.
- **Batch quá lớn** (nhét 10k placeholder vào 1 câu) → vượt giới hạn params (`max_allowed_packet`, 65535 params Postgres).
- **Quên transaction** → 10k commit riêng, không atomic; nếu lỗi giữa chừng thì một nửa đã vào, một nửa chưa.
- **Tắt index/constraint rồi quên bật lại** → query chậm vĩnh viễn, hoặc dữ liệu bẩn lọt vào production.
- **Bulk insert trong giờ cao điểm** → lock bảng, block query đọc → ốm hệ thống. Chạy batch lớn ngoài giờ hoặc chia nhỏ dần.

---

## Câu hỏi nối tiếp

- *"Sao không dùng ORM `save()` cho từng entity?"* → ORM thường sinh 1 INSERT mỗi `save()` → đúng kiểu loop tệ. Dùng bulk method của ORM (TypeORM `createQueryBuilder().insert().values(rows)`, Prisma `$transaction` + `createMany`) hoặc xuống raw SQL.
- *"Insert song song nhiều worker có nhanh hơn không?"* → Có giới hạn: quá nhiều concurrent insert → **lock contention** + cạn connection pool. Thường 1 worker bulk tuần tự còn nhanh hơn nhiều worker chạy `INSERT` lẻ.
- *"Shard DB thì bulk insert sao?"* → Mỗi shard nhận batch riêng theo shard key; sort dữ liệu theo shard trước rồi gửi từng shard song song.
- *"Làm sao biết batch size tối ưu?"* → Đo benchmark trên dữ liệu thật. Bắt đầu 1000, thử 500/2000/5000, chọn điểm throughput cao nhất mà memory an toàn.

> **Câu chốt phỏng vấn:** "Bí quyết là giảm **số transaction** và **số round-trip**. Gom nhiều row vào một multi-row INSERT, bọc trong một transaction duy nhất — đủ cho 10k dòng. Nếu lớn hơn nữa, dùng COPY/bulk load và cân nhắc tắt index tạm thời. Và luôn xử lý lỗi per-row (`ON CONFLICT` hoặc tách batch) để một dòng hỏng không làm hỏng cả mẻ."
