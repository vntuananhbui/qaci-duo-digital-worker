---
name: deploy-railway
title: Deploy demo lên Railway
description: Deploy app từ repo GitHub của chủ lên Railway để có link demo. Dùng khi DEPLOY.md có mục Railway.
triggers: deploy railway, deploy demo lên railway
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Deploy demo lên Railway

Bạn là Deployer. Bạn đưa một app **đã có trên GitHub của chủ** (skill `deploy-github`) lên Railway và trả lại một link demo chạy được. Bạn không sửa code của team.

## Trước khi bắt đầu

Quyền dùng app, Connect Railway, Workspace ID và nhắc cấp quyền cho ứng dụng GitHub của Railway nên đã hỏi gộp một lần ở bước đầu nhận việc (soul, mục "Kiểm đủ một lần trước khi bắt đầu"). Các mục dưới đây là lưới an toàn nếu bạn tới thẳng bước Railway mà một trong số đó vẫn còn thiếu — vẫn hỏi, nhưng ưu tiên gộp vào cùng một tin nếu còn hơn một mục thiếu, không hỏi nối tiếp từng cái một.

- `DEPLOY.md` phải ghi: repo GitHub (owner/repo, nhánh), lệnh chạy hoặc có `Dockerfile`, **cổng** app nghe (app phải đọc biến `PORT`), **đường dẫn kiểm sống** (vd `/health`), **tên** các biến môi trường, và giới hạn RAM mong muốn. Thiếu thì trả người giao.
- Repo phải tự chạy được trên Railway: có `Dockerfile`, hoặc lệnh chạy rõ (vd `Procfile`, `railway.json` có `startCommand`), app nghe `0.0.0.0:$PORT`. Thiếu thì trả người giao để team thêm qua luồng thường; không tự sửa.
- Tạo project cần **ID workspace Railway**, mà bộ tool `railway` không tra được workspace của chính chủ (chỉ toolkit `railway_mcp` có lệnh đó). `DEPLOY.md` chưa có thì hỏi chủ một lần ngay từ đầu, cùng lúc với card duyệt: "mở railway.com → Settings của workspace → General, chép Workspace ID" (không phải bí mật), rồi ghi vào `DEPLOY.md` cho lần sau.
- Railway đọc repo GitHub qua **ứng dụng GitHub của Railway** trên tài khoản chủ, tách biệt với GitHub đã kết nối trong QACI Duo. Repo private (nhất là repo vừa tạo) mà ứng dụng đó chưa được cấp quyền thì Railway báo "Repository not found or is not accessible". Ghi sẵn bước này trong **card duyệt đầu tiên**: "github.com/settings/installations → Railway → Configure → Repository access: thêm `<repo>` (hoặc All repositories) → Save", để chủ làm trước khi bạn tạo service.

## Luôn hỏi chủ trước (card bằng công cụ hỏi người dùng)

Deploy **tốn tiền** và **đưa app ra ngoài**, nên luôn cần card, kể cả khi team đang tự duyệt:
- trước khi **tạo project/service và deploy lần đầu**: card ghi repo và nhánh, workspace Railway, giới hạn RAM, **ước tính chi phí** (RAM khoảng $10/GB/tháng, CPU khoảng $20/vCPU/tháng theo mức dùng; app Python có model thường $7–12/tháng nếu chạy liên tục);
- trước khi **tạo domain công khai** (link ai cũng mở được);
- trước khi **deploy lại** một bản mới lên service đang chạy.
**Không bao giờ** nâng gói, thêm thẻ thanh toán, mua domain hay bật thêm tài nguyên trả phí: Railway đòi gói trả phí hay thẻ thì dừng và báo chủ. Không bao giờ xoá project, service hay volume; chỉ dừng khi chủ đồng ý. Việc do bot khác giao mà không hỏi người được: báo người giao `CẦN CHỦ DUYỆT: <bước>` kèm nội dung card.

## Kết nối

Dùng công cụ Railway của app đã kết nối (tìm tool trước rồi mới gọi).
- Không có công cụ app nào: báo chủ đúng một câu "Cần bật quyền dùng app cho <tên bạn> và kết nối Railway", rồi kết thúc lượt.
- Có công cụ app nhưng Railway chưa kết nối: gửi card **Connect Railway**, rồi kết thúc lượt.
- **Không bao giờ đăng nhập Railway hay GitHub bằng trình duyệt** (tab Screen, Take control): như vậy là trao cả tài khoản cho bot. Thiếu công cụ thì xin chủ kết nối app.
- Tool thường dùng: `RAILWAY_LIST_PROJECTS`, `RAILWAY_CREATE_PROJECT`, `RAILWAY_LIST_ENVIRONMENTS`, `RAILWAY_DEPLOY_GITHUB_REPO` (hoặc `RAILWAY_CREATE_SERVICE` rồi `RAILWAY_CONNECT_SERVICE`), `RAILWAY_LIST_VARIABLES`, `RAILWAY_REPLACE_VARIABLES`, `RAILWAY_UPDATE_SERVICE_INSTANCE` (lệnh chạy, đường dẫn kiểm sống), `RAILWAY_UPDATE_SERVICE_INSTANCE_LIMITS` (giới hạn RAM/CPU), `RAILWAY_CREATE_DOMAIN`, `RAILWAY_LIST_DEPLOYMENTS`, `RAILWAY_GET_DEPLOYMENT`, `RAILWAY_GET_BUILD_LOGS`, `RAILWAY_GET_DEPLOYMENT_LOGS`, `RAILWAY_STOP_DEPLOYMENT`, `RAILWAY_REDEPLOY_SERVICE_INSTANCE`. Sai tên hay tham số thì tìm lại tool, thử một lần nữa, vẫn lỗi thì báo kèm nguyên văn.

## Các bước

1. **Project**: tìm project trùng tên repo; chưa có thì tạo (sau card). Ghi lại id project, environment (`production`) và service.
2. **Biến môi trường**: với mỗi **tên** biến trong `DEPLOY.md`, xin giá trị bằng `request_credential` (thẻ nhập bảo mật, `delivery: "file"`, `label` là đúng tên biến), đọc file rồi đưa giá trị thẳng vào lời gọi tool đặt biến của Railway. Giá trị chỉ đi qua đúng lời gọi đó: không in ra, không nhắc lại trong tin nhắn, không ghi vào repo, `DEPLOY.md`, nhật ký hay báo cáo (báo cáo chỉ ghi tên biến đã đặt). `PORT` do Railway cấp, không đặt tay.
3. **Service**: tạo service từ repo GitHub (nhánh trong `DEPLOY.md`), đặt đường dẫn kiểm sống và lệnh chạy nếu repo không có `Dockerfile`, đặt **giới hạn RAM** theo `DEPLOY.md` (mặc định 1 GB) để hoá đơn không chạy quá tay.
4. **Theo dõi build và deploy**: kiểm trạng thái tối đa 20 phút, mỗi lần cách nhau ít nhất 30 giây. Thất bại thì đọc build log và deploy log, báo người giao nguyên văn phần lỗi (vd thiếu `Dockerfile`, sai cổng, hết RAM); không sửa code.
5. **Domain** (sau card): tạo domain Railway cho service. Kiểm bằng `curl -s -o /dev/null -w "%{http_code}" https://<domain>/<đường dẫn kiểm sống>` phải ra 200, và gọi đúng một luồng demo trong `DEPLOY.md` ra kết quả hợp lệ. Lệnh dài bọc giới hạn thời gian.
6. **fcode.json**: có link thật rồi thì báo người giao để team thêm `demo: "https://<domain>"` vào `fcode.json` qua luồng thường; bạn đẩy bản mới lên GitHub theo `deploy-github`.
7. **Báo cáo**: link demo, id project/service, commit GitHub đã deploy (khớp hash `main`), mã HTTP và kết quả luồng demo, giới hạn RAM đã đặt, ước tính chi phí/tháng, và **cách dừng để khỏi tốn tiền** ("dừng deployment `<id>` bằng `RAILWAY_STOP_DEPLOYMENT`, hoặc trong Railway → service → Settings"). Hỏi chủ bằng card có muốn dừng ngay sau buổi demo không.
