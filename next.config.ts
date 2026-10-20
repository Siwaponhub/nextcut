import type { NextConfig } from "next";

/**
 * ทำเป็นเว็บ static (โฟลเดอร์ out/) เพราะทุกอย่างทำงานในเบราว์เซอร์
 * deploy บน Vercel ได้ตรง ๆ (Vercel ตรวจเจอและเสิร์ฟไฟล์ static ให้) ไม่ต้องมี server
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
