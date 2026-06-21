import { NextResponse } from "next/server";

const staticCities: Record<string, any[]> = {
  "6": [
    { city_id: "152", city_name: "Jakarta Pusat", type: "Kota", postal_code: "10110" },
    { city_id: "151", city_name: "Jakarta Barat", type: "Kota", postal_code: "11110" },
    { city_id: "153", city_name: "Jakarta Selatan", type: "Kota", postal_code: "12110" },
    { city_id: "154", city_name: "Jakarta Timur", type: "Kota", postal_code: "13110" },
    { city_id: "155", city_name: "Jakarta Utara", type: "Kota", postal_code: "14110" }
  ],
  "9": [
    { city_id: "23", city_name: "Bandung", type: "Kota", postal_code: "40111" },
    { city_id: "78", city_name: "Bogor", type: "Kota", postal_code: "16111" },
    { city_id: "54", city_name: "Bekasi", type: "Kota", postal_code: "17111" },
    { city_id: "115", city_name: "Depok", type: "Kota", postal_code: "16411" }
  ],
  "10": [
    { city_id: "399", city_name: "Semarang", type: "Kota", postal_code: "50111" },
    { city_id: "444", city_name: "Surakarta", type: "Kota", postal_code: "57111" }
  ],
  "5": [
    { city_id: "501", city_name: "Yogyakarta", type: "Kota", postal_code: "55111" }
  ],
  "11": [
    { city_id: "443", city_name: "Surabaya", type: "Kota", postal_code: "60111" },
    { city_id: "256", city_name: "Malang", type: "Kota", postal_code: "65111" }
  ],
  "1": [
    { city_id: "114", city_name: "Denpasar", type: "Kota", postal_code: "80111" }
  ],
  "34": [
    { city_id: "278", city_name: "Medan", type: "Kota", postal_code: "20111" }
  ],
  "28": [
    { city_id: "246", city_name: "Makassar", type: "Kota", postal_code: "90111" }
  ],
  "15": [
    { city_id: "387", city_name: "Samarinda", type: "Kota", postal_code: "75111" },
    { city_id: "19", city_name: "Balikpapan", type: "Kota", postal_code: "76111" }
  ],
  "24": [
    { city_id: "160", city_name: "Jayapura", type: "Kota", postal_code: "99111" }
  ]
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get("provinceId");

  if (!provinceId) {
    return NextResponse.json({ success: false, error: "provinceId is required" }, { status: 400 });
  }

  const apiKey = process.env.RAJAONGKIR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: true, data: staticCities[provinceId] || [] });
  }

  try {
    const res = await fetch(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
      headers: { key: apiKey }
    });
    const result = await res.json();
    if (result.rajaongkir?.status?.code === 200) {
      return NextResponse.json({ success: true, data: result.rajaongkir.results });
    }
    console.error("RajaOngkir cities API error:", result.rajaongkir?.status?.description);
    return NextResponse.json({ success: true, data: staticCities[provinceId] || [], fallback: true });
  } catch (error: any) {
    console.error("RajaOngkir cities fetch failed, using fallback:", error.message);
    return NextResponse.json({ success: true, data: staticCities[provinceId] || [], fallback: true });
  }
}
