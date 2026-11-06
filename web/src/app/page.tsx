import { redirect } from "next/navigation";

// Beranda belum dibangun. Sementara langsung ke paket 01.
export default function Beranda() {
  redirect("/ujian/p01");
}
