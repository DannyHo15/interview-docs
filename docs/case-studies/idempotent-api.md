# 🔁 Case 5 — API idempotent: chống trùng giao dịch khi retry

> **Loại:** Backend / Distributed · **Tần suất:** 🔥🔥🔥 (chạm tới tiền/giao dịch là chắc hỏi).
> **Câu hỏi mẫu:** *"User bấm 'Thanh toán', mạng chập, bấm lại → charge 2 lần. Chống sao?"*

---

## Đặt vấn đề

Mạng **không đáng tin**: request có thể bị mất, timeout, hoặc **đến server nhưng response bị mất trên đường về**. User không biết → bấm lại (hoặc app tự retry). Kết quả: **cùng một ý định được thực thi 2 lần**.

| Tình huống | Hậu quả nếu không idempotent |
|---|---|
| Thanh toán charge 2 lần | **Trừ tiền khách 2 lần** — thảm họa |
| Tạo order 2 lần | 2 đơn hàng trùng, tồn kho sai |
| Gửi email 2 lần | Spam khách, phiền nhiễu |
| Webhook từ Stripe gửi lại | Cập nhật trạng thái 2 lần, lệch số dư |

**Mục tiêu:** cùng một request, gọi bao nhiêu lần cũng ra **cùng kết quả như gọi 1 lần** — không tạo tác dụng phụ thêm.

---

## Bước 1 — Idempotency Key — pattern kinh điển

Client tạo 1 **unique key** (UUID, hoặc hash nội dung request) gửi kèm mỗi lần gọi:

```
POST /api/payments
Idempotency-Key: 7c8d2e1f-...
Body: { order_id: 123, amount: 50000 }
```

- **Key = danh tính của "ý định"**: cùng key = cùng ý định = chỉ thực thi 1 lần.
- Stripe, GitHub, AWS đều dùng header `Idempotency-Key` chuẩn.

### Flow xử lý BE

```
1. Nhận request + Idempotency-Key
2. Check Redis/DB: key này đã có chưa?
   ├─ CHƯA → lưu key (status=in_progress), thực thi, lưu result (status=done)
   └─ RỒI → trả lại cached result (không thực thi lại)
```

---

## Bước 2 — Implement: state machine với 3 trạng thái

Idempotency không chỉ là "đã có key thì skip" — phải xử lý **concurrent request** (2 request cùng key đến cùng lúc).

```js
// Bảng idempotency_records: (key, status, response, created_at, expires_at)
async function handleIdempotent(req) {
  const key = req.headers['idempotency-key'];
  if (!key) return reply.code(400).send({ error: 'missing key' });

  // 1. Thử insert key (race-condition safe nhờ unique constraint)
  try {
    await db.query(
      `INSERT INTO idempotency_records (key, status) VALUES (?, 'in_progress')`,
      [key]
    );
  } catch (e) {
    if (e.code === '23505') {  // unique_violation — key đã có
      const record = await db.query(`SELECT * FROM idempotency_records WHERE key = ?`, [key]);
      if (record.status === 'done') {
        return reply.send(record.response);   // trả cached result
      }
      if (record.status === 'in_progress') {
        return reply.code(409).send({ error: 'request đang xử lý, thử lại sau' });
      }
    }
    throw e;
  }

  // 2. Thực thi nghiệp vụ thật
  try {
    const result = await processPayment(req.body);
    await db.query(
      `UPDATE idempotency_records SET status='done', response=? WHERE key=?`,
      [JSON.stringify(result), key]
    );
    return reply.send(result);
  } catch (e) {
    await db.query(`DELETE FROM idempotency_records WHERE key=?`, [key]);
    // Xóa để client có thể retry với cùng key sau khi fix lỗi
    throw e;
  }
}
```

**3 trạng thái:**
- `in_progress` — đang xử lý, request khác cùng key → trả **409 Conflict** (chưa xong, chờ).
- `done` — xong, có result → trả **cached response** (status code + body giống hệt).
- (khi lỗi nghiệp vụ) → xóa record, client retry được.

### Tại sao phải có `in_progress`?

Nếu 2 request cùng key đến **cùng giây** (network retry song song), cả 2 đều chưa thấy key → cả 2 cùng charge. Insert với **unique constraint** đảm bảo chỉ 1 request "thắng" được tạo record, request kia bị conflict.

---

## Bước 3 — Phân biệt method idempotent theo chuẩn HTTP

| Method | Idempotent? | Safe (không thay đổi state)? |
|---|---|---|
| GET | ✅ | ✅ |
| PUT | ✅ (thay thế toàn bộ resource) | ❌ |
| DELETE | ✅ (xóa 2 lần vẫn chỉ xóa 1) | ❌ |
| POST | ❌ (mặc định tạo mới mỗi lần) | ❌ |
| PATCH | ❌ (tùy thao tác) | ❌ |

> **POST** là method nguy hiểm nhất — mỗi lần gọi tạo resource mới. Đó là lý do **payment/order/create luôn cần Idempotency-Key**.

**Lưu ý subtle:** "idempotent" ở đây là **theo chuẩn HTTP** (gọi 2 lần = kết quả như 1 lần). `DELETE /users/123` idempotent vì xóa lần 2 vẫn chỉ kết quả là "user không tồn tại". Nhưng `POST /payments` thì mỗi lần charge 1 lần → **phải tự implement idempotency**.

---

## Bước 4 — Idempotency ở tầng nào?

Idempotency **không chỉ ở API** — phải qua suốt stack:

| Tầng | Cơ chế |
|---|--- |
| **Client** | Sinh `Idempotency-Key`, retry với **cùng key** (không sinh key mới). Exponential backoff. |
| **API Gateway** | Có thể lưu key + trả cached response (giảm tải BE) — hoặc forward cho BE. |
| **Backend** | State machine 3 trạng thái + unique constraint. |
| **Database** | Unique constraint trên (key) hoặc (order_id) để chặn tầng cuối. |
| **Payment provider** (Stripe) | Stripe **tự có** Idempotency-Key; BE chỉ forward. |

---

## Bước 5 — Trade-off & TTL

### Lưu key bao lâu?

- **Quá ngắn** (5 phút) → retry sau 10 phút lại charge. Nguy hiểm.
- **Quá dài** (vĩnh viễn) → bảng phình to, lưu rác.
- **Thực tế:** **24h–7 ngày** tùy bài toán. Stripe giữ 24h. Sau TTL có thể dọn (cronjob xóa record cũ).

### TTL vs "delete on failure"

- Khi nghiệp vụ **thành công** → giữ record tới TTL (client retry vẫn ra cached result).
- Khi nghiệp vụ **thất bại** (charge lỗi) → **xóa record**, client có thể retry với cùng key (lần sau hy vọng thành công).

### Lưu ở đâu?

- **DB** (Postgres) — bền vững, unique constraint tự nhiên, nhưng mỗi request 1 query.
- **Redis** — nhanh, có TTL tự động, nhưng có thể mất khi Redis sập → **không nên** dùng Redis làm nguồn chân lý cho payment. Dùng Redis làm **fast path cache** + DB làm source of truth.
- **Cả 2** — check Redis trước (nhanh), miss thì check DB.

---

## Bước 6 — Webhook idempotency

Webhook từ Stripe/GitHub/Momo **tự retry** khi BE trả non-2xx hoặc timeout. Nếu BE xử lý webhook 2 lần → cập nhật trạng thái 2 lần.

```js
// Mỗi webhook có event_id duy nhất từ provider
app.post('/webhooks/stripe', async (req, res) => {
  const eventId = req.body.id;  // evt_xxx từ Stripe

  // Đã xử lý event này chưa?
  const seen = await redis.set(`webhook:${eventId}`, '1', 'NX', 'EX', 86400);
  if (!seen) return res.send({ ok: true });  // đã xử lý, skip nhưng trả 200

  await processStripeEvent(req.body);
  res.send({ ok: true });
});
```

> ⚠️ **Quan trọng:** return **200 ngay cả khi đã xử lý** để provider ngừng retry. Trả 2xx = "tôi đã nhận, đừng gửi lại".

---

## Bẫy thường gặp

- **Sinh key mới mỗi retry** — nhầm tưởng key là UUID ngẫu nhiên mỗi lần. Sai: **cùng ý định = cùng key**, retry phải giữ nguyên key.
- **Không có unique constraint** trên key → 2 request concurrent cùng lọt qua check → charge 2 lần. Dựa vào DB constraint là chốt.
- **Lưu Redis mà không DB** → Redis sập mất key, retry sau đó charge lại. Payment phải có DB.
- **Quên xóa record khi lỗi nghiệp vụ** → client không retry được (key bị khóa vĩnh viễn ở `in_progress`/`done` lỗi).
- **Webhook trả non-2xx khi đã xử lý** → provider retry mãi, BE lại skip → không hại nhưng spam log + cạn quota.

---

## Câu hỏi nối tiếp

- *"Idempotency-Key có nên BE sinh không?"* → Khuyến nghị **client sinh** (UUID): key gắn với ý định client, BE không phải guess. Nhưng BE có thể sinh nếu client đáng tin (vd admin tool).
- *"Nếu charge thành công nhưng response về client bị mất thì sao?"* → Client retry với cùng key → BE thấy `done` → **trả lại cached result** (kể cả status code). Client biết "đã thành công từ trước".
- *"Rate limit với idempotency liên quan gì?"* → Khác: rate limit giới hạn **số request** (dù khác key); idempotency xử lý **trùng key**. Cả 2 cùng cần.
- *"Idempotent cho GET có cần không?"* → GET mặc định idempotent (chỉ đọc). Nhưng nếu GET có **side effect** (vd tăng counter) thì vẫn phải implement.

> **Câu chốt phỏng vấn:** "Bài toán thực ra là 'cùng một ý định, gọi nhiều lần, kết quả như một'. Giải pháp là Idempotency-Key: client gửi key, BE lưu state machine 3 trạng thái với unique constraint để chặn concurrent, trả cached result khi done, xóa khi lỗi để client retry được. Đối với webhook cũng vậy — dedupe theo event_id, luôn trả 200 để provider ngừng gửi."
