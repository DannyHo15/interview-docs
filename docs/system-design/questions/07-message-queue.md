# 07 — Design a Distributed Message Queue (Kafka) 📝 (tự luyện)

> **Loại:** Medium–Hard · Hỏi dạng *"thiết kế message queue / pub-sub"*.
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Thiết kế message queue phân tán: producer gửi message vào topic, consumer đọc theo thứ tự. Đảm bảo durability, scale được, hỗ trợ nhiều consumer group.

## ❓ Clarifying questions nên hỏi
- **Delivery guarantee:** at-most-once / at-least-once / exactly-once?
- Thứ tự message cần đảm bảo trong **topic** hay chỉ trong **partition**?
- Có cần **replay** (đọc lại message cũ)?
- Message size & throughput mục tiêu (Kafka → hàng triệu msg/s)?
- Retention bao lâu (vd 7 ngày)?

## 📐 Estimation hints
- Throughput cực cao → **sequential disk write** (nhanh hơn random RAM access ngoài đời).
- Partition count quyết định parallelism.

## 🎯 Trọng tâm / keywords
- **Topic → Partition:** chia để scale; thứ tự chỉ đảm bảo **trong 1 partition**.
- **Offset:** consumer theo dõi vị trí đã đọc (lưu trong `__consumer_offsets`).
- **Consumer group:** mỗi partition chỉ do 1 consumer trong group đọc → parallel + thứ tự.
- **Durability:** replication factor, **ISR** (in-sync replicas), ack=all.
- **Storage:** append-only log + **segment file**; retention by time/size.
- **Leader/Follower per partition**, ZooKeeper/KRaft cho metadata.
- **At-least-once** (default) → consumer cần **idempotent**; exactly-once qua transactional producer.
- **Backpressure / DLQ (dead letter queue)** cho message lỗi.

## ✅ Checklist tự đánh giá
- [ ] Đã giải thích partition vs topic vs consumer group?
- [ ] Đã nói về durability (replication, ack)?
- [ ] Đã phân biệt 3 delivery semantics?
- [ ] Đã xử lý consumer failure (offset commit, retry, DLQ)?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
