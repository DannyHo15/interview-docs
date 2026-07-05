# 00 — Khung giải bài toán Coding Interview

> Mục tiêu: trả lờí **có cấu trúc**, tránh đọc đề xong code ngay dẫn đến sai hướng.

---

## Bước 1 — Đọc đề & Clarify (1–2 phút)

Đặt các câu hỏi:
- Input size lớn đến mức nào?
- Có duplicate không?
- Cần return index hay value?
- Có yêu cầu **in-place** không?
- Có yêu cầu **sort theo thứ tự ban đầu** không?

Ví dụ: với *Two Sum*, hỏi "Nếu nhiều cặp thoả mãn thì return cặp nào?"

---

## Bước 2 — Thiết kế test cases (1–2 phút)

Viết ra 4–5 loại test case:
1. **Happy case** — bình thường.
2. **Edge case** — empty, single element, all same.
3. **Large input** — xem performance.
4. **Invalid input** — null, undefined (nếu ngôn ngữ cho phép).

Ví dụ *Valid Parentheses*:
- `()` → true
- `()[]{}` → true
- `(]` → false
- `((` → false
- empty → true

---

## Bước 3 — Brute-force (2–3 phút)

Luôn nêu brute-force trước. Ví dụ:
- *Two Sum* brute-force: nested loop O(n²).
- *Maximum Subarray* brute-force: tất cả subarrays O(n³) hoặc O(n²).

Nói rõ: "Brute-force là O(n²), tôi nghĩ có thể tối ưu xuống O(n) bằng hash map."

---

## Bước 4 — Tối ưu & chọn data structure (3–5 phút)

Câu hỏi then chốt: **pattern nào?**
| Dấu hiệu | Pattern/Lời giải |
|----------|------------------|
| Sorted array, cần pair/triplet | Two pointers |
| Subarray/substring có điều kiện | Sliding window |
| Đếm/tìm frequency, duplicate | Hash map/set |
| Cần LIFO hoặc matching | Stack |
| Cần FIFO hoặc level-order | Queue / BFS |
| Cần min/max liên tục | Heap / monotonic deque |
| Cây, đường đi, tìm kiếm | DFS/BFS |
| Phụ thuộc giữa các task | Topological sort |
| Bài toán con lặp lại | Dynamic programming |
| Chọn nhiều task không overlap | Greedy / intervals |

---

## Bước 5 — Code (10–15 phút)

- Viết **pseudo-code** hoặc outline trước nếu cần.
- Code theo style sạch: tên rõ, helper function ngắn.
- Tránh viết quá nhiều dòng trước khi test.

Ví dụ template Two Pointers:
```typescript
function twoSum(nums: number[], target: number): number[] {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [];
}
```

---

## Bước 6 — Dry run + Complexity (2–3 phút)

Chạy tay qua 1 test case. Sau đó nói:
- **Time complexity:** O(...)
- **Space complexity:** O(...)
- **Trade-off:** tại sao chọn cách này?

---

## 🗣️ Script trình bày mẫu

> "Đầu tiên tôi sẽ clarify input/output. Brute-force của bài này là O(n²) vì... Tôi nhận thấy pattern phù hợp là sliding window vì... Cách làm là... Complexity cuối cùng là O(n) time và O(1) space."

---

## ⚠️ Những lỗi phổ biến

1. **Không clarify** → code sai yêu cầu.
2. **Impose giả định** → giả sử input sorted trong khi chưa sort.
3. **Bỏ qua edge case** → empty array, null, overflow.
4. **Không phân tích complexity** → interviewer không biết bạn hiểu sâu không.
5. **Code xong mới test** → sửa lỗi tốn thờ gian.
