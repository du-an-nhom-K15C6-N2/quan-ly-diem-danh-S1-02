const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const app = express();
const crypto = require('crypto');

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Backend đang chạy bình thường.' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

const RESET_TOKEN_TTL = 30 * 60 * 1000;
const resetTokens = new Map();
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'email_cua_ban@gmail.com',
        pass: 'xxxx xxxx xxxx xxxx'
    }
});
app.post('/api/forgot-password', async (req, res) => {
    try {
        const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
        const token = crypto.randomBytes(32).toString('hex');
        resetTokens.set(token, {
            email,
            expiresAt: Date.now() + RESET_TOKEN_TTL
        });
        const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;
        console.log("=== ĐƯỜNG DẪN ĐẶT LẠI MẬT KHẨU ===");
        console.log(resetLink);
        await transporter.sendMail({
            to: email,
            subject: 'Đặt lại mật khẩu hệ thống',
            html: `<p>Nhấn vào liên kết sau để đặt lại mật khẩu (Có hiệu lực 30 phút):</p><a href="${resetLink}">${resetLink}</a>`
        }).catch(err => console.log("Gửi mail qua mạng có thể chưa cấu hình, nhưng đã in link ở terminal trên."));
        // Luôn trả cùng một nội dung, kể cả khi email không tồn tại.
        return res.status(200).json({
            success: true,
            message: 'Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi. Liên kết có hiệu lực trong 30 phút.'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống server' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    const { token, password } = req.body;
    const resetRequest = resetTokens.get(token);

    if (!resetRequest || resetRequest.expiresAt < Date.now()) {
        resetTokens.delete(token);
        return res.status(400).json({ success: false, message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' });
    }

    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 8 ký tự.' });
    }

    // Demo hiện chưa có cơ sở dữ liệu tài khoản; token vẫn được dùng một lần.
    resetTokens.delete(token);
    return res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' });
});

app.post('/api/check-permission', (req, res) => {
    const { permission } = req.body;
    if (!permission || typeof permission !== 'string') {
        return res.status(400).json({ success: false, code: 400, message: 'Thiếu thông tin quyền truy cập.' });
    }
    return res.status(403).json({ success: false, code: 403, message: 'Không đủ quyền truy cập.' });
});

app.use((req, res, next) => {
    const accept = req.headers['accept'] || '';
    if (accept.includes('application/json')) {
        return res.status(404).json({ success: false, code: 404, message: 'Không tìm thấy tài nguyên yêu cầu.' });
    }
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(3000, () => {
    console.log('Server Backend đang chạy tại http://localhost:3000');
});