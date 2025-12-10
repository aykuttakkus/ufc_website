# 🚀 UFC Website Deployment Rehberi

Bu doküman, UFC website projenizi bir domain üzerine deploy etmek için kullanabileceğiniz yöntemleri ve adım adım talimatları içerir.

## 📋 Proje Yapısı

- **Frontend**: React + Vite (Port: 5173)
- **Backend**: Express.js + TypeScript (Port: 5000)
- **Database**: MongoDB (MongoDB Atlas veya self-hosted)
- **Build Tool**: Vite

---

## 🎯 Deployment Seçenekleri

### 1. **Vercel (Önerilen - Frontend için)**

**Artıları:**
- ✅ Frontend için mükemmel, ücretsiz plan
- ✅ Otomatik CI/CD (GitHub entegrasyonu)
- ✅ CDN desteği
- ✅ Kolay domain bağlama
- ✅ SSL sertifikası otomatik

**Eksileri:**
- ❌ Backend için serverless functions gerekir (Express'i adapte etmek gerekebilir)
- ❌ MongoDB bağlantısı için environment variables gerekir

**Adımlar:**
1. Vercel hesabı oluştur (vercel.com)
2. GitHub repo'yu bağla
3. Root directory: `client`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variables ekle:
   - `VITE_API_URL=https://your-backend-domain.com/api`

**Maliyet:** Ücretsiz plan yeterli (küçük-orta projeler için)

---

### 2. **Railway (Önerilen - Full-Stack için)**

**Artıları:**
- ✅ Frontend ve backend'i aynı platformda deploy edebilirsin
- ✅ MongoDB Atlas entegrasyonu kolay
- ✅ Otomatik CI/CD
- ✅ Ücretsiz plan mevcut ($5 kredi/ay)
- ✅ Kolay domain bağlama

**Eksileri:**
- ❌ Ücretsiz plan sınırlı (aylık kullanım limiti)

**Adımlar:**
1. Railway hesabı oluştur (railway.app)
2. GitHub repo'yu bağla
3. İki servis oluştur:
   - **Frontend Service:**
     - Root: `client`
     - Build: `npm run build`
     - Start: `npm run preview` veya static file serve
   - **Backend Service:**
     - Root: `server`
     - Build: `npm run build`
     - Start: `npm start`
     - Environment variables:
       - `PORT=5000`
       - `MONGODB_URI=your-mongodb-atlas-uri`
       - `CLIENT_URL=https://your-frontend-domain.com`
4. Her servise domain bağla

**Maliyet:** $5/ay kredi (ücretsiz plan) veya $20/ay (hobby plan)

---

### 3. **Render (Full-Stack için)**

**Artıları:**
- ✅ Frontend ve backend desteği
- ✅ Ücretsiz plan (sınırlı)
- ✅ Otomatik SSL
- ✅ MongoDB Atlas entegrasyonu

**Eksileri:**
- ❌ Ücretsiz plan yavaş (spin-down özelliği)
- ❌ İlk istek yavaş olabilir

**Adımlar:**
1. Render hesabı oluştur (render.com)
2. GitHub repo'yu bağla
3. İki servis oluştur:
   - **Static Site (Frontend):**
     - Build command: `cd client && npm install && npm run build`
     - Publish directory: `client/dist`
   - **Web Service (Backend):**
     - Build command: `cd server && npm install && npm run build`
     - Start command: `cd server && npm start`
     - Environment variables ekle

**Maliyet:** Ücretsiz (sınırlı) veya $7/ay (starter plan)

---

### 4. **Netlify (Frontend) + Heroku/Railway (Backend)**

**Artıları:**
- ✅ Netlify frontend için mükemmel
- ✅ Kolay domain yönetimi
- ✅ Ücretsiz plan

**Eksileri:**
- ❌ İki platform yönetmek gerekir
- ❌ Heroku artık ücretsiz plan sunmuyor

**Adımlar:**
1. **Netlify (Frontend):**
   - Netlify hesabı oluştur
   - GitHub repo'yu bağla
   - Build settings:
     - Base directory: `client`
     - Build command: `npm run build`
     - Publish directory: `client/dist`
   - Environment variables: `VITE_API_URL`

2. **Railway/Heroku (Backend):**
   - Backend'i deploy et (yukarıdaki adımlar gibi)

**Maliyet:** Netlify ücretsiz, Backend için $5-20/ay

---

### 5. **DigitalOcean App Platform**

**Artıları:**
- ✅ Full-stack desteği
- ✅ Kolay scaling
- ✅ İyi performans
- ✅ MongoDB Atlas entegrasyonu

**Eksileri:**
- ❌ Ücretsiz plan yok
- ❌ Biraz daha pahalı

**Adımlar:**
1. DigitalOcean hesabı oluştur
2. App Platform'a git
3. GitHub repo'yu bağla
4. İki component ekle:
   - Frontend (Static Site)
   - Backend (Web Service)
5. Environment variables ekle

**Maliyet:** ~$12/ay (en düşük plan)

---

### 6. **VPS (DigitalOcean Droplet, Linode, vs.) - Manuel Setup**

**Artıları:**
- ✅ Tam kontrol
- ✅ Daha ucuz (uzun vadede)
- ✅ Özelleştirme imkanı

**Eksileri:**
- ❌ Manuel kurulum gerekir
- ❌ Server yönetimi bilgisi gerekir
- ❌ SSL sertifikası manuel (Let's Encrypt ile ücretsiz)

**Adımlar:**
1. VPS satın al (DigitalOcean, Linode, vs.)
2. Ubuntu/Debian kurulumu
3. Node.js, PM2, Nginx kurulumu
4. MongoDB Atlas kullan veya self-hosted MongoDB
5. Frontend build et ve Nginx'e serve et
6. Backend'i PM2 ile çalıştır
7. Nginx reverse proxy kurulumu
8. Let's Encrypt SSL sertifikası

**Maliyet:** $5-10/ay (VPS) + MongoDB Atlas ücretsiz plan

---

## 🔧 Deployment Öncesi Yapılması Gerekenler

### 1. Environment Variables Hazırlığı

**Backend (.env):**
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ufc_fighters
CLIENT_URL=https://your-frontend-domain.com
JWT_SECRET=your-super-secret-jwt-key
```

**Frontend (.env):**
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### 2. API Base URL Güncellemesi

`client/src/api/http.ts` dosyasını güncelle:
```typescript
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://your-backend-domain.com/api",
});
```

### 3. CORS Ayarları

Backend'de CORS'u production URL'lerine göre güncelle:
```typescript
app.use(cors({
  origin: process.env.CLIENT_URL || "https://your-frontend-domain.com",
  credentials: true
}));
```

### 4. MongoDB Atlas Kurulumu

1. MongoDB Atlas hesabı oluştur (ücretsiz)
2. Cluster oluştur
3. Database user oluştur
4. Network Access'te IP whitelist ekle (0.0.0.0/0 - tüm IP'lere izin)
5. Connection string'i al ve `.env`'e ekle

### 5. Build Test

Deployment öncesi local'de build test et:
```bash
# Backend
cd server
npm run build
npm start

# Frontend
cd client
npm run build
npm run preview
```

---

## 📝 Önerilen Deployment Stratejisi

### **Küçük-Orta Projeler için:**
**Railway** (Full-stack) veya **Vercel (Frontend) + Railway (Backend)**

### **Büyük Projeler için:**
**DigitalOcean App Platform** veya **VPS (Manuel Setup)**

### **En Hızlı Başlangıç:**
**Railway** - Her iki servisi de tek platformda deploy edebilirsin

---

## 🌐 Domain Bağlama

### 1. Domain Satın Al
- Namecheap, GoDaddy, Cloudflare, vs.

### 2. DNS Ayarları
- **Frontend için:** A record veya CNAME
- **Backend için:** A record veya CNAME (subdomain: api.yourdomain.com)

### 3. Platform'da Domain Ekle
- Her platform'un kendi domain yönetim paneli var
- SSL sertifikası genelde otomatik verilir

---

## 🔒 Güvenlik Kontrol Listesi

- [ ] Environment variables production'da set edildi
- [ ] CORS sadece frontend domain'ine izin veriyor
- [ ] JWT_SECRET güçlü ve unique
- [ ] MongoDB Atlas IP whitelist doğru
- [ ] Rate limiting aktif
- [ ] HTTPS aktif (SSL sertifikası)
- [ ] API keys ve secrets environment variables'da

---

## 🐛 Yaygın Sorunlar ve Çözümler

### 1. CORS Hatası
**Sorun:** Frontend'den backend'e istek atarken CORS hatası
**Çözüm:** Backend'de CORS ayarlarını kontrol et, CLIENT_URL doğru mu?

### 2. API 404 Hatası
**Sorun:** API endpoint'leri bulunamıyor
**Çözüm:** Base URL'i kontrol et, environment variable doğru mu?

### 3. MongoDB Bağlantı Hatası
**Sorun:** Database'e bağlanamıyor
**Çözüm:** MongoDB Atlas IP whitelist, connection string, credentials kontrol et

### 4. Build Hatası
**Sorun:** Production build başarısız
**Çözüm:** Local'de build test et, dependency'leri kontrol et

---

## 📚 Ek Kaynaklar

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)

---

## 💡 Sonuç

Projeniz için **Railway** veya **Vercel + Railway** kombinasyonu en pratik çözüm. Hızlı kurulum, otomatik SSL, ve kolay domain yönetimi sunuyorlar.

Sorularınız için GitHub Issues açabilir veya dokümantasyonu inceleyebilirsiniz.

