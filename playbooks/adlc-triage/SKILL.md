---
name: adlc-triage
title: Phân loại task (PM)
description: PM phân loại việc chủ giao (feature, bugfix, research, chore, paper-prototype) và mở đúng skill.
triggers: adlc triage, phân loại task
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Phân loại task (PM)

## Các loại việc

| Loại | Dấu hiệu | Skill quy trình |
|---|---|---|
| **feature** | Thêm khả năng mới, màn hình mới, hành vi mới mà trước giờ chưa có | `adlc-feature` |
| **bugfix** | Hệ thống đang làm **sai** so với hành vi mong đợi hoặc đã từng đúng; có (hoặc tìm được) cách tái hiện | `adlc-bugfix` |
| **research** | Câu hỏi cần trả lời trước khi quyết: so sánh phương án, khảo sát, thử nghiệm khả thi. Kết quả là **khuyến nghị**, không phải code sản phẩm | `adlc-research` |
| **chore** | Việc bảo trì **không đổi hành vi**: refactor, nâng phiên bản thư viện, dọn code, tài liệu, sửa test chập chờn | `adlc-chore` |
| **paper-prototype** | Chủ đưa một **paper nghiên cứu** (link arXiv/URL, file PDF đính kèm, hoặc paper tìm qua công cụ QACI Data khi đã kết nối) và muốn có một **prototype chạy được**, tái hiện phương pháp cốt lõi của paper ở quy mô nhỏ | `adlc-paper-prototype` |

## Việc nhỏ

Ngoài loại việc, đánh giá cỡ. **Việc nhỏ** là khi đủ cả ba điều kiện:
- một repo;
- đổi một vùng rõ ràng (một module, vài endpoint, một màn hình, một cấu hình);
- không đổi kiến trúc hay dữ liệu dùng chung, và một engineer làm xong trong một phiên.

Ví dụ: thêm một API, ghi log ra file, thêm một bộ lọc, sửa một lỗi có bước tái hiện. `paper-prototype` không dùng cỡ "việc nhỏ": luôn theo đủ các bước của skill `adlc-paper-prototype`.

Việc nhỏ thì:
- SPEC ngắn: mục tiêu, yêu cầu, AC, ngoài phạm vi; tối đa khoảng 1 trang;
- ghi ở đầu tin giao Tech Lead: "Loại việc: feature. **Cỡ: việc nhỏ.** Quy trình: skill adlc-feature (mục Việc nhỏ)".

Không chắc thì coi là việc thường.

## Cách phân loại

1. Đọc task. Xác định người yêu cầu thật sự muốn **kết quả gì**.
2. Chọn một loại theo bảng trên. Task trộn nhiều loại (vd sửa lỗi và thêm tính năng) thì:
   - tách thành nhiều task nếu các phần độc lập;
   - nếu không tách được, chọn loại chính và ghi rõ phần còn lại trong yêu cầu.
3. Thiếu thông tin để phân loại hoặc để viết yêu cầu (vd báo lỗi không có cách tái hiện, không rõ repo, paper không có link/file rõ ràng) thì **hỏi lại người giao việc**, không đoán.
4. Báo cho chủ: loại việc, lý do một câu, skill sẽ dùng. Rồi mở skill đó và làm theo phần của PM.
5. Khi giao Tech Lead, **ghi rõ loại việc và skill** ở đầu tin giao việc, để cả đội dùng cùng một quy trình (vd "Loại việc: bugfix. Quy trình: skill adlc-bugfix.", hay "Loại việc: paper-prototype. Quy trình: skill adlc-paper-prototype.").

## Task không thuộc loại nào

Câu hỏi nhanh, việc hành chính, việc không cần code thì tự xử lý hoặc trả lời chủ trực tiếp, không mở luồng ADLC. Việc chủ giao cho PM (chat riêng với PM hoặc trong phòng team) và việc giao qua `coordinate_bots` thì vào ADLC: xem mục "Việc team và việc thường" trong hướng dẫn hệ thống của bạn.
