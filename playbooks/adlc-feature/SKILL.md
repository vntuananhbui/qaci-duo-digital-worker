---
name: adlc-feature
title: "Quy trình: implement feature"
description: "Quy trình tính năng: SPEC, plan, code kèm test, review, merge, báo cáo. Dùng cho việc feature."
triggers: "adlc feature, quy trình: implement feature"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Quy trình: implement feature

Skill git và **nhánh gốc** của bạn ghi trong mục Môi trường của hướng dẫn hệ thống: `adlc-git-local` (demo cục bộ, nhánh gốc `main`) hoặc `adlc-git-azure` (Azure Repos, vd nhánh gốc `dev`). Dưới đây "nhánh gốc" là nhánh đó. Trên Azure, bước "merge" của Tech Lead là vote approve PR rồi chờ người thật hoàn tất PR trên Azure, và "Mở PR" của engineer là PR thật (skill `adlc-git-azure`).

Dùng kèm: `adlc-approval` (card xin chủ duyệt), skill git của bạn (nhánh, commit, PR, merge), `adlc-code-review` (review), `adlc-verify-browser` (nghiệm thu giao diện), `adlc-report` (nhật ký và báo cáo).

## PM

1. **Viết SPEC**:
   - Bối cảnh và mục tiêu (vì sao làm).
   - Phạm vi: làm gì / không làm gì.
   - Yêu cầu chức năng đánh số R1, R2, …
   - Tiêu chí nghiệm thu đo được AC1, AC2, …, mỗi AC gắn với một hoặc nhiều R.
     - **Mỗi AC phải kiểm đúng mục tiêu nghiệp vụ**, không phải một ngưỡng kỹ thuật dễ đạt. Tự hỏi: "AC này đạt nhưng người dùng vẫn không hài lòng được không?" Nếu được thì viết lại.
     - **Mỗi AC phải đạt được** trong ràng buộc của chính SPEC. Không viết AC mâu thuẫn với phần "không làm" (vd đòi hiện đủ 3 nhãn trong một lượt khi SPEC cấm đổi luật gán nhãn).
   - Repo, nhánh gốc, ràng buộc (deadline, phụ thuộc, công nghệ được dùng).
2. Gửi SPEC cho chủ, rồi **xin duyệt bằng card "Duyệt SPEC"** (skill `adlc-approval`). Chủ chọn Đồng ý thì **giao Tech Lead** qua `coordinate_bots`: ghi "Loại việc: feature. Quy trình: skill adlc-feature", kèm toàn bộ SPEC và `done_when`: "mọi AC đạt, các nhánh đã merge, có báo cáo".
3. Không tự viết code, không tự chia việc cho engineer. Đổi SPEC sau khi giao thì phải báo Tech Lead.
4. Kết quả của Tech Lead về: **mở lại skill `adlc-report` (phần PM)** rồi mới trả lời chủ. Gửi đủ 4 phần, chép nguyên văn mọi bảng của Tech Lead, tự kiểm đủ bảng trước khi gửi. Không gửi đoạn tóm tắt.

## Tech Lead

1. Nhận SPEC, ghi nhật ký (skill `adlc-report`). Chỗ mơ hồ hoặc AC không đạt được thì hỏi lại PM trước khi làm.
2. **Test plan**: mỗi test case có ID (TC1, TC2, …), bước thực hiện, kết quả mong đợi, AC nó kiểm.
3. **Implementation plan**: chia thành các phần nhỏ, độc lập nhất có thể. Mỗi phần có mô tả, file/module dự kiến, nhánh (`feature/<task>-<phần>`), loại việc (AI / phần mềm), test case liên quan.
   - **Chốt trước ranh giới giữa các phần** (module, hàm, kiểu dữ liệu vào/ra, endpoint) và ghi vào plan, để các nhánh làm song song không phụ thuộc chéo.
   - **Giữ đúng phạm vi SPEC.** Một yêu cầu có thể hiểu rộng (vd "không lộ secret trong log" thành rà mọi chỗ log của cả repo) thì chọn cách hiểu hẹp nhất vẫn đạt AC, ghi phần rộng hơn vào mục "Ngoài phạm vi, đề xuất sau" của plan. Chỉ làm rộng hơn khi chủ đồng ý trong card Duyệt plan.
4. Gửi plan cho chủ, rồi **xin duyệt bằng card "Duyệt plan"** (skill `adlc-approval`). Chỉ chia việc khi chủ chọn Đồng ý.
5. **Chia việc** qua `coordinate_bots`, gửi **cùng lúc** cho mọi người rồi kết thúc lượt:
   - Phần AI (model, embedding, đặc trưng, so khớp/xếp hạng, ngưỡng, đánh giá độ chính xác): **bắt buộc** giao AI Engineer.
   - Phần phần mềm (backend, frontend, API, dữ liệu mẫu, hạ tầng): Software Engineer.
   - **Mặc định một engineer.** Chỉ chia cho từ 2 engineer khi các phần **độc lập thật**: mỗi phần tự build và chạy test của nó trên nhánh gốc, không cần nhánh của phần kia. Phần này cần import, gọi hay test dựa trên code của phần kia (kiểu "B làm sau khi A merge") thì là **một việc nối tiếp**: một engineer làm hết theo thứ tự, một nhánh, một PR. Chia thì cân bằng tải giữa người cùng loại và ghi trong plan vì sao các phần độc lập.
   - Mỗi phần ghi rõ: "Loại việc: feature. Quy trình: skill adlc-feature", và `done_when`: "nhánh đã commit, test liên quan chạy qua, đã báo Lead".
6. **Review** từng nhánh theo skill `adlc-code-review`. Đạt và test xanh thì **xin duyệt bằng card "Duyệt merge"** (skill `adlc-approval`), Đồng ý thì merge.
7. Mọi nhánh đã merge: chạy test theo mục "Chạy test" của hướng dẫn hệ thống (đúng phạm vi, bỏ test cần dịch vụ không có), rồi **verify** theo từng test case. Có giao diện thì dùng skill `adlc-verify-browser`. TC không đạt thì giao sửa và lặp lại bước 6–7.
8. **Báo cáo** PM theo skill `adlc-report`.

## Việc nhỏ

PM ghi "Việc nhỏ" khi giao (skill `adlc-triage`) thì Tech Lead làm gọn:
- **Một file plan** `IMPLEMENTATION_PLAN.md`, gồm bảng test case (TC, bước, kết quả mong đợi, AC) và phần việc. Không viết test plan riêng.
- **Một engineer, một nhánh, một PR.**
- **Không có card Duyệt plan.** Chủ đã duyệt phạm vi ở card Duyệt SPEC. **Trước khi gọi `coordinate_bots` giao việc**, gửi chủ một tin có bảng test case và phần việc (ai làm, nhánh) của plan; câu "đã ghi plan" thôi là chưa đủ. Rồi giao việc luôn, không chờ trả lời. Plan muốn đi ra ngoài SPEC thì quay về luồng thường và xin duyệt plan.
- Vẫn giữ card Duyệt push (engineer) và Duyệt merge (Tech Lead).
- Vẫn ghi **nhật ký tiến độ có giờ thật** (skill `adlc-report`) ngay khi từng việc xảy ra: nhận việc, giao việc, engineer báo xong, review, merge, verify. Báo cáo lấy "Thời gian hoàn thành" từ đó.
- Báo cáo theo mục "Việc nhỏ" của skill `adlc-report` (bản rút gọn).

Lúc làm mới thấy việc lớn hơn dự kiến (đụng từ 3 module trở lên, cần đổi kiến trúc, cần nhiều engineer) thì báo PM và chủ, chuyển sang luồng thường.

## Engineer

1. Nhận phần việc. Đọc mô tả, ranh giới đã chốt, test case liên quan, `done_when`. Chỗ chưa rõ thì hỏi lại Tech Lead trước khi code.
2. Làm trên nhánh riêng theo skill git của bạn, đúng phạm vi và ranh giới; thấy cần đổi phạm vi thì báo Tech Lead.
3. Viết hoặc cập nhật test cho đúng các test case được giao; chạy test trước khi báo.
4. AI Engineer: kèm số liệu trước/sau trên cùng một tập; tách tập chỉnh tham số và tập held-out, không chọn ngưỡng bằng cách nhìn đúng tập dùng để chấm; test chất lượng phải ổn định giữa các môi trường (phiên bản Python, bản build thư viện khác nhau), chừa biên độ đo được thay vì đặt ngưỡng sát con số trên máy mình.
5. Thay đổi giao diện: trước card "Duyệt push", cho chủ xem trước trên desktop riêng theo skill `adlc-ui-preview` (ảnh từng màn hình, chủ có thể Take control).
6. Commit xong và test xanh thì **xin duyệt bằng card "Duyệt push"** (skill `adlc-approval`). Đồng ý thì "Mở PR" theo skill git của bạn, rồi kết thúc lượt. Nhận feedback thì sửa trên cùng nhánh và báo lại.
