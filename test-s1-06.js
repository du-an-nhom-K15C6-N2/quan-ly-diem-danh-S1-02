const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const http = require('http');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✓ PASS: ${message}`);
    } else {
        failedTests++;
        console.error(`  ✗ FAIL: ${message}`);
    }
}

console.log("=================================================");
console.log("  BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CHO NHIỆM VỤ S1-06    ");
console.log("=================================================\n");

const indexHtmlRaw = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const loginHtmlRaw = fs.readFileSync(path.join(__dirname, 'login.html'), 'utf8');
const changePasswordHtmlRaw = fs.readFileSync(path.join(__dirname, 'change-password.html'), 'utf8');

// Helper to simulate page loading with a specific currentUser in localStorage
function createPageInstance(userData) {
    const dom = new JSDOM(indexHtmlRaw, {
        runScripts: "dangerously",
        resources: "usable",
        url: "http://localhost:3000/index.html",
        beforeParse(window) {
            window.alert = () => {};
            window.confirm = () => true;
            if (userData) {
                window.localStorage.setItem("isLoggedIn", "true");
                window.localStorage.setItem("sessionExpiresAt", String(Date.now() + 30000));
                window.localStorage.setItem("currentUser", JSON.stringify(userData));
            } else {
                window.localStorage.clear();
            }
        }
    });
    return dom;
}

// 1. Trường hợp 1 & 2: Kiểm tra đăng nhập tài khoản Sinh viên (sv_k2301)
console.log("--- TEST CASE 1 & 2: Phân quyền & Hiển thị Menu cho Sinh viên ---");
{
    const studentUser = {
        username: "sv_k2301",
        fullName: "Nguyễn Văn An",
        role: "student",
        roleName: "Sinh viên",
        permissions: ["diem_danh", "lich_su_diem_danh", "doi_mat_khau"]
    };
    const dom = createPageInstance(studentUser);
    const document = dom.window.document;

    // Kích hoạt window.onload
    dom.window.onload();

    const desktopMenu = document.getElementById("desktopMenuList");
    const mobileMenu = document.getElementById("mobileMenuList");

    // Menu có các mục thuộc quyền: diem_danh, lich_su_diem_danh, doi_mat_khau
    assert(desktopMenu.querySelector("#desktop_menu_diem_danh") !== null, "Menu desktop có mục 'Điểm danh lớp học'");
    assert(desktopMenu.querySelector("#desktop_menu_lich_su") !== null, "Menu desktop có mục 'Lịch sử điểm danh'");
    assert(desktopMenu.querySelector("#desktop_menu_doi_mat_khau") !== null, "Menu desktop có mục 'Đổi mật khẩu'");

    assert(mobileMenu.querySelector("#mobile_menu_diem_danh") !== null, "Menu mobile có mục 'Điểm danh lớp học'");
    assert(mobileMenu.querySelector("#mobile_menu_lich_su") !== null, "Menu mobile có mục 'Lịch sử điểm danh'");
    assert(mobileMenu.querySelector("#mobile_menu_doi_mat_khau") !== null, "Menu mobile có mục 'Đổi mật khẩu'");

    // Menu KHÔNG chứa các mục của Giảng viên & Admin
    assert(desktopMenu.querySelector("#desktop_menu_quan_ly_diem_danh") === null, "Sinh viên KHÔNG thấy mục 'Quản lý điểm danh'");
    assert(desktopMenu.querySelector("#desktop_menu_danh_sach_lop") === null, "Sinh viên KHÔNG thấy mục 'Danh sách lớp học'");
    assert(desktopMenu.querySelector("#desktop_menu_bao_cao_chuyen_can") === null, "Sinh viên KHÔNG thấy mục 'Báo cáo chuyên cần'");
    assert(desktopMenu.querySelector("#desktop_menu_quan_ly_nguoi_dung") === null, "Sinh viên KHÔNG thấy mục 'Quản lý người dùng'");
    assert(desktopMenu.querySelector("#desktop_menu_quan_ly_lop_hoc") === null, "Sinh viên KHÔNG thấy mục 'Quản lý môn & lớp'");
    assert(desktopMenu.querySelector("#desktop_menu_bao_cao_tong_hop") === null, "Sinh viên KHÔNG thấy mục 'Báo cáo tổng hợp'");
    assert(desktopMenu.querySelector("#desktop_menu_cau_hinh_he_thong") === null, "Sinh viên KHÔNG thấy mục 'Cấu hình hệ thống'");
}

// 2. Kiểm tra đăng nhập tài khoản Giảng viên (gv_nguyenvana)
console.log("\n--- TEST CASE: Phân quyền & Hiển thị Menu cho Giảng viên ---");
{
    const lecturerUser = {
        username: "gv_nguyenvana",
        fullName: "ThS. Nguyễn Văn Anh",
        role: "lecturer",
        roleName: "Giảng viên",
        permissions: ["quan_ly_diem_danh", "danh_sach_lop", "bao_cao_chuyen_can", "doi_mat_khau"]
    };
    const dom = createPageInstance(lecturerUser);
    const document = dom.window.document;
    dom.window.onload();

    const desktopMenu = document.getElementById("desktopMenuList");

    assert(desktopMenu.querySelector("#desktop_menu_quan_ly_diem_danh") !== null, "Giảng viên thấy mục 'Quản lý điểm danh'");
    assert(desktopMenu.querySelector("#desktop_menu_danh_sach_lop") !== null, "Giảng viên thấy mục 'Danh sách lớp học'");
    assert(desktopMenu.querySelector("#desktop_menu_bao_cao_chuyen_can") !== null, "Giảng viên thấy mục 'Báo cáo chuyên cần'");
    assert(desktopMenu.querySelector("#desktop_menu_doi_mat_khau") !== null, "Giảng viên thấy mục 'Đổi mật khẩu'");

    // Giảng viên KHÔNG thấy mục của Sinh viên (Điểm danh cá nhân) và Admin (Quản lý hệ thống)
    assert(desktopMenu.querySelector("#desktop_menu_diem_danh") === null, "Giảng viên KHÔNG thấy 'Điểm danh lớp học'");
    assert(desktopMenu.querySelector("#desktop_menu_lich_su") === null, "Giảng viên KHÔNG thấy 'Lịch sử điểm danh'");
    assert(desktopMenu.querySelector("#desktop_menu_quan_ly_nguoi_dung") === null, "Giảng viên KHÔNG thấy 'Quản lý người dùng'");
    assert(desktopMenu.querySelector("#desktop_menu_cau_hinh_he_thong") === null, "Giảng viên KHÔNG thấy 'Cấu hình hệ thống'");
}

// 3. Kiểm tra đăng nhập tài khoản Quản trị viên (admin)
console.log("\n--- TEST CASE: Phân quyền & Hiển thị Menu cho Quản trị viên ---");
{
    const adminUser = {
        username: "admin",
        fullName: "Ngô Trung Hiếu",
        role: "admin",
        roleName: "Quản trị viên",
        permissions: ["quan_ly_nguoi_dung", "quan_ly_lop_hoc", "bao_cao_tong_hop", "cau_hinh_he_thong", "doi_mat_khau"]
    };
    const dom = createPageInstance(adminUser);
    const document = dom.window.document;
    dom.window.onload();

    const desktopMenu = document.getElementById("desktopMenuList");

    assert(desktopMenu.querySelector("#desktop_menu_quan_ly_nguoi_dung") !== null, "Admin thấy 'Quản lý người dùng'");
    assert(desktopMenu.querySelector("#desktop_menu_quan_ly_lop_hoc") !== null, "Admin thấy 'Quản lý môn & lớp'");
    assert(desktopMenu.querySelector("#desktop_menu_bao_cao_tong_hop") !== null, "Admin thấy 'Báo cáo tổng hợp'");
    assert(desktopMenu.querySelector("#desktop_menu_cau_hinh_he_thong") !== null, "Admin thấy 'Cấu hình hệ thống'");
    assert(desktopMenu.querySelector("#desktop_menu_doi_mat_khau") !== null, "Admin thấy 'Đổi mật khẩu'");

    // Admin KHÔNG thấy các mục của Sinh viên hay Giảng viên
    assert(desktopMenu.querySelector("#desktop_menu_diem_danh") === null, "Admin KHÔNG thấy 'Điểm danh lớp học'");
    assert(desktopMenu.querySelector("#desktop_menu_danh_sach_lop") === null, "Admin KHÔNG thấy 'Danh sách lớp học'");
}

// 4. Trường hợp 3 & 4: Kiểm tra hiển thị tên người dùng và vai trò
console.log("\n--- TEST CASE 3 & 4: Hiển thị Tên người dùng và Vai trò ---");
{
    const user = {
        username: "gv_nguyenvana",
        fullName: "ThS. Nguyễn Văn Anh",
        role: "lecturer",
        roleName: "Giảng viên",
        permissions: ["quan_ly_diem_danh", "doi_mat_khau"]
    };
    const dom = createPageInstance(user);
    const document = dom.window.document;
    dom.window.onload();

    const headerName = document.getElementById("userNameDisplay").textContent.trim();
    const headerRole = document.getElementById("userRoleDisplay").textContent.trim();
    const drawerName = document.getElementById("drawerUserName").textContent.trim();
    const drawerRole = document.getElementById("drawerUserRole").textContent.trim();

    assert(headerName === "ThS. Nguyễn Văn Anh", `Tên hiển thị trên Header chính xác: "${headerName}"`);
    assert(headerRole === "Giảng viên", `Vai trò hiển thị trên Header chính xác: "${headerRole}"`);
    assert(drawerName === "ThS. Nguyễn Văn Anh", `Tên hiển thị trong Mobile Drawer chính xác: "${drawerName}"`);
    assert(drawerRole === "Giảng viên", `Vai trò hiển thị trong Mobile Drawer chính xác: "${drawerRole}"`);
}

// 5. Trường hợp 5: Kiểm tra giao diện và cấu trúc cho màn hình 360px
console.log("\n--- TEST CASE 5: Kiểm tra Giao diện Màn hình 360px ---");
{
    assert(indexHtmlRaw.includes('name="viewport"') && indexHtmlRaw.includes('width=device-width'), "Trang có thẻ meta viewport chuẩn");
    assert(indexHtmlRaw.includes('@media (max-width: 360px)'), "Có CSS Media Query tối ưu riêng cho màn hình <= 360px");
    assert(indexHtmlRaw.includes('overflow-x: hidden'), "Có xử lý chống tràn ngang màn hình");
    assert(indexHtmlRaw.includes('mobile-drawer'), "Có Mobile Drawer Sidebar cho di động");
    assert(indexHtmlRaw.includes('drawer-backdrop'), "Có Backdrop làm mờ khi mở menu di động");
    assert(indexHtmlRaw.includes('menu-toggle-btn'), "Có Nút Hamburger ☰ mở menu di động");

    // Test toggleMenu logic
    const studentUser = {
        username: "sv_k2301",
        fullName: "Nguyễn Văn An",
        role: "student",
        roleName: "Sinh viên",
        permissions: ["diem_danh", "doi_mat_khau"]
    };
    const dom = createPageInstance(studentUser);
    dom.window.onload();
    const drawer = dom.window.document.getElementById("mobileDrawer");
    const backdrop = dom.window.document.getElementById("drawerBackdrop");

    assert(!drawer.classList.contains("open"), "Mobile drawer mặc định đóng");
    dom.window.toggleMenu();
    assert(drawer.classList.contains("open"), "Gọi toggleMenu() -> drawer mở thành công");
    assert(backdrop.classList.contains("active"), "Gọi toggleMenu() -> backdrop kích hoạt");
    dom.window.closeMenu();
    assert(!drawer.classList.contains("open"), "Gọi closeMenu() -> drawer đóng lại thành công");
}

// 6. Trường hợp 6: Kiểm tra giao diện desktop và tính năng cũ không bị hỏng
console.log("\n--- TEST CASE 6: Kiểm tra Desktop & Giữ nguyên chức năng cũ ---");
{
    const studentUser = {
        username: "sv_k2301",
        fullName: "Nguyễn Văn An",
        role: "student",
        roleName: "Sinh viên",
        permissions: ["diem_danh", "lich_su_diem_danh", "doi_mat_khau"]
    };
    const dom = createPageInstance(studentUser);
    dom.window.onload();
    const document = dom.window.document;

    // Giữ nguyên form điểm danh
    assert(document.getElementById("monHocSelect") !== null, "Select chọn môn học vẫn hoạt động");
    assert(document.getElementById("noiDungNhap") !== null, "Textarea ghi chú điểm danh vẫn hoạt động");
    assert(document.getElementById("draftStatus") !== null, "Thông báo lưu bản nháp tự động vẫn hoạt động");
    assert(document.getElementById("statusBar") !== null, "Thanh đếm ngược phiên đăng nhập vẫn hoạt động");
    assert(document.querySelector(".btn-renew") !== null, "Nút gia hạn phiên vẫn hoạt động");

    // Kiểm tra lưu nháp tự động
    const textarea = document.getElementById("noiDungNhap");
    textarea.value = "Nội dung kiểm thử tự động lưu nháp";
    textarea.dispatchEvent(new dom.window.Event('input'));
    assert(dom.window.localStorage.getItem("diem_danh_draft") === "Nội dung kiểm thử tự động lưu nháp", "Chức năng tự động lưu bản nháp hoạt động chính xác");
}

// 7. Trường hợp 7: Kiểm tra Đăng xuất và Đăng nhập lại
console.log("\n--- TEST CASE 7: Kiểm tra Đăng xuất & Đăng nhập lại ---");
{
    const studentUser = {
        username: "sv_k2301",
        fullName: "Nguyễn Văn An",
        role: "student",
        roleName: "Sinh viên",
        permissions: ["diem_danh"]
    };
    const dom = createPageInstance(studentUser);
    dom.window.onload();

    // Gọi đăng xuất an toàn
    dom.window.dangXuatAnToan();
    assert(dom.window.localStorage.getItem("isLoggedIn") === null, "Đăng xuất đã xóa 'isLoggedIn'");
    assert(dom.window.localStorage.getItem("currentUser") === null, "Đăng xuất đã xóa 'currentUser'");
    assert(dom.window.localStorage.getItem("sessionExpiresAt") === null, "Đăng xuất đã xóa 'sessionExpiresAt'");

    // Đăng nhập lại với tài khoản Giảng viên trong login.html
    const loginDom = new JSDOM(loginHtmlRaw, {
        runScripts: "dangerously",
        url: "http://localhost:3000/login.html"
    });
    loginDom.window.document.getElementById("username").value = "gv_nguyenvana";
    loginDom.window.document.getElementById("password").value = "123456";
    loginDom.window.xuLyDangNhap();

    const newUserData = JSON.parse(loginDom.window.localStorage.getItem("currentUser"));
    assert(newUserData.role === "lecturer", "Đăng nhập lại bằng tài khoản Giảng viên thành công");
    assert(newUserData.fullName === "ThS. Nguyễn Văn Anh", "Thông tin tên Giảng viên được lưu chính xác");
    assert(newUserData.permissions.includes("quan_ly_diem_danh"), "Quyền của Giảng viên được cấp chính xác");
}

// 8. Trường hợp 8: Kiểm tra refresh trang
console.log("\n--- TEST CASE 8: Kiểm tra Refresh Trang ---");
{
    const adminUser = {
        username: "admin",
        fullName: "Ngô Trung Hiếu",
        role: "admin",
        roleName: "Quản trị viên",
        permissions: ["quan_ly_nguoi_dung", "doi_mat_khau"]
    };
    const dom = createPageInstance(adminUser);
    // Lần tải 1
    dom.window.onload();

    // Giả lập refresh (tải lại cùng window/localStorage)
    dom.window.onload();

    const headerRole = dom.window.document.getElementById("userRoleDisplay").textContent.trim();
    assert(headerRole === "Quản trị viên", "Sau refresh: Vai trò vẫn là Quản trị viên");
    assert(dom.window.document.getElementById("desktop_menu_quan_ly_nguoi_dung") !== null, "Sau refresh: Menu Quản trị viên vẫn được giữ nguyên và lọc đúng");
}

// 9. Kiểm tra tính năng Đổi Mật Khẩu (Tích hợp từ S1-04)
console.log("\n--- TEST CASE: Tính năng Đổi Mật Khẩu Tích Hợp ---");
{
    const studentUser = {
        username: "sv_k2301",
        fullName: "Nguyễn Văn An",
        role: "student",
        roleName: "Sinh viên",
        permissions: ["diem_danh", "doi_mat_khau"]
    };
    const dom = createPageInstance(studentUser);
    dom.window.onload();
    const document = dom.window.document;

    // Chuyển sang panel đổi mật khẩu
    dom.window.chuyenChucNang("menu_doi_mat_khau", "panel_doi_mat_khau");
    assert(document.getElementById("panel_doi_mat_khau").classList.contains("active"), "Panel Đổi mật khẩu kích hoạt khi bấm menu");

    // Thử đổi sai mật khẩu hiện tại
    document.getElementById("pCurrentPassword").value = "sai_mat_khau";
    document.getElementById("pNewPassword").value = "MatKhauMoi123";
    document.getElementById("pConfirmPassword").value = "MatKhauMoi123";
    dom.window.xuLyDoiMatKhau({ preventDefault: () => {} });
    assert(document.getElementById("pPasswordMessage").textContent.includes("không chính xác"), "Báo lỗi khi nhập sai mật khẩu hiện tại");

    // Đổi đúng
    document.getElementById("pCurrentPassword").value = "123456";
    document.getElementById("pNewPassword").value = "MatKhauMoi123";
    document.getElementById("pConfirmPassword").value = "MatKhauMoi123";
    dom.window.xuLyDoiMatKhau({ preventDefault: () => {} });
    assert(document.getElementById("pPasswordMessage").textContent.includes("thành công"), "Đổi mật khẩu thành công khi đúng quy tắc (>=8 ký tự, có chữ và số)");
}

console.log("\n=================================================");
console.log(`  KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} PASSED (Thất bại: ${failedTests})`);
console.log("=================================================\n");

if (failedTests > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
