#!/usr/bin/env node
// Script để tạo GOOGLE_APPLICATION_CREDENTIALS_JSON cho Vercel
// Chạy: node generate-credentials.js

const fs = require('fs');
const path = require('path');

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   GENERATE DIALOGFLOW CREDENTIALS FOR VERCEL                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Đọc .env.local
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('❌ Không tìm thấy file .env.local');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');

// Hàm helper: loại bỏ \r, \n và khoảng trắng thừa
const cleanValue = (value) => {
    if (!value) return '';
    return value.replace(/\r/g, '').replace(/\n/g, '').trim();
};

// Parse env vars
const getEnvVar = (name) => {
    const patterns = [
        new RegExp(`${name}="([^"]+)"`),
        new RegExp(`${name}='([^']+)'`),
        new RegExp(`${name}=([^\\n]+)`)
    ];

    for (const pattern of patterns) {
        const match = envContent.match(pattern);
        if (match) return match[1];
    }
    return null;
};

// Clean project_id và client_email (loại bỏ hoàn toàn \r và \n)
const projectId = cleanValue(getEnvVar('DIALOGFLOW_PROJECT_ID'));
const clientEmail = cleanValue(getEnvVar('DIALOGFLOW_CLIENT_EMAIL'));
let privateKey = getEnvVar('DIALOGFLOW_PRIVATE_KEY');

// Validate có đầy đủ biến không
if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Thiếu biến môi trường trong .env.local:');
    console.error('   - DIALOGFLOW_PROJECT_ID:', projectId ? '✓' : '✗');
    console.error('   - DIALOGFLOW_CLIENT_EMAIL:', clientEmail ? '✓' : '✗');
    console.error('   - DIALOGFLOW_PRIVATE_KEY:', privateKey ? '✓' : '✗');
    process.exit(1);
}

// Fix private key format: chỉ xóa \r, giữ lại \n (cần cho PEM format)
privateKey = privateKey.replace(/\r/g, '');
privateKey = privateKey.replace(/\\n/g, '\n');

// Validate không có ký tự điều khiển trong metadata fields
console.log('🔍 Validating credentials...');
console.log('   Project ID:', projectId);
console.log('   Client Email:', clientEmail);
console.log('   Private Key length:', privateKey.length, 'chars\n');

if (projectId.includes('\r') || projectId.includes('\n')) {
    console.error('❌ project_id chứa ký tự không hợp lệ (\\r hoặc \\n)');
    process.exit(1);
}

if (clientEmail.includes('\r') || clientEmail.includes('\n')) {
    console.error('❌ client_email chứa ký tự không hợp lệ (\\r hoặc \\n)');
    process.exit(1);
}

if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
    console.error('❌ private_key không có format PEM hợp lệ');
    process.exit(1);
}

console.log('✅ Credentials validation passed!');

// Create service account JSON
const serviceAccount = {
    type: "service_account",
    project_id: projectId,
    private_key_id: "dummy-key-id",
    private_key: privateKey,
    client_email: clientEmail,
    client_id: "dummy-client-id",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`
};

// Convert to single-line JSON string (minified)
const jsonString = JSON.stringify(serviceAccount);

// Test parse JSON để chắc chắn hợp lệ
try {
    const parsed = JSON.parse(jsonString);
    console.log('✅ JSON parse test: PASSED');

    // Double check không có \r trong parsed values
    if (parsed.project_id.includes('\r')) {
        console.error('❌ Vẫn còn \\r trong project_id sau khi clean!');
        process.exit(1);
    }
    if (parsed.client_email.includes('\r')) {
        console.error('❌ Vẫn còn \\r trong client_email sau khi clean!');
        process.exit(1);
    }
    console.log('✅ Final validation: Không có ký tự \\r trong JSON\n');
} catch (e) {
    console.error('❌ JSON không hợp lệ:', e.message);
    process.exit(1);
}

console.log('✅ Đã tạo credentials JSON thành công!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 HƯỚNG DẪN CẬP NHẬT TRÊN VERCEL:\n');
console.log('1. Vào Vercel Dashboard → Your Project → Settings → Environment Variables\n');
console.log('2. XÓA các biến cũ (nếu có):');
console.log('   - DIALOGFLOW_PROJECT_ID');
console.log('   - DIALOGFLOW_CLIENT_EMAIL');
console.log('   - DIALOGFLOW_PRIVATE_KEY\n');
console.log('3. Tạo biến MỚI:');
console.log('   Name: GOOGLE_APPLICATION_CREDENTIALS_JSON');
console.log('   Value: (copy đoạn JSON dưới đây)\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📝 COPY ĐOẠN JSON NÀY (1 dòng duy nhất, không có dấu ngoặc kép bên ngoài):\n');
console.log('--- BẮT ĐẦU COPY ---');
console.log(jsonString);
console.log('--- KẾT THÚC COPY ---\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('4. Save Environment Variables');
console.log('5. Redeploy project (Vercel sẽ tự động redeploy)\n');
console.log('✨ Sau khi redeploy, chatbot sẽ hoạt động với Dialogflow!\n');

// Optionally save to file
const outputPath = path.join(__dirname, 'dialogflow-credentials.json');
fs.writeFileSync(outputPath, JSON.stringify(serviceAccount, null, 2));
console.log(`💾 File credentials cũng đã được lưu tại: ${outputPath}`);
console.log('   (Dùng cho local testing, KHÔNG commit file này lên Git!)\n');
