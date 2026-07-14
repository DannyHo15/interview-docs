# ☁️ Case 7 — Upload file lớn qua Presigned URL (tránh qua BE server)

> **Loại:** Backend / Cloud · **Tần suất:** 🔥🔥 (fullstack làm upload đều gặp).
> **Câu hỏi mẫu:** *"User upload video 2GB, nếu stream qua BE server thì server tắc nghẽn. Có cách nào để browser upload thẳng lên S3 không?"*

---

## Đặt vấn đề

Upload "truyền thống" chạy qua BE:

```
Browser ──file 2GB──▶ BE server ──file 2GB──▶ S3
                        ↑
                 server giữ connection 2GB,
                 tốn CPU/memory/bandwidth 2 lần
```

**Vấn đề:**
- BE **trung chuyển** toàn bộ file → ăn **double bandwidth** (nhận + gửi).
- BE phải **buffer/stream** file → memory/CPU căng.
- BE **scale chặt**: 100 user upload song song = 100× bandwidth qua BE → cần BE instance lớn + nhiều.
- Latency cao (2 hop thay vì 1).

**Mục tiêu:** để browser **upload thẳng lên S3**, BE chỉ phát "vé" cho phép.

---

## Bước 1 — Presigned URL — pattern kinh điển

S3 (và GCS, Azure Blob, R2...) hỗ trợ **presigned URL**: một URL có chữ ký, cho phép **bất kỳ ai có URL** upload/download object trong **thời gian giới hạn**.

```
1. Browser ──"tôi muốn upload video.mp4"──▶ BE
2. BE ──tạo presigned URL (hết hạn 15 phút)──▶ Browser
3. Browser ──PUT file 2GB thẳng──▶ S3 (KHÔNG qua BE)
4. Browser ──"upload xong"──▶ BE (notify + record metadata)
```

→ BE chỉ lo bước 1, 2, 4 (request nhỏ). File **không chạm** tới BE.

---

## Bước 2 — Implement

### BE — phát presigned URL (AWS SDK)

```js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'ap-southeast-1' });

app.post('/api/upload/sign', auth, async (req, res) => {
  const { filename, contentType, size } = req.body;

  // Validate: loại file, kích thước tối đa
  if (!ALLOWED_TYPES.includes(contentType)) return res.code(400).send('invalid type');
  if (size > MAX_SIZE) return res.code(413).send('too large');

  const key = `uploads/${req.userId}/${uuid()}-${filename}`;
  const command = new PutObjectCommand({
    Bucket: 'my-bucket',
    Key: key,
    ContentType: contentType,
    ContentLength: size,  // chặn upload lớn hơn đã báo
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 phút
  res.send({ uploadUrl, key });
});
```

### FE — upload thẳng lên S3

```js
// 1. Xin URL từ BE
const { uploadUrl, key } = await fetch('/api/upload/sign', {
  method: 'POST',
  body: JSON.stringify({ filename: 'video.mp4', contentType: 'video/mp4', size: file.size }),
}).then(r => r.json());

// 2. PUT thẳng lên S3 — có progress!
await axios.put(uploadUrl, file, {
  headers: { 'Content-Type': file.type },
  onUploadProgress: (e) => {
    const pct = Math.round((e.loaded / e.total) * 100);
    setProgress(pct);  // progress bar
  },
});

// 3. Notify BE đã xong
await fetch('/api/upload/complete', {
  method: 'POST',
  body: JSON.stringify({ key }),
});
```

---

## Bước 3 — Validity & bảo mật

| Mối lo | Biện pháp |
|---|---|
| **URL bị đánh cắp** → ai cũng upload được | TTL ngắn (15 phút–1 giờ); URL gắn với session/user |
| **Upload file độc hại** | Validate `contentType` + `size` **trước** khi ký; cấu hình S3 bucket policy chặn type sai |
| **Upload file khổng lồ DOS** | `ContentLength` trong presigned URL giới hạn kích thước |
| **User A dùng URL của user B** | Phân biệt key theo `userId` trong path (`uploads/{userId}/...`); S3 prefix policy |
| **Scan malware** | Trigger Lambda/Cloud Function khi object tạo → scan, xóa nếu độc |

> ⚠️ **Tuyệt đối không** để presigned URL public/forward cho bên thứ 3. Nó là "vé" có thời hạn — ai có vé upload được.

---

## Bước 4 — Multipart upload cho file cực lớn (> 100MB–GB)

Presigned URL đơn lẻ giới hạn **5GB** (S3 PUT). Với video 10GB+, dùng **multipart presigned**:

```
1. BE tạo uploadId + N presigned URL (mỗi URL cho 1 part, vd 5MB/part)
2. Browser chia file thành N part, PUT song song từng part lên S3
3. Browser gửi danh sách (partNumber, etag) cho BE
4. BE gọi S3 CompleteMultipartUpload → ghép các part thành 1 object
```

**Ưu điểm multipart:**
- **Song song**: upload nhiều part cùng lúc → nhanh hơn.
- **Resume**: part nào lỗi retry riêng, không phải upload lại cả file.
- **Vượt giới hạn 5GB**: multipart hỗ trợ tới 5TB.

---

## Bước 5 — So sánh các kiến trúc upload

| Kiến trúc | BE bandwith | BE CPU/mem | Resume | Khi nào dùng |
|---|---|---|---|---|
| **Qua BE** (stream → S3) | 2× file | Cao | Khó | File nhỏ (< 50MB), cần validate nội dung |
| **Presigned URL** (upload thẳng S3) | ~0 | ~0 | Khó | **Default** cho mọi file lớn |
| **Presigned multipart** | ~0 | ~0 | ✅ | File > 100MB, cần resume |
| **Pre-signed + S3 event** | ~0 | ~0 | ✅ | Sau upload trigger Lambda xử lý (transcode, thumbnail) |

---

## Bước 6 — Lifecycle sau upload

Upload xong chưa phải hết — thường cần **xử lý hậu kỳ**:

```
S3 bucket upload
   │
   ├─▶ S3 Event Notification (trigger khi object tạo)
   │      │
   │      ├─▶ Lambda: tạo thumbnail, transcode video
   │      ├─▶ Lambda: scan malware (ClamAV)
   │      └─▶ Publish event "file.ready" → queue → BE cập nhật DB
   │
   └─▶ Lifecycle rule: chuyển object sang Glacier sau 90 ngày (tiết kiệm cost)
```

→ File vừa upload xong → Lambda tự chạy → **không cần BE poll**. Event-driven, scale tốt.

---

## Bước 7 — Cross-check với Case 1 (CSV 1M dòng)

Bạn có thể hỏi: *"Vậy Case 1 (upload CSV) dùng presigned không?"*

| Trường hợp | Nên dùng |
|---|---|
| File CSV cần **BE parse + insert DB ngay** | Stream qua BE (như Case 1) — BE cần thấy nội dung |
| File **chỉ lưu trữ**, xử lý sau (Lambda) | **Presigned** — đỡ tải BE hoàn toàn |
| File lớn + cần **validate schema** | Presigned upload → Lambda validate → notify BE |

> 💡 **Quy tắc:** nếu BE **cần nội dung file** ngay (parse, transform) → stream qua BE. Nếu chỉ **lưu trữ + xử lý nền** → presigned.

---

## Bẫy thường gặp

- **CORS** quên config trên bucket → browser upload bị block. S3 bucket cần CORS rule cho phép `PUT` từ origin của app.
- **TTL quá dài** (7 ngày) → URL rò rỉ, ai cũng upload được. 15 phút–1 giờ là đủ cho hầu hết.
- **Quên ContentLength** → user có thể upload file lớn hơn giới hạn đã validate.
- **Không xử lý "complete"** → file lên S3 rồi nhưng BE không biết, metadata không có. Phải có bước notify.
- **Đặt key không unique** (`uploads/{filename}`) → user khác upload cùng tên → ghi đè. Luôn có UUID hoặc userId trong key.

---

## Câu hỏi nối tiếp

- *"Presigned URL khác signed cookie/signed policy?"* → Cùng ý tưởng (ký cho phép), khác scope: presigned URL cho 1 object cụ thể; signed policy/cookie cho nhiều object theo pattern (vd upload bất kỳ file trong folder).
- *"Download cũng dùng presigned?"* → Đúng, `getSignedUrl` cho GET — cho phép download file private mà BE không trung chuyển. Hợp lý cho file lớn.
- *"STT/S3 tương đương self-host?"* → MinIO hỗ trợ presigned URL API giống S3. Cloudflare R2, Wasabi cũng vậy — API compatible.
- *"Vậy BE hết việc à?"* → BE lo: auth (ai được upload), ký URL, validate rule, nhận notify, lưu metadata, trigger hậu kỳ. BE vẫn trung tâm — chỉ không trung chuyển file.

> **Câu chốt phỏng vấn:** "Thay để browser upload qua BE, em để browser upload thẳng S3 qua presigned URL — BE chỉ phát vé có TTL ngắn, validate trước khi ký, và nhận notify khi xong. Tiết kiệm double bandwidth và CPU cho BE, BE scale nhẹ. Với file cực lớn thì dùng multipart presigned để có song song + resume. Bí quyết là: **BE kiểm soát quyền, S3 xử lý bytes**."
