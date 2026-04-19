'use client'

import { Users, Lock } from 'lucide-react'

const GROUPS = [
  { name: 'DLSU Block 3A', members: 12, decks: 8 },
  { name: 'STEM Reviewers PH', members: 47, decks: 22 },
  { name: 'Nursing Board 2025', members: 31, decks: 15 },
]

const LEADERBOARD = [
  { name: 'aguindelacruz', pts: 620 },
  { name: 'amartezfern', pts: 380 },
  { name: 'altahorgaizster', pts: 310 },
]

const POPULAR = ['Gen Chem Finals', 'Kasaysayan ng Pilipinas', 'Calculus Basics', 'English Vocab']

export default function KommunityPage() {
  return (
    <div className="mx-auto px-4 py-8" style={{ maxWidth: '980px' }}>
      <div className="flex items-center gap-2 mb-2">
        <Users size={22} style={{ color: 'var(--orange)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>Kommunity</h1>
      </div>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Study groups, shared decks, and leaderboards with classmates.</p>

      <div className="relative rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--cream-border)' }}>
        {/* Blurred content */}
        <div className="filter blur-sm pointer-events-none select-none" style={{ background: 'white' }}>
          <div className="divide-y" style={{ borderColor: 'var(--cream-border)' }}>
            {GROUPS.map(g => (
              <div key={g.name} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: 'var(--orange-light)' }}>
                    {g.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--charcoal)' }}>{g.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{g.members} members · {g.decks} decks</p>
                  </div>
                </div>
                <button className="text-xs px-3 py-1 rounded-lg font-medium" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>JOIN</button>
              </div>
            ))}
          </div>

          <div className="border-t px-5 py-4" style={{ borderColor: 'var(--cream-border)' }}>
            <p className="text-xs font-semibold tracking-wider mb-3 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              🏆 Weekly leaderboard
            </p>
            {LEADERBOARD.map((u, i) => (
              <div key={u.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold w-4" style={{ color: 'var(--muted)' }}>{i + 1}</span>
                  <div className="w-6 h-6 rounded-full" style={{ background: 'var(--cream-dark)' }} />
                  <span className="text-sm" style={{ color: 'var(--charcoal)' }}>{u.name}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>{u.pts} pts</span>
              </div>
            ))}
          </div>

          <div className="border-t px-5 py-4" style={{ borderColor: 'var(--cream-border)' }}>
            <p className="text-xs font-semibold tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
              🔥 Popular this week
            </p>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR.map(p => (
                <div key={p} className="px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--cream)', color: 'var(--charcoal)' }}>{p}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center locked-overlay">
          <div className="text-center bg-white rounded-2xl shadow-lg p-8 mx-4">
            <Lock size={32} className="mx-auto mb-3" style={{ color: 'var(--orange)' }} />
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--charcoal)' }}>Coming in Clek²</h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Study groups, class leaderboards, and shared decks with your blockmates — all in one place.
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
