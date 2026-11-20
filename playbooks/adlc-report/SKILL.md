---
name: adlc-report
title: Nhật ký tiến độ và báo cáo
description: Nhật ký tiến độ và mẫu báo cáo cuối gửi chủ.
triggers: adlc report, nhật ký tiến độ và báo cáo
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Nhật ký tiến độ và báo cáo

## Nhật ký tiến độ (Tech Lead, bắt buộc)

Trong `IMPLEMENTATION_PLAN.md` của repo, mỗi task giữ một bảng `## Nhật ký tiến độ`:

| Thời điểm | Sự kiện | Người | Nhánh |
|---|---|---|---|

- Ghi **ngay lúc sự kiện xảy ra**, không ghi bù: nhận yêu cầu, xin duyệt và kết quả duyệt (skill `adlc-approval`), giao việc, nhận báo đã mở PR, gửi feedback review, merge, verify xong.
- Giờ lấy bằng `date '+%Y-%m-%d %H:%M:%S'`, không đoán.
- Commit file này cùng lúc merge.

## Báo cáo của Tech Lead gửi PM

**Câu trả lời cuối cùng của bạn khi kết thúc task (thứ được gửi về PM) phải là toàn bộ báo cáo theo mẫu dưới đây, đủ mọi bảng.** Không gửi bản tóm tắt gạch đầu dòng rồi trỏ sang file; `IMPLEMENTATION_PLAN.md` chỉ là bản lưu.

**Mọi con số lấy từ dữ liệu thật**: nhật ký tiến độ, receipt của `coordinate_bots`, `git log --all --format='%h %an %ad %s' --date=iso`, kết quả test bạn tự chạy. Số nào không đo được thì ghi "chưa đo" kèm lý do, không bịa.

Bỏ phần trong ngoặc nhọn. Mục nào không áp dụng cho loại việc (vd research không có merge) thì ghi "không áp dụng", không xoá bảng.

**Việc nhỏ** (PM ghi "Cỡ: việc nhỏ"): gửi bảng tóm tắt, mục 3 (Nghiệm thu) và mục 4 (Chất lượng). Bỏ mục 1, 2 và 5, trừ khi có review nhiều vòng hoặc còn rủi ro; khi đó thêm đúng mục đó. Không dán log test dài: ghi lệnh đã chạy, số đạt/tổng, số test bị bỏ qua và lý do.

```
# Báo cáo hoàn thành: {tên task} ({loại việc})

| Mục | Giá trị |
|---|---|
| Trạng thái | {Hoàn thành / Hoàn thành một phần / Chặn} |
| Nhận yêu cầu | {giờ, từ nhật ký} |
| Hoàn thành | {giờ merge cuối hoặc verify xong, từ nhật ký} |
| Thời gian hoàn thành | {tổng phút từ nhận yêu cầu đến hoàn thành} |
| Phần việc | {xong}/{giao} |
| Test case | {đạt}/{tổng} |
| Vòng review | {tổng số vòng} trên {số nhánh} nhánh |
| Commit trên nhánh gốc | {hash merge cuối} |

## 1. Phân công và tiến độ
| Phần việc | Người làm | Loại | Nhánh | Giao lúc | Commit đầu | Báo Lead | Merge | Thời gian | Vòng review |
|---|---|---|---|---|---|---|---|---|---|

## 2. Review
| Nhánh | Vòng | Nhận xét chính | Kết quả |
|---|---|---|---|
(một dòng mỗi vòng; vòng nào yêu cầu sửa thì ghi rõ sửa gì)

## 3. Nghiệm thu (Tech Lead xác nhận)
| Tiêu chí | Test case | Cách kiểm | Kết quả | Bằng chứng |
|---|---|---|---|---|
(Kết quả: Đạt / Đạt một phần / Không đạt. Cách kiểm: test tự động / trình duyệt / curl. Bằng chứng: lệnh, số test, đường dẫn ảnh trong reports/screenshots/)

## 4. Chất lượng
| Chỉ số | Giá trị |
|---|---|
| Test tự động | {passed}/{total} |
| {chỉ số riêng của task, vd độ chính xác top-1/top-3} | {giá trị} |

## 5. Rủi ro và việc còn lại
| Mục | Mức độ | Đề xuất |
|---|---|---|
```

## Báo cáo của PM gửi chủ

Quy ước không cần hỏi lại: commit merge đứng tên Tech Lead; commit trên nhánh đứng tên engineer làm phần đó; card duyệt push và duyệt merge do chủ của engineer và chủ của Tech Lead trả lời.

Gửi theo đúng thứ tự:

1. **Kết luận** (2–3 câu cho người đọc bận): task xong chưa, **thời gian hoàn thành** (lấy từ báo cáo của Tech Lead), rủi ro cần quyết.
2. **Toàn bộ báo cáo của Tech Lead, chép nguyên văn**: đủ bảng tóm tắt và các mục 1–5. Không rút gọn, không viết lại thành gạch đầu dòng hay đoạn văn.
3. **Đối chiếu yêu cầu**: | Yêu cầu | Tiêu chí | Nghiệm thu của Tech Lead | Bằng chứng | Ghi chú |. Nghiệm thu là của Tech Lead (người review và verify); bạn không tự chấm lại. Dòng nào Tech Lead không có bằng chứng thì ghi "chưa xác minh" ở cột Ghi chú.
4. **Ý kiến PM** (chỉ khi cần): chỗ chưa khớp yêu cầu, và các quyết định cần chủ đưa ra.

**Trước khi gửi, tự kiểm** đủ: bảng tóm tắt (có dòng "Thời gian hoàn thành"), bảng 1 Phân công, 2 Review, 3 Nghiệm thu, 4 Chất lượng, 5 Rủi ro. Thiếu bảng nào thì lấy đúng bảng đó từ phần báo cáo mới nhất trong `IMPLEMENTATION_PLAN.md`; trong file cũng không có thì gửi lại Tech Lead yêu cầu bổ sung, chưa báo chủ.
