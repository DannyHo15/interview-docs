# 📄 Case 4 — Phân trang sâu (deep pagination): OFFSET chậm, dùng gì?

> **Loại:** Backend / Database · **Tần suất:** 🔥🔥 (list nào cũng phải phân trang, ai cũng từng gặp).
> **Câu hỏi mẫu:** *"Hiển thị list 1M item, user kéo tới trang 100.000 — query chậm dần, xử lý sao?"*

---

## Đặt vấn đề

Phân trang chuẩn của người mới:

```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 1000000;
```

**Tại sao tệ?** DB không "nhảy" tới dòng thứ 1M được. Nó phải:
1. **Quét + sắp xếp** 1.000.020 dòng đầu.
2. **Bỏ đi** 1.000.000 dòng đầu.
3. Trả 20 dòng cuối.

→ Render **càng sâu càng chậm** (O(N) mỗi lần, quét lại từ đầu). Trang 1 nhanh, trang 50.000 chậm vài giây.

**Mục tiêu:** thay vì "tính offset", **nhớ vị trí cuối** và **tiếp tục từ đó**.

---

## Bước 1 — OFFSET pagination (đơn giản, chỉ dùng khi shallow)

```sql
-- Trang N: lấy 20 dòng, bỏ (N-1)*20 dòng đầu
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 40;
```

**Khi nào OK:**
- List ngắn (vài trăm–vài nghìn dòng).
- User chỉ duyệt vài trang đầu (Google search result hiếm khi ai qua trang 5).
- **Không** cho "jump to page 5000".

**Vấn đề cố hữu:**
- **Chậm khi sâu** (quét lại từ đầu mỗi query).
- **Không ổn định**: nếu có row mới chèn giữa lúc user ở trang 2 → các row bị **dịch chỗ** → user thấy row trùng hoặc lỡ. Gọi là *drifting*.

---

## Bước 2 — Cursor pagination (keyset) — lời giải kinh điển

Thay vì "bỏ N dòng", **lưu giá trị cuối của trang trước** rồi query "sau giá trị đó":

```sql
-- Trang đầu
SELECT * FROM orders ORDER BY id DESC LIMIT 20;
-- Giả sử id cuối = 9876

-- Trang tiếp: "cho tôi 20 row có id < 9876"
SELECT * FROM orders
WHERE id < 9876
ORDER BY id DESC LIMIT 20;
```

**Tại sao nhanh?** DB dùng **index** trên `id` (hoặc cột sort) → nhảy thẳng tới `id = 9876` rồi đọc tiếp 20 dòng. O(log N + 20) thay vì O(N).

**Tại sao ổn định?** Dù có row mới chèn, cursor `id < 9876` vẫn trỏ đúng vị trí — không bị drift.

### Cursor với sort theo cột khác (vd thời gian)

```sql
-- Sort theo created_at, nhưng created_at có thể trùng → cần tie-breaker
SELECT * FROM orders
WHERE (created_at, id) < ('2026-07-14 10:00:00', 9876)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

> 💡 **Bắt buộc có index** trên `(created_at DESC, id DESC)` để cursor query dùng index. Không index = vẫn quét toàn bảng.

**Cần composite key khi sort column có duplicate.** Nếu chỉ `created_at < X` thì các row cùng `created_at` sẽ bị bỏ sót hoặc trùng.

---

## Bước 3 — So sánh OFFSET vs Cursor

| Tiêu chí | OFFSET | Cursor (keyset) |
|---|---|---|
| Tốc độ trang sâu | ❌ Chậm dần O(N) | ✅ Không đổi O(log N + k) |
| Ổn định với insert mới | ❌ Drift (trùng/lỡ row) | ✅ Cố định |
| "Jump to page 5000" | ✅ Trực tiếp | ❌ Không (phải duyệt tuần tự) |
| Mở ngược (trang trước) | ✅ Dễ | Cần cursor forward + backward |
| Bookmark/chia sẻ URL | `?page=50` trực quan | `?cursor=abc` khó đọc |
| Phức tạp code | Thấp | Trung bình |

> 💡 **Thực tế:** dùng cursor cho **infinite scroll** / "load more" (FE không cần số trang, chỉ cần "tiếp theo"). Dùng offset cho **admin table có số trang** (user cần jump).

---

## Bước 4 — Bất ngờ: COUNT(*) đắt nữa

Phân trang thường hiển thị *"Hiển thị 20/1.234.567"*. Để biết 1.234.567, BE phải `COUNT(*)`:

```sql
SELECT COUNT(*) FROM orders WHERE status = 'completed';
```

→ **Quét toàn bảng** (hoặc index). Trên 10M row có thể mất vài giây.

**Giải pháp:**
- **Không count chính xác:** hiển thị *"Hơn 10.000 kết quả"* thay vì con số chính xác. Cache count với TTL.
- **Ước lượng** (Postgres): `SELECT reltuples FROM pg_class WHERE relname = 'orders'` — số liệu thống kê, gần đúng nhưng O(1).
- **Cache**: lưu count trong Redis, cập nhật định kỳ hoặc qua trigger/đếm tăng dần.
- **Cursor pagination thường bỏ luôn total count** — chỉ có "next cursor", không cần tổng số trang.

---

## Bước 5 — Edge cases

### Sort theo cột không unique, không có index

```sql
-- ❌ Tệ: sort theo user_name (text, không index, có trùng)
SELECT * FROM users ORDER BY name LIMIT 20 OFFSET 1000;
```

→ Tạo index hoặc thêm **tie-breaker** (`ORDER BY name, id`) để cursor hoạt động.

### Cursor + filter phức tạp

```sql
WHERE status = 'completed' AND id < 9876 ORDER BY id DESC LIMIT 20
```

→ Cần **composite index** `(status, id)` để query vừa filter vừa dùng cursor hiệu quả.

### Bi-directional (scroll lên + xuống)

Cursor phải lưu **cả 2 chiều**: `afterCursor` (trang sau) và `beforeCursor` (trang trước). FE dùng cả 2 như GitHub API.

---

## Sơ đồ quyết định

```
Cần phân trang?
   │
   ├─ List ngắn / user chỉ xem vài trang đầu → OFFSET (đơn giản)
   │
   ├─ List dài + infinite scroll / load more → CURSOR ✅
   │
   ├─ Admin table cần jump tới "trang 5000" → OFFSET (chấp nhận chậm) hoặc capping
   │
   └─ Capped pagination (giới hạn "chỉ duyệt 1000 row gần nhất") → cursor + hard limit
```

---

## Bẫy thường gặp

- **OFFSET sâu mà tưởng bình thường** → trang cuối chậm vài giây, user phàn nàn.
- **Cursor mà quên index** trên sort column → vẫn quét toàn bảng, không nhanh hơn OFFSET.
- **Quên tie-breaker** khi sort column có duplicate → row trùng/lỡ giữa các trang.
- **COUNT(*) trên mỗi request** → mỗi lần phân trang đều quét bảng. Cache hoặc bỏ.
- **Drifting với OFFSET**: user báo "tôi vừa thấy row X ở trang 2, F5 rồi nó biến mất" → đó là insert mới đẩy row đi.

---

## Câu hỏi nối tiếp

- *"Vì sao GitHub/Facebook dùng cursor?"* → List của họ khổng lồ + infinite scroll; OFFSET quá đắt ở trang sâu, và cursor ổn định với dữ liệu đổi liên tục.
- *"Cursor encode thế nào?"* → BE mã hóa giá trị cursor (`id + sort key`) thành opaque string (base64) cho client. Client không biết nội dung, chỉ forward lại. Bảo mật + gọn.
- *"Sort theo nhiều cột thì cursor sao?"* → Composite cursor: WHERE (col1, col2, id) < (val1, val2, valId), với index covering đủ cột.
- *"Redis sorted set cũng có cursor?"* → ZSET hỗ trợ `ZRANGEBYSCORE` natural cursor (theo score) — lý tưởng cho leaderboard có phân trang.

> **Câu chốt phỏng vấn:** "OFFSET pagination chỉ OK cho list nông. Khi user duyệt sâu, query quét lại từ đầu mỗi lần — em chuyển sang cursor (keyset): nhớ giá trị cuối, query `WHERE id < last_id` để DB nhảy thẳng qua index. Kèm index đúng + tie-breaker cho cột trùng, cursor cho tốc độ ổn định dù ở trang 100.000."
