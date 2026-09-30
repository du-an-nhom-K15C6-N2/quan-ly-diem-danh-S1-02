# Hệ Thống Quản Lý Điểm Danh

Dự án nhóm K15C6-N2 — Quản lý điểm danh sinh viên với phân quyền vai trò và xác thực phiên đăng nhập.

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Tài khoản demo](#tài-khoản-demo)
- [Phân quyền menu (S1-06)](#phân-quyền-menu-s1-06)
- [API Backend](#api-backend)
- [Trang lỗi](#trang-lỗi)
- [Kiểm thử](#kiểm-thử)
- [Git workflow](#git-workflow)

---

## Tổng quan

Ứng dụng web quản lý điểm danh sinh viên với các tính năng:

- **Đăng nhập** với xác thực phiên (session timeout 30 giây demo)
- **Phân quyền theo vai trò**: Sinh viên / Giảng viên / Quản trị viên
- **Menu điều hướng động**: chỉ hiển thị chức năng người dùng có quyền
- **Responsive**: hỗ trợ màn hình từ 360px trở lên (mobile drawer)
- **Quên mật khẩu** và **đặt lại mật khẩu** qua email
- **Trang lỗi 403 / 404** đồng bộ giao diện

---

## Cấu trúc dự án

```
S1-06/
├── server.js              # Backend Express — API và static file server
├── index.html             # Trang chính — menu phân quyền, điểm danh
├── login.html             # Trang đăng nhập
├── forgot-password.html   # Quên mật khẩu
├── reset-password.html    # Đặt lại mật khẩu (qua link email)
├── change-password.html   # Đổi mật khẩu trực tiếp
├── 403.html               # Trang lỗi không đủ quyền
├── 404.html               # Trang lỗi không tìm thấy
├── test-s1-06.js          # Kiểm thử giao diện (JSDOM)
├── test-api.js            # Kiểm thử API server (HTTP)
└── package.json
```

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---------|---------------------|
| Node.js | v18 trở lên |
| npm | v8 trở lên |

---

## Cài đặt và chạy

### 1. Cài dependencies

```bash
npm install
```

### 2. Chạy server

```bash
npm start
```

Server khởi động tại: **http://localhost:3000**

> Sử dụng `nodemon` — server tự động restart khi thay đổi file.

### 3. Mở trình duyệt

Truy cập **http://localhost:3000** — tự động chuyển đến trang đăng nhập.

---

## Tài khoản demo

| Tài khoản | Mật khẩu | Vai trò | Quyền |
|-----------|----------|---------|-------|
| `sinhvien` | *(bất kỳ)* | Sinh viên | Điểm danh, Lịch sử, Đổi mật khẩu |
| `sv_k2301` | *(bất kỳ)* | Sinh viên | Điểm danh, Lịch sử, Đổi mật khẩu |
| `giangvien` | *(bất kỳ)* | Giảng viên | Quản lý điểm danh, DS lớp, Báo cáo, Đổi mật khẩu |
| `gv_nguyenvana` | *(bất kỳ)* | Giảng viên | Quản lý điểm danh, DS lớp, Báo cáo, Đổi mật khẩu |
| `admin` | *(bất kỳ)* | Quản trị viên | Quản lý người dùng, Quản lý lớp, Báo cáo tổng hợp, Cấu hình |
| `quantri` | *(bất kỳ)* | Quản trị viên | Quản lý người dùng, Quản lý lớp, Báo cáo tổng hợp, Cấu hình |

> Tài khoản bắt đầu bằng `gv` → tự động nhận quyền Giảng viên  
> Tài khoản bắt đầu bằng `admin` → tự động nhận quyền Quản trị viên  
> Tài khoản khác → mặc định là Sinh viên

---

## Phân quyền menu (S1-06)

Sau khi đăng nhập, `index.html` đọc `currentUser` từ `localStorage`, lọc `ALL_MENU_ITEMS` theo mảng `permissions` và render menu tương ứng.

### Bảng quyền

| Mã quyền | Mục menu | Vai trò |
|----------|----------|---------|
| `diem_danh` | Điểm danh lớp học | Sinh viên |
| `lich_su_diem_danh` | Lịch sử điểm danh | Sinh viên |
| `quan_ly_diem_danh` | Quản lý điểm danh | Giảng viên |
| `danh_sach_lop` | Danh sách lớp học | Giảng viên |
| `bao_cao_chuyen_can` | Báo cáo chuyên cần | Giảng viên |
| `quan_ly_nguoi_dung` | Quản lý người dùng | Quản trị viên |
| `quan_ly_lop_hoc` | Quản lý môn & lớp | Quản trị viên |
| `bao_cao_tong_hop` | Báo cáo tổng hợp | Quản trị viên |
| `cau_hinh_he_thong` | Cấu hình hệ thống | Quản trị viên |
| `doi_mat_khau` | Đổi mật khẩu | Tất cả |

### Trường hợp không có quyền

Nếu `permissions = []` (mảng rỗng), hệ thống tự động chuyển hướng đến **403.html**.

### Kiểm tra thủ công

1. Đăng nhập vào hệ thống
2. Mở DevTools (F12) → **Application** → **Local Storage**
3. Sửa giá trị `currentUser`, đặt `"permissions": []`
4. Tải lại trang → hệ thống chuyển đến trang 403

---

## API Backend

Base URL: `http://localhost:3000`

### GET `/api/health`

Kiểm tra server đang chạy.

```
Response 200:
{ "success": true, "message": "Backend đang chạy bình thường." }
```

### POST `/api/forgot-password`

Gửi link đặt lại mật khẩu qua email.

```
Body: { "email": "user@example.com" }

Response 200:
{ "success": true, "message": "Nếu email tồn tại..." }
```

> Link đặt lại cũng được in ra terminal để tiện test.

### POST `/api/reset-password`

Đặt lại mật khẩu bằng token từ email.

```
Body: { "token": "<token>", "password": "MatKhauMoi123" }

Response 200: { "success": true, "message": "Đặt lại thành công." }
Response 400: { "success": false, "message": "Token không hợp lệ..." }
Response 400: { "success": false, "message": "Mật khẩu phải có ít nhất 8 ký tự." }
```

### POST `/api/check-permission`

Kiểm tra quyền truy cập (middleware).

```
Body: { "permission": "quan_ly_nguoi_dung" }

Response 403: { "success": false, "code": 403, "message": "Không đủ quyền truy cập." }
Response 400: { "success": false, "code": 400, "message": "Thiếu thông tin quyền truy cập." }
```

### Lỗi chung

| Trường hợp | HTTP Status | Phản hồi |
|-----------|-------------|----------|
| URL không tồn tại (API) | 404 | `{ "success": false, "code": 404 }` |
| URL không tồn tại (Browser) | 404 | Trang `404.html` |
| Lỗi server | 500 | `{ "success": false, "message": "Lỗi hệ thống server" }` |

---

## Trang lỗi

### 403 — Không đủ quyền (`/403.html`)

Hiển thị khi người dùng đã đăng nhập nhưng không có quyền truy cập vào bất kỳ chức năng nào.

**Hành động gợi ý:** Nút "Về trang chủ" và "Đăng xuất".

### 404 — Không tìm thấy trang (`/404.html`)

Hiển thị khi trình duyệt truy cập đường dẫn không tồn tại trên server.

**Hành động gợi ý:** Nút "Về trang chủ" và "Quay lại".

---

## Kiểm thử

Dự án có 2 bộ test tự động:

### 1. Kiểm thử giao diện (không cần server)

Sử dụng `jsdom` để giả lập DOM, test phân quyền menu, hiển thị tên/vai trò, responsive và đăng xuất.

```bash
npm test
```

**Phạm vi kiểm thử:**
- Phân quyền menu Sinh viên (13 test)
- Phân quyền menu Giảng viên (8 test)
- Phân quyền menu Quản trị viên (7 test)
- Hiển thị tên và vai trò trên Header & Mobile Drawer (4 test)
- Giao diện màn hình 360px — viewport, media query, mobile drawer (10 test)
- Giữ nguyên chức năng cũ — form điểm danh, lưu nháp tự động (6 test)
- Đăng xuất và đăng nhập lại (6 test)
- Refresh trang giữ nguyên trạng thái (2 test)
- Tính năng đổi mật khẩu tích hợp (3 test)

> **Kết quả:** 59/59 PASSED

---

### 2. Kiểm thử API server (cần server đang chạy)

Test trực tiếp HTTP request đến server, bao gồm toàn bộ endpoint và xử lý lỗi.

**Cách 1 — Server đã đang chạy (`npm start`):**

```bash
node test-api.js
```

**Cách 2 — Chạy tự động (tự khởi động server):**

```bash
npm run test:api
```

**Phạm vi kiểm thử:**
- `GET /api/health` → 200 OK (2 test)
- `POST /api/check-permission` với quyền hợp lệ → 403 (4 test)
- `POST /api/check-permission` thiếu field → 400 (3 test)
- `POST /api/forgot-password` → 200 OK (3 test)
- `POST /api/reset-password` với token sai → 400 (2 test)
- `POST /api/reset-password` với mật khẩu ngắn → 400 (2 test)
- `GET` URL sai với Accept: application/json → 404 JSON (3 test)
- `GET` URL sai với Accept: text/html → 404 HTML page (3 test)
- `GET /favicon.ico` → 204 No Content (1 test)
- Static files (login.html, index.html, 403.html, 404.html) → 200 (7 test)

> **Kết quả:** 30/30 PASSED

---

### 3. Chạy tất cả cùng lúc

```bash
npm run test:all
```

Chạy `npm test` (giao diện) → sau đó `npm run test:api` (API server) tuần tự.

---

## Git workflow

- Nhánh phát triển: **`dev`**
- Không commit trực tiếp vào `main` / `master`
- Trước khi push: `git status`, `git diff`, xác nhận đúng branch

```bash
git checkout dev
git add .
git commit -m "feat: mô tả ngắn gọn thay đổi"
git push origin dev
```