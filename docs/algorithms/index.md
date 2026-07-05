# 🧮 Algorithms & Data Structures — Fullstack Interview Prep

> Bộ tài liệu ôn **coding interview** cho vị trí fullstack, **song ngữ Việt–Anh**.
> Không phải LeetCode toàn tập, mà là **các pattern & câu hỏi thường gặp** ở vòng technical screen / live coding.

---

## 📂 Cấu trúc thư mục

```
algorithms/
├── index.md                         ← bạn đang ở đây
├── 00-problem-solving-framework.md  ← khung giải bài toán coding
├── 01-arrays-strings.md             ← two pointers, sliding window, hash map
├── 02-linked-lists-stacks-queues.md ← LL, stack, queue, monotonic stack
├── 03-trees-graphs.md               ← BST, DFS, BFS, topological sort
├── 04-dynamic-programming.md        ← memo, knapsack, LIS, string DP
├── 05-intervals-greedy.md           ← merge intervals, scheduling
└── 06-bit-manipulation-math.md      ← bitwise, modulo, gcd/lcm, primes
```

---

## 📋 Catalog theo pattern

| Pattern | Tần suất | File | Mấu chốt |
|---------|----------|------|----------|
| **Two Pointers** | 🔥🔥🔥 | `01` | Sorted array, palindrome, 3-sum |
| **Sliding Window** | 🔥🔥🔥 | `01` | Subarray/substring có điều kiện |
| **Hash Map / Set** | 🔥🔥🔥 | `01` | Two sum, anagram, frequency |
| **Linked List** | 🔥🔥 | `02` | Reverse, cycle, merge, middle |
| **Stack / Queue** | 🔥🔥 | `02` | Valid parentheses, monotonic stack |
| **Binary Tree / BST** | 🔥🔥🔥 | `03` | Traversal, LCA, validate BST |
| **DFS / BFS** | 🔥🔥🔥 | `03` | Island, path, shortest path |
| **Topological Sort** | 🔥🔥 | `03` | Course schedule, task ordering |
| **Dynamic Programming** | 🔥🔥🔥 | `04` | Fibonacci, knapsack, LCS/LIS |
| **Greedy / Intervals** | 🔥🔥 | `05` | Merge intervals, meeting rooms |
| **Bit Manipulation** | 🔥 | `06` | Single number, power of two, XOR |

---

## 🗺️ Lộ trình ôn (Study Roadmap)

### Tuần 1 — Arrays & Strings (foundation)
`00-problem-solving-framework` → `01-arrays-strings`
> Mục tiêu: giải 80% bài easy–medium array/string trong 20–25 phút.

### Tuần 2 — Linear structures
`02-linked-lists-stacks-queues`
> Focus: reverse LL, detect cycle, valid parentheses, monotonic stack.

### Tuần 3 — Trees & Graphs
`03-trees-graphs`
> Focus: DFS/BFS template, BST operations, topological sort.

### Tuần 4 — DP + Intervals
`04-dynamic-programming` → `05-intervals-greedy`
> Focus: nhận diện DP state, bottom-up, merge intervals.

### Tuần 5 — Mixed practice
Luyện 1–2 bài/ngày, xen kẽ các pattern. Đọc lại `00-problem-solving-framework` để cải thiện cách trình bày.

---

## ✍️ Quy tắc khi giải bài live coding

1. **Hiểu đề trước khi code** — đặt clarifying questions, đưa ra ví dụ input/output.
2. **Nói ra suy nghĩ** — interviewer muốn nghe tư duy, không chỉ kết quả.
3. **Brute-force trước** — đừng lao vào optimal; nêu brute-force và complexity.
4. **Tối ưu dần** — từ O(n²) → O(n log n) → O(n).
5. **Code sạch** — đặt tên biến rõ ràng, chia helper function.
6. **Self-test** — chạy qua 1–2 ví dụ bằng tay (dry run) trước khi nói xong.
7. **Phân tích complexity** — time + space, best/average/worst case.

---

## 📚 Tài liệu tham khảo

- [LeetCode Top 150](https://leetcode.com/studyplan/top-interview-150/) — lộ trình chuẩn.
- [NeetCode Roadmap](https://neetcode.io/roadmap) — phân theo pattern rất hay.
- *Cracking the Coding Interview* (Gayle McDowell) — cơ bản.
- *Elements of Programming Interviews* — nâng cao.
