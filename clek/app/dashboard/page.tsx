'use client'

import { BarChart2, Lock } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="mx-auto px-4 py-8" style={{ maxWidth: '980px' }}>
      <div className="flex items-center gap-2 mb-8">
        <BarChart2 size={22} style={{ color: 'var(--orange)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>Stats</h1>
      </div>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Track your study habits and progress over time.</p>

      {/* Blurred preview with lock */}
      <div className="relative rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--cream-border)' }}>
        {/* Blurred content */}
        <div className="filter blur-sm pointer-events-none select-none p-6" style={{ background: 'white' }}>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[['248', 'Cards studied'], ['84%', 'Accuracy'], ['12', 'Days active']].map(([val, label]) => (
              <div key={label} className="text-center p-4 rounded-xl" style={{ background: 'var(--cream)' }}>
                <p className="text-3xl font-extrabold mb-1" style={{ color: 'var(--charcoal)' }}>{val}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--cream)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>Cards studied per day</p>
            <div className="flex items-end gap-2 h-24">
              {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%`, background: 'var(--orange-light)' }} />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <span key={d} className="text-xs flex-1 text-center" style={{ color: 'var(--muted)' }}>{d}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--cream)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>Accuracy over time</p>
            <div className="h-20 flex items-end">
              <svg viewBox="0 0 300 80" className="w-full h-full">
                <polyline
                  points="0,70 50,55 100,40 150,60 200,30 250,20 300,15"
                  fill="none"
                  stroke="var(--orange-light)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center locked-overlay">
          <div className="text-center bg-white rounded-2xl shadow-lg p-8 mx-4">
            <Lock size={32} className="mx-auto mb-3" style={{ color: 'var(--orange)' }} />
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--charcoal)' }}>Coming in Clek²</h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Detailed study stats, accuracy tracking, and daily activity — dropping with the Clek² launch.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center mt-6 text-sm" style={{ color: 'var(--muted)' }}>
        ← <a href="/decks" className="font-medium" style={{ color: 'var(--orange)' }}>Your decks</a>
      </p>
    </div>
  )
}
