const http = require('http');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  \u2713 PASS: ${message}`);
    } else {
        failedTests++;
        console.error(`  \u2717 FAIL: ${message}`);
    }
}

function request(method, path, body, extraHeaders = {}) {
    return new Promise((resolve) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...extraHeaders
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
                } catch {
                    resolve({ status: res.statusCode, body: data, headers: res.headers });
                }
            });
        });

        req.on('error', (err) => {
            console.error('\n  [LỖI KẾT NỐI] Server chưa chạy. Chạy "npm start" trước rồi thử lại.\n');
            process.exit(1);
        });

        if (payload) req.write(payload);
        req.end();
    });
}

function requestHTML(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method: 'GET',
            headers: { 'Accept': 'text/html' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });

        req.on('error', () => {
            console.error('\n  [LỖI KẾT NỐI] Server chưa chạy. Chạy "npm start" trước rồi thử lại.\n');
            process.exit(1);
        });

        req.end();
    });
}

async function runTests() {
    console.log('=================================================');
    console.log('  KIỂM THỬ API SERVER - S1-06');
    console.log('=================================================\n');

    // --- TEST 1: Health Check ---
    console.log('--- TEST 1: GET /api/health ---');
    {
        const res = await request('GET', '/api/health');
        assert(res.status === 200, 'Health check trả về HTTP 200');
        assert(res.body.success === true, 'Health check body.success = true');
    }

    // --- TEST 2: 403 - Check Permission ---
    console.log('\n--- TEST 2: POST /api/check-permission ---');
    {
        const res = await request('POST', '/api/check-permission', { permission: 'quan_ly_nguoi_dung' });
        assert(res.status === 403, 'Check permission trả về HTTP 403');
        assert(res.body.success === false, 'Check permission body.success = false');
        assert(res.body.code === 403, 'Check permission body.code = 403');
        assert(typeof res.body.message === 'string', 'Check permission trả về message');
    }

    // --- TEST 3: 400 - Check Permission thiếu field ---
    console.log('\n--- TEST 3: POST /api/check-permission (thiếu permission) ---');
    {
        const res = await request('POST', '/api/check-permission', {});
        assert(res.status === 400, 'Thiếu permission trả về HTTP 400');
        assert(res.body.success === false, 'Thiếu permission body.success = false');
        assert(res.body.code === 400, 'Thiếu permission body.code = 400');
    }

    // --- TEST 4: Forgot Password ---
    console.log('\n--- TEST 4: POST /api/forgot-password ---');
    {
        const res = await request('POST', '/api/forgot-password', { email: 'test@example.com' });
        assert(res.status === 200, 'Forgot password trả về HTTP 200');
        assert(res.body.success === true, 'Forgot password body.success = true');
        assert(typeof res.body.message === 'string', 'Forgot password trả về message');
    }

    // --- TEST 5: Reset Password - Token không hợp lệ ---
    console.log('\n--- TEST 5: POST /api/reset-password (token sai) ---');
    {
        const res = await request('POST', '/api/reset-password', {
            token: 'token_gia_khong_ton_tai_abc123',
            password: 'MatKhauMoi123'
        });
        assert(res.status === 400, 'Token sai trả về HTTP 400');
        assert(res.body.success === false, 'Token sai body.success = false');
    }

    // --- TEST 6: Reset Password - Mật khẩu quá ngắn ---
    console.log('\n--- TEST 6: POST /api/reset-password (mật khẩu < 8 ký tự) ---');
    {
        const res = await request('POST', '/api/reset-password', {
            token: 'bat_ky_token_nao',
            password: '123'
        });
        assert(res.status === 400, 'Mật khẩu ngắn trả về HTTP 400');
        assert(res.body.success === false, 'Mật khẩu ngắn body.success = false');
    }

    // --- TEST 7: 404 JSON (đường dẫn không tồn tại, gọi API) ---
    console.log('\n--- TEST 7: GET đường dẫn không tồn tại (Accept: application/json) ---');
    {
        const res = await request('GET', '/duong-dan-khong-ton-tai-xyz');
        assert(res.status === 404, 'Đường dẫn sai trả về HTTP 404');
        assert(res.body.success === false, '404 body.success = false');
        assert(res.body.code === 404, '404 body.code = 404');
    }

    // --- TEST 8: 404 HTML (trình duyệt truy cập sai URL) ---
    console.log('\n--- TEST 8: GET đường dẫn không tồn tại (Accept: text/html) ---');
    {
        const res = await requestHTML('/trang-nay-khong-ton-tai-abc');
        assert(res.status === 404, 'HTML 404 trả về HTTP 404');
        assert(res.body.includes('404'), 'HTML 404 chứa nội dung trang lỗi');
        assert(res.body.includes('<!DOCTYPE html') || res.body.includes('<html'), 'HTML 404 trả về trang HTML hợp lệ');
    }

    // --- TEST 9: Favicon không gây lỗi ---
    console.log('\n--- TEST 9: GET /favicon.ico ---');
    {
        const res = await requestHTML('/favicon.ico');
        assert(res.status === 204, 'favicon.ico trả về HTTP 204 (No Content), không bị lỗi 404');
    }

    // --- TEST 10: Static files được phục vụ đúng ---
    console.log('\n--- TEST 10: Static files (login.html, index.html) ---');
    {
        const loginRes = await requestHTML('/login.html');
        assert(loginRes.status === 200, 'login.html trả về HTTP 200');
        assert(loginRes.body.includes('xuLyDangNhap'), 'login.html chứa hàm xử lý đăng nhập');

        const indexRes = await requestHTML('/index.html');
        assert(indexRes.status === 200, 'index.html trả về HTTP 200');
        assert(indexRes.body.includes('dangXuatAnToan'), 'index.html chứa hàm đăng xuất');
        assert(indexRes.body.includes('ALL_MENU_ITEMS'), 'index.html chứa danh mục menu phân quyền');

        const res403 = await requestHTML('/403.html');
        assert(res403.status === 200, '403.html tồn tại và trả về HTTP 200');

        const res404 = await requestHTML('/404.html');
        assert(res404.status === 200, '404.html tồn tại và trả về HTTP 200');
    }

    // --- KẾT QUẢ ---
    console.log('\n=================================================');
    console.log(`  KẾT QUẢ: ${passedTests}/${totalTests} PASSED  (Thất bại: ${failedTests})`);
    console.log('=================================================\n');

    process.exit(failedTests > 0 ? 1 : 0);
}

runTests();
