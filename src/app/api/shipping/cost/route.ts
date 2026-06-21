import { NextResponse } from "next/server";

const calculateMockCost = (destination: string, weight: number, courier: string) => {
  let cost = 15000; // default (Java area)
  const destId = parseInt(destination);

  // Jakarta area (Jakarta city IDs are 151, 152, 153, 154, 155)
  if (destId >= 151 && destId <= 155) {
    cost = 9000;
  }
  // Outside Java (Sumatera, Bali, Kalimantan, Sulawesi, etc.)
  else if (destId === 278 || destId === 114 || destId === 387 || destId === 19 || destId === 246) {
    cost = 25000;
  }
  // Papua
  else if (destId === 160) {
    cost = 50000;
  }

  // Weight multiplier (per kg, min 1kg)
  const calculatedWeight = Math.max(1, Math.ceil(weight / 1000));
  return {
    code: courier,
    name: courier.toUpperCase(),
    costs: [
      {
        service: "REG",
        description: "Layanan Reguler",
        cost: [{ value: cost * calculatedWeight, etd: "2-3 Hari", note: "" }]
      }
    ]
  };
};

export async function POST(request: Request) {
  try {
    const { destination, weight, courier } = await request.json();

    if (!destination || !weight || !courier) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.RAJAONGKIR_API_KEY;
    if (!apiKey) {
      const mockResult = calculateMockCost(destination, weight, courier);
      return NextResponse.json({ success: true, data: mockResult });
    }

    try {
      const res = await fetch("https://api.rajaongkir.com/starter/cost", {
        method: "POST",
        headers: {
          key: apiKey,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          origin: "152", // Jakarta Pusat ID
          destination,
          weight: weight.toString(),
          courier
        }),
        signal: AbortSignal.timeout(5000) // 5s timeout
      });

      const result = await res.json();
      if (result.rajaongkir?.status?.code === 200) {
        return NextResponse.json({ success: true, data: result.rajaongkir.results[0] });
      }
      console.error("RajaOngkir cost API error:", result.rajaongkir?.status?.description);
      const mockResult = calculateMockCost(destination, weight, courier);
      return NextResponse.json({ success: true, data: mockResult, fallback: true });
    } catch (error: any) {
      console.error("RajaOngkir cost fetch failed, using fallback:", error.message);
      const mockResult = calculateMockCost(destination, weight, courier);
      return NextResponse.json({ success: true, data: mockResult, fallback: true });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
