import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** ทดสอบเฉพาะฟังก์ชันคำนวณใน src/lib (ไม่ต้องใช้เบราว์เซอร์) */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
