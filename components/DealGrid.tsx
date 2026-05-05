'use client'
import { FlightDeal, SortOption } from '@/lib/types'
import { sortDeals } from '@/lib/utils'
import DealCard from './DealCard'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'price_asc', label: '💰 Günstigste' },
  { value: 'price_desc', label: '💎 Teuerste' },
  { value: 'date_asc', label: '📅 Früheste' },
  { value: 'duration_asc', label: '⚡ Kürzeste' },
]

interface Props {
  deals: FlightDeal[]
  sortBy: SortOption
  onSortChange: (s: SortOption) => void
  origins: string[]
  destination: string
  lastRefresh: Date | null
}

export default function DealGrid({ deals, sortBy, onSortChange, origins, destination, lastRefresh }: Props) {
  const sorted = sortDeals(deals, sortBy)
  const refreshStr = lastRefresh ? lastRefresh.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : null
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{deals.length} Deals gefunden</span>
          {' · '}{origins.join(', ')} → {destination}
          {refreshStr && <span className="ml-2 text-slate-400">· {refreshStr} Uhr</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => onSortChange(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${sortBy === opt.value ? 'bg-sky-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">✈️</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Keine Deals gefunden</h3>
          <p className="text-slate-500 text-sm">Versuche andere Filter oder einen höheren Maximalpreis</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map(deal => <DealCard key={deal.id} deal={deal} />)}
        </div>
      )}
    </div>
  )
}
