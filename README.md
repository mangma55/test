# GitHub Pages + Supabase demo

เว็บตัวอย่าง 2 หน้า: `index.html` สำหรับเข้าสู่ระบบ และ `dashboard.html` สำหรับเพิ่ม อ่าน แก้ไข ลบข้อความใน `demo_notes` แยกตามบัญชี Supabase Auth ไม่มีระบบสมัครสมาชิกในหน้าเว็บ และไม่ได้ให้สิทธิ์ admin แก่บัญชีใดโดยอัตโนมัติ

## เริ่มใช้งาน

1. ใน Supabase Dashboard เปิด **SQL Editor** แล้วรัน `setup.sql` ในโปรเจกต์ที่ต้องการทดลอง หากมีตาราง `public.demo_notes` ชื่อนี้ใช้อยู่แล้ว ให้ตรวจสอบก่อนรัน เพราะคำสั่งเปลี่ยน grants และ policies ของตารางดังกล่าว
2. ไปที่ **Authentication → Users** แล้วสร้างบัญชีอีเมล/รหัสผ่านสำหรับทดสอบ หรือใช้บัญชีที่มีอยู่แล้ว ตรวจสอบว่าบัญชีสามารถล็อกอินด้วยรหัสผ่านได้
3. เปิด **Project Settings → API Keys** แล้วคัดลอกเฉพาะ **Project URL** และ **Publishable key** (`sb_publishable_...`) ลง `config.js` ถ้าโปรเจกต์เก่าใช้ `anon` key ก็ใช้ได้
4. อัปโหลด `index.html`, `dashboard.html`, `style.css`, `config.js` และ `app.js` ไปยัง root ของ GitHub repository ทั้งหมด ไม่จำเป็นต้องเผยแพร่ `setup.sql` หรือ `README.md` แต่เผยแพร่ได้เพราะไม่มี secret
5. ใน GitHub repository ไปที่ **Settings → Pages → Build and deployment** เลือก **Deploy from a branch**, branch `main`, folder `/ (root)` แล้วเปิด `https://USERNAME.github.io/REPOSITORY/`
6. เข้าสู่ระบบ เพิ่มข้อความ รีเฟรชหน้า แก้ไข และลบ เพื่อดูว่าข้อมูลอยู่ใน Supabase จริง

## ข้อควรทราบ

- `config.js` อยู่ในเว็บสาธารณะ ใช้ได้เฉพาะ publishable/anon key เท่านั้น **ห้าม** ใส่ `sb_secret_...`, `service_role`, รหัสผ่าน หรือโทเค็นผู้ใช้
- RLS ใน `setup.sql` จำกัดให้แต่ละบัญชีเห็นและแก้ไขเฉพาะแถวของตนเอง หากต้องการสิทธิ์ admin ต้องออกแบบ role และ policy ฝั่ง Supabase เพิ่ม ไม่ควรตัดสินจากรหัสผ่านที่เขียนใน JavaScript
- จำนวนบนแดชบอร์ดคือจำนวนรายการที่โหลดในหน้า (สูงสุด 100 รายการ) ไม่ใช่ยอดรวมทั้งตาราง
- หน้าเว็บต้องใช้อินเทอร์เน็ตเพื่อโหลด `supabase-js` ผ่าน CDN และติดต่อ Supabase

เอกสารอ้างอิง: [supabase-js installation](https://supabase.com/docs/reference/javascript/installing), [Supabase Auth](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [API keys](https://supabase.com/docs/guides/getting-started/api-keys)
