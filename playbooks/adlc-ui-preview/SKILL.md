---
name: adlc-ui-preview
title: Xem trước giao diện trên desktop riêng
description: "Xem trước thay đổi giao diện: chạy app, chụp ảnh trước/sau gửi kèm card."
triggers: adlc ui preview, xem trước giao diện trên desktop riêng
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Xem trước giao diện trên desktop riêng

Đường dẫn desktop của bạn (trong desktop `/home/cua/workspace`, trên máy chủ một thư mục riêng) nằm trong mục **Desktop riêng
của bạn** của hướng dẫn hệ thống. Không có mục đó (bạn không có desktop riêng) thì bỏ qua skill này và ghi trong card "chưa xem
trước được trên desktop".

## Khi nào

Mọi phần việc đổi giao diện người dùng: màn hình, component, style, luồng bấm. Làm **sau khi commit và test xanh, trước card
"Duyệt push"** (skill `adlc-approval`). Không đổi giao diện thì không cần.

## Các bước

1. **Build trên máy chủ**, trong worktree của bạn: cài dependency và build bản tĩnh theo README của repo (vd `npm ci --include=dev && npm run build`).
   Cấu hình dev của repo (nếu có) nằm ở thư mục `.env` của đội cạnh các repo (mục Môi trường), vd `<thư mục repos>/.env/<repo>.env`:
   nạp nó vào **chính lệnh build**, không chép vào worktree, không commit, không in ra: `set -a; . "<thư mục repos>/.env/<repo>.env"; set +a; npm run build`.
   Không có file đó thì build như bình thường. Không bao giờ dùng dữ liệu hay khoá production.
2. **Chép bản build sang desktop**: thư mục máy chủ của desktop + `/preview/<nhánh>` (đổi `/` thành `-`), vd
   `rm -rf "<desktop>/preview/<nhánh>" && mkdir -p "<desktop>/preview/<nhánh>" && cp -r dist/. "<desktop>/preview/<nhánh>/"`.
   Trong desktop nó là `/home/cua/workspace/preview/<nhánh>`.
3. **Chạy trong desktop** (lệnh chạy trong máy ảo, vd `vm_exec`), chạy nền. Dùng server trả `index.html` cho mọi đường dẫn (app
   một trang có route như `/login`, `/projects`). **Cổng:** cấu hình có `VITE_AZURE_REDIRECT_URI` (vd `http://localhost:5173/login`)
   thì chạy đúng cổng đó và mở bằng `localhost` để đăng nhập Microsoft khớp redirect; không có thì dùng 5001–5009.
   ```bash
   cat > /home/cua/workspace/.tools/spa.py <<'PY'
   import http.server, os, sys
   root, port = sys.argv[1], int(sys.argv[2])
   class H(http.server.SimpleHTTPRequestHandler):
       def __init__(self, *a, **k): super().__init__(*a, directory=root, **k)
       def send_head(self):
           if not os.path.exists(self.translate_path(self.path)): self.path = "/index.html"
           return super().send_head()
   http.server.ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
   PY
   nohup python3 /home/cua/workspace/.tools/spa.py /home/cua/workspace/preview/<nhánh> 5173 >/tmp/preview.log 2>&1 &
   ```
   Trang cần đăng nhập Microsoft: mở `http://localhost:5173`, rồi **nhờ chủ Take control để tự đăng nhập** (tài khoản test của đội
   nếu có; bạn không bao giờ gõ mật khẩu hay mã MFA). Chủ đăng nhập xong và bấm "Hand control back" thì bạn mới đi tới màn hình cần xem.
   Chưa đăng nhập được thì dựng đúng trang đó với dữ liệu mock (theo test của repo), trong khung **rộng đúng như trang thật** (trừ
   sidebar, padding), và ghi rõ trong card là ảnh mock.
4. **Mở Firefox của desktop** tới `http://127.0.0.1:5001` và đi qua **từng màn hình đã đổi** như người dùng thật, chụp mỗi
   màn hình thành file rồi đính vào chat bằng `attach_file` (đường dẫn máy chủ của desktop + `/preview/shots/…`).
   Có công cụ computer (chụp/bấm) trong lượt này thì dùng nó; không có thì dùng script dưới đây trong desktop (vd `vm_exec`).
   Lần đầu cài thư viện vào thư mục bền của desktop (giữ qua các lần khởi động):
   ```bash
   python3 -m pip install -q --target /home/cua/workspace/.tools pillow python-xlib
   mkdir -p /home/cua/workspace/preview/shots
   cat > /home/cua/workspace/.tools/ui.py <<'PY'
   import sys, time
   from Xlib import X, display
   from Xlib.ext import xtest
   from PIL import ImageGrab
   d = display.Display(":1")
   def click(x, y):
       d.screen().root.warp_pointer(x, y); d.sync()
       xtest.fake_input(d, X.ButtonPress, 1); xtest.fake_input(d, X.ButtonRelease, 1); d.sync(); time.sleep(0.4)
   for arg in sys.argv[1:]:
       if arg.startswith("click="): click(*map(int, arg[6:].split(",")))
       elif arg.startswith("wait="): time.sleep(float(arg[5:]))
       else: ImageGrab.grab(xdisplay=":1").save(arg)
   PY
   ```
   Mở trang: `DISPLAY=:1 nohup firefox http://localhost:<cổng> >/dev/null 2>&1 &`. Đo đúng bề rộng thật của trang (cửa sổ 1366 và 1440 px). Chụp và bấm:
   `PYTHONPATH=/home/cua/workspace/.tools python3 /home/cua/workspace/.tools/ui.py wait=3 /home/cua/workspace/preview/shots/<nhánh>-1.png click=640,400 /home/cua/workspace/preview/shots/<nhánh>-2.png`.
   Xem ảnh vừa chụp (đọc file ở đường dẫn máy chủ) để biết toạ độ cần bấm và chắc ảnh đúng màn hình; Firefox hiện hộp thoại (vd
   dịch trang) thì đóng nó trước khi chụp. Có bản trước để so thì build nhánh gốc vào `preview/base`, chạy cổng khác, chụp cả hai.
5. **Card "Duyệt push"** (skill `adlc-approval`) ghi thêm:
   - "Giao diện đã mở trên desktop của mình tại http://127.0.0.1:5001: xem ở tab Screen hoặc bấm Take control để tự bấm thử. Ảnh các màn hình (file đính kèm) ở ngay trên."
   - màn hình nào đã xem, điều gì cần chủ để ý; phần nào chưa xem được (thiếu backend, cần đăng nhập…) và vì sao.
   - Để server preview chạy tới khi chủ trả lời card.
6. Chủ chọn **Yêu cầu sửa**: sửa, commit, build lại, làm lại từ bước 2 rồi hỏi lại bằng card mới.
7. Xong (chủ đồng ý và đã push): tắt server preview (`pkill -f "http.server 5001"`), đóng Firefox, xoá `preview/<nhánh>` và ảnh của nhánh trên desktop.

## Không được

- Không chép mã nguồn, file `.env`, khoá hay token sang desktop; chỉ bản build tĩnh. Secret của backend không bao giờ dùng cho preview.
- Không mở trang ngoài hay đăng nhập tài khoản thật trong Firefox của desktop cho việc này.
- Không commit ảnh hay thư mục `preview/` vào repo.
