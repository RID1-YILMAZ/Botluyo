# 🤖 Topluyo Bot Geliştirici - Blok Kodlama

Kod yazmadan [Topluyo](https://topluyo.com) botu tasarlamanı sağlayan, tek dosyalık (`index.html`) bir blok kodlama aracı. Blokları ekle, ayarlarını doldur, sağ tarafta oluşan Node.js kodunu kopyala ya da hazır proje olarak indir.

> Bot kodu [`topluyo-bot`](https://github.com/topluyo/TopluyoBOTJS) kütüphanesiyle çalışır.

## ✨ Özellikler

- 🧱 Blok tabanlı tasarım: mesaj, mention, form, Turbo ve grup olayları
- 📱 Mobil uyumlu: bloğa dokunarak ekle (masaüstünde sürükle-bırak da çalışır)
- 🔀 Blokları ▲▼ ile sırala, ⧉ ile kopyala, × ile sil
- 🪆 Dinleme bloğundan sonraki bloklar otomatik olarak o dinlemenin içine yazılır
- ⚠️ Uyarı paneli: eksik ya da hatalı blokları kod çalışmadan gösterir
- 💾 Otomatik kayıt (tarayıcıda), ayrıca proje `.json` olarak kaydedilip geri açılabilir
- 📋 Tek dokunuşla kodu kopyalama
- 📦 Tek tıkla hazır proje ZIP'i (`index.js`, `package.json`, `.token.json`, `.gitignore`, `README.md`)

## 🚀 Kullanım

1. `index.html` dosyasını tarayıcıda aç. Kurulum gerekmez, internet bağlantısı da gerekmez.
2. Soldan blok ekle ve alanlarını doldur.
3. Sağdaki **Kod Önizleme**'yi kontrol et. Uyarı varsa düzelt.
4. **📥 Dışa Aktar** ile ZIP indir ya da **📋 Kodu Kopyala** ile kodu al.

### Dışa aktarılan projeyi çalıştırma

```bash
unzip topluyo-bot-project.zip -d topluyo-bot
cd topluyo-bot
npm install
npm start
```

`.token.json` içine bot tokenini tırnak içinde yaz:

```json
"BURAYA_TOKENINIZI_YAZIN"
```

İstersen **Tokenli İndir** seçeneğiyle token'ı indirmeden önce girebilirsin. Token yalnızca ZIP'in içindeki `.token.json` dosyasına yazılır, hiçbir yere gönderilmez.

## 🧩 Bloklar

Bir **dinleme bloğu** (📨 📋 🔔 💸 ➕ ➖) yeni bir `if` açar. Ondan sonra gelen bloklar, bir sonraki dinleme bloğuna kadar bu `if`'in içinde çalışır.

| Blok | Ne yapar |
|---|---|
| 📨 Mesaj Dinle | Mesaj geldiğinde çalışır. İstersen tam eşleşecek metin ve kanal ID'si belirtirsin. |
| 🔔 Mention Dinle | Bot etiketlendiğinde çalışır. İstersen mesajda geçmesi gereken metni yazarsın. |
| 📋 Form Gönderimi Dinle | Form gönderildiğinde, girilen alan adının değerini bir değişkene alır. |
| 💸 Turbo Transferi Dinle | Turbo transferi alındığında çalışır. İstersen minimum miktar belirtirsin. |
| ➕ / ➖ Grup Olayları | Gruba katılma ve ayrılma olaylarında çalışır. İstersen grup ID'si verirsin. |
| 📤 Mesaj Gönder | Belirtilen kanala mesaj gönderir. Varsayılan kanal `data.channel_id`'dir. |
| 💰 Turbo Gönder | Kullanıcıya Turbo gönderir. Varsayılan kullanıcı `data.user_id`'dir. |
| ❓ Eğer Koşulu | JavaScript koşuluyla yeni bir `if` açar. |
| 📝 Değişken Tanımla | `const` ile değişken tanımlar. |
| ⏱️ Bekle | Belirtilen milisaniye kadar bekler. |
| 🖨️ Konsola Yaz | Konsola metin yazar. |

### Değer yazma kuralları

"Kanal ID", "Kullanıcı ID" ve "Değer" alanlarında:

- `data.channel_id`, `data.user_id` gibi `data.` ile başlayan ifadeler, sayılar, `true`/`false`/`null` ve tanımladığın değişken adları **olduğu gibi** koda yazılır.
- Diğer her şey **metin** olarak (tırnak içinde) yazılır.

"Eğer Koşulu" alanı ise doğrudan JavaScript'tir, yazdığın gibi koda girer.

## 🧪 Örnek: "!merhaba" botu

1. 📨 **Mesaj Dinle** → Mesaj içeriği: `!merhaba`
2. 📤 **Mesaj Gönder** → Mesaj: `Merhaba! 👋` (kanal alanı varsayılan kalır)

Oluşan kod (kısaltılmış):

```js
bot.on('message', async (data) => {
  try {
    if (data.action === 'post/add' && data.message === "!merhaba") {
      await bot.post('/!api/post/add', {
        channel_id: data.channel_id,
        text: "Merhaba! 👋"
      });
    }
  } catch (err) {
    console.error('Blok hatası:', err);
  }
});
```

## 🔒 Güvenlik

- Bot token'ını **asla** GitHub'a yükleme. ZIP'teki `.gitignore` `.token.json`'ı zaten dışarıda bırakır, ama kendi reponda da aynısını kontrol et.
- Token yanlışlıkla paylaşıldıysa Topluyo panelinden yenile.

## ⚠️ Bilinen Sınırlamalar

- Blok ve olay adları (`post/add`, `post/mention`, `post/bumote`, `turbo/transfer`, `group/join`, `group/leave`) ile API alanları (`text`, `quantity` vb.) `topluyo-bot` kütüphanesinin güncel sürümüyle uyuşmayabilir. Bir olay çalışmıyorsa kütüphane dokümanından adını kontrol edip `index.html` içindeki `eventInfo` fonksiyonunda düzelt.
- Bir dinleme bloğunun ya da koşulun içinde tanımlanan değişken, o bloğun dışında kullanılamaz (JavaScript blok kapsamı).
- Tarayıcıda bot çalıştırılamaz. Test için projeyi indirip Node.js ile çalıştırman gerekir.
- Otomatik kayıt yalnızca o tarayıcıda geçerlidir. Başka cihaza taşımak için **💾 Kaydet** ile `.json` indir, orada **📂 Aç** ile yükle.

## 🌐 GitHub Pages ile yayınlama

Repo ayarlarından **Settings → Pages** bölümünde dalı seçersen `index.html` doğrudan bir web sayfası olarak açılır, mobilde de kullanabilirsin.

## 📁 Dosya yapısı

```
.
├── index.html   # Aracın tamamı (HTML + CSS + JS)
└── README.md
```
