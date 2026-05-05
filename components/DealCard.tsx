'use client'
import { FlightDeal } from '@/lib/types'
import { formatPrice, formatDate, formatTime, formatDuration, getNights } from '@/lib/utils'
import { Plane, Clock, Zap, ExternalLink } from 'lucide-react'

export default function DealCard({ deal }: { deal: FlightDeal }) {
  const nights = deal.returnDate ? getNights(deal.departDate, deal.returnDate) : null
  return (
    <div className={`relative bg-white rounded-2xl border-2 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${deal.isBestDeal ? 'border-sky-400 shadow-sky-100 shadow-lg' : 'border-slate-100 hover:border-sky-200'}`}>
      {deal.isBestDeal && (
        <div className="absolute -top-3 left-4 z-10">
          <span className="inline-flex items-center gap-1 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            <Zap size={11} fill="white" /> Bester Deal
          </span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: deal.airlineColor }} />
            <span className="text-sm font-medium text-slate-500">{deal.airline}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {deal.direct && <span className="tag-green text-xs px-2 py-0.5 rounded-full font-medium">Direktflug</span>}
            {!deal.direct && <span className="tag-yellow text-xs px-2 py-0.5 rounded-full font-medium">{deal.stops} Stopp{deal.stops > 1 ? 's' : ''}</span>}
            {deal.baggageIncluded && <span className="tag-blue text-xs px-2 py-0.5 rounded-full font-medium">Handgepäck</span>}
            {deal.type === 'package' && <span className="tag-purple text-xs px-2 py-0.5 rounded-full font-medium">Pauschal</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-center">
            <div className="text-2xl font-black text-slate-900">{deal.fromCode}</div>
            <div className="text-xs text-slate-400 truncate max-w-[60px]">{deal.fromCity}</div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 w-full">
              <div className="h-px flex-1 bg-slate-200" />
              <Plane size={14} className="text-sky-400" />
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <span className="text-xs text-slate-400">{formatDuration(deal.durationMinutes)}</span>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-slate-900">{deal.toCode}</div>
            <div className="text-xs text-slate-400 truncate max-w-[60px]">{deal.toCity}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Clock size={12} />
          <span>{formatDate(deal.departDate)} · {formatTime(deal.departDate)}</span>
          {deal.returnDate && nights && <><span className="text-slate-300">→</span><span>{formatDate(deal.returnDate)} ({nights}N)</span></>}
        </div>
        <div className="flex items-end justify-between pt-3 border-t border-slate-100">
          <div>
            <div className="text-3xl font-black text-slate-900">{formatPrice(deal.price)}</div>
            <div className="text-xs text-slate-400 mt-0.5">/ Person · {deal.type === 'package' ? 'Pauschal' : deal.returnDate ? 'Hin+Rück' : 'Hinflug'}</div>
          </div>
          <a href={deal.deepLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            Buchen <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  )
}
