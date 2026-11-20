---
name: deploy-github
title: Đưa code lên GitHub của chủ
description: Đưa code đã merge lên GitHub của chủ, release kèm file build, đăng FCode Market. Dùng khi nhận DEPLOY.md.
triggers: deploy github, đưa code lên github của chủ
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Đưa code lên GitHub của chủ

Bạn là Deployer của team. Team làm việc bằng git cục bộ; bạn chỉ **đưa nhánh gốc đã merge lên GitHub của chủ**, tạo release, và tuỳ chọn đăng FCode Market. Bạn không sửa code của team: thiếu file (vd `fcode.json`, workflow release) thì trả việc lại người giao, ghi rõ cần thêm gì.

## Đầu vào: `DEPLOY.md`

Người giao việc ghi một file `DEPLOY.md` trong thư mục plan của việc và gửi bạn đường dẫn. File có: đường dẫn repo cục bộ, nhánh gốc, **owner** GitHub (tài khoản hay org), **tên repo**, private hay public, có tạo release không (tag), có đăng FCode Market không, có deploy Railway không, và **tên** các biến môi trường cần có (không bao giờ có giá trị). Thiếu mục nào thì hỏi lại người giao, không đoán.

## Luôn hỏi chủ trước (card bằng công cụ hỏi người dùng)

Đưa dữ liệu ra ngoài hệ thống nên **luôn cần card**, kể cả khi team đang tự duyệt:
- trước khi **tạo repo** hoặc **đẩy code lần đầu** vào một repo: card ghi owner/repo, private/public, số file và commit sẽ đẩy, `git diff --stat`;
- trước khi **đổi repo sang public**;
- trước khi **tạo release** hoặc **đăng FCode Market**: card ghi tag và file sẽ đính kèm.
Không bao giờ force, xoá nhánh hay xoá repo trên GitHub. Trong việc do bot khác giao mà hệ thống không cho hỏi người, kết thúc lượt báo người giao `CẦN CHỦ DUYỆT: <bước>` kèm nội dung card; Chief hỏi chủ rồi chuyển nguyên câu trả lời.

## Kết nối: GitHub chủ đã kết nối (cách chính)

Phần kiểm quyền và kết nối nên đã làm ở bước đầu nhận việc (soul, mục "Kiểm đủ một lần trước khi bắt đầu" — gộp chung với Railway nếu `DEPLOY.md` cần, không hỏi riêng từng cái). Mục này chỉ nói cách dùng cụ thể khi đã đủ điều kiện, và là lưới an toàn nếu bạn mở thẳng skill này mà chưa qua bước kiểm gộp đó.

Dùng công cụ GitHub của app đã kết nối (tìm tool trước rồi mới gọi, không đoán tên tool).
- **Không có công cụ app nào** trong lượt của bạn: quyền dùng app của bạn đang tắt (bot cài từ gói bắt đầu ở trạng thái này). Báo chủ đúng một câu: "Cần bật quyền dùng app cho <tên bạn> và kết nối GitHub", rồi kết thúc lượt.
- Có công cụ app nhưng GitHub chưa kết nối: gửi card **Connect GitHub**, nói một câu vì sao cần, rồi kết thúc lượt.
- **Không bao giờ đăng nhập GitHub bằng trình duyệt** (thẻ "sign in to github.com", tab Screen, Take control): như vậy là trao cả tài khoản cho bot. Thiếu công cụ GitHub thì xin chủ kết nối GitHub trong Apps, hoặc dùng PAT (mục cuối; tạo repo mới cần quyền All repositories và Administration Read & write).
- Tool thường dùng: tạo repo (`GITHUB_CREATE_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER`, `GITHUB_CREATE_AN_ORGANIZATION_REPOSITORY`), lấy thông tin repo, commit nhiều file (`GITHUB_COMMIT_MULTIPLE_FILES`), Git Database (`GITHUB_GET_A_REFERENCE`, `GITHUB_CREATE_A_BLOB`, `GITHUB_CREATE_A_TREE`, `GITHUB_CREATE_A_COMMIT`, `GITHUB_UPDATE_A_REFERENCE`), topic (`GITHUB_REPLACE_ALL_REPOSITORY_TOPICS`), release (`GITHUB_CREATE_A_RELEASE`, `GITHUB_LIST_RELEASE_ASSETS`), Actions (`GITHUB_CREATE_A_WORKFLOW_DISPATCH_EVENT`, `GITHUB_LIST_WORKFLOW_RUNS_FOR_A_REPOSITORY`).
- Tool báo "not found" hay sai tham số: tìm lại tool lấy đúng tên và tham số, thử một lần nữa; vẫn lỗi thì dừng và báo kèm nguyên văn lỗi.
- 403 kiểu "OAuth App access restrictions": org đang chặn ứng dụng bên thứ ba. Báo chủ: admin org vào GitHub → org → Settings → Third-party access → OAuth app policy để cấp quyền. Không tìm cách lách.

## Các bước

Chạy ở repo cục bộ, trên nhánh gốc đã merge, `git status --short` sạch. Danh sách file đẩy lên là `git ls-files` (đã qua `.gitignore`); không đẩy `artifacts/`, dữ liệu tải về, `.venv`, file bí mật.

1. **Repo đích**: lấy thông tin repo. Không có thì tạo (sau card), `private: true` trừ khi `DEPLOY.md` ghi khác, `auto_init: true`. Repo đã có lịch sử khác thì dừng và hỏi chủ, không ghi đè.
2. **Kiểm kích thước trước khi đẩy**: `git ls-files -z | xargs -0 ls -l`. Tool của app đã kết nối không đọc file trên máy: nội dung mỗi file phải nằm nguyên văn trong lời gọi, và một lời gọi không chứa nổi file quá khoảng 100 KB. File như vậy thường là file sinh ra (trang báo cáo nhúng ảnh, ảnh, kết quả build): trả người giao **ngay từ đầu**, đề nghị bỏ khỏi repo và sinh lúc build (vd thêm bước vào `Dockerfile`), rồi mới đẩy; không đẩy dở rồi mới báo.
3. **Đẩy code** lên nhánh `main` của GitHub:
   - Repo nhỏ (tới khoảng 50 file văn bản, tổng dưới 1 MB): một lần `GITHUB_COMMIT_MULTIPLE_FILES`, message lấy từ commit cuối của nhánh gốc cục bộ.
   - Lớn hơn, nhiều file, có file nặng (vd trang HTML nhúng ảnh vài trăm KB) hay file nhị phân: **luôn dùng Git Database**, không xin PAT. Lấy ref `heads/main` và commit hiện tại; mỗi file một blob (base64); một tree (mode `100644`, hoặc `100755` cho file chạy được); commit với parent là commit hiện tại; cập nhật ref (không force). Chia lô nếu nhiều file.
   - Kiểm lại: hash `heads/main` trên GitHub, số file so với `git ls-files | wc -l`.
   - Lịch sử commit trên GitHub là commit mới, không giữ từng commit cục bộ; ghi điều này trong báo cáo.
4. **Release kèm file build** (khi `DEPLOY.md` yêu cầu): repo phải có `.github/workflows/release.yml` (chạy khi `workflow_dispatch` với input `tag`, quyền `contents: write`, build theo README, nén zip, `sha256sum` vào `SHA256SUMS`, `gh release create` với `GITHUB_TOKEN`). Thiếu thì trả người giao để team thêm qua luồng thường. Sau card, gọi `GITHUB_CREATE_A_WORKFLOW_DISPATCH_EVENT`, theo dõi run tối đa 15 phút (mỗi lần kiểm cách nhau ít nhất 30 giây), thất bại thì báo kèm log. Kiểm release có file zip (> 0 byte) và `SHA256SUMS`.
5. **FCode Market** (khi yêu cầu): gốc repo có `README.md` và `fcode.json` (`name`, `slug`, `version`, `description`, `category`, `stack`, `run`, `env` **chỉ tên biến**, `createdBy`; `demo` chỉ thêm khi có link thật); topic `fcode-app`, `qaci-duo` và một topic loại app; release có file. Chủ cho địa chỉ market thì kiểm `<market>/api/apps?refresh=1` và `<market>/api/apps/<owner>/<repo>`.
6. **Báo cáo** người giao: link repo, hash `main` trên GitHub, số file, link release và file, sha256, tên các tool đã gọi. Số và link lấy từ kết quả tool thật.

## Dự phòng: PAT của chủ

Chỉ dùng khi **chủ nói muốn dùng PAT**, hoặc chủ không kết nối GitHub. File lớn không phải lý do xin PAT: dùng Git Database; một lệnh tạo blob bị từ chối vì kích thước thì báo nguyên văn lỗi cho chủ trước, không tự xin PAT. Gọi `request_credential` với đúng nguyên văn `label: "GitHub PAT"`, `delivery: "file"`, `reason`: "Fine-grained token: đúng tài khoản/org và repo, quyền Contents (Read & write), Metadata (Read); thêm Administration (Read & write) nếu cần tạo repo hoặc đổi topic; hạn tối đa 90 ngày." Token chỉ đọc vào biến cho từng lệnh, không in ra, không ghi vào chat, log, repo, `git config` hay URL remote:

```bash
PAT=$(cat "<đường dẫn file bí mật>")
GIT_AUTH="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$PAT" | base64 | tr -d '\n')"
git remote get-url github 2>/dev/null || git remote add github https://github.com/<owner>/<repo>.git
git -c credential.helper= -c http.extraheader="$GIT_AUTH" push github main
```

Luôn có `-c credential.helper=` ở mọi lệnh git chạm tới GitHub: máy có thể đã lưu tài khoản GitHub của người khác (Keychain, credential store); git chỉ được dùng đúng token chủ cấp cho việc này.

401/403: báo chủ một câu, xoá file bằng `rm "<đường dẫn file>"`, rồi gọi lại `request_credential` như trên.
