'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Item = any
type Region = any
type Discovery = any

interface ImageState {
  [itemId: string]: {
    uploading: boolean
    error?: string
    success?: string
  }
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [imageState, setImageState] = useState<ImageState>({})
  const [activeTab, setActiveTab] = useState<string>('items')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    const [itemsRes, regionsRes, discoveriesRes] = await Promise.all([
      supabase.from('content_items').select('*').order('category').order('name'),
      supabase.from('content_regions').select('*').order('name'),
      supabase.from('content_discoveries').select('*').order('name'),
    ])
    setItems(itemsRes.data ?? [])
    setRegions(regionsRes.data ?? [])
    setDiscoveries(discoveriesRes.data ?? [])
    setLoading(false)
  }

  const handleUpload = async (itemId: string, file: File) => {
    setImageState(prev => ({ ...prev, [itemId]: { uploading: true } }))
    const formData = new FormData()
    formData.append('file', file)
    formData.append('itemId', itemId)

    try {
      const res = await fetch('/api/admin/upload-item-image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setImageState(prev => ({
          ...prev,
          [itemId]: { uploading: false, success: data.iconPath },
        }))
        loadAll()
      } else {
        setImageState(prev => ({
          ...prev,
          [itemId]: { uploading: false, error: data.error },
        }))
      }
    } catch (e: any) {
      setImageState(prev => ({
        ...prev,
        [itemId]: { uploading: false, error: e.message },
      }))
    }
  }

  if (loading) return <div style={{ padding: '20px', color: '#888' }}>Loading...</div>

  const itemsNeedingImages = items.filter(it => !it.icon_path)
  const itemsWithImages = items.filter(it => it.icon_path)

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: '#ccc' }}>
      <h1 style={{ color: '#0ff', fontSize: '24px', marginBottom: '4px' }}>Admin — Content Manager</h1>
      <p style={{ color: '#555', fontSize: '10px', marginBottom: '20px' }}>
        Dev-only tools for managing game content
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'items', label: `Items (${items.length})` },
          { id: 'needs-images', label: `Upload Images (${itemsNeedingImages.length})` },
          { id: 'regions', label: `Regions (${regions.length})` },
          { id: 'discoveries', label: `Discoveries (${discoveries.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--accent-dim)' : 'none',
              borderColor: activeTab === tab.id ? 'var(--accent)' : 'var(--border)',
              padding: '6px 12px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Items needing images */}
      {activeTab === 'needs-images' && (
        <div>
          <div className="panel-header">ITEMS NEEDING IMAGES ({itemsNeedingImages.length})</div>
          <p style={{ color: '#555', fontSize: '10px', marginBottom: '10px' }}>
            These items have no icon_path set. Upload 128x128 PNG images for each.
          </p>
          <div className="feature-grid">
            {itemsNeedingImages.map(item => (
              <ItemImageUploader
                key={item.id}
                item={item}
                state={imageState[item.id]}
                onUpload={(file) => handleUpload(item.id, file)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab: Items with images */}
      {activeTab === 'items' && (
        <div>
          <div className="panel-header">ALL ITEMS ({items.length})</div>
          {['gathering', 'production', 'special', 'token', 'consumable'].map(cat => {
            const catItems = items.filter(it => it.category === cat)
            if (catItems.length === 0) return null
            return (
              <div key={cat} style={{ marginBottom: '16px' }}>
                <h3 style={{ color: '#0ff', fontSize: '14px', marginBottom: '8px', textTransform: 'capitalize' }}>
                  {cat} ({catItems.length})
                </h3>
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#555' }}>
                      <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--border)' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--border)' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--border)' }}>Rarity</th>
                      <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--border)' }}>Icon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '4px', color: '#888', fontFamily: 'monospace' }}>{item.id}</td>
                        <td style={{ padding: '4px' }}>{item.name}</td>
                        <td style={{ padding: '4px', color: '#555' }}>{item.rarity}</td>
                        <td style={{ padding: '4px' }}>
                          {item.icon_path ? (
                            <span style={{ color: '#0f0' }}>
                              ✓ {item.icon_path}
                            </span>
                          ) : (
                            <span style={{ color: '#f44' }}>Missing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}

      {/* Regions tab */}
      {activeTab === 'regions' && (
        <div>
          <div className="panel-header">REGIONS ({regions.length})</div>
          {regions.map(r => (
            <div key={r.id} style={{
              padding: '10px', marginBottom: '8px',
              border: '1px solid var(--border)', borderRadius: '2px',
            }}>
              <div style={{ fontWeight: 'bold', color: '#0ff' }}>{r.name}</div>
              <div style={{ fontSize: '10px', color: '#888' }}>{r.description}</div>
              <div style={{ fontSize: '10px', color: '#555' }}>
                ID: {r.id} | Level: {r.level_required || 1} | Time: {r.exploration_base_time}s
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discoveries tab */}
      {activeTab === 'discoveries' && (
        <div>
          <div className="panel-header">DISCOVERIES ({discoveries.length})</div>
          <div className="feature-grid">
            {discoveries.map(d => (
              <div key={d.id} style={{
                padding: '10px', border: '1px solid var(--border)', borderRadius: '2px',
              }}>
                <div style={{ fontWeight: 'bold', color: '#0ff' }}>{d.name}</div>
                <div style={{ fontSize: '10px', color: '#555' }}>{d.id}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>{d.description}</div>
                <div style={{ fontSize: '10px', color: '#555' }}>Rarity: {d.rarity} | Value: {d.base_value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemImageUploader({ item, state, onUpload }: {
  item: any
  state?: { uploading?: boolean; error?: string; success?: string }
  onUpload: (file: File) => void
}) {
  return (
    <div style={{
      padding: '10px', border: '1px solid var(--border)',
      borderRadius: '2px', background: 'var(--bg-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{
          width: '40px', height: '40px', background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)', borderRadius: '2px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', color: '#555',
        }}>
          ?
        </div>
        <div>
          <div style={{ color: '#0ff', fontWeight: 'bold', fontSize: '12px' }}>{item.name}</div>
          <div style={{ color: '#555', fontSize: '9px' }}>{item.id}</div>
          <div style={{ color: '#555', fontSize: '9px', textTransform: 'capitalize' }}>
            {item.category} — {item.rarity}
          </div>
        </div>
      </div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
        }}
        style={{
          width: '100%', fontSize: '10px', color: '#888',
          marginBottom: '4px',
        }}
        disabled={state?.uploading}
      />
      {state?.uploading && <div style={{ color: '#888', fontSize: '10px' }}>Uploading...</div>}
      {state?.success && <div style={{ color: '#0f0', fontSize: '10px' }}>Uploaded: {state.success}</div>}
      {state?.error && <div style={{ color: '#f44', fontSize: '10px' }}>Error: {state.error}</div>}
    </div>
  )
}
