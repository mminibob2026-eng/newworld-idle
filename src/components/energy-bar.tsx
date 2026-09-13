'use client'

import { useTranslation } from '@/lib/i18n'

interface EnergyBarProps {
  current: number
  max: number
}

export function EnergyBar({ current, max }: EnergyBarProps) {
  const { t } = useTranslation()
  const pct = Math.min(100, (current / max) * 100)
  const isLow = pct < 25
  const isFull = pct >= 100

  return (
    <div className="energy-bar-container">
      <div className="energy-bar-label">
        <span>{t.common.energy}</span>
        <span className="energy-bar-value">{current}/{max}</span>
      </div>
      <div className="energy-bar-track">
        <div
          className={`energy-bar-fill ${isLow ? 'low' : ''} ${isFull ? 'full' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="energy-bar-recovery">{t.home.energyRecovery}</div>
    </div>
  )
}
