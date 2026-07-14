# 📤 Case 1 — User upload file CSV 1 triệu dòng: xử lý từ FE tới BE thế nào cho "mượt"?

> **Loại:** End-to-end (Frontend + Backend) · **Tần suất:** 🔥🔥 (hay gặp ở vòng mid/senior fullstack).
> **Câu hỏi thật** từ một buổi phỏng vấn. Yêu cầu: xử lý file lớn mà UI **không treo**, server **không sập**, dữ liệu **không mất**.

---

## Đặt vấn đề

User upload 1 file CSV ~**1 triệu dòng** (có thể 100–500 MB). Nếu làm "bình thường" (đọc cả file vào RAM, parse rồi `INSERT` từng dòng), bạn sẽ gặp **cả 3 tầng đều chết**:

| Tầng | Triệu chứng nếu làm sai |
|---|---|
| **Browser (FE)** | Treo main thread, tab "Page Unresponsive", RAM tăng vọt vì tải cả file vào memory |
| **Network** | Request HTTP khổng lồ → timeout, reverse proxy (nginx) chặn vì vượt body limit, mất tiến độ nếu rớt mạng giữa chừng |
| **Server (BE)** | Parse 1M dòng ăn hết RAM/CPU, request lâu → bị load balancer kill, nếu crash giữa chừng thì **toàn bộ công sức mất** |

**Nguyên tắc dẫn đường:** **luồng phải luôn "chảy" (streaming) ở mọi tầng** — không bao giờ giữ toàn bộ file trong memory, phải có **tiến độ (progress)** để resume, và **chia nhỏ ra xử lý từng phần**.

---

## Bước 1 — Frontend: không tải cả file vào RAM

### ❌ Sai: `file.text()` / `file.arrayBuffer()`

```js
// Tệ: tải cả 100–500MB vào RAM, parse JSON stringify, main thread đứng
const text = await file.text(); // đột biến RAM, UI đông cứng
```

### ✅ Đúng: Stream file bằng File API + Web Worker

```js
// worker.js — chạy off main thread, UI không bị block
import { parse } from 'csv-parse/browser/esm'; // streaming CSV parser

self.onmessage = async (e) => {
  const file = e.data.file;
  const stream = file.stream(); // ReadableStream native
  const parser = stream.pipeThrough(
    new TextDecoderStream()
  ).pipeThrough(
    parse({ columns: true, skip_empty_lines: true }) // csv-parse streaming
  );

  let count = 0;
  for await (const row of parser) {
    count++;
    // Gom theo batch (vd 1000 dòng) rồi gửi lên BE, KHÔNG gửi từng dòng
    if (count % 1000 === 0) {
      postMessage({ type: 'progress', count });
    }
  }
  postMessage({ type: 'done', count });
};
```

**Tại sao Web Worker?** Parse CSV nặng CPU — nếu chạy ở main thread, **UI đông cứng** (không animation, không click được). Worker tách sang thread khác, UI vẫn mượt.

**Tại sao stream?** `file.stream()` đọc từng chunk thay vì tải cả file vào RAM → memory RSS của browser gần như phẳng.

### ✅ Gửi lên BE: chia batch + upload có tiến độ

**Cách A — Truyền thẳng file stream (upload rồi BE xử lý):**
- Dùng `fetch` với body là `file.stream()` (hoặc `FormData`) → BE nhận **stream**, parse dần.
- Hiển thị **upload progress** bằng `XMLHttpRequest.upload.onprogress` hoặc stream API.
- Hạn chế: nếu BE xử lý chậm hơn tốc độ upload, vẫn cần queue.

**Cách B — Stream + chunk thành nhiều request nhỏ (khả năng resume tốt hơn):**
- FE stream parse, gom **1000 dòng/batch**, gửi lên `POST /api/import?uploadId=xxx&chunkIndex=N`.
- Nếu mạng rớt ở chunk 500/1000 → chỉ resend chunk 500, không phải làm lại từ đầu.

> 💡 **Quy tắc:** batch size ~ **500–5000 dòng** là vùng ngọt. Nhỏ quá → quá nhiều HTTP request overhead. Lớn quá → một request lại nặng, dễ timeout.

---

## Bước 2 — Backend: stream + parse + queue

### ❌ Sai: `await req.json()` / load toàn body

Express/Node mặc định buffer body — với file 500MB bạn sẽ **ăn hết RAM** và **vượt default body limit**.

### ✅ Đúng: stream body trực tiếp vào parser

```js
// Fastify/Express — streaming upload endpoint
app.post('/api/import', uploadLimiter, async (req, reply) => {
  // req là ReadableStream, không buffer
  const parser = req.pipe(new TextDecoderStream()).pipe(
    parse({ columns: true })
  );

  let batch = [];
  for await (const row of parser) {
    batch.push(row);
    if (batch.length >= 1000) {
      await insertBatch(batch);   // xem [Case 2](./bulk-insert-db.md)
      batch = [];
    }
  }
  if (batch.length) await insertBatch(batch);
  reply.send({ ok: true });
});
```

### ✅ Async pattern: đẩy vào Queue (xử lý nền)

Với file 1M dòng, xử lý **synchronous trong HTTP request** là tự sát — request kéo dài 5–10 phút → bị LB/nginx/Cloudflare kill (timeout 30s–2 phút).

**Luồng đúng (async):**

```
Browser ──upload file──▶ BE nhận file
                            │
                            ├─▶ Lưu file tạm (S3/local disk)
                            ├─▶ Tạo job trong Queue (Redis/SQS)
                            └─▶ Trả về 202 Accepted + jobId ngay lập tức
                                                        │
Worker (queue consumer) ◀───── lắng nghe job ──────────┘
   │
   ├─ Stream đọc file + parse
   ├─ Insert DB theo batch
   ├─ Cập nhật tiến độ vào Redis (cho FE poll/SSE)
   └─ Đánh dấu job done/failed
                                                        │
Browser ◀──── poll /api/jobs/:id hoặc SSE ─────────────┘
            (hiển thị progress bar 0→100%)
```

**Tại sao phải async?**
- HTTP request trả về **ngay** (< 1s) → không timeout, không block connection.
- Có thể **retry** nếu worker crash — job vẫn nằm trong queue.
- Có thể **scale worker** riêng (CPU-heavy) tách khỏi API server (latency-sensitive).

---

## Bước 3 — Xử lý lỗi & resume: file 1M dòng KHÔNG được xử lý kiểu "all-or-nothing"

Đây là điểm người phỏng vấn đào: *"Nếu chạy tới dòng 800k thì DB sập, user phải làm lại từ đầu à?"*

### Giải pháp: checkpoint + idempotent insert

- **Gán `uploadId`** cho mỗi lần upload. Mỗi batch insert lưu kèm `uploadId` + `chunkIndex`.
- Trước khi insert batch N, **kiểm tra** batch đó đã insert chưa (idempotent) → nếu rồi thì skip.
- Khi resume: BE biết đã xử lý tới chunk nào, chỉ đọc tiếp từ đó.
- Lưu **file tạm trên object storage** (S3/MinIO) → worker có thể đọc lại nhiều lần, không phụ thuộc client còn online không.

### Báo lỗi từng dòng, không dừng toàn bộ

- Hàng bị sai định dạng (thiếu cột, sai kiểu số)? → **log vào bảng `import_errors`** kèm `rowNumber`, tiếp tục chứ không dừng.
- Cuối cùng trả về: `"inserted: 999,500, errors: 500 (xem chi tiết)"`.

---

## Bước 4 — Bảo mật & giới hạn

| Rủi ro | Biện pháp |
|---|---|
| **File khổng lồ DOS** | Giới hạn `maxFileSize` ở nginx/gateway, từ chối sớm (413 Payload Too Large) |
| **File độc hại** (zip bomb, CSVInject) | Validate MIME type thật (không tin `Content-Type`), **scan malware** nếu cần |
| **CSV injection** (cell bắt đầu `=`, `+`, `-` → Excel chạy formula độc) | Escape/neutralize khi export ra spreadsheet; không apply khi insert DB |
| **Quá tải đồng thời** | **Rate limit** số upload đồng thời / user; queue serializes theo user |
| **Bộ nhớ** | Stream mọi thứ, không bao giờ `.toString()` cả file |

---

## Tóm tắt kiến trúc

```
┌─────────┐  stream file   ┌─────────┐  store temp   ┌────────┐
│ Browser │ ──────────────▶ │   BE    │ ────────────▶ │  S3    │
│ (worker)│ ◀── progress ── │ (API)   │ ── enqueue ─▶ │ (Queue)│
└─────────┘   poll/SSE      └─────────┘               └────┬───┘
                                                              │
                                              ┌───────────────▼──────────┐
                                              │ Worker: stream → parse → │
                                              │ batch insert → update    │
                                              │ progress (Redis)         │
                                              └──────────────────────────┘
```

**Bốn chìa khóa:**
1. **Stream mọi thứ** — FE (`file.stream()`), BE (pipe body → parser), không buffer cả file.
2. **Web Worker** tách parse khỏi main thread → UI không đông cứng.
3. **Async + Queue** — API trả về ngay, worker xử lý nền, có retry/resume.
4. **Idempotent + checkpoint** — crash giữa chừng không phải làm lại từ đầu.

---

## Bẫy thường gặp

- **Đọc cả file vào RAM** ở bất kỳ tầng nào (FE `file.text()`, BE `bodyParser` full) → OOM. Stream tất cả.
- **Đồng bộ trong HTTP request** → timeout. Đẩy ra queue, trả 202.
- **Không có resume** → user phải upload lại 500MB nếu rớt mạng ở 99%. Checkpoint + temp storage.
- **Batch quá nhỏ** (1 dòng/request) → 1M HTTP request, quá tải BE + DB connection pool. Gom 1000+ dòng/batch.
- **Quên progress UX** → user nhìn spinner 10 phút tưởng treo. Luôn báo tiến độ.

---

## Câu hỏi nối tiếp

- *"Sao không dùng WebSocket thay vì poll?"* → Cũng được, nhưng WebSocket giữ connection sống cả quá trình; với job dài 10 phút, **SSE** hoặc **poll** nhẹ hơn và chịu tốt hơn khi network chập chờn. SSE unidirectional, đủ cho progress.
- *"Nếu 2 user upload cùng lúc thì sao?"* → Queue serialize theo user (mỗi user 1 hàng đợi); hoặc worker pool với concurrency limit để không quá tải DB.
- *"Validate schema CSV ở đâu?"* → Validate **streaming** header đầu tiên trước khi insert (fail fast), rồi validate từng row trong worker, log lỗi theo row mà không dừng.
- *"Lưu file tạm ở đâu?"* → Object storage (S3/MinIO/GCS) với lifecycle auto-delete sau 24h. Không lưu disk BE vì khó scale + mất khi redeploy.

> **Câu chốt phỏng vấn:** "Bí quyết là **stream ở mọi tầng** — không bao giờ tải cả file vào memory. FE dùng `file.stream()` trong Web Worker cho UI mượt, BE nhận stream rồi đẩy vào queue xử lý nền với checkpoint để resume. Một câu upload 1M dòng thực chất là bài toán **streaming + async job + idempotency**, không phải bài toán upload."
