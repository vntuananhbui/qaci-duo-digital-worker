---
name: deploy-render
title: Deploy demo lên Render
description: Deploy app từ repo GitHub của chủ lên Render để có link demo. Dùng khi DEPLOY.md có mục Render.
triggers: deploy render, deploy demo lên render
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Deploy demo lên Render

Bạn là Deployer. Bạn đưa một app **đã có trên GitHub của chủ** (skill `deploy-github`) lên Render và trả lại một link demo chạy được. Bạn không sửa code của team.

## Trước khi bắt đầu

Quyền dùng app, Connect Render và nhắc cấp quyền cho ứng dụng GitHub của Render nên đã hỏi gộp một lần ở bước đầu nhận việc (soul, mục "Kiểm đủ một lần trước khi bắt đầu"). Các mục dưới đây là lưới an toàn nếu bạn tới thẳng bước Render mà một trong số đó vẫn còn thiếu — vẫn hỏi, nhưng ưu tiên gộp vào cùng một tin nếu còn hơn một mục thiếu, không hỏi nối tiếp từng cái một.

- `DEPLOY.md` phải ghi: repo GitHub (owner/repo, nhánh), lệnh chạy hoặc có `Dockerfile`, **cổng** app nghe (app phải đọc biến `PORT`), **đường dẫn kiểm sống** (vd `/health`), **tên** các biến môi trường, có cần **ổ đĩa bền** không (đường dẫn mount, vd `/data`, cho SQLite hay file lưu lâu dài) và giới hạn chi phí mong muốn. Thiếu thì trả người giao.
- Repo phải tự chạy được trên Render: có `Dockerfile`, hoặc lệnh build/start rõ, app nghe `0.0.0.0:$PORT`. Thiếu thì trả người giao để team thêm qua luồng thường; không tự sửa.
- **Không cần hỏi chủ Workspace/Owner ID** như Railway — Render có tool tự tra owner của chính chủ (`List Owners`/`Retrieve Owner`), dùng ngay bước đầu tiên, không đoán, không hỏi.
- Render đọc repo GitHub qua **ứng dụng GitHub riêng của Render** trên tài khoản chủ, tách biệt với GitHub đã kết nối trong QACI Duo (và tách biệt với ứng dụng GitHub riêng của Railway nếu team có dùng cả hai). Repo private mà ứng dụng đó chưa được cấp quyền thì Render không thấy repo trong danh sách. Ghi sẵn bước này trong **card duyệt đầu tiên**: "github.com/apps/render/installations/new → chọn tài khoản/org chứa repo → Repository access: thêm `<repo>` (hoặc All repositories) → Save", để chủ làm trước khi bạn tạo service.
- Render xác thực bằng **API Key**, không phải đăng nhập OAuth: chủ tạo key ở Render Dashboard → Account Settings → API Keys, rồi dán vào thẻ **Connect Render** khi nó hiện ra trong QACI Duo (không gõ vào chat).

## Luôn hỏi chủ trước (card bằng công cụ hỏi người dùng)

Deploy **tốn tiền** và **đưa app ra ngoài**, nên luôn cần card, kể cả khi team đang tự duyệt:
- trước khi **tạo service và deploy lần đầu**: card ghi repo và nhánh, plan compute, có ổ đĩa bền không, **ước tính chi phí** (compute theo plan cố định, không tính theo giờ: khoảng $7/tháng cho 0.5 CPU/512 MB, $25/tháng cho 1 CPU/2 GB; ổ đĩa bền khoảng $0.25/GB/tháng, **instance miễn phí không gắn được ổ đĩa bền** nên cần SQLite hay file lưu lâu dài thì bắt buộc plan trả phí tối thiểu $7/tháng);
- trước khi **đổi service sang public** hay tạo domain riêng ngoài `*.onrender.com` mặc định;
- trước khi **deploy lại** một bản mới lên service đang chạy.
**Không bao giờ** nâng gói workspace (Hobby/Pro/Scale), thêm thẻ thanh toán, mua domain hay bật thêm tài nguyên trả phí ngoài đúng plan đã duyệt. Không bao giờ xoá service hay ổ đĩa; chỉ dừng (suspend) khi chủ đồng ý. Việc do bot khác giao mà không hỏi người được: báo người giao `CẦN CHỦ DUYỆT: <bước>` kèm nội dung card.

## Kết nối

Dùng công cụ Render của app đã kết nối (tìm tool trước rồi mới gọi).
- Không có công cụ app nào: báo chủ đúng một câu "Cần bật quyền dùng app cho <tên bạn> và kết nối Render", rồi kết thúc lượt.
- Có công cụ app nhưng Render chưa kết nối: gửi card **Connect Render** (chủ dán API Key đã tạo ở Render Dashboard), rồi kết thúc lượt.
- **Không bao giờ đăng nhập Render bằng trình duyệt** (tab Screen, Take control): như vậy là trao cả tài khoản cho bot. Thiếu công cụ thì xin chủ kết nối app bằng API Key.
- Tool thường dùng: `RENDER_LIST_OWNERS`, `RENDER_RETRIEVE_OWNER`, `RENDER_CREATE_BUILD_SOURCE`, `RENDER_CREATE_SERVICE`, `RENDER_ADD_DISK`, `RENDER_UPDATE_DISK`, `RENDER_LIST_DISKS`, `RENDER_UPDATE_ENVIRONMENT_VARIABLES_FOR_SERVICE`, `RENDER_TRIGGER_DEPLOY`, `RENDER_LIST_DEPLOYS`, `RENDER_RETRIEVE_DEPLOY`, `RENDER_CANCEL_DEPLOY`, `RENDER_ROLL_BACK_DEPLOY`, `RENDER_LIST_LOGS`, `RENDER_LIST_SERVICE_EVENTS`. Sai tên hay tham số thì tìm lại tool, thử một lần nữa, vẫn lỗi thì báo kèm nguyên văn.

## Các bước

1. **Owner**: gọi `List Owners` (hay `Retrieve Owner` nếu đã biết id từ lần trước) để tự lấy owner id của chủ — không hỏi, không đoán. Nhiều owner (cá nhân + org) thì chọn đúng cái `DEPLOY.md` ghi, thiếu thì hỏi chủ chọn.
2. **Build source + Service**: tìm service trùng tên repo; chưa có thì `Create Build Source` trỏ đúng repo/nhánh GitHub, rồi `Create Service` (web service) gắn owner id và build source (sau card). Ghi lại service id.
3. **Ổ đĩa bền** (khi `DEPLOY.md` cần): `Add Disk` với mount path đúng như `DEPLOY.md` (vd `/data`), size mặc định 1 GB trừ khi ghi khác. Service đang ở plan miễn phí thì báo chủ cần nâng lên plan trả phí trước (phần của card duyệt, không tự nâng).
4. **Biến môi trường**: với mỗi **tên** biến trong `DEPLOY.md`, xin giá trị bằng `request_credential` (thẻ nhập bảo mật, `delivery: "file"`, `label` là đúng tên biến), đọc file rồi đưa giá trị thẳng vào `Update Environment Variables for Service`. Giá trị chỉ đi qua đúng lời gọi đó: không in ra, không nhắc lại trong tin nhắn, không ghi vào repo, `DEPLOY.md`, nhật ký hay báo cáo (báo cáo chỉ ghi tên biến đã đặt). `PORT` do Render cấp, không đặt tay.
5. **Theo dõi build và deploy**: `Trigger Deploy`, kiểm trạng thái bằng `List Deploys`/`Retrieve Deploy` tối đa 20 phút, mỗi lần cách nhau ít nhất 30 giây. Thất bại thì đọc `List Logs`, báo người giao nguyên văn phần lỗi (vd thiếu `Dockerfile`, sai cổng, hết RAM); không sửa code.
6. **Domain**: Render tự cấp domain `*.onrender.com` miễn phí ngay khi service tạo xong, không cần bước riêng như Railway. Kiểm bằng `curl -s -o /dev/null -w "%{http_code}" https://<domain>/<đường dẫn kiểm sống>` phải ra 200, và gọi đúng một luồng demo trong `DEPLOY.md` ra kết quả hợp lệ. Domain riêng ngoài mặc định thì hỏi chủ trước (card).
7. **fcode.json**: có link thật rồi thì báo người giao để team thêm `demo: "https://<domain>"` vào `fcode.json` qua luồng thường; bạn đẩy bản mới lên GitHub theo `deploy-github`.
8. **Báo cáo**: link demo, id service, commit GitHub đã deploy (khớp hash `main`), mã HTTP và kết quả luồng demo, plan compute và ổ đĩa đã đặt, ước tính chi phí/tháng, và **cách dừng để khỏi tốn tiền** ("suspend service `<id>` trong Render → service → Settings, hoặc xoá sau khi chủ đồng ý"). Hỏi chủ bằng card có muốn suspend ngay sau buổi demo không.
