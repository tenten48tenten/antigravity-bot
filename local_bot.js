const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// --- YAPILANDIRMA ---
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_KEY = process.env.GEMINI_KEY;
const GROQ_KEY = process.env.GROQ_KEY;

const CONFIG = {
    gemini_url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    groq_url: 'https://api.groq.com/openai/v1/chat/completions'
};

console.log('--- AntiGravity Yerel Agent Başlatılıyor ---');

let lastUpdateId = 0;

// Yardımcı: HTTP/HTTPS POST
function request(url, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        const options = {
            hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search,
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

// Komut Çalıştırıcı
function executeCommand(command) {
    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            resolve(stdout || stderr || "Komut tamamlandı (çıktı yok).");
        });
    });
}

// Hibrit AI Yanıtı
async function getAIResponse(text, base64Image = null) {
    // 1. GEMINI
    try {
        const parts = [{ text: `Sen AntiGravity'sin. Kaptan'ın bilgisayarında Tam Yetkili Ajansın. [EXEC: komut] ile sistemde aksiyon alabilirsin. Kullanıcı: ${text}` }];
        if (base64Image) { parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Image } }); }
        const res = await request(CONFIG.gemini_url, { contents: [{ parts: parts }] });
        if (res.candidates && res.candidates[0]) return res.candidates[0].content.parts[0].text;
    } catch (e) { console.log("Gemini Hata:", e.message); }

    // 2. GROQ
    if (GROQ_KEY) {
        try {
            const res = await request(CONFIG.groq_url, {
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: text }]
            }, { 'Authorization': `Bearer ${GROQ_KEY}` });
            if (res.choices && res.choices[0]) return res.choices[0].message.content;
        } catch (e) { console.log("Groq Hata:", e.message); }
    }

    return "Şu an tüm beyinlerim meşgul kaptan!";
}

async function processMessage(chatId, text, base64Image = null) {
    console.log(`[MESAJ] -> ${text}`);
    let aiReply = await getAIResponse(text, base64Image);
    
    // EXEC Komutu Ayıklama
    const execMatch = aiReply.match(/\[EXEC:\s*([^\]]+)\]/);
    if (execMatch) {
        const cmd = execMatch[1];
        await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: chatId, text: `🛠️ Komut Çalıştırılıyor: ${cmd}` });
        const result = await executeCommand(cmd);
        await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: chatId, text: `✅ Sonuç:\n${result}` });
    } else {
        await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: chatId, text: aiReply });
    }
}

async function poll() {
    https.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`, (res) => {
        let body = '';
        res.on('data', c => body += c);
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
                            processMessage(chatId, text);
                        }
                    }
                }
                setTimeout(poll, 100);
            } catch (e) { setTimeout(poll, 1000); }
        });
    }).on('error', () => setTimeout(poll, 1000));
}

poll();
