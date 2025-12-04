# Tài liệu tích hợp Backend - Frontend

## 📋 Tổng quan

Tài liệu này mô tả cách backend xử lý các API và cách frontend tích hợp đúng.

## 🔄 API Endpoints

### 1. PUT /api/jobs/{job_id} - Cập nhật Job

**Request Body: `UpdateJobRequest`**
```typescript
{
  title?: string;
  description?: string;
  location?: string;
  salaryFrom?: number;
  salaryTo?: number;
  workTime?: string;
  yoe?: number;
  unit?: string;
  rounds?: JobRoundDTO[];  // ⚠️ QUAN TRỌNG
  status?: string;
  deadline?: string;  // LocalDateTime format: yyyy-MM-ddTHH:mm:ss
}
```

**Backend Logic (JobPostService.java, dòng 280-317):**

1. **Nếu `rounds != null && !rounds.isEmpty()`:**
   - ✅ Xóa tất cả rounds cũ (gọi `deleteJobRoundsSafely`)
   - ✅ Tạo rounds mới từ request
   - ✅ Tự động cập nhật `round_count` = số rounds mới
   - ✅ Validation: Số rounds phải khớp với `round_count` (sau khi cập nhật)

2. **Nếu `rounds == null` hoặc `rounds.isEmpty()`:**
   - ✅ Giữ nguyên rounds hiện tại
   - ✅ Không thay đổi `round_count`

## 🎯 Frontend Implementation

### Logic cập nhật rounds (edit-post.page.ts)

```typescript
const roundCount = formValue.recruitmentRound || 1;
const currentRounds = this.jobData?.rounds || [];
const oldRoundCount = this.jobData?.roundCount || 0;

let rounds: JobRoundDTO[] | undefined = undefined;

// Chỉ build rounds nếu roundCount thay đổi
if (roundCount !== oldRoundCount) {
  rounds = [];
  
  // Giữ lại rounds cũ (nếu có)
  const roundsToKeep = Math.min(roundCount, oldRoundCount);
  for (let i = 0; i < roundsToKeep; i++) {
    const existingRound = currentRounds[i];
    rounds.push({
      roundIndex: i,  // Phải từ 0 đến roundCount-1
      roundName: existingRound?.roundName || `Vòng ${i + 1}`,
      isConfirmed: existingRound?.isConfirmed || false,
    });
  }
  
  // Thêm rounds mới nếu tăng
  if (roundCount > oldRoundCount) {
    for (let i = oldRoundCount; i < roundCount; i++) {
      rounds.push({
        roundIndex: i,
        roundName: `Vòng ${i + 1}`,
        isConfirmed: false,
      });
    }
  }
  // Nếu giảm, rounds đã được cắt ở trên
}

// Nếu roundCount không đổi, rounds = undefined
```

## 📝 JobRoundDTO Structure

```typescript
interface JobRoundDTO {
  roundId?: number;        // ID trong DB (optional, không cần khi tạo mới)
  roundIndex: number;     // REQUIRED: 0, 1, 2, ... (bắt đầu từ 0)
  roundName: string;      // REQUIRED: Tên vòng (ví dụ: "Vòng 1")
  isConfirmed?: boolean;  // Optional: Mặc định false
}
```

## ⚠️ Lưu ý quan trọng

### 1. Round Index
- **Bắt đầu từ 0**: `roundIndex` phải từ `0` đến `roundCount - 1`
- **Không duplicate**: Mỗi `roundIndex` chỉ xuất hiện 1 lần
- **Validation backend**: Backend sẽ throw error nếu `roundIndex < 0` hoặc `>= roundCount`

### 2. Số lượng rounds
- **Phải khớp**: Số lượng rounds gửi lên phải = `roundCount` mới
- **Backend tự cập nhật**: Backend sẽ tự động set `round_count` = số rounds mới

### 3. Khi không thay đổi
- **Gửi `undefined`**: Nếu `roundCount` không đổi, gửi `rounds = undefined`
- **Backend giữ nguyên**: Backend sẽ không thay đổi rounds hiện tại

## 🔍 Ví dụ

### Ví dụ 1: Tăng từ 2 → 4 vòng

**Frontend gửi:**
```json
{
  "rounds": [
    { "roundIndex": 0, "roundName": "Vòng 1", "isConfirmed": false },
    { "roundIndex": 1, "roundName": "Vòng 2", "isConfirmed": true },
    { "roundIndex": 2, "roundName": "Vòng 3", "isConfirmed": false },
    { "roundIndex": 3, "roundName": "Vòng 4", "isConfirmed": false }
  ]
}
```

**Backend xử lý:**
1. Xóa rounds cũ (rounds 1, 2)
2. Tạo rounds mới (rounds 1, 2, 3, 4)
3. Cập nhật `round_count` = 4

### Ví dụ 2: Giảm từ 4 → 2 vòng

**Frontend gửi:**
```json
{
  "rounds": [
    { "roundIndex": 0, "roundName": "Vòng 1", "isConfirmed": false },
    { "roundIndex": 1, "roundName": "Vòng 2", "isConfirmed": true }
  ]
}
```

**Backend xử lý:**
1. Xóa tất cả rounds cũ (rounds 1, 2, 3, 4)
2. Tạo rounds mới (rounds 1, 2)
3. Cập nhật `round_count` = 2

### Ví dụ 3: Không thay đổi (2 → 2 vòng)

**Frontend gửi:**
```json
{
  "rounds": undefined  // hoặc không gửi field rounds
}
```

**Backend xử lý:**
- Giữ nguyên rounds hiện tại
- Không thay đổi `round_count`

## 🐛 Common Issues

### Issue 1: Round count mismatch
**Error:** `"Round count mismatch. Expected: X, Found: Y"`
**Nguyên nhân:** Số lượng rounds gửi lên không khớp với `roundCount`
**Giải pháp:** Đảm bảo `rounds.length === roundCount`

### Issue 2: Invalid round index
**Error:** `"Round index must be between 0 and X"`
**Nguyên nhân:** `roundIndex` < 0 hoặc >= `roundCount`
**Giải pháp:** Đảm bảo `roundIndex` từ 0 đến `roundCount - 1`

### Issue 3: Duplicate round index
**Error:** `"Duplicate round index: X"`
**Nguyên nhân:** Có 2 rounds cùng `roundIndex`
**Giải pháp:** Đảm bảo mỗi `roundIndex` chỉ xuất hiện 1 lần

## ✅ Checklist khi implement

- [ ] Số lượng rounds = `roundCount` mới
- [ ] `roundIndex` từ 0 đến `roundCount - 1`
- [ ] Không có duplicate `roundIndex`
- [ ] Giữ lại thông tin rounds cũ (tên, `isConfirmed`) khi có thể
- [ ] Gửi `rounds = undefined` khi không thay đổi
- [ ] Validation số rounds trước khi gửi request

## 📚 References

- Backend Controller: `JobPostController.java`
- Backend Service: `JobPostService.java` (method `updateJob`)
- DTO: `UpdateJobRequest.java`, `JobRoundDTO.java`
- Frontend: `edit-post.page.ts` (method `onSubmit`)














