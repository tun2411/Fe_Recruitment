# Tài liệu yêu cầu Backend - Cập nhật Job và Rounds

## 📋 Tổng quan

Tài liệu này mô tả các vấn đề và yêu cầu liên quan đến API cập nhật job (`PUT /api/jobs/{job_id}`), đặc biệt là phần xử lý rounds khi người dùng thay đổi số vòng tuyển dụng.

## 🔍 Phân tích logic hiện tại

### API: PUT /api/jobs/{job_id}

**File:** `JobPostService.java` - Method `updateJob()` (dòng 167-322)

**Logic hiện tại:**

```java
// Dòng 280-317
if (request.getRounds() != null && !request.getRounds().isEmpty()) {
    // Validation: Kiểm tra số lượng rounds khớp với round_count
    int expectedRoundCount = request.getRounds().size();
    if (jobPost.getRoundCount() != null && expectedRoundCount != jobPost.getRoundCount()) {
        // Update round_count nếu khác
        jobPost.setRoundCount(expectedRoundCount);
    }
    
    // Validation: Kiểm tra round_index...
    
    // Xóa rounds cũ (an toàn - set round_id = NULL trong Form trước)
    deleteJobRoundsSafely(jobId);
    
    // Tạo rounds mới
    for (JobRoundDTO roundDTO : request.getRounds()) {
        JobRound jobRound = new JobRound();
        // ... tạo round mới
    }
    
    // Đồng bộ round_count
    jobPost.setRoundCount(expectedRoundCount);
}
```

## ⚠️ Vấn đề hiện tại

### 1. Logic xóa và tạo lại rounds

**Vấn đề:**
- Backend luôn xóa tất cả rounds cũ và tạo mới khi có `rounds` trong request
- Điều này có thể gây mất dữ liệu nếu frontend không gửi đầy đủ thông tin rounds cũ

**Ví dụ:**
- Job có 4 rounds với tên tùy chỉnh: "Vòng phỏng vấn kỹ thuật", "Vòng phỏng vấn HR", ...
- User chỉ thay đổi `roundCount` từ 4 → 5
- Frontend gửi 5 rounds (4 rounds cũ + 1 round mới)
- Backend xóa tất cả và tạo lại → **Mất thông tin rounds cũ nếu frontend không gửi đúng**

### 2. Validation round_count

**Vấn đề:**
- Backend kiểm tra `expectedRoundCount != jobPost.getRoundCount()` (dòng 283)
- Nhưng sau đó lại set `round_count = expectedRoundCount` (dòng 285, 316)
- Logic này có vẻ redundant

**Gợi ý:**
- Nên luôn cập nhật `round_count = expectedRoundCount` khi có rounds trong request
- Validation chỉ cần kiểm tra `roundIndex` hợp lệ (0 đến expectedRoundCount-1)

### 3. Behavior khi rounds = null

**Hiện tại:**
- Nếu `rounds == null` hoặc empty → Backend giữ nguyên rounds hiện tại ✅
- Điều này là đúng và phù hợp với yêu cầu

**Xác nhận cần thiết:**
- Có cần thêm validation khi `rounds = null` nhưng `round_count` thay đổi không?
- Ví dụ: User thay đổi `round_count` trong form nhưng không gửi `rounds` → Backend sẽ làm gì?

## 🎯 Yêu cầu và đề xuất

### 1. Cải thiện logic cập nhật rounds

**Đề xuất 1: Merge thay vì replace (Khuyến nghị)**

Thay vì xóa tất cả và tạo mới, nên:
- Giữ lại rounds có `roundId` trong request (update nếu có)
- Xóa rounds không có trong request
- Tạo mới rounds không có `roundId`

```java
if (request.getRounds() != null && !request.getRounds().isEmpty()) {
    List<JobRoundDTO> newRounds = request.getRounds();
    List<JobRound> existingRounds = jobRoundRepository.findByJobIdOrderByRoundIndexAsc(jobId);
    
    // Map existing rounds by roundId
    Map<Long, JobRound> existingRoundsMap = existingRounds.stream()
        .collect(Collectors.toMap(JobRound::getId, r -> r));
    
    // Process each round in request
    for (JobRoundDTO roundDTO : newRounds) {
        if (roundDTO.getRoundId() != null && existingRoundsMap.containsKey(roundDTO.getRoundId())) {
            // Update existing round
            JobRound existing = existingRoundsMap.get(roundDTO.getRoundId());
            existing.setRoundIndex(roundDTO.getRoundIndex());
            existing.setRoundName(roundDTO.getRoundName());
            existing.setIsConfirmed(roundDTO.getIsConfirmed());
            jobRoundRepository.save(existing);
        } else {
            // Create new round
            JobRound newRound = new JobRound();
            newRound.setJob(jobPost);
            newRound.setRoundIndex(roundDTO.getRoundIndex());
            newRound.setRoundName(roundDTO.getRoundName());
            newRound.setIsConfirmed(roundDTO.getIsConfirmed());
            jobRoundRepository.save(newRound);
        }
    }
    
    // Delete rounds not in request
    Set<Long> requestedRoundIds = newRounds.stream()
        .map(JobRoundDTO::getRoundId)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());
    
    for (JobRound existing : existingRounds) {
        if (!requestedRoundIds.contains(existing.getId())) {
            deleteJobRoundSafely(existing.getId());
            jobRoundRepository.delete(existing);
        }
    }
    
    // Update round_count
    jobPost.setRoundCount(newRounds.size());
}
```

**Đề xuất 2: Giữ nguyên logic hiện tại nhưng cải thiện validation**

Nếu giữ logic xóa và tạo lại:
- Thêm validation: Đảm bảo frontend luôn gửi đầy đủ rounds
- Thêm warning log khi xóa rounds có dữ liệu liên quan (forms, templates)
- Cải thiện error message khi validation fail

### 2. Cải thiện validation

**Đề xuất:**

```java
// Validation 1: Số lượng rounds phải hợp lệ
if (request.getRounds() != null && !request.getRounds().isEmpty()) {
    int expectedRoundCount = request.getRounds().size();
    
    if (expectedRoundCount < 1) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "At least 1 round is required");
    }
    
    if (expectedRoundCount > 10) { // Hoặc giới hạn phù hợp
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Maximum 10 rounds allowed");
    }
    
    // Validation 2: Round index phải từ 0 đến expectedRoundCount-1
    boolean[] indexUsed = new boolean[expectedRoundCount];
    for (JobRoundDTO roundDTO : request.getRounds()) {
        if (roundDTO.getRoundIndex() < 0 || roundDTO.getRoundIndex() >= expectedRoundCount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                String.format("Round index must be between 0 and %d, got: %d",
                    expectedRoundCount - 1, roundDTO.getRoundIndex()));
        }
        if (indexUsed[roundDTO.getRoundIndex()]) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                String.format("Duplicate round index: %d", roundDTO.getRoundIndex()));
        }
        indexUsed[roundDTO.getRoundIndex()] = true;
    }
    
    // Validation 3: Round name không được trống
    for (JobRoundDTO roundDTO : request.getRounds()) {
        if (roundDTO.getRoundName() == null || roundDTO.getRoundName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Round name cannot be empty");
        }
    }
}
```

### 3. Xử lý trường hợp đặc biệt

**Trường hợp 1: Job đã publish**

**Hiện tại:** Backend cho phép cập nhật rounds của job đã publish (dòng 280)

**Đề xuất:** 
- Có nên cho phép cập nhật rounds của job đã publish không?
- Nếu có, cần cảnh báo hoặc yêu cầu xác nhận
- Nếu không, nên throw error khi job status = active

**Trường hợp 2: Rounds có applications đang xử lý**

**Đề xuất:**
- Kiểm tra xem rounds có applications đang ở vòng đó không
- Nếu có, không cho phép xóa hoặc yêu cầu xác nhận
- Hoặc tự động chuyển applications sang round khác

**Trường hợp 3: Rounds có forms/templates đã cấu hình**

**Hiện tại:** `deleteJobRoundsSafely()` đã xử lý (set round_id = NULL trong Form)

**Xác nhận:** Logic này có đúng và an toàn không?

## 📝 Các câu hỏi cần trả lời

1. **Khi `rounds = null` nhưng `round_count` thay đổi:**
   - Backend sẽ làm gì?
   - Có nên throw error không?
   - Hay tự động tạo rounds mặc định?

2. **Khi xóa rounds:**
   - Có cần backup dữ liệu không?
   - Có cần log audit không?
   - Có cần thông báo cho user không?

3. **Khi update rounds của job đã publish:**
   - Có nên cho phép không?
   - Nếu có, có cần thông báo cho candidates không?

4. **Performance:**
   - Logic xóa và tạo lại có ảnh hưởng performance không?
   - Có nên dùng batch insert/delete không?

## 🔄 Flow đề xuất (Merge approach)

```
User thay đổi roundCount
    ↓
Frontend gửi UpdateJobRequest với rounds array
    ↓
Backend nhận request
    ↓
Validation:
  - Số lượng rounds hợp lệ
  - Round index hợp lệ
  - Round name không trống
    ↓
Xử lý từng round:
  - Nếu có roundId → Update round hiện có
  - Nếu không có roundId → Tạo round mới
    ↓
Xóa rounds không có trong request
    ↓
Cập nhật round_count = số rounds mới
    ↓
Return success
```

## 📊 So sánh 2 approaches

| Tiêu chí | Replace (Hiện tại) | Merge (Đề xuất) |
|----------|-------------------|-----------------|
| Đơn giản | ✅ Đơn giản hơn | ❌ Phức tạp hơn |
| Performance | ✅ Nhanh hơn (batch delete) | ⚠️ Có thể chậm hơn |
| Giữ dữ liệu | ❌ Mất dữ liệu nếu frontend không gửi đúng | ✅ Giữ được dữ liệu |
| Validation | ⚠️ Cần frontend gửi đầy đủ | ✅ Linh hoạt hơn |
| Error handling | ⚠️ Khó debug khi mất dữ liệu | ✅ Dễ debug hơn |

## ✅ Khuyến nghị

**Nếu giữ logic hiện tại (Replace):**
1. ✅ Cải thiện validation (như đề xuất ở trên)
2. ✅ Thêm warning log khi xóa rounds
3. ✅ Cải thiện error messages
4. ✅ Document rõ ràng behavior cho frontend

**Nếu chuyển sang Merge approach:**
1. ✅ Implement logic merge như đề xuất
2. ✅ Thêm unit tests cho các trường hợp edge cases
3. ✅ Performance testing với số lượng rounds lớn
4. ✅ Document migration guide nếu cần

## 📚 Tài liệu tham khảo

- Backend code: `JobPostService.java` - Method `updateJob()` (dòng 167-322)
- DTO: `UpdateJobRequest.java`, `JobRoundDTO.java`
- Frontend implementation: `edit-post.page.ts` - Method `onSubmit()`

## 📞 Liên hệ

Nếu có câu hỏi hoặc cần làm rõ thêm, vui lòng liên hệ team frontend.

---

**Ngày tạo:** $(date)
**Phiên bản:** 1.0
**Trạng thái:** Đang chờ review








