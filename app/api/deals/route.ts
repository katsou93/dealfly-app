import { NextRequest, NextResponse } from 'next/server'
import { getAirlineColor, getAirlineName, deduplicateDeals } from '@/lib/utils'
import { FlightDeal } from '@/lib/types'

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN
const BASE = 'https://api.travelpayouts.com'

// Popular destinations for "anywhere" search
const ANYWHERE_DESTINATIONS = [
  'BCN','PMI','AGP','LIS','FAO','ATH','SKG','HER','RHO','DXB',
  'CMN','RAK','AGA','DUB','RAK','MUC','FCO','MAD','VCE','CDG',
  'PRG','BUD','KRK','OPO','VAR','BOJ','AYT','DLM','BJV','LCA',
  'TFS','ACE','FUE','LPA','IBZ','MAH','VLC','SVQ','GRX','SCQ',
]

async function fetchCheapPrices(origin: string, destination: string, departMonth: string, returnMonth?: string): Promise<any[]> {
  const params = new URLSearchParams({
    origin,
    destination,
    depart_date: departMonth,
    currency: 'eur',
    token: TOKEN!,
    limit: '10',
    page: '1',
  })
  if (returnMonth) params.set('return_date', returnMonth)

  const res = await fetch(`${BASE}/v1/prices/cheap?${params}`, {
    next: { revalidate: 300 }
  })
  if (!res.ok) return []
  const data = await res.json()
  if (!data.success || !data.data) return []

  // Flatten: data.data = { "BCN": { "0": {...}, "1": {...} } }
  const results: any[] = []
  for (const [dest, flights] of Object.entries(data.data as Record<string, any>)) {
    for (const [, flight] of Object.entries(flights as Record<string, any>)) {
      results.push({ ...flight, destination: dest, origin })
    }
  }
  return results
}

async function fetchLatestPrices(origin: string, limit = 30): Promise<any[]> {
  const params = new URLSearchParams({
    origin,
    currency: 'eur',
    token: TOKEN!,
    limit: String(limit),
    one_way: 'true',
    period_type: 'month',
  })
  const res = await fetch(`${BASE}/v2/prices/latest?${params}`, {
    next: { revalidate: 300 }
  })
  if (!res.ok) return []
  const data = await res.json()
  if (!data.success) return []
  return data.data ?? []
}

function normalizeDeal(item: any, origin: string): FlightDeal {
  const airlineCode = item.airline ?? ''
  return {
    id: `${origin}-${item.destination ?? item.destination}-${item.departure_at}-${item.price}`,
    type: 'flight',
    airline: getAirlineName(airlineCode),
    airlineCode,
    airlineColor: getAirlineColor(airlineCode),
    fromCode: origin,
    fromCity: origin,
    toCode: item.destination ?? '',
    toCity: item.destination ?? '',
    toCountry: '',
    price: Math.round(item.price ?? 0),
    currency: 'EUR',
    departDate: item.departure_at ? new Date(item.departure_at).toISOString() : new Date().toISOString(),
    returnDate: item.return_at ? new Date(item.return_at).toISOString() : undefined,
    durationMinutes: (item.duration ?? 0) * 60,
    stops: item.transfers ?? 0,
    direct: (item.transfers ?? 0) === 0,
    baggageIncluded: false,
    deepLink: `https://www.aviasales.com/search/${origin}${item.departure_at ? new Date(item.departure_at).toISOString().slice(0,10).replace(/-/g,'') : ''}1${item.destination ?? ''}1`,
    isBestDeal: false,
  }
}

export async function GET(request: NextRequest) {
  if (!TOKEN) {
    return NextResponse.json({ error: 'API Token nicht konfiguriert.', deals: [], count: 0 })
  }

  const { searchParams } = new URL(request.url)
  const origins = searchParams.get('origins')?.split(',') ?? ['DUS']
  const destination = searchParams.get('destination') ?? 'anywhere'
  const maxPrice = parseInt(searchParams.get('maxPriceFlight') ?? '200')
  const flexMode = searchParams.get('flexMode') ?? 'any3months'

  // Determine month(s) to search
  const now = new Date()
  const getMonth = (offset: number) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() + offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const months = flexMode === 'any16months'
    ? Array.from({ length: 16 }, (_, i) => getMonth(i))
    : flexMode === 'any3months'
    ? Array.from({ length: 3 }, (_, i) => getMonth(i))
    : [getMonth(0)]

  try {
    const allDeals: FlightDeal[] = []

    for (const origin of origins) {
      if (destination === 'anywhere') {
        // Use latest prices API for anywhere search
        const latest = await fetchLatestPrices(origin, 30)
        for (const item of latest) {
          if (item.price <= maxPrice) {
            allDeals.push(normalizeDeal(item, origin))
          }
        }
      } else {
        // Search specific destination across months
        for (const month of months.slice(0, 3)) { // max 3 months to avoid rate limits
          const flights = await fetchCheapPrices(origin, destination, month)
          for (const item of flights) {
            if (item.price <= maxPrice) {
              allDeals.push(normalizeDeal(item, origin))
            }
          }
        }
      }
    }

    const unique = deduplicateDeals(allDeals)
    const sorted = unique.sort((a, b) => a.price - b.price)
    if (sorted.length > 0) sorted[0].isBestDeal = true

    return NextResponse.json({ deals: sorted, count: sorted.length })
  } catch (error: any) {
    console.error('Travelpayouts error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Deals: ' + error.message, deals: [], count: 0 }, { status: 500 })
  }
}import { NextRequest, NextResponse } from 'next/server'
import { buildSearchUrl, normalizeDeals } from '@/lib/tequila'
import { deduplicateDeals } from '@/lib/utils'
import { SearchParams } from '@/lib/types'

const API_KEY = process.env.TEQUILA_API_KEY

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({
      error: 'API-Key nicht konfiguriert. Bitte TEQUILA_API_KEY in Vercel setzen.',
      deals: [], count: 0
    })
  }

  const { searchParams } = new URL(request.url)
  const params: SearchParams = {
    tripType: (searchParams.get('tripType') as any) ?? 'oneway',
    origins: searchParams.get('origins')?.split(',') ?? ['DUS'],
    destination: searchParams.get('destination') ?? 'anywhere',
    destinationLabel: searchParams.get('destinationLabel') ?? 'Überall',
    departDateFrom: searchParams.get('departDateFrom') ?? '',
    departDateTo: searchParams.get('departDateTo') ?? '',
    returnDateFrom: searchParams.get('returnDateFrom') ?? undefined,
    returnDateTo: searchParams.get('returnDateTo') ?? undefined,
    flexMode: (searchParams.get('flexMode') as any) ?? 'any3months',
    adults: parseInt(searchParams.get('adults') ?? '1'),
    children: parseInt(searchParams.get('children') ?? '0'),
    infants: parseInt(searchParams.get('infants') ?? '0'),
    cabinClass: (searchParams.get('cabinClass') as any) ?? 'M',
    stops: (searchParams.get('stops') as any) ?? 'any',
    baggage: (searchParams.get('baggage') as any) ?? 'handonly',
    departureTime: (searchParams.get('departureTime') as any) ?? 'any',
    maxPriceFlight: parseInt(searchParams.get('maxPriceFlight') ?? '200'),
    maxPricePackage: parseInt(searchParams.get('maxPricePackage') ?? '300'),
    minNights: searchParams.get('minNights') ? parseInt(searchParams.get('minNights')!) : undefined,
    maxNights: searchParams.get('maxNights') ? parseInt(searchParams.get('maxNights')!) : undefined,
    filterFlights: searchParams.get('filterFlights') !== 'false',
    filterPackages: searchParams.get('filterPackages') === 'true',
    continentFilter: (searchParams.get('continentFilter') as any) ?? 'all',
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const promises = params.origins.map(origin => {
      const url = buildSearchUrl(origin, params)
      return fetch(url, { headers: { apikey: API_KEY! }, signal: controller.signal, next: { revalidate: 300 } })
        .then(r => r.json())
        .then(data => normalizeDeals(data?.data ?? [], origin))
        .catch(() => [] as any[])
    })
    const results = await Promise.all(promises)
    const allDeals = results.flat()
    const unique = deduplicateDeals(allDeals)
    const sorted = unique.sort((a, b) => a.price - b.price)
    if (sorted.length > 0) sorted[0].isBestDeal = true
    clearTimeout(timeout)
    return NextResponse.json({ deals: sorted, count: sorted.length })
  } catch (error: any) {
    clearTimeout(timeout)
    return NextResponse.json({ error: 'Fehler beim Laden der Deals', deals: [], count: 0 }, { status: 500 })
  }
}
