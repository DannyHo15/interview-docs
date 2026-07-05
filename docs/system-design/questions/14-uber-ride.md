# 14 — Design Uber / Ola (Ride Sharing) 🔥 📝 (tự luyện)

> **Loại:** Hard · Nặng về **geospatial** + real-time matching.
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
User gọi xe → tìm tài xế gần nhất → match → tài xế tới → đi → thanh toán. Theo dõi vị trí real-time, tính ETA, surge pricing.

## ❓ Clarifying questions nên hỏi
- Chỉ **match nearest** hay có ranking (rating, surge)?
- Cần **real-time location tracking** cả hành khách & tài xế?
- **ETA** tính dựa trên gì (traffic)?
- Có cần **surge pricing** (giá cao giờ cao điểm)?
- **Quy mô thành phố** (vd 1 triệu tài xế)?

## 📐 Estimation hints
- Cập nhật vị trí liên tục (mỗi vài giây/driver) → **write QPS geo rất cao**.
- Latency match < vài giây.

## 🎯 Trọng tâm / keywords
- **Geospatial index:** **Geohash** hoặc **Quadtree** (hoặc Google S2) để tìm "driver trong bán kính R".
- **Driver location service:** nhận update vị trí liên tục → lưu in-memory (Redis + geospatial).
- **Dispatch / matching:** rider request → query driver gần → assign; **idempotent** khi retry.
- **WebSocket** cho real-time tracking rider/driver.
- **ETA:** gọi routing service (road graph + traffic) — không phải thẳng tuyến.
- **Surge pricing:** dựa trên supply/demand theo khu vực (geohash cell).
- **Trip state machine** (requested → matched → enroute → completed) — durable, Kafka events.
- **Scaling:** shard geospatial theo khu vực (city cell); hot city → cell con nhỏ hơn.
- **Payment, rating, notification** — service riêng.

## ✅ Checklist tự đánh giá
- [ ] Đã chọn geospatial index (Geohash/Quadtree) + giải thích?
- [ ] Đã xử lý write QPS cao của location update?
- [ ] Đã có matching + ETA mechanism?
- [ ] Đã nói surge pricing & state machine?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
