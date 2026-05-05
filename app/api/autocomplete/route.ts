import { NextRequest, NextResponse } from 'next/server'
const API_KEY = process.env.TEQUILA_API_KEY
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const term = searchParams.get('term') ?? ''
  if (!term || !API_KEY) return NextResponse.json([])
  try {
    const res = await fetch(
      `https://tequila.kiwi.com/locations/query?term=${encodeURIComponent(term)}&locale=de&limit=7&location_types=city,airport`,
      { headers: { apikey: API_KEY } }
    )
    const data = await res.json()
    const results = (data?.locations ?? []).map((loc: any) => ({
      id: loc.id, name: loc.name,
      city: loc.city?.name ?? loc.name,
      country: loc.country?.name ?? '',
      code: loc.code, type: loc.type,
    }))
    return NextResponse.json(results)
  } catch { return NextResponse.json([]) }
}
