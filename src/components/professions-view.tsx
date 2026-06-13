'use client'

import { useState } from 'react'
import { ProfessionTab } from '@/components/profession-tab'

export function ProfessionsView({
  characterId, accountId, professions, onRefresh, notify, showProfessionReward,
}: {
  characterId: string
  accountId: string
  professions: any[]
  onRefresh: () => void
  notify: (msg: string) => void
  showProfessionReward: (data: any, name: string) => void
}) {
  const [subTab, setSubTab] = useState<'gathering' | 'production'>('gathering')

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        <button
          onClick={() => setSubTab('gathering')}
          style={{
            flex: 1, fontSize: '11px', padding: '8px',
            background: subTab === 'gathering' ? 'var(--accent-dim)' : 'none',
            borderColor: subTab === 'gathering' ? 'var(--accent)' : 'var(--border)',
            color: subTab === 'gathering' ? '#0ff' : '#555',
            minHeight: '38px',
          }}
        >
          ⛏ GATHER
        </button>
        <button
          onClick={() => setSubTab('production')}
          style={{
            flex: 1, fontSize: '11px', padding: '8px',
            background: subTab === 'production' ? 'var(--accent-dim)' : 'none',
            borderColor: subTab === 'production' ? 'var(--accent)' : 'var(--border)',
            color: subTab === 'production' ? '#0ff' : '#555',
            minHeight: '38px',
          }}
        >
          🔧 CRAFT
        </button>
      </div>
      {subTab === 'gathering' ? (
        <ProfessionTab key="gather" category="gathering" characterId={characterId} accountId={accountId} professions={professions} onRefresh={onRefresh} notify={notify} showReward={showProfessionReward} />
      ) : (
        <ProfessionTab key="craft" category="production" characterId={characterId} accountId={accountId} professions={professions} onRefresh={onRefresh} notify={notify} showReward={showProfessionReward} />
      )}
    </div>
  )
}
