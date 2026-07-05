# 01 — Arrays & Strings

> Nền tảng của mọi coding interview. Nếu chỉ ôn 1 nhóm, đây là nhóm quan trọng nhất.

---

## 1. Two Pointers

### Khi nào dùng?
- Array/string **đã sorted** hoặc cần duyệt từ **2 đầu**.
- Tìm pair/triplet thoả mãn điều kiện.

### Câu hỏi kinh điển
- **Two Sum II** (sorted)
- **3Sum**
- **Container With Most Water**
- **Valid Palindrome**
- **Merge Sorted Array**

### Template
```typescript
function twoPointer(nums: number[], target: number): number[] {
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

### Gotcha
- `left < right` hay `left <= right`? Thường là `<` để tránh dùng cùng phần tử.
- Triplet: fix 1 phần tử rồi two pointers phần còn lại.

---

## 2. Sliding Window

### Khi nào dùng?
- Tìm **subarray/substring** liên tục thoả mãn điều kiện.
- Dấu hiệu: "longest/shortest substring", "maximum sum of k elements", "contains all characters".

### 2 loại
| Loại | Đặc điểm | Ví dụ |
|------|----------|-------|
| **Fixed-size window** | Window size k cố định | Max sum of k consecutive elements |
| **Variable-size window** | Mở rộng/thu nhỏ linh hoạt | Longest substring without repeating chars |

### Template (variable)
```typescript
function longestSubstring(s: string): number {
  const seen = new Map<string, number>();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (seen.has(char) && seen.get(char)! >= left) {
      left = seen.get(char)! + 1;
    }
    seen.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
```

### Câu hỏi kinh điển
- **Longest Substring Without Repeating Characters**
- **Minimum Window Substring**
- **Maximum Average Subarray I**
- **Longest Repeating Character Replacement**

---

## 3. Hash Map / Hash Set

### Khi nào dùng?
- Cần **O(1) lookup**.
- Đếm frequency, tìm duplicate, check anagram.

### Câu hỏi kinh điển
- **Two Sum** (unsorted)
- **Group Anagrams**
- **Top K Frequent Elements**
- **Contains Duplicate**
- **Subarray Sum Equals K**

### Pattern: frequency counter
```typescript
function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const count: Record<string, number> = {};
  for (const c of s) count[c] = (count[c] || 0) + 1;
  for (const c of t) {
    if (!count[c]) return false;
    count[c]--;
  }
  return true;
}
```

### Gotcha
- Object key trong JS là string; nếu key là number cũng bị ép kiểu → vẫn ổn nhưng cẩn thận với object key.
- Với `Map`, key có thể là bất kỳ type nào.

---

## 4. Prefix Sum

### Khi nào dùng?
- Tính **sum của subarray** nhiều lần.
- Dấu hiệu: "subarray sum equals k", "range sum query".

### Ý tưởng
```
prefix[i] = nums[0] + nums[1] + ... + nums[i-1]
sum(i, j) = prefix[j+1] - prefix[i]
```

### Câu hỏi kinh điển
- **Subarray Sum Equals K**
- **Range Sum Query — Immutable**
- **Continuous Subarray Sum**

---

## 5. String manipulation

### Câu hỏi kinh điển
- **Valid Palindrome**
- **Valid Anagram**
- **Longest Common Prefix**
- **Reverse String / Words**
- **Roman to Integer**

### Tips
- Dùng `split('')`, `Array.from(str)` hoặc spread `[...str]` để iterate trong JS/TS.
- Regex cẩn thận với performance; trong interview thường tự viết cleaner.

---

## 6. Sorting & Searching cơ bản

### Cần biết
- **Binary Search**: O(log n), dùng khi array sorted.
- **Merge Sort / Quick Sort**: O(n log n) trung bình.

### Binary Search template
```typescript
function binarySearch(nums: number[], target: number): number {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
```

> Dùng `left + Math.floor((right - left) / 2)` thay vì `(left + right) / 2` để tránh overflow.

---

## 📝 Checklist tự đánh giá

- [ ] Two pointers: biết khi nào dùng, viết template trong 2 phút.
- [ ] Sliding window: phân biệt fixed vs variable.
- [ ] Hash map: dùng frequency counter, biết trade-off với object/Map.
- [ ] Prefix sum: giải thích subarray sum bằng prefix.
- [ ] Binary search: viết chuẩn, tránh infinite loop.
