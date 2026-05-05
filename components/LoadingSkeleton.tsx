export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border-2 border-slate-100 p-5 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-200" />
              <div className="h-3 w-20 bg-slate-200 rounded" />
            </div>
            <div className="h-5 w-16 bg-slate-200 rounded-full" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-12 bg-slate-200 rounded" />
            <div className="flex-1 h-px bg-slate-200" />
            <div className="h-8 w-12 bg-slate-200 rounded" />
          </div>
          <div className="h-3 w-40 bg-slate-100 rounded mb-4" />
          <div className="flex items-end justify-between pt-3 border-t border-slate-100">
            <div>
              <div className="h-8 w-20 bg-slate-200 rounded mb-1" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
            <div className="h-10 w-28 bg-slate-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
