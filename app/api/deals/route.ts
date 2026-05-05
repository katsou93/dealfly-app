import { NextRequest, NextResponse } from 'next/server'
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
