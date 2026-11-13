# Flame in Freefall — اقرأ ده الأول

**التيم:** PHARAOHS x DIGILIANS · NASA Space Apps Challenge 2026

المشروع بيشرح إزاي النار بتتصرف في انعدام الجاذبية، وإزاي حساسات السفينة بتكتشفها، وبيعتمد على 1,412 تجربة حقيقية من ناسا، من 10 برامج بحثية.

---

## 1. إزاي تشغّل المشروع (ويندوز)

**محتاج حاجة واحدة بس قبل التشغيل: Node.js**

1. نزّل **Node.js** النسخة اللي مكتوب عليها **LTS** من <https://nodejs.org> وسطّبها (Next, Next, Finish).
   - لازم تكون نسخة 20.9 أو أحدث.
   - لو مسطّب Node قبل كده، اتأكد من النسخة: افتح cmd واكتب `node -v`.
2. ادخل فولدر المشروع ودبل كليك على **`RUN-APP.bat`**.
3. **أول مرة بس:** هينزّل الباكدجات من النت. بياخد من 2 لـ 5 دقايق. **سيب الشباك الأسود مفتوح والنت شغال.**
4. المتصفح هيفتح لوحده على <http://localhost:3005>.

**مهم:** الشباك الأسود لازم يفضل مفتوح طول ما أنت شغال على المشروع. لما تقفله المشروع بيقف.

### ملف التشغيل

فيه ملف واحد: **`RUN-APP.bat`**. بيبني النسخة السريعة (حوالي دقيقة) وبعدين يشغّلها.

لو هتعدّل في الكود وعايز التعديل يظهر على طول من غير بناء، افتح cmd جوه الفولدر واكتب:

```bash
npx next dev -p 3005
```

### ماك أو لينكس

افتح Terminal جوه الفولدر واكتب:

```bash
npm install
npx next build
npx next start -p 3005
```

وافتح <http://localhost:3005>.

---

## 2. لو المشروع مفتحش

| اللي ظهر | الحل |
|---|---|
| `Node.js is not installed` | سطّب Node.js من <https://nodejs.org> وشغّل الملف تاني |
| `npm install failed` | النت قاطع أو ضعيف. اتأكد من النت وشغّل الملف تاني |
| `Packages are missing or incomplete. Reinstalling` | ده طبيعي لو التسطيب اتقطع قبل كده. سيبه يكمل لوحده |
| `'next' is not recognized` أو `Cannot find module` | امسح فولدر `node_modules` وشغّل `RUN-APP.bat` تاني |
| المتصفح مفتحش لوحده | افتح المتصفح واكتب `localhost:3005` بنفسك |
| الصفحة بتقول إن العنوان مشغول (port in use) | اقفل أي شباك أسود تاني شغال وجرب تاني |
| المجسم الـ 3D بطيء | اقفل التابات التانية في المتصفح |

لو فيه خطأ تاني، خد سكرين شوت للشباك الأسود وابعته في جروب التيم.

---

## 2.5 تشغيل Firewise AI (مفتاح Groq)

Firewise بيستخدم مفتاح Groq. **المفتاح مش موجود في المشروع عشان ميتسربش.** خده من صاحبة الحساب في رسالة خاصة.

1. جوه فولدر المشروع اعمل ملف اسمه `.env.local` (أو انسخ `.env.example` وغيّر اسمه).
2. اكتب فيه سطر واحد:
   ```
   GROQ_API_KEY=المفتاح_هنا
   ```
3. اقفل الشباك الأسود وشغّل `RUN-APP.bat` تاني.

**على Vercel:** شوف الجزء 6 تحت.

**تجربة Firewise بالمفتاح الحقيقي:** بعد ما تحط المفتاح وتشغّل `RUN-APP.bat`، افتح cmd تاني جوه الفولدر واكتب:

```bash
node scripts/test-firewise.mjs
```

بيسأل 7 أسئلة (أكسجين، كشف دخان، تهوية، إطفاء، جاذبية القمر، سؤال بالعربي، وسؤال طوارئ لازم يترفض)، وبيتأكد إن كل تجربة اتذكرت في الإجابة موجودة وصفحتها بتفتح. المفتاح عمره ما بيتطبع.

**ممنوع:** ترفع `.env.local` على GitHub أو تبعت المفتاح في جروب. ملف `.gitignore` بيمنع رفعه، بس خلي بالك.

من غير المفتاح المشروع شغال عادي، و Firewise بيرجّع التجارب المطابقة في لستة قصيرة (عنوان، نتيجة، لينك) ومكتوب عليها **Search result**. ولو Groq بطيء أو زحمة (429)، البديل بيظهر في أقل من 8 ثواني.

---

## 3. الصفحات

| الصفحة | فيها إيه |
|---|---|
| **Home** | الداشبورد التفاعلية على شاشة واحدة: مجسم الكابينة 3D، الحساسات الخمسة، وتايم لاين حريقة SAFFIRE-III الحقيقية. الزراير اللي فوق: Dashboard، Fire Response، Recommendations، Flame behaviour، **Evidence** (جواها Results و Records و Findings & gaps)، Demo & media |
| **Explore** | كل الـ 1,412 تجربة، بفلاتر وبحث. ترتيب حسب المكان (محطة، قاعدة على القمر، روفر) وزرار **Download CSV** |
| **Flame Lab** | فوق: **What the data says**، نسبة تجارب FLEX اللي انطفت جنب الموديل. وتحت: موديل اللهب (رسم توضيحي) |
| **Mission Lab** | الوجهات (الأرض، المحطة، القمر، المريخ) بنفس هوا الـ habitat اللي في Fire Response، وترتيب التجارب الأقرب لكل وجهة (موديل تقييم، مش قياس) |
| **Firewise AI** | مساعد بذكاء اصطناعي (Groq) بيجاوب من التجارب بس وبيذكر رقم كل تجربة. كل إجابة مكتوب عليها **AI answer** أو **Search result** |
| **Insights** | صفحة التفسير: 4 نتايج أساسية بأرقامها ولينكات تجاربها، رسمتين (FLEX، وحساس الدخان لكل مادة)، Cross-experiment insights، Mission-specific findings، والـ Evidence library |
| **Compare** | مقارنة البرامج العشرة، وتحتها مقارنة لحد 3 تجارب جنب بعض |
| **Team** | صفحة التيم وبروفايل كل عضو، وزرار موسيقى صغير تحت على الشمال |

**`/demo`** بيفتح Home على Demo & media على طول.

**المقدمة:** أول مرة تفتح فيها المشروع، Home بتبدأ بمشهد من شباك السفينة، وبعد حوالي 4 ثواني الكاميرا بتدخل لوحدها على الداشبورد. بتظهر مرة واحدة في كل جلسة.

**الصوت:** شغال من الأول، وبيبدأ مع أول ضغطة في الصفحة (المتصفح بيمنع الصوت قبل كده). تقفله من زرار Sound في Home، وبيفتكر اختيارك.

**الموسيقى (Team):** مش بتتحمّل خالص غير لما تدوس Play. بتبدأ واطية (15%) وبتعلى تدريجي، وأعلى صوت 60%. لو وقفتها بتفضل واقفة المرة الجاية.

**اللايت مود:** من زرار Light فوق على اليمين.

---

## 4. الداتا

- **1,412 تجربة** من **10 برامج بحثية** (نفس العشرة اللي في Compare، والرقم ده واحد في كل حتة):

  | البرنامج | التجارب | المصدر | بيدرس إيه |
  |---|---|---|---|
  | ACME | 333 | PSI-159 | لهب غازات: إمتى بيكمل وإمتى بينطفي لوحده (أكسجين 18–40%، ضغط 0.5–3.3 bar) |
  | FLEX | 274 | PSI-69 | انطفاء قطرات الوقود، والإطفاء بـ CO₂ والهيليوم |
  | CFI | 227 | PSI-39 | اللهب البارد (cool flames) لقطرات الوقود |
  | BASS-II + BASS | 185 | PSI-25 + تقارير منشورة | قابلية اشتعال المواد الصلبة في ممر هوا |
  | SAME + SAME-R | 154 | PSI-102 + PSI-101 | دخان المواد المسخّنة وحساسات الدخان |
  | SPICE | 105 | PSI-107 | نقطة الدخان (السناج) في لهب الغاز |
  | Counterflow extinction | 95 | PSI-142 | حدود الانطفاء على الأرض (1 g) كمرجع |
  | SAFFIRE (I–VI) | 22 | PSI-100 + تقارير | حرايق كبيرة في سفن شحن، فيها داتا الحساسات |
  | Cool flames | 15 | PSI-117 | نقط تجارب لهب بارد من أبحاث منشورة |
  | LUCI | 2 | ورقة منشورة (مش PSI) | جاذبية القمر المحاكاة |

- الداتا الجديدة اتدمجت بسكريبت `scripts/merge_psi.py`، وتقريره في `data/real/merge_report.json`. الجداول اللي هي جزء من جدول تاني، أو مكررة، أو ناتج موديل، ما اتضافتش كتجارب.
- جدول BASS-II (PSI-25) ممكن يكون فيه تجارب متكررة مع سجلات BASS-II اللي جاية من التقرير المنشور، لأن أرقام التجارب فيهم مختلفة ومنقدرش نطابقهم واحدة بواحدة. مكتوب ده على السجلات نفسها.
- ملف Saffire 2017 ما اتستخدمش، لأن التجربة اللي فيه مش معروفة.
- أوقات اكتشاف الحريقة في Home مقاسة من داتا SAFFIRE-III (العينة الأولى، k = 5):

  | الحساس | الوقت بعد الاشتعال |
  |---|---|
  | الكاميرا | 0.86 ث |
  | الراديوميتر | 3.06 ث |
  | ثرموكبل العينة | 4.19 ث |
  | ثرموكبل البلوم | 7.91 ث |
  | حساس CO₂ | 52.23 ث |

- كل لوحة مكتوب عليها نوعها: **قياس حقيقي**، **إعادة لتجربة متسجلة**، **ناتج موديل**، أو **رسم توضيحي**.
- **Measured و Published متعرّفين في مكان واحد** (`data/real/programMeta.js`): أي رقم جاي من جدول تجارب PSI أو من ملف حساسات SAFFIRE-III = **Measured**. الداتا المنقولة من رسومات منشورة (PSI-117 و PSI-142)، والجداول والأوراق المنشورة بس (LUCI، تقارير BASS، جداول SAFFIRE المنشورة) = **Published**. نفس التعريف في Explore و Recommendations وترتيب الـ habitat وملف الـ CSV.
- التواريخ بتظهر بشكل واحد في الواجهة (مثلاً 26 Aug 2009)، وفي الـ CSV بصيغة ISO (2009-08-26).
- شكل المجسم ومكان الحساسات فيه رسم توضيحي، لأن أماكن الحساسات مش موثقة في داتا ناسا. الأوقات نفسها حقيقية.
- مفيش داتا عن جاذبية المريخ (0.38 g) في التجارب دي.

---

## 5. الفولدر فيه إيه

| الملف أو الفولدر | إيه ده |
|---|---|
| `READ-ME-FIRST.md` | الملف ده |
| `RUN-APP.bat` | ملف التشغيل على ويندوز |
| `CLEANUP.bat` | شغّله مرة واحدة: بيفك `clean-images.zip` (صور WebP صغيرة) مكان الصور الحالية، وبيمسح الصور القديمة اللي اتبدلت، وبعدين بيمسح الـ zip |
| `app/` | الصفحات والستايل، و`app/api/firewise/` اللي بيكلم Groq (المفتاح بيتقري هنا بس) |
| `components/` | مكونات الواجهة والمجسمات الـ 3D |
| `lib/` | الحسابات والإعدادات. `lib/records/` اللستة الخفيفة للتجارب، `lib/server/` البحث بتاع Firewise (على السيرفر بس) |
| `data/real/` | الكتالوج (`catalog.json`)، والأصل القديم (`catalog_core.json`)، وتعريف Measured/Published (`programMeta.js`) |
| `data/psi/` | جداول PSI زي ما التيم سلّمها |
| `data/ingest/` | ملخصات الداتا (Evidence library) والموديل وتقرير المراجعة |
| `public/data/saffire/` | قراءات حساسات SAFFIRE-III وصور الكاميرا (WebP) |
| `public/media/` و `public/team/` و `public/brand/` | الفيديوهات والموسيقى وصور التيم واللوجو |
| `scripts/merge_psi.py` | بيدمج جداول `data/psi/` مع الكتالوج: `python3 scripts/merge_psi.py` |
| `scripts/test-firewise.mjs` | اختبار Firewise بالمفتاح الحقيقي |
| `.env.example` | مثال لملف المفتاح (فاضي) |
| `docs/CHANGES.md` | كل اللي اتغير |

`node_modules` و `.next` بيتعملوا لوحدهم أول مرة تشغّل المشروع.

---

## 6. النشر على Vercel (ببلاش، خطة Hobby)

المشروع جاهز يترفع على Vercel من غير أي تعديل. الخطة المجانية (Hobby) للاستخدام الشخصي وغير التجاري، وده مناسب لمشروع مسابقة.

### قبل ما تبدأ (مرة واحدة)
1. شغّل `CLEANUP.bat` لو لسه ما شغلتوش، عشان الملفات القديمة ما تترفعش.
2. اتأكد إن مفيش ملف `.env.local` هيترفع: `.gitignore` بيمنعه، بس لو بترفع الفولدر بإيدك (الطريقة التانية) هو مش بيترفع برضه، لأن Vercel CLI بيحترم `.gitignore`.

### الطريقة الأولى: من GitHub (الأسهل لو عندكم GitHub)
1. اعمل حساب على <https://vercel.com/signup> واختار **Continue with GitHub**.
2. ارفع فولدر المشروع على repository جديد في GitHub (من غير `node_modules` و `.next`؛ ملف `.gitignore` بيستبعدهم لوحده). أسهل طريقة: **GitHub Desktop** ← File ← Add Local Repository ← Publish repository.
3. في Vercel: **Add New… ← Project**، واختار الـ repository ودوس **Import**.
4. Vercel هيعرف لوحده إنه Next.js. **ما تغيّرش** Build Command ولا Output Directory.
5. افتح **Environment Variables** في نفس الصفحة وضيف:
   - Name: `GROQ_API_KEY`
   - Value: المفتاح
6. دوس **Deploy**. بعد دقيقة أو اتنين هيديك لينك زي `https://flame-in-freefall.vercel.app`.
7. لو نسيت المفتاح في خطوة 5: من المشروع ← **Settings ← Environment Variables** ← ضيفه، وبعدين **Deployments** ← آخر deployment ← **⋯ ← Redeploy**. المتغير الجديد ما بيشتغلش غير بعد Redeploy.

بعد كده أي تعديل ترفعه على GitHub بيتنشر لوحده.

### الطريقة التانية: من غير GitHub (Vercel CLI)
1. اعمل حساب على <https://vercel.com/signup> (بالإيميل عادي).
2. افتح cmd جوه فولدر المشروع واكتب:
   ```bash
   npx vercel
   ```
   أول مرة هيطلب منك تسجّل دخول (بيفتح المتصفح)، وبعدين يسألك كام سؤال: اضغط Enter على كل الإجابات الافتراضية.
3. ضيف المفتاح:
   ```bash
   npx vercel env add GROQ_API_KEY production
   ```
   والصق المفتاح لما يطلبه.
4. انشر النسخة النهائية:
   ```bash
   npx vercel --prod
   ```
   اللينك اللي بيطلع في الآخر هو لينك المشروع.

### لو الـ build فشل على Vercel
| اللي ظهر | الحل |
|---|---|
| `Failed to fetch font` أو مشكلة في Google Fonts | مشكلة شبكة مؤقتة عند Vercel: **Redeploy** |
| `Module not found` | ملف ناقص في الرفع. اتأكد إن فولدرات `app` و `components` و `lib` و `data` و `public` كلها اترفعت، وارفع تاني |
| `Node.js version` | من **Settings ← Build and Deployment ← Node.js Version** اختار 22.x أو 24.x |
| الموقع شغال بس Firewise بيقول Search result على طول | المفتاح مش متضاف أو اتضاف بعد النشر: ضيفه واعمل **Redeploy** |
| Firewise بيقول إن الموديل مشغول | حصة Groq المجانية خلصت للدقيقة دي. استنى شوية وجرب تاني |

لو حاجة تانية: من **Deployments** ← الـ deployment اللي فشل ← **Build Logs**، وخد سكرين شوت لآخر 20 سطر.

---

## 7. لو عايز تعدّل في الكود

- شغّل `npx next dev -p 3005`. أي تعديل تحفظه بيظهر في المتصفح على طول.
- المشروع مبني بـ Next.js 16 و React 19 و three.js و Tailwind 4.
- اسم التيم واسم المشروع في `lib/constants.js`، وبيانات الأعضاء ولينك فيديو الديمو في `lib/team.js`.
- تأكد قبل الرفع: `npm run lint` (لازم 0 errors) و `npx next build`.

---

## English (short)

**Run locally (Windows):** double-click `RUN-APP.bat`; it installs, builds and opens <http://localhost:3005>.
**macOS / Linux:** `npm install`, then `npx next build && npx next start -p 3005`.

**Deploy (Vercel Hobby, free):** import the GitHub repository at <https://vercel.com/new> (Next.js is detected; keep the defaults), add `GROQ_API_KEY` under Settings › Environment Variables, deploy, and redeploy after any change to environment variables. Without GitHub: `npx vercel`, `npx vercel env add GROQ_API_KEY production`, `npx vercel --prod`.

**Firewise check with a real key:** start the app, then `node scripts/test-firewise.mjs`.

Independent challenge entry. Not affiliated with or endorsed by NASA.
