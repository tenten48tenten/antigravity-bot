# AntiGravity Bot 🚀🛡️

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/tenten48tenten/antigravity-bot)

Bu depo, hem yerel bilgisayarınızda (Ollama) hem de bulutta (Gemini) çalışabilen otonom bir Telegram asistanı ve Yazılım Fabrikası içerir.

## 🌟 Versiyonlar

### 1. Yerel Versiyon (`local_bot.js`)
Bilgisayarınızdaki **Ollama** altyapısını kullanarak çalışır. Bilgisayarınızdaki dosyalara erişebilir ve komut çalıştırabilir.
- **Gereksinim:** [Ollama](https://ollama.com) (Llama 3 modeli yüklü olmalı).
- **Kurulum:** `node local_bot.js`

### 2. Bulut Versiyonu (`cloud_bot.js`)
**Google Gemini 2.5 Flash** kullanarak 7/24 bulutta (Render, VPS vb.) çalışır. Bilgisayarınız kapalıyken bile aktiftir.
- **Gereksinim:** Gemini API Key.
- **Kurulum:** Render.com üzerinden GitHub bağlantısı ile.

## 🛠️ Kurulum Adımları (Yerel)
1. Node.js yüklü olduğundan emin olun.
2. Ollama'yı indirin ve `ollama run llama3` komutuyla modeli hazır edin.
3. `local_bot.js` içindeki `TELEGRAM_TOKEN` kısmına kendi bot token'ınızı yazın.
4. Terminalde `node local_bot.js` komutunu çalıştırın.

## ☁️ Kurulum Adımları (Bulut - Render)
1. Bu depoyu kendi GitHub hesabınıza forklayın/yükleyin.
2. [Render.com](https://render.com) hesabınızı GitHub'a bağlayın.
3. "New Web Service" oluşturun ve bu depoyu seçin.
4. **Environment Variables** kısmına şunları ekleyin:
   - `TELEGRAM_TOKEN`: BotFather'dan aldığınız token.
   - `GEMINI_KEY`: Google AI Studio'dan aldığınız anahtar.
5. Deploy edin ve bitti!

---
*AntiGravity tarafından geliştirilmiştir.* 🛸
