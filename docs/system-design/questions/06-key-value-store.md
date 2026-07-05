# 06 — Design a Key-Value Store (DynamoDB / Cassandra-style) 📝 (tự luyện)

> **Loại:** Hard · Nền tảng của NoSQL — hỏi khi phỏng vấn senior.
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Thiết kế KV store phân tán: `get(key)`, `put(key, value)`. Có thể chạy trên nhiều node, HA, scale được, mỗi khi node add/remove thì rebalance ít tốn kém.

## ❓ Clarifying questions nên hỏi
- Có cần **strong consistency** hay eventual OK?
- **CAP** ưu tiên gì (AP hay CP)?
- Item size, throughput yêu cầu?
- Có cần **range query** (sort order) hay chỉ point get/put?
- Có cần **durability** tuyệt đối?

## 📐 Estimation hints
- PB-scale data → phải partition + replicate.
- Tính số replica = replication factor (RF, thường 3).

## 🎯 Trọng tâm / keywords
- **Consistent hashing** + virtual nodes (giống cache, nhưng cho data durable).
- **Replication:** mỗi key → N replica (RF=3) trên các node khác nhau (rack-aware).
- **Consistency level (quorum):** `W + R > N` → strong. `R=1, W=1` → eventual, nhanh.
- **Vector clocks / versioning** để phát hiện & giải quyết **conflict** khi concurrent write.
- **Read repair / anti-entropy (Merkle tree)** để sửa replica lệch.
- **Gossip protocol** cho node membership/failure detection.
- **Hinted handoff** khi node tạm down.
- **SSTable + Memtable + WAL** (LSM-tree) cho write-heavy (Cassandra).
- CAP: chọn **AP** (Dynamo) hay **CP** (HBase).

## ✅ Checklist tự đánh giá
- [ ] Đã giải thích quorum consistency (W+R>N)?
- [ ] Đã xử lý conflict (vector clock / last-write-wins)?
- [ ] Đã nói replication + failure handling?
- [ ] Đã chọn AP vs CP có lý do?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
