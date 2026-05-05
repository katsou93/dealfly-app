import { FlightDeal, SearchParams } from './types'
import { getAirlineColor, getAirlineName, deduplicateDeals, formatDateForApi, addDays } from './utils'

const TEQUILA_BASE = 'https://tequila.kiwi.com'

export function buildSearchUrl(origin: string, params: SearchParams): string {
  const today = new Date()
  const dateFrom = params.departDateFrom || formatDateForApi(today)
  const dateTo = params.departDateTo || formatDateForApi(addDays(today, 90))

  const p = new URLSearchParams({
    fly_from: origin,
    fly_to: params.destination === 'anywhere' ? 'anywhere' : params.destination,
    date_from: dateFrom,
    date_to: dateTo,
    flight_type: params.tripType === 'roundtrip' ? 'round' : 'oneway',
    adults: String(params.adults),
    children: String(params.children),
    infants: String(params.infants),
    selected_cabins: params.cabinClass,
    max_stopovers: params.stops === 'direct' ? '0' : params.stops === 'max1' ? '1' : '2',
    price_to: String(params.tripType === 'package' ? params.maxPricePackage : params.maxPriceFlight),
    curr: 'EUR',
    locale: 'de',
    limit: '20',
    sort: 'price',
    asc: '1',
  })

  if (params.tripType === 'roundtrip') {
    const retFrom = params.returnDateFrom || formatDateForApi(addDays(today, 3))
    const retTo = params.returnDateTo || formatDateForApi(addDays(today, 14))
    p.set('return_from', retFrom)
    p.set('return_to', retTo)
  }

  if (params.minNights) p.set('nights_in_dst_from', String(params.minNights))
  if (params.maxNights) p.set('nights_in_dst_to', String(params.maxNights))

  if (params.departureTime === 'morning') { p.set('dtime_from', '06:00'); p.set('dtime_to', '12:00') }
  else if (params.departureTime === 'afternoon') { p.set('dtime_from', '12:00'); p.set('dtime_to', '18:00') }
  else if (params.departureTime === 'evening') { p.set('dtime_from', '18:00'); p.set('dtime_to', '23:59') }

  return `${TEQUILA_BASE}/v2/search?${p.toString()}`
}

export function normalizeDeals(raw: any[], origin: string): FlightDeal[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    const airlineCode = item.airlines?.[0] ?? ''
    const stops = Math.max(0, (item.route?.length ?? 1) - 1)
    return {
      id: item.id ?? Math.random().toString(36).slice(2),
      type: 'flight' as const,
      airline: getAirlineName(airlineCode),
      airlineCode,
      airlineColor: getAirlineColor(airlineCode),
      fromCode: item.flyFrom ?? origin,
      fromCity: item.cityFrom ?? origin,
      toCode: item.flyTo ?? '',
      toCity: item.cityTo ?? '',
      toCountry: item.countryTo?.name ?? '',
      price: Math.round(item.price ?? 0),
      currency: 'EUR',
      departDate: new Date((item.dTime ?? 0) * 1000).toISOString(),
      returnDate: stops > 0 ? new Date((item.aTime ?? 0) * 1000).toISOString() : undefined,
      durationMinutes: Math.round((item.duration?.total ?? 0) / 60),
      stops,
      direct: stops === 0,
      baggageIncluded: (item.baglimit?.hand_weight ?? 0) > 0,
      deepLink: item.deep_link ?? `https://www.kiwi.com/de/booking?token=${item.booking_token}`,
      isBestDeal: false,
    }
  })
}
