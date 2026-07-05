# 12 — Design YouTube / Netflix (Video Streaming) 🔥 📝 (tự luyện)

> **Loại:** Medium–Hard · Bandwidth khổng lồ; nhấn mạnh **CDN + transcoding**.
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Upload video → user stream (play). Hỗ trợ nhiều thiết bị, chất lượng (1080p/720p/...), adaptive bitrate. Gợi ý video tiếp theo.

## ❓ Clarifying questions nên hỏi
- **Read:write ratio** (upload ít, xem cực nhiều).
- Cần **DASH/HLS adaptive bitrate**?
- Có **live streaming** hay chỉ VOD?
- Cần **DRM**?
- Latency start playback mục tiêu?

## 📐 Estimation hints
- Bandwidth là bottleneck #1: 1 video 100MB × triệu view → **petabytes/ngày**.
- → Bắt buộc **CDN** ở edge.

## 🎯 Trọng tâm / keywords
- **Upload flow:** client → **chunked upload** (resumable) → origin storage (S3).
- **Transcoding pipeline:** video → **message queue** → workers tạo **nhiều resolution/bitrate** → lưu.
- **Streaming:** client request manifest (DASH/HLS) → fetch chunks từ **CDN** (closest edge).
- **CDN** absorb 90%+ traffic; origin pull khi cache miss.
- **Adaptive bitrate (ABR):** client chọn quality theo băng thông.
- **Metadata** (title, thumbnail, views) → DB; **search/recommend** → Elasticsearch + ML.
- **CDN cache key** = video_id + resolution + segment.
- **DRM** (Widevine/FairPlay) cho nội dung bản quyền.

## ✅ Checklist tự đánh giá
- [ ] Đã tách upload (S3) vs transcoding (queue + worker)?
- [ ] Đã dùng CDN + adaptive bitrate để stream?
- [ ] Đã tính bandwidth & giải thích CDN cần thiết?
- [ ] Đã nói về metadata vs binary storage?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
