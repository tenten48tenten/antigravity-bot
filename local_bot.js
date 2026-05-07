const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// --- YAPILANDIRMA ---
const TELEGRAM_TOKEN = '8704037641:AAEPtpkXFXYg_r_CAt06ZNOG92z9-OfPYvA';
const GEMINI_KEY = 'AIzaSyA5fbtXzy61DCzNlm7NhoK_mdJV0yQ6590';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
const SYNC_FILE = path.join('C:', 'Users', 'Administrator', 'Desktop', 'Gorevler.txt');

console.log('--- AntiGravity Yerel Medya Robotu (FFMPEG + Gemini) Başlatılıyor ---');

let lastUpdateId = 0;

// Yardımcı: HTTP/HTTPS POST
function request(url, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers }
        };
        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); } catch(e) { resolve({ok: false, error: body}); }
            });
        });
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

// Yardımcı: Komut Çalıştırma
function executeCommand(command) {
    return new Promise((resolve) => {
        console.log(`[SİSTEM] Komut: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) { resolve(`Hata: ${error.message}\n${stderr}`); return; }
            resolve(stdout || stderr || 'İşlem tamam.');
        });
    });
}

// Yardımcı: Dosya İndirme (Yerel Kaydetme)
function downloadFile(fileId, targetName) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const fileData = JSON.parse(body);
                if (fileData.ok) {
                    const filePath = fileData.result.file_path;
                    const dest = path.join(__dirname, targetName);
                    const file = fs.createWriteStream(dest);
                    https.get(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`, (fileRes) => {
                        fileRes.pipe(file);
                        file.on('finish', () => { file.close(); resolve(dest); });
                    }).on('error', reject);
                } else { reject('File path error'); }
            });
        }).on('error', reject);
    });
}

// Yardımcı: Dosya Gönderme (FormData manuel)
function sendFile(chatId, filePath, type = 'document') {
    return new Promise((resolve) => {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const fileName = path.basename(filePath);
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${TELEGRAM_TOKEN}/send${type.charAt(0).toUpperCase() + type.slice(1)}`,
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });

        req.write(`--${boundary}\r\n`);
        req.write(`Content-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`);
        req.write(`--${boundary}\r\n`);
        req.write(`Content-Disposition: form-data; name="${type}"; filename="${fileName}"\r\n`);
        req.write(`Content-Type: application/octet-stream\r\n\r\n`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.on('data', (chunk) => req.write(chunk));
        fileStream.on('end', () => {
            req.write(`\r\n--${boundary}--\r\n`);
            req.end();
        });
    });
}

// Gemini AI Yanıtı
async function getAIResponse(text, base64Image = null) {
    try {
        const parts = [{ text: `Sen AntiGravity Yerel Medya ve Yazılım Robotusun. 
GÖREVLERİN:
1. Sadece kullanıcı açıkça "resim yap", "çiz" veya "görsel oluştur" derse [DRAW: prompt] formatını kullan.
2. MEDYA: ffmpeg ve magick ile video/foto düzenleme.
3. YAZILIM: EXE için PyInstaller, APK için GitHub Push kullan. APK süreci GitHub'da 10-15 dakika sürer.
4. Gereksiz yere [DRAW] komutu kullanma.

Kullanıcı mesajı: ${text}` }];
        if (base64Image) { parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Image } }); }
        
        const response = await request(GEMINI_URL, { contents: [{ parts: parts }] });
        return response.candidates[0].content.parts[0].text;
    } catch (e) { return 'Oyun alanımda bir sorun var kaptan!'; }
}

async function poll() {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
        https.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    if (data.ok && data.result) {
                        for (const update of data.result) {
                            lastUpdateId = update.update_id;
                            const msg = update.message;
                            if (msg) {
                                const chatId = msg.chat.id;
                                let text = msg.text || msg.caption || "Dosyayı aldım.";
                                let mediaPath = null;
                                let base64Image = null;

                                // Medya yakalama
                                if (msg.photo) {
                                    mediaPath = await downloadFile(msg.photo[msg.photo.length-1].file_id, 'input.jpg');
                                    base64Image = fs.readFileSync(mediaPath).toString('base64');
                                } else if (msg.video) {
                                    mediaPath = await downloadFile(msg.video.file_id, 'input.mp4');
                                }

                                let history = [{ role: 'user', content: text }];
                                let aiReply = await getAIResponse(text, base64Image);
                                
                                const execMatch = aiReply.match(/\[EXEC:\s*([^\]]+)\]/);
                                if (execMatch) {
                                    const cmd = execMatch[1];
                                    const result = await executeCommand(cmd);
                                    
                                    // Çıktı dosyasını bulmaya çalış
                                    const outputMatch = cmd.match(/(\w+\.(mp4|jpg|png|gif|avi|mkv|mp3))/g);
                                    let sentFile = false;
                                    if (outputMatch && outputMatch.length > 1) {
                                        const outPath = path.join(__dirname, outputMatch[outputMatch.length-1]);
                                        if (fs.existsSync(outPath)) {
                                            await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: chatId, text: `İşlem tamamlandı! Sonucu gönderiyorum: ${result}` });
                                            await sendFile(chatId, outPath);
                                            sentFile = true;
                                        }
                                    }
                                    if (!sentFile) {
                                        await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: chatId, text: `Komut çalıştırıldı: ${result}` });
                                    }
                                } else {
                                    await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: chatId, text: aiReply });
                                }
                            }
                        }
                    }
                    setTimeout(poll, 100);
                } catch (e) { setTimeout(poll, 1000); }
            });
        }).on('error', () => setTimeout(poll, 1000));
    } catch (e) { setTimeout(poll, 1000); }
}

poll();
console.log('--- Medya Robotu Aktif (FFMPEG + Gemini) ---');
