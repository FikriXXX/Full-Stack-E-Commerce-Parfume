import { NextResponse } from "next/server";

const staticProvinces = [
  { province_id: "6", province: "DKI Jakarta" },
  { province_id: "9", province: "Jawa Barat" },
  { province_id: "10", province: "Jawa Tengah" },
  { province_id: "5", province: "DI Yogyakarta" },
  { province_id: "11", province: "Jawa Timur" },
  { province_id: "1", province: "Bali" },
  { province_id: "34", province: "Sumatera Utara" },
  { province_id: "28", province: "Sulawesi Selatan" },
  { province_id: "15", province: "Kalimantan Timur" },
  { province_id: "24", province: "Papua" }
];

export async function GET() {
  const apiKey = process.env.RAJAONGKIR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: true, data: staticProvinces });
  }

  try {
    const res = await fetch("https://api.rajaongkir.com/starter/province", {
      headers: { key: apiKey }
    });
    const result = await res.json();
    if (result.rajaongkir?.status?.code === 200) {
      return NextResponse.json({ success: true, data: result.rajaongkir.results });
    }
    console.error("RajaOngkir provinces API error:", result.rajaongkir?.status?.description);
    return NextResponse.json({ success: true, data: staticProvinces, fallback: true });
  } catch (error: any) {
    console.error("RajaOngkir provinces fetch failed, using fallback:", error.message);
    return NextResponse.json({ success: true, data: staticProvinces, fallback: true });
  }
}
