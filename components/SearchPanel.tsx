'use client'
import { useState, useEffect, useRef } from 'react'
import { SearchParams, TripType, FlexMode, StopFilter, AutocompleteResult } from '@/lib/types'
import { formatDateForApi, addDays } from '@/lib/utils'
import { MapPin, Users, Plane, Package, ArrowLeftRight, ChevronDown, Search, X } from 'lucide-react'

const AIRPORTS = [
  { code: 'DUS', label: 'DUS – Düsseldorf' },
  { code: 'CGN', label: 'CGN – Köln/Bonn' },
  { code: 'DTM', label: 'DTM – Dortmund' },
  { code: 'AMS', label: 'AMS – Amsterdam' },
  { code: 'FRA', label: 'FRA – Frankfurt' },
]

const FLEX_MODES: { value: FlexMode; label: string; desc?: string }[] = [
  { value: 'exact', label: 'Genau' },
  { value: 'pm1', label: '± 1 Tag' },
  { value: 'pm3', label: '± 3 Tage' },
  { value: 'month', label: 'Ganzer Monat' },
  { value: 'weekends', label: 'Wochenenden' },
  { value: 'any3months', label: 'Nächste 3 Monate' },
  { value: 'any16months', label: '🔥 Nächste 16 Monate', desc: 'Günstigste Deals des ganzen Jahres' },
]

const QUICK_DEST = [
  { code: 'anywhere', label: '🌍 Überall' },
  { code: 'ES', label: '🇪🇸 Spanien' },
  { code: 'GR', label: '🇬🇷 Griechenland' },
  { code: 'PT', label: '🇵🇹 Portugal' },
  { code: 'MA', label: '🇲🇦 Marokko' },
  { code: 'HR', label: '🇭🇷 Kroatien' },
  { code: 'CO', label: '🇨🇴 Kolumbien' },
  { code: 'PA', label: '🇵🇦 Panama' },
]

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}

const defaultParams = (): SearchParams => ({
  tripType: 'oneway', origins: ['DUS'], destination: 'anywhere', destinationLabel: 'Überall',
  departDateFrom: formatDateForApi(new Date()), departDateTo: formatDateForApi(addDays(new Date(), 90)),
  flexMode: 'any3months', adults: 1, children: 0, infants: 0, cabinClass: 'M',
  stops: 'any', baggage: 'handonly', departureTime: 'any', maxPriceFlight: 200, maxPricePackage: 300,
  filterFlights: true, filterPackages: false, continentFilter: 'all',
})

function getDateRangeForFlex(flexMode: FlexMode): { from: string; to: string } {
  const today = new Date()
  switch (flexMode) {
    case 'any16months': return { from: formatDateForApi(today), to: formatDateForApi(addDays(today, 487)) }
    case 'any3months': return { from: formatDateForApi(today), to: formatDateForApi(addDays(today, 90)) }
    case 'month': return { from: formatDateForApi(today), to: formatDateForApi(addDays(today, 30)) }
    case 'weekends': return { from: formatDateForApi(today), to: formatDateForApi(addDays(today, 60)) }
    default: return { from: formatDateForApi(today), to: formatDateForApi(addDays(today, 90)) }
  }
}

export default function SearchPanel({ onSearch, loading }: { onSearch: (p: SearchParams) => void; loading: boolean }) {
  const [params, setParams] = useState<SearchParams>(defaultParams())
  const [destInput, setDestInput] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([])
  const [showSugg, setShowSugg] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showAir, setShowAir] = useState(false)
  const debouncedDest = useDebounce(destInput, 300)
  const destRef = useRef<HTMLDivElement>(null)
  const passRef = useRef<HTMLDivElement>(null)
  const airRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!debouncedDest || debouncedDest.length < 2) { setSuggestions([]); return }
    fetch(`/api/autocomplete?term=${encodeURIComponent(debouncedDest)}`).then(r => r.json()).then(setSuggestions).catch(() => setSuggestions([]))
  }, [debouncedDest])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowSugg(false)
      if (passRef.current && !passRef.current.contains(e.target as Node)) setShowPass(false)
      if (airRef.current && !airRef.current.contains(e.target as Node)) setShowAir(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const upd = (patch: Partial<SearchParams>) => setParams(p => ({ ...p, ...patch }))

  const setFlexMode = (mode: FlexMode) => {
    const range = getDateRangeForFlex(mode)
    upd({ flexMode: mode, departDateFrom: range.from, departDateTo: range.to })
  }

  const toggleOrigin = (code: string) => setParams(p => {
    const has = p.origins.includes(code)
    if (has && p.origins.length === 1) return p
    return { ...p, origins: has ? p.origins.filter(o => o !== code) : [...p.origins, code] }
  })

  const setTripType = (t: TripType) => {
    const today = new Date()
    upd({ tripType: t, returnDateFrom: t !== 'oneway' ? formatDateForApi(addDays(today, 14)) : undefined, returnDateTo: t !== 'oneway' ? formatDateForApi(addDays(today, 21)) : undefined, minNights: t !== 'oneway' ? 7 : undefined, maxNights: t !== 'oneway' ? 14 : undefined })
  }

  const passLabel = `${params.adults} Erw.${params.children > 0 ? ', ' + params.children + ' Kind' : ''}${params.infants > 0 ? ', ' + params.infants + ' Baby' : ''} · ${params.cabinClass === 'M' ? 'Economy' : 'Business'}`

  const isFlexible = ['any3months', 'any16months', 'month', 'weekends'].includes(params.flexMode)

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      {/* Trip Type Tabs */}
      <div className="flex border-b border-slate-100">
        {([['oneway', <Plane size={15}/>, 'Hinflug'], ['roundtrip', <ArrowLeftRight size={15}/>, 'Hin + Rückflug'], ['package', <Package size={15}/>, 'Pauschal']] as const).map(([v, icon, label]) => (
          <button key={v} onClick={() => setTripType(v as TripType)} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all flex-1 justify-center ${params.tripType === v ? 'text-sky-600 border-b-2 border-sky-500 bg-sky-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* Row 1: Airports + Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Airport */}
          <div className="relative" ref={airRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Abflughafen</label>
            <button onClick={() => setShowAir(v => !v)} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:border-sky-300 transition-colors">
              <span className="flex items-center gap-2"><Plane size={14} className="text-sky-400" />{params.origins.length === 1 ? AIRPORTS.find(a => a.code === params.origins[0])?.label : `${params.origins.join(', ')}`}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showAir && (
              <div className="absolute z-30 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                <button onClick={() => { upd({ origins: ['DUS', 'CGN', 'DTM'] }); setShowAir(false) }} className="w-full text-left px-4 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50">✓ Alle NRW (DUS + CGN + DTM)</button>
                {AIRPORTS.map(ap => (
                  <label key={ap.code} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={params.origins.includes(ap.code)} onChange={() => toggleOrigin(ap.code)} className="accent-sky-500" />
                    <span className="text-sm text-slate-700">{ap.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="relative" ref={destRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Ziel</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none" />
              <input type="text" value={destInput} onChange={e => { setDestInput(e.target.value); setShowSugg(true) }} onFocus={() => setShowSugg(true)}
                placeholder="Überall · Stadt oder Flughafen" className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white transition-colors" />
              {destInput && <button onClick={() => { setDestInput(''); upd({ destination: 'anywhere', destinationLabel: 'Überall' }) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={13} /></button>}
            </div>
            {!showSugg && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_DEST.map(d => (
                  <button key={d.code} onClick={() => { upd({ destination: d.code, destinationLabel: d.label.replace(/^\S+\s/, '') }); setDestInput('') }}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${params.destination === d.code ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>{d.label}</button>
                ))}
              </div>
            )}
            {showSugg && suggestions.length > 0 && (
              <div className="absolute z-30 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto">
                {suggestions.map(s => (
                  <button key={s.id} onClick={() => { upd({ destination: s.code, destinationLabel: `${s.city} (${s.code})` }); setDestInput(`${s.city} (${s.code})`); setShowSugg(false) }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50">
                    <div className="text-sm font-semibold text-slate-800">{s.city} <span className="text-xs font-bold text-sky-500">{s.code}</span></div>
                    <div className="text-xs text-slate-400">{s.country}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Flex Mode - PROMINENT */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Wann willst du reisen?</label>
          <div className="flex flex-wrap gap-2">
            {FLEX_MODES.map(m => (
              <button key={m.value} onClick={() => setFlexMode(m.value as FlexMode)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${params.flexMode === m.value ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : m.value === 'any16months' ? 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                {m.label}
              </button>
            ))}
          </div>
          {params.flexMode === 'any16months' && (
            <p className="text-xs text-orange-600 mt-1.5 font-medium">🔍 Sucht die günstigsten Deals in den nächsten 16 Monaten – dauert etwas länger</p>
          )}
        </div>

        {/* Date pickers – nur anzeigen wenn NICHT voll-flexibel */}
        {!isFlexible && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Abflug von</label>
              <input type="date" value={params.departDateFrom.split('/').reverse().join('-')} onChange={e => upd({ departDateFrom: e.target.value.split('-').reverse().join('/') })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Abflug bis</label>
              <input type="date" value={params.departDateTo.split('/').reverse().join('-')} onChange={e => upd({ departDateTo: e.target.value.split('-').reverse().join('/') })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400" />
            </div>
          </div>
        )}

        {params.tripType !== 'oneway' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Min. Nächte</label>
              <select value={params.minNights ?? 7} onChange={e => upd({ minNights: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400">
                {[1,3,5,7,10,14].map(n => <option key={n} value={n}>{n} Nächte</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Max. Nächte</label>
              <select value={params.maxNights ?? 14} onChange={e => upd({ maxNights: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400">
                {[7,10,14,21,30].map(n => <option key={n} value={n}>{n} Nächte</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Row: Passengers + Stops + Baggage */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative" ref={passRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Reisende</label>
            <button onClick={() => setShowPass(v => !v)} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:border-sky-300 transition-colors">
              <span className="flex items-center gap-2"><Users size={14} className="text-sky-400" />{passLabel}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showPass && (
              <div className="absolute z-30 top-full mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 space-y-3">
                {([['adults', 'Erwachsene', '16+', 1, 8], ['children', 'Kinder', '2–15', 0, 4], ['infants', 'Babys', '0–1', 0, 2]] as const).map(([key, label, sub, min, max]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div><div className="text-sm font-semibold text-slate-700">{label}</div><div className="text-xs text-slate-400">{sub}</div></div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => upd({ [key]: Math.max(min, params[key] - 1) })} disabled={params[key] <= min} className="w-8 h-8 rounded-full border-2 border-slate-200 text-slate-600 font-bold hover:border-sky-400 hover:text-sky-600 disabled:opacity-30">–</button>
                      <span className="w-5 text-center font-bold text-slate-800">{params[key]}</span>
                      <button onClick={() => upd({ [key]: Math.min(max, params[key] + 1) })} disabled={params[key] >= max} className="w-8 h-8 rounded-full border-2 border-slate-200 text-slate-600 font-bold hover:border-sky-400 hover:text-sky-600 disabled:opacity-30">+</button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Klasse</div>
                  <div className="flex gap-2">
                    {[['M', 'Economy'], ['C', 'Business']].map(([v, l]) => (
                      <button key={v} onClick={() => upd({ cabinClass: v as any })} className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-all ${params.cabinClass === v ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-200 text-slate-600 hover:border-sky-300'}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Stopps</label>
            <div className="flex gap-1.5">
              {[['direct', 'Direkt'], ['max1', 'Max. 1'], ['any', 'Egal']].map(([v, l]) => (
                <button key={v} onClick={() => upd({ stops: v as StopFilter })} className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${params.stops === v ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-sky-300'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Max. Preis / Person</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <input type="number" min={20} max={2000} step={10} value={params.maxPriceFlight}
                onChange={e => upd({ maxPriceFlight: parseInt(e.target.value) || 200 })}
                className="w-full bg-transparent text-sm font-bold text-slate-700 focus:outline-none" />
              <span className="text-sm font-bold text-slate-400">€</span>
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {[70, 150, 300, 600].map(v => (
                <button key={v} onClick={() => upd({ maxPriceFlight: v })} className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-all ${params.maxPriceFlight === v ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-200 text-slate-500 hover:border-sky-300'}`}>{v}€</button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button onClick={() => onSearch(params)} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-md hover:shadow-lg text-lg">
          <Search size={20} />
          {loading ? 'Suche läuft...' : params.flexMode === 'any16months' ? '🔥 Beste Deals der nächsten 16 Monate finden' : 'Deals suchen'}
        </button>
      </div>
    </div>
  )
}'use client'
import { useState, useEffect, useRef } from 'react'
import { SearchParams, TripType, FlexMode, StopFilter, AutocompleteResult } from '@/lib/types'
import { formatDateForApi, addDays } from '@/lib/utils'
import { MapPin, Users, Plane, Package, ArrowLeftRight, ChevronDown, Search, X } from 'lucide-react'

const AIRPORTS = [
  { code: 'DUS', label: 'DUS – Düsseldorf' },
  { code: 'CGN', label: 'CGN – Köln/Bonn' },
  { code: 'DTM', label: 'DTM – Dortmund' },
  { code: 'AMS', label: 'AMS – Amsterdam' },
  { code: 'FRA', label: 'FRA – Frankfurt' },
]

const FLEX_MODES: { value: FlexMode; label: string }[] = [
  { value: 'exact', label: 'Genau' }, { value: 'pm1', label: '± 1 Tag' },
  { value: 'pm3', label: '± 3 Tage' }, { value: 'month', label: 'Ganzer Monat' },
  { value: 'weekends', label: 'Wochenenden' }, { value: 'any3months', label: 'Nächste 3 Monate' },
]

const QUICK_DEST = [
  { code: 'anywhere', label: '🌍 Überall' }, { code: 'ES', label: '🇪🇸 Spanien' },
  { code: 'GR', label: '🇬🇷 Griechenland' }, { code: 'PT', label: '🇵🇹 Portugal' },
  { code: 'MA', label: '🇲🇦 Marokko' }, { code: 'HR', label: '🇭🇷 Kroatien' },
]

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}

const defaultParams = (): SearchParams => ({
  tripType: 'oneway', origins: ['DUS'], destination: 'anywhere', destinationLabel: 'Überall',
  departDateFrom: formatDateForApi(new Date()), departDateTo: formatDateForApi(addDays(new Date(), 90)),
  flexMode: 'any3months', adults: 1, children: 0, infants: 0, cabinClass: 'M',
  stops: 'any', baggage: 'handonly', departureTime: 'any', maxPriceFlight: 200, maxPricePackage: 300,
  filterFlights: true, filterPackages: false, continentFilter: 'all',
})

export default function SearchPanel({ onSearch, loading }: { onSearch: (p: SearchParams) => void; loading: boolean }) {
  const [params, setParams] = useState<SearchParams>(defaultParams())
  const [destInput, setDestInput] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([])
  const [showSugg, setShowSugg] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showAir, setShowAir] = useState(false)
  const debouncedDest = useDebounce(destInput, 300)
  const destRef = useRef<HTMLDivElement>(null)
  const passRef = useRef<HTMLDivElement>(null)
  const airRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!debouncedDest || debouncedDest.length < 2) { setSuggestions([]); return }
    fetch(`/api/autocomplete?term=${encodeURIComponent(debouncedDest)}`).then(r => r.json()).then(setSuggestions).catch(() => setSuggestions([]))
  }, [debouncedDest])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowSugg(false)
      if (passRef.current && !passRef.current.contains(e.target as Node)) setShowPass(false)
      if (airRef.current && !airRef.current.contains(e.target as Node)) setShowAir(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const upd = (patch: Partial<SearchParams>) => setParams(p => ({ ...p, ...patch }))
  const toggleOrigin = (code: string) => setParams(p => {
    const has = p.origins.includes(code)
    if (has && p.origins.length === 1) return p
    return { ...p, origins: has ? p.origins.filter(o => o !== code) : [...p.origins, code] }
  })
  const setTripType = (t: TripType) => {
    const today = new Date()
    upd({ tripType: t, returnDateFrom: t !== 'oneway' ? formatDateForApi(addDays(today, 7)) : undefined, returnDateTo: t !== 'oneway' ? formatDateForApi(addDays(today, 14)) : undefined, minNights: t !== 'oneway' ? 3 : undefined, maxNights: t !== 'oneway' ? 14 : undefined })
  }
  const passLabel = `${params.adults} Erw.${params.children > 0 ? ', ' + params.children + ' Kind' : ''}${params.infants > 0 ? ', ' + params.infants + ' Baby' : ''} · ${params.cabinClass === 'M' ? 'Economy' : 'Business'}`

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="flex border-b border-slate-100">
        {([['oneway', <Plane size={15}/>, 'Hinflug'], ['roundtrip', <ArrowLeftRight size={15}/>, 'Hin + Rückflug'], ['package', <Package size={15}/>, 'Pauschal']] as const).map(([v, icon, label]) => (
          <button key={v} onClick={() => setTripType(v as TripType)} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all flex-1 justify-center ${params.tripType === v ? 'text-sky-600 border-b-2 border-sky-500 bg-sky-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {icon} {label}
          </button>
        ))}
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative" ref={airRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Abflughafen</label>
            <button onClick={() => setShowAir(v => !v)} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:border-sky-300 transition-colors">
              <span className="flex items-center gap-2"><Plane size={14} className="text-sky-400" />
                {params.origins.length === 1 ? AIRPORTS.find(a => a.code === params.origins[0])?.label : `${params.origins.join(', ')}`}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showAir && (
              <div className="absolute z-30 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                <button onClick={() => { upd({ origins: ['DUS', 'CGN', 'DTM'] }); setShowAir(false) }} className="w-full text-left px-4 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50">✓ Alle NRW (DUS + CGN + DTM)</button>
                {AIRPORTS.map(ap => (
                  <label key={ap.code} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={params.origins.includes(ap.code)} onChange={() => toggleOrigin(ap.code)} className="accent-sky-500" />
                    <span className="text-sm text-slate-700">{ap.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={destRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Ziel</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none" />
              <input type="text" value={destInput} onChange={e => { setDestInput(e.target.value); setShowSugg(true) }} onFocus={() => setShowSugg(true)}
                placeholder="Überall · Stadt oder Flughafen" className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white transition-colors" />
              {destInput && <button onClick={() => { setDestInput(''); upd({ destination: 'anywhere', destinationLabel: 'Überall' }) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={13} /></button>}
            </div>
            {!showSugg && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_DEST.map(d => (
                  <button key={d.code} onClick={() => { upd({ destination: d.code, destinationLabel: d.label.replace(/^\S+\s/, '') }); setDestInput('') }}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${params.destination === d.code ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            )}
            {showSugg && suggestions.length > 0 && (
              <div className="absolute z-30 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto">
                {suggestions.map(s => (
                  <button key={s.id} onClick={() => { upd({ destination: s.code, destinationLabel: `${s.city} (${s.code})` }); setDestInput(`${s.city} (${s.code})`); setShowSugg(false) }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50">
                    <div className="text-sm font-semibold text-slate-800">{s.city} <span className="text-xs font-bold text-sky-500">{s.code}</span></div>
                    <div className="text-xs text-slate-400">{s.country}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Abflug (von – bis)</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={params.departDateFrom.split('/').reverse().join('-')} onChange={e => upd({ departDateFrom: e.target.value.split('-').reverse().join('/') })} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400 w-full" />
              <input type="date" value={params.departDateTo.split('/').reverse().join('-')} onChange={e => upd({ departDateTo: e.target.value.split('-').reverse().join('/') })} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400 w-full" />
            </div>
          </div>
          {params.tripType !== 'oneway' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Rückkehr (von – bis)</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={(params.returnDateFrom ?? '').split('/').reverse().join('-')} onChange={e => upd({ returnDateFrom: e.target.value.split('-').reverse().join('/') })} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400 w-full" />
                <input type="date" value={(params.returnDateTo ?? '').split('/').reverse().join('-')} onChange={e => upd({ returnDateTo: e.target.value.split('-').reverse().join('/') })} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400 w-full" />
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Flexibilität</label>
          <div className="flex flex-wrap gap-2">
            {FLEX_MODES.map(m => (
              <button key={m.value} onClick={() => upd({ flexMode: m.value })} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${params.flexMode === m.value ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>{m.label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative" ref={passRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Reisende</label>
            <button onClick={() => setShowPass(v => !v)} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:border-sky-300 transition-colors">
              <span className="flex items-center gap-2"><Users size={14} className="text-sky-400" />{passLabel}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showPass && (
              <div className="absolute z-30 top-full mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 space-y-3">
                {([['adults', 'Erwachsene', '16+', 1, 8], ['children', 'Kinder', '2–15', 0, 4], ['infants', 'Babys', '0–1', 0, 2]] as const).map(([key, label, sub, min, max]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div><div className="text-sm font-semibold text-slate-700">{label}</div><div className="text-xs text-slate-400">{sub}</div></div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => upd({ [key]: Math.max(min, params[key] - 1) })} className="w-8 h-8 rounded-full border-2 border-slate-200 text-slate-600 font-bold hover:border-sky-400 hover:text-sky-600 transition-colors disabled:opacity-30" disabled={params[key] <= min}>–</button>
                      <span className="w-5 text-center font-bold text-slate-800">{params[key]}</span>
                      <button onClick={() => upd({ [key]: Math.min(max, params[key] + 1) })} className="w-8 h-8 rounded-full border-2 border-slate-200 text-slate-600 font-bold hover:border-sky-400 hover:text-sky-600 transition-colors disabled:opacity-30" disabled={params[key] >= max}>+</button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Klasse</div>
                  <div className="flex gap-2">
                    {[['M', 'Economy'], ['C', 'Business']].map(([v, l]) => (
                      <button key={v} onClick={() => upd({ cabinClass: v as any })} className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-all ${params.cabinClass === v ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-200 text-slate-600 hover:border-sky-300'}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Stopps</label>
            <div className="flex gap-1.5">
              {[['direct', 'Direkt'], ['max1', 'Max. 1'], ['any', 'Egal']].map(([v, l]) => (
                <button key={v} onClick={() => upd({ stops: v as StopFilter })} className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${params.stops === v ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-sky-300'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Gepäck</label>
            <div className="flex gap-1.5">
              {[['handonly', 'Hand'], ['checked', '+ Aufgabe']].map(([v, l]) => (
                <button key={v} onClick={() => upd({ baggage: v as any })} className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${params.baggage === v ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-sky-300'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Max. Preis: {params.maxPriceFlight} €</label>
            <input type="range" min={20} max={500} step={10} value={params.maxPriceFlight} onChange={e => upd({ maxPriceFlight: parseInt(e.target.value) })} className="w-full accent-sky-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>20 €</span>
              <div className="flex gap-2">
                {[70, 150].map(v => <button key={v} onClick={() => upd({ maxPriceFlight: v })} className={`px-2 py-0.5 rounded-full border text-xs font-medium transition-all ${params.maxPriceFlight === v ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-200 text-slate-500 hover:border-sky-300'}`}>unter {v} €</button>)}
              </div>
              <span>500 €</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Abflugzeit</label>
            <div className="flex gap-1.5">
              {[['any', 'Egal'], ['morning', '🌅 6–12'], ['afternoon', '☀️ 12–18'], ['evening', '🌙 18–24']].map(([v, l]) => (
                <button key={v} onClick={() => upd({ departureTime: v as any })} className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${params.departureTime === v ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-sky-300'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        {params.tripType !== 'oneway' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Min. Nächte</label>
              <select value={params.minNights ?? 3} onChange={e => upd({ minNights: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400">
                {[1,3,5,7,10,14].map(n => <option key={n} value={n}>{n} Nächte</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Max. Nächte</label>
              <select value={params.maxNights ?? 14} onChange={e => upd({ maxNights: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400">
                {[7,10,14,21,30].map(n => <option key={n} value={n}>{n} Nächte</option>)}
              </select>
            </div>
          </div>
        )}
        <button onClick={() => onSearch(params)} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-bold text-base py-3.5 rounded-xl transition-colors shadow-md hover:shadow-lg">
          <Search size={18} />
          {loading ? 'Suche läuft...' : 'Deals suchen'}
        </button>
      </div>
    </div>
  )
}
