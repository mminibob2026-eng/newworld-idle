'use client'

import { RARITY_COLORS } from '@/lib/game-data'

type StorageItem = any

export function StorageView({
  storage,
  onRefresh,
}: {
  storage: StorageItem[]
  onRefresh: () => void
}) {
  const categories = [...new Set(storage.map(s => s.content_items?.category || 'unknown'))]

  return (
    <div>
      <div className="panel-header">SHARED STORAGE</div>
      <p style={{ color: '#888', fontSize: '10px', marginBottom: '8px' }}>
        Account-wide storage. All characters can access these items.
      </p>

      {storage.length === 0 && (
        <div style={{ color: '#555', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
          Storage is empty. Start gathering resources!
        </div>
      )}

      {categories.map(cat => {
        const items = storage.filter(s => s.content_items?.category === cat)
        return (
          <div key={cat} style={{ marginBottom: '12px' }}>
            <div style={{ color: '#0ff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
              {cat}
            </div>
            <div className="feature-grid">
              {items.map(item => (
                <div key={item.id} className="card" style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '12px',
                      color: RARITY_COLORS[item.content_items?.rarity as keyof typeof RARITY_COLORS] || '#888',
                      fontWeight: 'bold',
                    }}>
                      {item.content_items?.name || item.item_id}
                    </span>
                    <span style={{ color: '#fff', fontSize: '13px' }}>
                      {item.quantity.toLocaleString()}
                    </span>
                  </div>
                  {item.content_items?.description && (
                    <div style={{ color: '#555', fontSize: '9px', marginTop: '2px' }}>
                      {item.content_items.description}
                    </div>
                  )}
                  <div style={{ fontSize: '9px', color: '#555', marginTop: '4px' }}>
                    Value: {item.content_items?.base_value || 0} Gold
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {storage.length > 0 && (
        <div style={{ fontSize: '10px', color: '#555', textAlign: 'center', marginTop: '8px' }}>
          Total: {storage.reduce((sum, s) => sum + Number(s.quantity), 0).toLocaleString()} items
        </div>
      )}
    </div>
  )
}
