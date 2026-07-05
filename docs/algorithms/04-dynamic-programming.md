# 04 — Dynamic Programming

> DP là nỗi sợ phổ biến, nhưng với fullstack interview thường chỉ cần nhận diện pattern cơ bản.

---

## 1. Nhận diện DP

Dấu hiệu:
- Bài toán có **optimal substructure**: optimal của bài toán lớn phụ thuộc optimal của bài toán con.
- Bài toán con **lặp lại** (overlapping subproblems).
- Câu hỏi dạng: "maximum/minimum/number of ways".

---

## 2. Các bước giải DP

1. **Define state**: `dp[i]` hoặc `dp[i][j]` nghĩa là gì?
2. **Base case**: giá trị khởi đầu.
3. **Recurrence relation**: công thức chuyển trạng thái.
4. **Compute order**: bottom-up hoặc top-down memoization.
5. **Return result**: trả về `dp[n]` hoặc `dp[n][m]`.

---

## 3. 1D DP

### Câu hỏi kinh điển
- **Climbing Stairs**
- **House Robber**
- **Maximum Subarray (Kadane)**
- **Coin Change**
- **Longest Increasing Subsequence (LIS)**

### Template: bottom-up
```typescript
function climbStairs(n: number): number {
  if (n <= 2) return n;
  const dp = new Array(n + 1).fill(0);
  dp[1] = 1;
  dp[2] = 2;
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}
```

### Space optimization
```typescript
function climbStairsOptimized(n: number): number {
  if (n <= 2) return n;
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}
```

---

## 4. 2D DP

### Câu hỏi kinh điển
- **Unique Paths**
- **Longest Common Subsequence (LCS)**
- **Edit Distance**
- **0/1 Knapsack**
- **Coin Change II**

### Template: LCS
```typescript
function longestCommonSubsequence(text1: string, text2: string): number {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = 1 + dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}
```

---

## 5. Memoization (Top-down)

Thích hợp khi:
- Không cần tính tất cả subproblems.
- Code gần với đệ quy tự nhiên hơn.

```typescript
function fib(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n)!;
  const result = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, result);
  return result;
}
```

---

## 📝 Checklist tự đánh giá

- [ ] Phân biệt top-down vs bottom-up.
- [ ] Define state rõ ràng trước khi code.
- [ ] Biết space optimization từ O(n) → O(1) cho 1D DP.
- [ ] Nhận diện bài "number of ways" → thường là DP.
