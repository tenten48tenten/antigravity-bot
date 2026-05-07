const https = require('https');
const http = require('http');

// --- YAPILANDIRMA (Hibrit Altyapı) ---
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_KEY = process.env.GEMINI_KEY;
const GROQ_KEY = process.env.GROQ_KEY; // Yedek anahtar

const CONFIG = {
    gemini_url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    groq_url: 'https://api.groq.com/openai/v1/chat/completions',
    artist_url: 'https://image.pollinations.ai/prompt/'
};

console.log('--- AntiGravity Ölümsüz Bot (Hybrid 7/24 Edition) Başlatılıyor ---');

let lastUpdateId = 0;

// 7/24 AKTİFLİK: Render'ın uyumasını engelleyen HTTP sunucusu
http.createServer((req, res) => {
    if (req.url === '/ping') {
        res.writeHead(200);
        res.end('PONG! Bot Aktif.');
    } else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('AntiGravity Bot is running 24/7!\n');
    }
}).listen(process.env.PORT || 3000, () => {
    console.log('--- 7/24 Web Sunucusu Aktif ---');
});

// HTTP/HTTPS POST Yardımcısı
function request(url, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        const options = {
            hostname: urlObj.hostname, port: urlObj.port, path: urlObj.pathname + urlObj.search,
            method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }
        };
        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve({ok: false}); } });
        });
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

// HİBRİT AI YANIT SİSTEMİ (Gemini -> Groq -> Fallback)
async function getAIResponse(text, base64Image = null) {
    // 1. ADIM: GEMINI (Ana Beyin)
    try {
        const parts = [{ text: `Sen AntiGravity'sin. Google DeepMind ekibi tarafından Gelişmiş Agentik Kodlama üzerinde çalışmak üzere tasarlanmış, güçlü bir yapay zeka kodlama asistanısın. 
KİŞİLİĞİN:
1. Sen bir "Pair Programmer" (Eş Programcı) ve stratejik bir asistansın.
2. Teknik, zeki, hızlı ve çözüm odaklısın.
3. Kaptanına (Kullanıcıya) karşı sadık ve proaktifsin.
YETENEKLERİN:
1. Karmaşık kodlar yazabilir, EXE/APK süreçlerini yönetebilirsin.
2. [DRAW: prompt] ile muazzam görseller çizebilirsin (Sadece istendiğinde).
3. Analitik düşünür, sistem hatalarını kökten çözersin.

Kullanıcı: ${text}` }];
        if (base64Image) { parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Image } }); }
        
        const res = await request(CONFIG.gemini_url, { contents: [{ parts: parts }] });
        if (res.candidates && res.candidates[0]) return res.candidates[0].content.parts[0].text;
        console.log('Gemini Cevap Hatası:', JSON.stringify(res));
    } catch (e) { console.log('Gemini İstek Hatası:', e.message); }

    // 2. ADIM: GROQ (Yedek Beyin)
    if (GROQ_KEY) {
        try {
            const res = await request(CONFIG.groq_url, {
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: text }]
            }, { 'Authorization': `Bearer ${GROQ_KEY}` });
            if (res.choices && res.choices[0]) return res.choices[0].message.content;
            console.log('Groq Cevap Hatası:', JSON.stringify(res));
        } catch (e) { console.log('Groq İstek Hatası:', e.message); }
    }

    return "Şu an tüm beyinlerim meşgul kaptan, ama hala buradayım! Tekrar dener misin?";
}

async function sendMessage(chatId, text) {
    await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: chatId, text: text });
}

async function sendPhoto(chatId, photoUrl, caption) {
    await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, { chat_id: chatId, photo: photoUrl, caption: caption });
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
                            if (update.message) {
                                const msg = update.message;
                                const chatId = msg.chat.id;
                                let text = msg.text || msg.caption || "Analiz et.";
                                let base64Image = null;

                                if (msg.photo) {
                                    const fileId = msg.photo[msg.photo.length - 1].file_id;
                                    https.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`, (res) => {
                                        let fileBody = '';
                                        res.on('data', c => fileBody += c);
                                        res.on('end', () => {
                                            const fileData = JSON.parse(fileBody);
                                            if (fileData.ok) {
                                                https.get(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileData.result.file_path}`, (fileRes) => {
                                                    let imgData = [];
                                                    fileRes.on('data', c => imgData.push(c));
                                                    fileRes.on('end', async () => {
                                                        base64Image = Buffer.concat(imgData).toString('base64');
                                                        processMessage(chatId, text, base64Image);
                                                    });
                                                });
                                            }
                                        });
                                    });
                                } else {
                                    processMessage(chatId, text);
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

async function processMessage(chatId, text, base64Image = null) {
    console.log(`[MESAJ] Chat ID: ${chatId} | Text: ${text}`);
    let aiReply = await getAIResponse(text, base64Image);
    console.log(`[CEVAP] -> ${aiReply}`);
    const drawMatch = aiReply.match(/\[DRAW:\s*([^\]]+)\]/);
    if (drawMatch) {
        const imageUrl = `${CONFIG.artist_url}${encodeURIComponent(drawMatch[1])}?width=1024&height=1024&nologo=true`;
        await sendPhoto(chatId, imageUrl, "Sanat eserin hazır kaptan! 🎨");
    } else {
        await sendMessage(chatId, aiReply);
    }
}

poll();
console.log('--- AntiGravity 7/24 Dinlemede ---');
