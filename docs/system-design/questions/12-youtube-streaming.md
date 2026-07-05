# 12 — Design YouTube / Netflix (Video Streaming) 🔥 ✅ MẪU

> **Loại:** Medium–Hard · **Tần suất:** 🔥🔥🔥 (nhấn mạnh **CDN + transcoding + bandwidth**).
> Áp dụng [khung 6 bước](../00-solving-framework.md).

---

## Bước 1 — Clarify Requirements

### Functional
- User **upload video**.
- User **stream video** trên nhiều thiết bị, nhiều chất lượng.
- **Adaptive bitrate**: tự động chọn quality theo bandwidth.
- Gợi ý video tiếp theo, search.
- (Tuỳ) live streaming, DRM.

### Non-functional
- **Massive read-heavy**: upload ít, xem nhiều.
- **Low latency start playback**: < 2s.
- **High availability**: video phải luôn xem được.
- **Global**: CDN phân phối worldwide.

### Scope
- MVP: upload VOD, transcode, stream qua CDN, adaptive bitrate.
- Later: live streaming, recommendation, DRM.

---

## Bước 2 — Estimation

- 1M DAU, mỗi user xem 5 videos/ngày → 5M views/ngày.
- Mỗi video trung bình 10 phút, 1080p ~ 50MB → **250TB/ngày** outbound bandwidth.
- Upload: 1% users upload 1 video/ngày → 10K uploads/ngày.
- Read:write ratio ≈ **500:1**.

> → Hệ thống cực kỳ read-heavy. **CDN là bắt buộc**.

---

## Bước 3 — High-Level Design + API + Data Model

### API

```typescript
// Upload (resumable)
POST /v1/videos
POST /v1/videos/:id/chunks?index=0

// Stream
GET /v1/videos/:id/manifest.m3u8       // HLS master playlist
GET /v1/videos/:id/1080p/segment_1.ts  // video segment

// Metadata
GET /v1/videos/:id
GET /v1/search?q=...
```

### Data Model

```sql
videos
  id (PK)
  user_id
  title
  description
  status ('uploading' | 'processing' | 'ready' | 'failed')
  duration
  thumbnail_url
  created_at

video_formats
  video_id (FK)
  resolution ('360p' | '720p' | '1080p' | '4k')
  bitrate
  manifest_url
  PK(video_id, resolution)

// Metadata DB tách biệt với video binary storage
```

### Architecture

```
Upload Flow:
[Client] → [Upload Service] → [Raw Storage (S3)]
                                    ↓
                              [Transcoding Queue]
                                    ↓
                              [Transcoding Workers]
                                    ↓
                            [Processed Storage (S3)]
                                    ↓
                              [CDN Origin]

Stream Flow:
[Client] → [CDN Edge] → [Origin Storage] (cache miss)
```

---

## Bước 4 — Deep Dive

### 🔑 Phần cốt lõi #1: Upload

- **Chunked upload**: chia file thành nhiều phần, upload song song, resume khi fail.
- **Resumable upload protocol**: client gửi `Content-Range`, server merge chunks.
- Sau khi upload xong, ghi metadata và đưa vào transcoding queue.

### 🔑 Phần cốt lõi #2: Transcoding pipeline

```
[S3 Raw] → [Queue: transcoding-jobs] → [Worker]
                                            ↓
                              [360p] [720p] [1080p] [4k]
                                            ↓
                              [S3 Processed]
```

- Worker dùng FFmpeg để tạo nhiều resolution/bitrate.
- **Horizontal scaling**: số worker tăng theo queue length.
- Thumbnail cũng được extract ở bước này.

### 🔑 Phần cốt lõi #3: Streaming với HLS/DASH

- **HLS (HTTP Live Streaming)**: video được chia thành các segment `.ts`, client tải manifest `.m3u8` rồi fetch segment.
- **DASH**: tương tự, dùng manifest `.mpd`.
- **Adaptive Bitrate (ABR)**: master playlist chứa nhiều variant, client chọn variant phù hợp băng thông.

### 🔑 Phần cốt lõi #4: CDN

- CDN cache ở edge gần user, giảm latency và origin load.
- **Cache key**: `video_id/resolution/segment_index`.
- Origin pull khi cache miss.
- TTL dài (vd 1 năm) vì video không thay đổi.

### 🔑 Phần cốt lõi #5: Metadata & Discovery

- Metadata (title, description, views) lưu trong **SQL/NoSQL DB**.
- Search dùng **Elasticsearch**.
- Recommendation dùng ML pipeline (user behavior → candidate generation → ranking).

---

## Bước 5 — Bottlenecks & Trade-offs

| Vấn đề | Giải pháp |
|--------|-----------|
| Bandwidth khổng lồ | CDN absorbs 90%+ traffic |
| Transcoding cost | Spot instances, queue-based scaling |
| Storage cost | S3 lifecycle: move old videos to cold storage |
| Start latency | CDN edge + small initial segment + prefetch |
| Format compatibility | HLS for Apple, DASH for Android/web |
| DRM | Widevine (web/Android), FairPlay (Apple) |

---

## Bước 6 — Wrap-up

> "Video streaming là bài toán read-heavy cực đoan: upload ít, xem nhiều. Giải pháp cốt lõi là chunked upload, transcoding pipeline tạo nhiều chất lượng, HLS/DASH adaptive streaming, và CDN global để phân phối. Metadata tách biệt với binary storage."

---

## ✅ Checklist tự đánh giá

- [ ] Đã tách upload (S3) vs transcoding (queue + worker)?
- [ ] Đã dùng CDN + adaptive bitrate để stream?
- [ ] Đã tính bandwidth & giải thích CDN cần thiết?
- [ ] Đã nói về metadata vs binary storage?
- [ ] Đã đề cập HLS/DASH và ABR?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
