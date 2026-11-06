import { redirect } from "next/navigation";

// Beranda belum dibangun. Sementara langsung ke paket contoh.
export default function Beranda() {
  redirect("/ujian/sample-15");
}
