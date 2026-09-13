# 💰 SplitKaro Pro - Expense Tracker

Next.js 15+ (App Router), shadcn/ui (Tailwind CSS v4) और Supabase पर आधारित एक मॉडर्न और प्रीमियम Expense Sharing एप्लीकेशन।

## ✨ Features
- **Premium UI:** shadcn/ui कंपोनेंट्स (`Base UI` + `Nova` थीम) से निर्मित।
- **Supabase Backend:** Users, Categories, और Groups का डेटाबेस के साथ रियल-टाइम कनेक्शन।
- **Smart Form:** बिना किसी स्टेट एरर के खर्चे सीधे `expense_log` टेबल में इंसर्ट होते हैं।

---

## 🚀 Quick Start (कैसे रन करें?)

### 1. क्लिन करें और पैकेजेस इनस्टॉल करें
```bash
git clone https://github.com
cd splitexpense
npm install
```

### 2. shadcn/ui कंपोनेंट्स जोड़ें
```bash
npx shadcn@latest init
npx shadcn@latest add button input select textarea
```

### 3. Environment Variables (.env)
अपने रूट फोल्डर में `.env` फाइल बनाएं और अपनी Supabase की डिटेल्स डालें:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. प्रोजेक्ट स्टार्ट करें
```bash
npm run dev
```
अब ब्राउज़र में `http://localhost:3000` ओपन करें।

---

## 🗄️ Database Architecture (6-Tables)
यह ऐप नीचे दी गई टेबल्स के रिलेशनल स्कीमा पर काम करती है:
1. `users_role` - सिस्टम रोल्स
2. `users` - यूज़र्स प्रोफाइल्स
3. `expense_category` - खर्चों की कैटेगरीज
4. `split_group` - ग्रुप्स (उदा: गोवा ट्रिप 🌴)
5. `group_members` - ग्रुप के मेंबर्स और उनके Sharing %
6. `expense_log` - खर्चों का मुख्य लेजर (Main Ledger)

---

## 📄 License
This project is open-source and available under the MIT License.
