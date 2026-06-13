'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type ContentItem = any

export default function AdminItemsPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [regions, setRegions] = useState<ContentItem[]>([])
  const [discoveries, setDiscoveries] = useState<ContentItem[]>([])
  const [imageState, setImageState] = useState<Record<string, { uploading?: boolean; error?: string; success?: string }>>({})
  const [activeTab, setActiveTab] = useState('items')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

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

  const handleUpload = async (contentType: string, id: string, file: File) => {
    const key = `${contentType}:${id}`
    setImageState(prev => ({ ...prev, [key]: { uploading: true } }))
    const formData = new FormData()
    formData.append('file', file)
    formData.append('contentType', contentType)
    formData.append('id', id)

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setImageState(prev => ({ ...prev, [key]: { uploading: false, success: data.iconPath } }))
        loadAll()
      } else {
        setImageState(prev => ({ ...prev, [key]: { uploading: false, error: data.error } }))
      }
    } catch (e: any) {
      setImageState(prev => ({ ...prev, [key]: { uploading: false, error: e.message } }))
    }
  }

  if (loading) return <div style={{ padding: '20px', color: '#888' }}>Loading...</div>

  const itemsNoImg = items.filter(it => !it.icon_path)
  const regionsNoImg = regions.filter(r => !r.icon_path)
  const discoveriesNoImg = discoveries.filter(d => !d.icon_path)
  const totalNoImg = itemsNoImg.length + regionsNoImg.length + discoveriesNoImg.length

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: '#ccc' }}>
      <h1 style={{ color: '#0ff', fontSize: '24px', marginBottom: '4px' }}>Admin — Content Manager</h1>
      <p style={{ color: '#555', fontSize: '10px', marginBottom: '20px' }}>
        Dev-only tools for managing game content. Upload 128x128 PNG images for each asset.
      </p>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'items', label: `Items (${items.length})` },
          { id: 'regions', label: `Regions (${regions.length})` },
          { id: 'discoveries', label: `Discoveries (${discoveries.length})` },
          { id: 'needs-images', label: `📷 Needs Images (${totalNoImg})` },
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

      {/* === Needs Images Tab === */}
      {activeTab === 'needs-images' && (
        <div>
          <div className="panel-header">NEEDS IMAGES ({totalNoImg})</div>
          {itemsNoImg.length > 0 && (
            <>
              <h3 style={{ color: '#0ff', fontSize: '12px', margin: '12px 0 6px' }}>Items ({itemsNoImg.length})</h3>
              <div className="feature-grid">
                {itemsNoImg.map(item => (
                  <ImageUploader key={`i:${item.id}`} item={item} contentType="item"
                    state={imageState[`item:${item.id}`]}
                    onUpload={(f) => handleUpload('item', item.id, f)} />
                ))}
              </div>
            </>
          )}
          {regionsNoImg.length > 0 && (
            <>
              <h3 style={{ color: '#0ff', fontSize: '12px', margin: '12px 0 6px' }}>Regions ({regionsNoImg.length})</h3>
              <div className="feature-grid">
                {regionsNoImg.map(r => (
                  <ImageUploader key={`r:${r.id}`} item={r} contentType="region"
                    state={imageState[`region:${r.id}`]}
                    onUpload={(f) => handleUpload('region', r.id, f)} />
                ))}
              </div>
            </>
          )}
          {discoveriesNoImg.length > 0 && (
            <>
              <h3 style={{ color: '#0ff', fontSize: '12px', margin: '12px 0 6px' }}>Discoveries ({discoveriesNoImg.length})</h3>
              <div className="feature-grid">
                {discoveriesNoImg.map(d => (
                  <ImageUploader key={`d:${d.id}`} item={d} contentType="discovery"
                    state={imageState[`discovery:${d.id}`]}
                    onUpload={(f) => handleUpload('discovery', d.id, f)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* === Items Tab === */}
      {activeTab === 'items' && (
        <div>
          <div className="panel-header">ALL ITEMS ({items.length})</div>
          <div className="feature-grid">
            {items.map(item => (
              <ImageUploader key={item.id} item={item} contentType="item"
                state={imageState[`item:${item.id}`]}
                onUpload={(f) => handleUpload('item', item.id, f)} />
            ))}
          </div>
        </div>
      )}

      {/* === Regions Tab === */}
      {activeTab === 'regions' && (
        <div>
          <div className="panel-header">REGIONS ({regions.length})</div>
          <div className="feature-grid">
            {regions.map(r => (
              <ImageUploader key={r.id} item={r} contentType="region"
                state={imageState[`region:${r.id}`]}
                onUpload={(f) => handleUpload('region', r.id, f)} />
            ))}
          </div>
        </div>
      )}

      {/* === Discoveries Tab === */}
      {activeTab === 'discoveries' && (
        <div>
          <div className="panel-header">DISCOVERIES ({discoveries.length})</div>
          <div className="feature-grid">
            {discoveries.map(d => (
              <ImageUploader key={d.id} item={d} contentType="discovery"
                state={imageState[`discovery:${d.id}`]}
                onUpload={(f) => handleUpload('discovery', d.id, f)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ImageUploader({ item, contentType, state, onUpload }: {
  item: any
  contentType: string
  state?: { uploading?: boolean; error?: string; success?: string }
  onUpload: (file: File) => void
}) {
  const hasIcon = !!item.icon_path
  return (
    <div style={{
      padding: '10px', border: '1px solid var(--border)',
      borderRadius: '2px', background: 'var(--bg-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        {hasIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.icon_path} alt={item.name}
            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />
        ) : (
          <div style={{
            width: '40px', height: '40px', background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)', borderRadius: '2px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', color: '#555',
          }}>?</div>
        )}
        <div>
          <div style={{ color: '#0ff', fontWeight: 'bold', fontSize: '12px' }}>{item.name}</div>
          <div style={{ color: '#555', fontSize: '9px' }}>{item.id}</div>
          {item.category && <div style={{ color: '#555', fontSize: '9px' }}>{item.category}</div>}
          {item.rarity && <div style={{ color: '#555', fontSize: '9px' }}>{item.rarity}</div>}
        </div>
      </div>
      {hasIcon && (
        <div style={{ fontSize: '9px', color: '#0f0', marginBottom: '4px' }}>
          ✓ {item.icon_path}
        </div>
      )}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
        }}
        style={{ width: '100%', fontSize: '10px', color: '#888' }}
        disabled={state?.uploading}
      />
      {state?.uploading && <div style={{ color: '#888', fontSize: '10px' }}>Uploading...</div>}
      {state?.success && <div style={{ color: '#0f0', fontSize: '10px' }}>Uploaded: {state.success}</div>}
      {state?.error && <div style={{ color: '#f44', fontSize: '10px' }}>Error: {state.error}</div>}
    </div>
  )
}
