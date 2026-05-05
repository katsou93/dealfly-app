'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import SearchPanel from '@/components/SearchPanel'
import DealGrid from '@/components/DealGrid'
import RefreshBar from '@/components/RefreshBar'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { FlightDeal, SearchParams, SortOption } from '@/lib/types'
import { formatDateForApi, addDays } from '@/lib/utils'
import { Plane, AlertCircle, RefreshCw } from 'lucide-react'

const defaultParams = (): SearchParams => ({
  tripType: 'oneway',
  origins: ['DUS'],
  destination: 'anywhere',
  destinationLabel: 'Überall',
  departDateFrom: formatDateForApi(new Date()),
  departDateTo: formatDateForApi(addDays(new Date(), 90)),
  flexMode: 'any3months',
  adults: 1, children: 0, infants: 0,
  cabinClass: 'M', stops: 'any', baggage: 'handonly', departureTime: 'any',
  maxPriceFlight: 200, maxPricePackage: 300,
  filterFlights: true, filterPackages: false, continentFilter: 'all',
})

export default function Home() {
  const [deals, setDeals] = useState<FlightDeal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoInterval, setAutoInterval] = useState<5 | 10 | 30>(10)
  const [sortBy, setSortBy] = useState<SortOption>('price_asc')
  const [currentParams, setCurrentParams] = useState<SearchParams>(defaultParams())
  const [hasSearched, setHasSearched] = useState(false)
  const autoRef = useRef<NodeJS.Timeout | null>(null)

  const fetchDeals = useCallback(async (params: SearchParams) => {
    setLoading(true); setError(null)
    try {
      const p = new URLSearchParams({
        tripType: params.tripType, origins: params.origins.join(','),
        destination: params.destination, destinationLabel: params.destinationLabel,
        departDateFrom: params.departDateFrom, departDateTo: params.departDateTo,
        flexMode: params.flexMode, adults: String(params.adults),
        children: String(params.children), infants: String(params.infants),
        cabinClass: params.cabinClass, stops: params.stops, baggage: params.baggage,
        departureTime: params.departureTime, maxPriceFlight: String(params.maxPriceFlight),
        maxPricePackage: String(params.maxPricePackage),
        filterFlights: String(params.filterFlights), filterPackages: String(params.filterPackages),
        continentFilter: params.continentFilter,
      })
      if (params.returnDateFrom) p.set('returnDateFrom', params.returnDateFrom)
      if (params.returnDateTo) p.set('returnDateTo', params.returnDateTo)
      if (params.minNights) p.set('minNights', String(params.minNights))
      if (params.maxNights) p.set('maxNights', String(params.maxNights))
      const res = await fetch('/api/deals?' + p.toString())
      const data = await res.json()
      if (data.error && !data.deals?.length) { setError(data.error) }
      else { setDeals(data.deals ?? []); setError(data.error ?? null); setLastRefresh(new Date()); setHasSearched(true) }
    } catch { setError('Netzwerkfehler. Bitte Verbindung prüfen.') }
    finally { setLoading(false) }
  }, [])

  const handleSearch = (p: SearchParams) => { setCurrentParams(p); fetchDeals(p) }
  const handleRefresh = () => fetchDeals(currentParams)

  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current)
    if (autoRefresh && hasSearched) autoRef.current = setInterval(() => fetchDeals(currentParams), autoInterval * 60000)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [autoRefresh, autoInterval, currentParams, hasSearched, fetchDeals])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center shadow-md">
              <Plane size={18} className="text-white -rotate-45" />
            </div>
            <div>
              <div className="font-black text-xl text-slate-900 tracking-tight leading-none">DealFly</div>
              <div className="text-xs text-slate-400 font-medium">Smarter Flugdeal-Scanner</div>
            </div>
          </div>
          <RefreshBar loading={loading} lastRefresh={lastRefresh} autoRefresh={autoRefresh}
            autoRefreshInterval={autoInterval} onRefresh={handleRefresh}
            onToggleAuto={() => setAutoRefresh(v => !v)} onIntervalChange={setAutoInterval} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <SearchPanel onSearch={handleSearch} loading={loading} />
        {error && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-amber-800">{error}</span>
              {error.includes('API-Key') && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Registriere dich kostenlos auf <a href="https://tequila.kiwi.com/register" target="_blank" rel="noopener noreferrer" className="underline font-medium">tequila.kiwi.com</a> und trage den Key als TEQUILA_API_KEY in Vercel ein.
                </p>
              )}
            </div>
            <button onClick={handleRefresh} className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}
        {loading && <LoadingSkeleton />}
        {!loading && hasSearched && <DealGrid deals={deals} sortBy={sortBy} onSortChange={setSortBy}
          origins={currentParams.origins} destination={currentParams.destinationLabel} lastRefresh={lastRefresh} />}
        {!loading && !hasSearched && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Plane size={36} className="text-sky-400 -rotate-45" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Wohin soll's gehen?</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Wähle deine Abflughäfen, setze dein Budget und lass DealFly die besten Preise finden.</p>
          </div>
        )}
      </main>
      <footer className="text-center py-8 text-xs text-slate-400">
        DealFly · Powered by <a href="https://tequila.kiwi.com" className="underline hover:text-slate-600" target="_blank" rel="noopener noreferrer">Kiwi Tequila API</a>
      </footer>
    </div>
  )
}
