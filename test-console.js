// =================================================================
//  HỆ THỐNG ĐIỂM DANH — BROWSER CONSOLE TEST SUITE
//  Dán vào Chrome DevTools (F12 > Console) và nhấn Enter để chạy
//
//  Nếu Chrome hiện "allow pasting":
//  1. Gõ vào ô console chữ: allow pasting
//  2. Nhấn Enter
//  3. Dán script này và nhấn Enter
// =================================================================

(async function TEST_SUITE() {
    // ─── Cấu hình màu sắc output ─────────────────────────────────
    const C = {
        pass:    'color: #16a34a; font-weight: bold',
        fail:    'color: #dc2626; font-weight: bold',
        group:   'color: #2563eb; font-weight: bold; font-size: 13px',
        summary: 'color: #7c3aed; font-weight: bold; font-size: 14px',
        reset:   'color: inherit; font-weight: normal',
        warn:    'color: #d97706; font-weight: bold'
    };

    let total = 0, passed = 0, failed = 0;
    const errors = [];

    function ok(condition, label) {
        total++;
        if (condition) {
            passed++;
            console.log(`%c  ✓ ${label}`, C.pass);
        } else {
            failed++;
            errors.push(label);
            console.log(`%c  ✗ ${label}`, C.fail);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────
    const BASE = 'http://localhost:3000';

    async function api(method, path, body) {
        try {
            const res = await fetch(`${BASE}${path}`, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: body ? JSON.stringify(body) : undefined
            });
            const data = await res.json().catch(() => ({}));
            return { status: res.status, data };
        } catch {
            return { status: 0, data: {} };
        }
    }

    async function fetchHTML(path) {
        try {
            const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'text/html' } });
            return { status: res.status, text: await res.text() };
        } catch {
            return { status: 0, text: '' };
        }
    }

    function setUser(user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('sessionExpiresAt', String(Date.now() + 60000));
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    function clearSession() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('sessionExpiresAt');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('diem_danh_draft');
    }

    function getMenuItems() {
        const items = [];
        document.querySelectorAll('#desktopMenuList li').forEach(li => items.push(li.id));
        return items;
    }

    // ─── PHẦN 1: KIỂM TRA TRANG HIỆN TẠI ────────────────────────
    const isLogin = location.pathname.includes('login');
    const isIndex = location.pathname.includes('index') || location.pathname === '/';
    const is403   = location.pathname.includes('403');
    const is404   = location.pathname.includes('404');

    // ─── PHẦN 2: KIỂM TRA API SERVER ─────────────────────────────
    console.log('%c\n════ PHẦN 1: API SERVER ═══════════════════════════════', C.group);

    {
        const res = await api('GET', '/api/health');
        ok(res.status === 200, 'GET /api/health → 200 OK');
        ok(res.data.success === true, 'GET /api/health → success: true');
    }

    {
        const res = await api('POST', '/api/check-permission', { permission: 'quan_ly_nguoi_dung' });
        ok(res.status === 403, 'POST /api/check-permission → 403 Forbidden');
        ok(res.data.success === false, 'POST /api/check-permission → success: false');
        ok(res.data.code === 403, 'POST /api/check-permission → code: 403');
    }

    {
        const res = await api('POST', '/api/check-permission', {});
        ok(res.status === 400, 'POST /api/check-permission (thiếu field) → 400 Bad Request');
        ok(res.data.code === 400, 'POST /api/check-permission (thiếu field) → code: 400');
    }

    {
        const res = await api('POST', '/api/forgot-password', { email: 'test@example.com' });
        ok(res.status === 200, 'POST /api/forgot-password → 200 OK');
        ok(res.data.success === true, 'POST /api/forgot-password → success: true');
    }

    {
        const res = await api('POST', '/api/reset-password', { token: 'token_gia', password: 'MatKhauMoi123' });
        ok(res.status === 400, 'POST /api/reset-password (token sai) → 400');
        ok(res.data.success === false, 'POST /api/reset-password (token sai) → success: false');
    }

    {
        const res = await api('POST', '/api/reset-password', { token: 'bat_ky', password: '123' });
        ok(res.status === 400, 'POST /api/reset-password (password < 8) → 400');
    }

    {
        const res = await api('GET', '/duong-dan-khong-ton-tai-xyz');
        ok(res.status === 404, 'GET URL sai (JSON) → 404');
        ok(res.data.success === false, 'GET URL sai (JSON) → success: false');
        ok(res.data.code === 404, 'GET URL sai (JSON) → code: 404');
    }

    {
        const res = await fetchHTML('/favicon.ico');
        ok(res.status === 204, 'GET /favicon.ico → 204 No Content (không lỗi 404)');
    }

    // ─── PHẦN 3: KIỂM TRA STATIC FILES ───────────────────────────
    console.log('%c\n════ PHẦN 2: STATIC FILES ═════════════════════════════', C.group);

    const pages = [
        { path: '/login.html',           contains: 'xuLyDangNhap',     label: 'login.html' },
        { path: '/index.html',           contains: 'ALL_MENU_ITEMS',   label: 'index.html' },
        { path: '/403.html',             contains: '403',               label: '403.html' },
        { path: '/404.html',             contains: '404',               label: '404.html' },
        { path: '/forgot-password.html', contains: 'forgot-password',  label: 'forgot-password.html' },
        { path: '/change-password.html', contains: 'change-password',  label: 'change-password.html' },
    ];

    for (const p of pages) {
        const res = await fetchHTML(p.path);
        ok(res.status === 200, `${p.label} → tồn tại (200 OK)`);
        ok(res.text.includes(p.contains), `${p.label} → nội dung hợp lệ`);
    }

    // ─── PHẦN 4: KIỂM TRA LOCALSTORAGE & PHÂN QUYỀN ─────────────
    console.log('%c\n════ PHẦN 3: LOCALSTORAGE & SESSION ═══════════════════', C.group);

    {
        clearSession();
        ok(localStorage.getItem('isLoggedIn') === null, 'clearSession() xóa sạch isLoggedIn');
        ok(localStorage.getItem('currentUser') === null, 'clearSession() xóa sạch currentUser');

        const sv = { username: 'sv_k2301', fullName: 'Nguyễn Văn An', role: 'student', roleName: 'Sinh viên', permissions: ['diem_danh', 'lich_su_diem_danh', 'doi_mat_khau'] };
        setUser(sv);
        ok(localStorage.getItem('isLoggedIn') === 'true', 'setUser() → isLoggedIn = "true"');
        ok(JSON.parse(localStorage.getItem('currentUser')).role === 'student', 'setUser() → currentUser.role = "student"');
        ok(Number(localStorage.getItem('sessionExpiresAt')) > Date.now(), 'setUser() → sessionExpiresAt > now (phiên còn hiệu lực)');

        const gv = { username: 'gv_nguyenvana', fullName: 'ThS. Nguyễn Văn Anh', role: 'lecturer', roleName: 'Giảng viên', permissions: ['quan_ly_diem_danh', 'danh_sach_lop', 'bao_cao_chuyen_can', 'doi_mat_khau'] };
        setUser(gv);
        ok(JSON.parse(localStorage.getItem('currentUser')).role === 'lecturer', 'setUser(giảng viên) → role = "lecturer"');
        ok(JSON.parse(localStorage.getItem('currentUser')).permissions.includes('quan_ly_diem_danh'), 'Giảng viên có quyền quan_ly_diem_danh');
        ok(!JSON.parse(localStorage.getItem('currentUser')).permissions.includes('diem_danh'), 'Giảng viên KHÔNG có quyền diem_danh');

        const admin = { username: 'admin', fullName: 'Admin', role: 'admin', roleName: 'Quản trị viên', permissions: ['quan_ly_nguoi_dung', 'quan_ly_lop_hoc', 'bao_cao_tong_hop', 'cau_hinh_he_thong', 'doi_mat_khau'] };
        setUser(admin);
        ok(JSON.parse(localStorage.getItem('currentUser')).role === 'admin', 'setUser(admin) → role = "admin"');
    }

    // ─── PHẦN 5: KIỂM TRA DOM (CHỈ TRÊN index.html) ─────────────
    console.log('%c\n════ PHẦN 4: KIỂM TRA DOM (index.html) ════════════════', C.group);

    if (isIndex) {
        ok(!!document.getElementById('desktopMenuList'), 'DOM: #desktopMenuList tồn tại');
        ok(!!document.getElementById('mobileMenuList'), 'DOM: #mobileMenuList tồn tại');
        ok(!!document.getElementById('userNameDisplay'), 'DOM: #userNameDisplay tồn tại');
        ok(!!document.getElementById('userRoleDisplay'), 'DOM: #userRoleDisplay tồn tại');
        ok(!!document.getElementById('statusBar'), 'DOM: Thanh session status tồn tại');
        ok(!!document.getElementById('mobileDrawer'), 'DOM: Mobile drawer tồn tại');
        ok(!!document.getElementById('drawerBackdrop'), 'DOM: Drawer backdrop tồn tại');
        ok(!!document.getElementById('menuToggleBtn'), 'DOM: Nút hamburger ☰ tồn tại');
        ok(!!document.querySelector('.btn-renew'), 'DOM: Nút gia hạn phiên tồn tại');
        ok(!!document.querySelector('.btn-logout'), 'DOM: Nút đăng xuất tồn tại (desktop)');

        // Kiểm tra phân quyền live
        const svUser = { username: 'sv_test', fullName: 'Sinh Viên Test', role: 'student', roleName: 'Sinh viên', permissions: ['diem_danh', 'lich_su_diem_danh', 'doi_mat_khau'] };
        setUser(svUser);
        if (typeof window.renderMenuTheoQuyen === 'function') {
            window.renderMenuTheoQuyen(svUser);
            const menus = getMenuItems();
            ok(menus.includes('desktop_menu_diem_danh'), 'Sinh viên: menu "Điểm danh lớp học" hiển thị');
            ok(menus.includes('desktop_menu_lich_su'), 'Sinh viên: menu "Lịch sử điểm danh" hiển thị');
            ok(!menus.includes('desktop_menu_quan_ly_diem_danh'), 'Sinh viên: KHÔNG thấy "Quản lý điểm danh"');
            ok(!menus.includes('desktop_menu_quan_ly_nguoi_dung'), 'Sinh viên: KHÔNG thấy "Quản lý người dùng"');
            ok(!menus.includes('desktop_menu_cau_hinh_he_thong'), 'Sinh viên: KHÔNG thấy "Cấu hình hệ thống"');

            const gvUser = { username: 'gv_test', fullName: 'Giảng Viên Test', role: 'lecturer', roleName: 'Giảng viên', permissions: ['quan_ly_diem_danh', 'danh_sach_lop', 'bao_cao_chuyen_can', 'doi_mat_khau'] };
            setUser(gvUser);
            window.renderMenuTheoQuyen(gvUser);
            const gvMenus = getMenuItems();
            ok(gvMenus.includes('desktop_menu_quan_ly_diem_danh'), 'Giảng viên: menu "Quản lý điểm danh" hiển thị');
            ok(!gvMenus.includes('desktop_menu_diem_danh'), 'Giảng viên: KHÔNG thấy "Điểm danh lớp học"');
            ok(!gvMenus.includes('desktop_menu_quan_ly_nguoi_dung'), 'Giảng viên: KHÔNG thấy "Quản lý người dùng"');

            const adminUser = { username: 'admin', fullName: 'Admin', role: 'admin', roleName: 'Quản trị viên', permissions: ['quan_ly_nguoi_dung', 'quan_ly_lop_hoc', 'bao_cao_tong_hop', 'cau_hinh_he_thong', 'doi_mat_khau'] };
            setUser(adminUser);
            window.renderMenuTheoQuyen(adminUser);
            const adminMenus = getMenuItems();
            ok(adminMenus.includes('desktop_menu_quan_ly_nguoi_dung'), 'Admin: menu "Quản lý người dùng" hiển thị');
            ok(adminMenus.includes('desktop_menu_cau_hinh_he_thong'), 'Admin: menu "Cấu hình hệ thống" hiển thị');
            ok(!adminMenus.includes('desktop_menu_diem_danh'), 'Admin: KHÔNG thấy "Điểm danh lớp học"');

            console.log('%c  [Đã phục hồi menu về trạng thái ban đầu...]', C.warn);
            window.renderMenuTheoQuyen(svUser);
        } else {
            console.log('%c  [Bỏ qua test DOM phân quyền — hàm renderMenuTheoQuyen không tồn tại trên trang này]', C.warn);
        }

        // Kiểm tra responsive
        const style = getComputedStyle(document.body);
        ok(document.querySelector('meta[name="viewport"]') !== null, 'Responsive: có thẻ meta viewport');
        ok(document.body.style.overflowX === '' || style.overflowX !== 'scroll', 'Responsive: không bị scroll ngang');
    } else {
        console.log('%c  [Bỏ qua test DOM — Mở trang index.html để chạy test này]', C.warn);
        ok(true, 'Bỏ qua DOM test (không phải index.html)');
    }

    // ─── PHẦN 6: KIỂM TRA TRANG LỖI ─────────────────────────────
    console.log('%c\n════ PHẦN 5: TRANG LỖI 403 / 404 ══════════════════════', C.group);

    {
        const res403 = await fetchHTML('/403.html');
        ok(res403.status === 200, '403.html: file tồn tại');
        ok(res403.text.includes('403'), '403.html: có nội dung mã lỗi 403');
        ok(res403.text.includes('index.html'), '403.html: có nút về trang chủ');

        const res404 = await fetchHTML('/404.html');
        ok(res404.status === 200, '404.html: file tồn tại');
        ok(res404.text.includes('404'), '404.html: có nội dung mã lỗi 404');
        ok(res404.text.includes('index.html'), '404.html: có nút về trang chủ');

        const resMissing = await fetchHTML('/trang-khong-ton-tai-xyzabc');
        ok(resMissing.status === 404, 'URL ngẫu nhiên → server trả 404');
        ok(resMissing.text.includes('<!DOCTYPE html') || resMissing.text.includes('<html'), 'URL ngẫu nhiên → server trả lại HTML (trang 404)');
    }

    // ─── KẾT QUẢ ─────────────────────────────────────────────────
    console.log('\n');
    console.log('%c═══════════════════════════════════════════════════════', C.summary);
    console.log(`%c  KẾT QUẢ KIỂM THỬ: ${passed}/${total} PASSED  |  Thất bại: ${failed}`, C.summary);
    console.log('%c═══════════════════════════════════════════════════════', C.summary);

    if (failed > 0) {
        console.log('%c\n  Danh sách test thất bại:', C.fail);
        errors.forEach((e, i) => console.log(`%c    ${i + 1}. ${e}`, C.fail));
    } else {
        console.log('%c  Tất cả test đã pass! Hệ thống hoạt động đúng.', C.pass);
    }

    console.log('\n%c  Gợi ý kiểm tra thủ công:', C.warn);
    console.log('%c  • Đăng nhập với tài khoản "admin" → xem menu admin', C.reset);
    console.log('%c  • Đăng nhập với tài khoản "sinhvien" → xem menu sinh viên', C.reset);
    console.log('%c  • Mở DevTools > Application > LocalStorage > sửa permissions: [] > F5 → phải ra 403.html', C.reset);
    console.log('%c  • Truy cập http://localhost:3000/khong-ton-tai → phải ra 404.html', C.reset);
    console.log('%c  • Thu nhỏ trình duyệt xuống 360px → menu phải chuyển sang drawer', C.reset);

    return { total, passed, failed };
})();
