import { FlightDeal, SortOption } from './types'

export function formatPrice(price: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m > 0 ? m + 'm' : ''}`.trim()
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateForApi(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function sortDeals(deals: FlightDeal[], sortBy: SortOption): FlightDeal[] {
  const sorted = [...deals]
  switch (sortBy) {
    case 'price_asc': return sorted.sort((a, b) => a.price - b.price)
    case 'price_desc': return sorted.sort((a, b) => b.price - a.price)
    case 'date_asc': return sorted.sort((a, b) => new Date(a.departDate).getTime() - new Date(b.departDate).getTime())
    case 'duration_asc': return sorted.sort((a, b) => a.durationMinutes - b.durationMinutes)
    default: return sorted
  }
}

export function getAirlineColor(code: string): string {
  const colors: Record<string, string> = {
    FR: '#ff6600', U2: '#ff8800', W6: '#cc0000', VY: '#ff0000',
    LH: '#003366', EW: '#ff0000', TK: '#e81932', EK: '#c60c30',
    AF: '#002157', BA: '#075aaa', KL: '#00a1e4',
  }
  return colors[code] ?? '#6366f1'
}

export function getAirlineName(code: string): string {
  const names: Record<string, string> = {
    FR: 'Ryanair', U2: 'easyJet', W6: 'Wizz Air', VY: 'Vueling',
    LH: 'Lufthansa', EW: 'Eurowings', TK: 'Turkish Airlines',
    EK: 'Emirates', AF: 'Air France', BA: 'British Airways',
    IB: 'Iberia', KL: 'KLM', TP: 'TAP Air Portugal',
  }
  return names[code] ?? code
}

export function getNights(departDate: string, returnDate: string): number {
  return Math.round((new Date(returnDate).getTime() - new Date(departDate).getTime()) / (1000 * 60 * 60 * 24))
}

export function deduplicateDeals(deals: FlightDeal[]): FlightDeal[] {
  const seen = new Set<string>()
  return deals.filter(d => {
    const key = `${d.fromCode}-${d.toCode}-${d.departDate.slice(0, 10)}-${d.price}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
