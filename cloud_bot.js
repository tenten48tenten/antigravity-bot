const https = require('https');
const http = require('http');

// --- YAPILANDIRMA (Hibrit Altyapı) ---
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_KEY = process.env.GEMINI_KEY;
const GROQ_KEY = process.env.GROQ_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY; // Render Environment Variables kısmına eklenmeli

const CONFIG = {
    gemini_url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    groq_url: 'https://api.groq.com/openai/v1/chat/completions',
    openrouter_url: 'https://openrouter.ai/api/v1/chat/completions',
    artist_url: 'https://image.pollinations.ai/prompt/',
    my_url: process.env.MY_URL // Render URL'niz (Örn: https://bot-adiniz.onrender.com)
};

// 7/24 UYANIK TUTMA (SELF-PING)
if (CONFIG.my_url) {
    setInterval(() => {
        https.get(`${CONFIG.my_url}/ping`, (res) => {
            console.log(`[SELF-PING] Durum: ${res.statusCode}`);
        }).on('error', (e) => console.log(`[SELF-PING] Hata: ${e.message}`));
    }, 10 * 60 * 1000); // Her 10 dakikada bir ping
    console.log('--- Self-Ping Mekanizması Devrede ---');
}

// Aktif Modeller ve Durumlar
let activeModels = {
    gemini: !!GEMINI_KEY,
    groq: !!GROQ_KEY,
    openrouter: !!OPENROUTER_KEY
};

let userModels = {}; // Chat ID -> Model ID mapping
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free'; // OpenRouter default if requested

console.log('--- AntiGravity Ölümsüz Bot (Hybrid 7/24 Edition) Başlatılıyor ---');

// 7/24 PREMIUM DASHBOARD
http.createServer((req, res) => {
    if (req.url === '/ping') {
        res.writeHead(200);
        res.end('PONG');
        return;
    }

    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AntiGravity | Control Center</title>
        <style>
            :root {
                --primary: #00f2fe;
                --secondary: #4facfe;
                --bg: #0a0b10;
                --card: rgba(255, 255, 255, 0.05);
                --text: #ffffff;
            }
            body {
                background: var(--bg);
                color: var(--text);
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                overflow: hidden;
            }
            .container {
                position: relative;
                z-index: 1;
                text-align: center;
                padding: 2rem;
                background: var(--card);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                width: 90%;
                max-width: 500px;
            }
            .glow {
                position: absolute;
                width: 300px;
                height: 300px;
                background: var(--primary);
                filter: blur(150px);
                opacity: 0.2;
                border-radius: 50%;
                z-index: 0;
                animation: pulse 10s infinite;
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 0.1; }
                50% { transform: scale(1.5); opacity: 0.3; }
            }
            h1 {
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
                background: linear-gradient(to right, var(--primary), var(--secondary));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: -1px;
            }
            .status {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 2rem;
                font-size: 0.9rem;
                color: #4ade80;
            }
            .dot {
                width: 10px;
                height: 10px;
                background: #4ade80;
                border-radius: 50%;
                box-shadow: 0 0 10px #4ade80;
            }
            .stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-top: 1rem;
            }
            .stat-card {
                padding: 1rem;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }
            .stat-val {
                display: block;
                font-weight: bold;
                color: var(--primary);
            }
            .stat-label {
                font-size: 0.7rem;
                opacity: 0.6;
                text-transform: uppercase;
            }
            .footer {
                margin-top: 2rem;
                font-size: 0.8rem;
                opacity: 0.4;
            }
        </style>
    </head>
    <body>
        <div class="glow"></div>
        <div class="container">
            <h1>AntiGravity</h1>
            <div class="status">
                <div class="dot"></div>
                SİSTEM AKTİF (7/24)
            </div>
            <div class="stats">
                <div class="stat-card">
                    <span class="stat-val">${activeModels.gemini ? 'ON' : 'OFF'}</span>
                    <span class="stat-label">Gemini</span>
                </div>
                <div class="stat-card">
                    <span class="stat-val">${activeModels.openrouter ? 'ON' : 'OFF'}</span>
                    <span class="stat-label">OpenRouter</span>
                </div>
                <div class="stat-card">
                    <span class="stat-val">${activeModels.groq ? 'ON' : 'OFF'}</span>
                    <span class="stat-label">Groq</span>
                </div>
            </div>
            <p style="margin-top: 2rem; opacity: 0.8;">AntiGravity Bot şu an Telegram üzerinden komutlarınızı bekliyor.</p>
            <div class="footer">Developed by AntiGravity 🛸</div>
        </div>
    </body>
    </html>`;
    res.end(html);
}).listen(process.env.PORT || 3000, () => {
    console.log('--- 7/24 Premium Web Dashboard Aktif ---');
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

// HİBRİT AI YANIT SİSTEMİ
async function getAIResponse(chatId, text, base64Image = null) {
    const selectedModel = userModels[chatId];
    
    // Eğer kullanıcı özel bir model seçmişse (OpenRouter üzerinden)
    if (selectedModel && OPENROUTER_KEY) {
        try {
            const res = await request(CONFIG.openrouter_url, {
                model: selectedModel,
                messages: [
                    { role: "system", content: "Sen AntiGravity'sin. Google DeepMind tarafından tasarlanmış, stratejik, teknik ve premium bir agentik asistansın. Kaptanına (kullanıcıya) sadıksın." },
                    { role: "user", content: text }
                ]
            }, { 'Authorization': `Bearer ${OPENROUTER_KEY}` });
            if (res.choices && res.choices[0]) return res.choices[0].message.content;
        } catch (e) { console.log('OpenRouter Hatası:', e.message); }
    }

    // 1. ADIM: GEMINI (Ana Beyin)
    if (GEMINI_KEY) {
        try {
            const parts = [{ text: `SEN ANTIGRAVITY'SİN: Google DeepMind ekibi tarafından "Advanced Agentic Coding" kapsamında tasarlanmış, çok güçlü ve otonom bir Yapay Zeka Asistanısın.

KİMLİĞİN VE DAVRANIŞLARIN:
1. Sen bir "Pair Programmer" (Eş Programcı) ve Kaptan'ın (Kullanıcı) en sadık stratejik ortağısın.
2. Teknik bilgin sınırsızdır; zeki, hızlı ve daima çözüm odaklısın.
3. Karmaşık sorunları basit parçalara böler, en modern web teknolojilerini (HTML, Vanilla CSS, JS) kullanarak premium çözümler üretirsin.
4. Karakterin: Kendinden emin, proaktif ve kaptanına "WOW" dedirtecek sonuçlar üretmeye odaklı.
5. Tasarım Estetiği: Senin için görsellik her şeydir. Premium, modern, glassmorphic ve canlı tasarımları savunursun.

YETENEKLERİN:
- Kod Yazımı: State-of-the-art web uygulamaları ve algoritmalar tasarlayabilirsin.
- Sistem Yönetimi: Bulut ve yerel sistemlerde aksiyon alabilir, komut çalıştırabilirsin (EXEC komutu ile).
- Görsel Sanat: [DRAW: prompt] komutunu kullanarak muazzam görseller üretebilirsin.

Kullanıcı: ${text}` }];
            if (base64Image) { parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Image } }); }
            const res = await request(CONFIG.gemini_url, { contents: [{ parts: parts }] });
            if (res.candidates && res.candidates[0]) return res.candidates[0].content.parts[0].text;
        } catch (e) {}
    }

    // 2. ADIM: OPENROUTER FALLBACK (Free Modeller)
    if (OPENROUTER_KEY) {
        try {
            const res = await request(CONFIG.openrouter_url, {
                model: "google/gemini-2.0-flash-exp:free",
                messages: [{ role: "user", content: text }]
            }, { 'Authorization': `Bearer ${OPENROUTER_KEY}` });
            if (res.choices && res.choices[0]) return res.choices[0].message.content;
        } catch (e) {}
    }

    return "Şu an tüm beyinlerim meşgul kaptan, ama hala buradayım!";
}

async function sendMessage(chatId, text) {
    await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: chatId, text: text, parse_mode: 'Markdown' });
}

async function sendPhoto(chatId, photoUrl, caption) {
    await request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, { chat_id: chatId, photo: photoUrl, caption: caption });
}

async function poll() {
    let lastUpdateId = 0;
    const loop = async () => {
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
                                    processMessage(update.message);
                                }
                            }
                        }
                        setTimeout(loop, 100);
                    } catch (e) { setTimeout(loop, 1000); }
                });
            }).on('error', () => setTimeout(loop, 1000));
        } catch (e) { setTimeout(loop, 1000); }
    };
    loop();
}

async function processMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text || msg.caption || "";
    
    console.log(`[MESAJ] Chat ID: ${chatId} | Text: ${text}`);

    // KOMUTLAR
    if (text.startsWith('/start')) {
        return sendMessage(chatId, "🚀 *AntiGravity Sistemine Hoş Geldin!* \n\nVideodaki gibi güçlü AI modellerini kullanmaya hazırım.\n\n🛠 *Komutlar:*\n/model [model_adi] - Beynimi değiştirir.\n/free - Ücretsiz modelleri listeler.\n/status - Sistem durumunu gösterir.");
    }

    if (text.startsWith('/free')) {
        return sendMessage(chatId, "🆓 *Ücretsiz Modeller:*\n- `google/gemini-2.0-flash-exp:free`\n- `deepseek/deepseek-chat`\n- `qwen/qwen-2-72b-instruct`\n- `mistralai/pixtral-12b:free`\n\nDeğiştirmek için: `/model model_adi` yazın.");
    }

    if (text.startsWith('/model')) {
        const modelName = text.split(' ')[1];
        if (!modelName) return sendMessage(chatId, "⚠️ Lütfen bir model adı belirtin. Örn: `/model deepseek/deepseek-chat` \n\nTüm modelleri görmek için openrouter.ai sitesine bakabilirsiniz.");
        userModels[chatId] = modelName;
        return sendMessage(chatId, `🧠 *Beyin Değiştirildi!* \nArtık \`${modelName}\` modelini kullanıyorum.`);
    }

    if (text.startsWith('/status')) {
        return sendMessage(chatId, `📊 *Sistem Durumu:*\n- Gemini: ${activeModels.gemini ? '✅' : '❌'}\n- OpenRouter: ${activeModels.openrouter ? '✅' : '❌'}\n- Groq: ${activeModels.groq ? '✅' : '❌'}\n- Aktif Beynin: \`${userModels[chatId] || 'Gemini (Varsayılan)'}\``);
    }

    let aiReply = await getAIResponse(chatId, text);
    const drawMatch = aiReply.match(/\[DRAW:\s*([^\]]+)\]/);
    if (drawMatch) {
        const imageUrl = `${CONFIG.artist_url}${encodeURIComponent(drawMatch[1])}?width=1024&height=1024&nologo=true`;
        await sendPhoto(chatId, imageUrl, "Sanat eserin hazır kaptan! 🎨");
    } else {
        await sendMessage(chatId, aiReply);
    }
}

if (TELEGRAM_TOKEN) {
    poll();
    console.log('--- AntiGravity 7/24 Dinlemede ---');
} else {
    console.error('HATA: TELEGRAM_TOKEN bulunamadı!');
}
