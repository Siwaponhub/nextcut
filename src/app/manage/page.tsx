import type { Metadata } from "next";
import { ManageEntry } from "@/components/entries";

export const metadata: Metadata = { title: "จัดการขนาดและเทมเพลต · NextCut" };

/** หน้าจัดการรายการขนาดกรอบและเทมเพลตของร้าน */
export default function ManagePage() {
  return <ManageEntry />;
}
