'use client'

import { useState } from 'react'
import { StorageView } from '@/components/storage-view'
import { DiscoveriesTab } from '@/components/discoveries-tab'

export function CollectionView({
  accountId, storage, onRefresh,
}: {
  accountId: string
  storage: any[]
  onRefresh: () => void
}) {
  const [subTab, setSubTab] = useState<'storage' | 'discoveries'>('discoveries')

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        <button
          onClick={() => setSubTab('discoveries')}
          style={{
            flex: 1, fontSize: '11px', padding: '8px',
            background: subTab === 'discoveries' ? 'var(--accent-dim)' : 'none',
            borderColor: subTab === 'discoveries' ? 'var(--accent)' : 'var(--border)',
            color: subTab === 'discoveries' ? '#0ff' : '#555',
            minHeight: '38px',
          }}
        >
          🔍 DISCOVERIES
        </button>
        <button
          onClick={() => setSubTab('storage')}
          style={{
            flex: 1, fontSize: '11px', padding: '8px',
            background: subTab === 'storage' ? 'var(--accent-dim)' : 'none',
            borderColor: subTab === 'storage' ? 'var(--accent)' : 'var(--border)',
            color: subTab === 'storage' ? '#0ff' : '#555',
            minHeight: '38px',
          }}
        >
          📦 STORAGE
        </button>
      </div>
      {subTab === 'discoveries' ? (
        <DiscoveriesTab key="disc" accountId={accountId} />
      ) : (
        <StorageView key="stor" storage={storage} onRefresh={onRefresh} />
      )}
    </div>
  )
}
