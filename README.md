# NextCut

แอปจัดวางรูปบนกระดาษ 10×15 ซม. สำหรับ iPhone / iPad / คอมพิวเตอร์ แล้วส่งออกเป็น JPG 300 dpi, PDF ขนาดจริง หรือสั่งพิมพ์ เพื่อนำไปตัดตามกรอบ

- 3 ขั้น: **เลือกแบบ → ใส่รูป → ส่งออก**
- กรอบ 4 รูปทรง: สี่เหลี่ยม มุมมน วงกลม หัวใจ (ปรับความลึกร่อง 0–40% และความแหลมของปลายได้)
- เทมเพลต หรือกำหนดขนาด + จำนวนแล้วสร้างทีเดียว (ไม่พอระบบเพิ่มแผ่นให้)
- แสดงหน่วย ซม. หรือ นิ้ว พร้อมค่าที่แปลงเป็นอีกหน่วย (ค่าภายในเก็บเป็น mm เสมอ)
- ธีมสว่าง / มืด / ตามระบบ

## ข้อมูลเก็บที่ไหน

| ข้อมูล | ที่เก็บ |
|---|---|
| รายการขนาดกรอบ | Firestore `presets` (ไม่มีข้อมูลในโค้ด เพิ่มในหน้า `/manage`) |
| เทมเพลต | Firestore `templates` (สร้างจากหน้าจัดวาง: ตั้งค่าแผ่น › บันทึกเป็นเทมเพลต) |
| งานจัดวางและไฟล์รูป | IndexedDB ในเครื่องของผู้ใช้ (ไม่อัปโหลดขึ้น server) |
| หน่วย, ขอบ, ระยะห่าง, ธีม | localStorage ในเครื่องของผู้ใช้ |

## สิทธิ์แก้ไข

ไม่มีการล็อกอินและไม่มี PIN ใครเปิดเว็บก็เพิ่ม/แก้/ลบขนาดกรอบและเทมเพลตได้ (`firestore.rules` ตรวจแค่รูปแบบข้อมูล)
เหมาะกับใช้ในร้านที่ไม่ได้เผยแพร่ลิงก์ ถ้าวันหลังต้องการจำกัดคนแก้ไข ต้องเพิ่มระบบล็อกอินกลับมา

## เริ่มใช้งานในเครื่อง

```bash
npm install
cp .env.example .env.local   # แล้วใส่ค่า Firebase ตามหัวข้อถัดไป
npm run dev
```

เปิด http://localhost:3000 (ถ้ายังไม่ใส่ค่า Firebase แอปจะเปิดได้ แต่จะไม่มีขนาดกรอบและเทมเพลตให้เลือก)

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | เปิดเซิร์ฟเวอร์สำหรับพัฒนา |
| `npm run build` | สร้างเว็บ static ไว้ในโฟลเดอร์ `out/` |
| `npm start` | เปิดดูผลจาก `out/` |
| `npm test` | รัน unit test ของฟังก์ชันคำนวณ (vitest) |
| `npm run lint` / `npm run typecheck` | ตรวจโค้ด |

## เชื่อม Firebase

1. สร้างโปรเจกต์ที่ https://console.firebase.google.com (ปิด Google Analytics ได้)
2. **Firestore**: Build › Firestore Database › Create database › เลือก Production mode และ location `asia-southeast1` (สิงคโปร์ ใกล้ไทยสุด เปลี่ยนทีหลังไม่ได้)
3. **กฎความปลอดภัย**: Firestore › แท็บ Rules › ลบของเดิมแล้ววางเนื้อหาจากไฟล์ `firestore.rules` › Publish
   (ถ้าตอนสร้างเลือก Test mode กฎเดิมจะหมดอายุใน 30 วัน แล้วแอปจะอ่านข้อมูลไม่ได้ ต้องเปลี่ยนเป็นกฎของโปรเจกต์นี้)
4. **ค่าเชื่อมต่อ**: ⚙ Project settings › General › Your apps › ไอคอน `</>` (Web) › ตั้งชื่อ แล้วเอาค่าใน `firebaseConfig` มาใส่ `.env.local` ในรูปแบบ `ชื่อ=ค่า` บรรทัดละตัว (ไม่ต้องวางโค้ด JavaScript ทั้งก้อน)

   | ใน firebaseConfig | ใส่ที่ |
   |---|---|
   | `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
   | `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
   | `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
   | `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
   | `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
   | `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |

   ไม่ต้องเปิด Authentication เพราะแอปไม่มีการล็อกอิน
5. หยุดแล้วเริ่ม `npm run dev` ใหม่ (ค่า env อ่านตอนเริ่มเท่านั้น)
6. **เพิ่มขนาดกรอบ**: เปิด http://localhost:3000/manage › กด "เพิ่ม"
7. **สร้างเทมเพลต**: หน้าจัดวาง › กำหนดขนาดและจำนวน › สร้างกรอบ › ตั้งค่าแผ่น › บันทึกเป็นเทมเพลต

## Deploy บน Vercel

1. push โปรเจกต์ขึ้น GitHub แล้ว Import ใน Vercel (ตรวจเจอ Next.js เอง ไม่ต้องตั้งค่า build)
2. Project Settings › Environment Variables › ใส่ `NEXT_PUBLIC_FIREBASE_*` ทั้ง 6 ตัวเหมือนใน `.env.local` เลือก Production และ Preview แล้ว Redeploy
3. `.env.local` ไม่ถูกส่งขึ้น git (อยู่ใน `.gitignore`) ต้องใส่ค่าใน Vercel เอง
4. (แนะนำ) Google Cloud Console › APIs & Services › Credentials › API key ของโปรเจกต์ › จำกัด HTTP referrers ให้เฉพาะโดเมน Vercel และ `localhost` เพื่อลดการใช้ key จากเว็บอื่น

## โครงสร้างโค้ด

```
src/
├─ app/                       หน้าเว็บ (App Router)
│  ├─ layout.tsx              ฟอนต์ไทย, viewport, script ตั้งธีมก่อนวาดหน้า
│  ├─ page.tsx                หน้าจัดวาง
│  ├─ manage/page.tsx         หน้าจัดการขนาดและเทมเพลต
│  └─ globals.css             สีสว่าง/มืด, ขนาดปุ่ม iPhone/iPad, CSS ตอนพิมพ์
├─ components/
│  ├─ entries.tsx             โหลดแอปเฉพาะฝั่งเบราว์เซอร์ (ssr: false)
│  ├─ editor/                 หน้าจัดวาง: แถบบน, แผ่นกระดาษ, แผงเครื่องมือ, หน้าต่างโต้ตอบ
│  ├─ manage/                 หน้าจัดการ: รายการ, ฟอร์มขนาด, รายละเอียดเทมเพลต
│  ├─ shared/                 ใช้ร่วมกัน: ตัวปรับหัวใจ, ภาพย่อ, สถานะการเชื่อม Firebase
│  └─ ui/                     ปุ่ม, ตัวเลือก, ช่องตัวเลข, หน้าต่าง, ข้อความแจ้ง
├─ hooks/                     ท่าทางบนแผ่น, นำเข้ารูป, บันทึกอัตโนมัติ, ขนาดจอ, ธีม
├─ lib/                       ฟังก์ชันล้วน (ทดสอบได้ไม่ต้องใช้เบราว์เซอร์)
│  ├─ units.ts                แปลงหน่วย mm ↔ ซม./นิ้ว
│  ├─ shapes.ts               path ของรูปทรง และเส้นโค้งหัวใจ
│  ├─ geometry.ts             ตำแหน่งรูปในกรอบ, dpi, ตรวจกรอบทับกัน
│  ├─ layout.ts               หาที่ว่าง, สร้างตามจำนวน, จัดเรียง, ทำซ้ำ
│  ├─ export.ts               วาดแผ่นลง canvas 300 dpi → JPG/PDF, Share Sheet
│  ├─ storage.ts              IndexedDB (งานและรูป)
│  ├─ catalog/                interface ของ repository และการแปลงเอกสาร Firestore
│  └─ firebase/               ค่าตั้ง env และการอ่าน/เขียน Firestore + Auth
├─ store/                     state ด้วย zustand (editor, catalog, prefs, dialog, toast)
└─ types/                     ชนิดข้อมูลหลัก
```

### หลักการสำคัญ

- **เก็บทุกค่าเป็นมิลลิเมตร** หน่วย ซม./นิ้ว ใช้แค่ตอนแสดงผลและรับค่า บนจอคูณ scale เป็น px ตอนส่งออกคูณเป็น 300 dpi
- **รูปทรงใช้ฟังก์ชันเดียว** `shapePath()` ใช้ทั้งบนจอ ภาพย่อ และตอนส่งออก รูปที่เห็นจึงตรงกับไฟล์ที่พิมพ์
- **กรอบเก็บขนาดของตัวเอง** แก้หรือลบขนาดในหน้าจัดการ ไม่กระทบงานที่วางไว้แล้ว
- **ตำแหน่งรูปในกรอบเก็บเป็น %** ของส่วนที่ล้นกรอบ เปลี่ยนขนาดกรอบหรือซูมแล้วรูปไม่กระโดด
