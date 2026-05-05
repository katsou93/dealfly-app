'use client'
import { RefreshCw, Timer } from 'lucide-react'

interface Props {
  loading: boolean
  lastRefresh: Date | null
  autoRefresh: boolean
  autoRefreshInterval: 5 | 10 | 30
  onRefresh: () => void
  onToggleAuto: () => void
  onIntervalChange: (v: 5 | 10 | 30) => void
}

export default function RefreshBar({ loading, lastRefresh, autoRefresh, autoRefreshInterval, onRefresh, onToggleAuto, onIntervalChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={onRefresh} disabled={loading}
        className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Lädt...' : 'Aktualisieren'}
      </button>
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
        <Timer size={14} className="text-slate-400" />
        <span className="text-sm text-slate-600 font-medium">Auto:</span>
        <button onClick={onToggleAuto}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoRefresh ? 'bg-sky-500' : 'bg-slate-200'}`}>
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
        {autoRefresh && (
          <select value={autoRefreshInterval} onChange={e => onIntervalChange(Number(e.target.value) as 5 | 10 | 30)}
            className="text-xs border-none bg-transparent text-slate-600 focus:outline-none cursor-pointer">
            <option value={5}>5 Min</option>
            <option value={10}>10 Min</option>
            <option value={30}>30 Min</option>
          </select>
        )}
      </div>
      {lastRefresh && (
        <span className="text-xs text-slate-400">
          Zuletzt: {lastRefresh.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
        </span>
      )}
    </div>
  )
}
