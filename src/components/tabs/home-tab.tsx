'use client'

import { useTranslation } from '@/lib/i18n'

interface HomeTabProps {
  character: any
  onRefresh: () => Promise<void>
}

export function HomeTab({ character, onRefresh }: HomeTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t.home.title}</h2>

      {/* Character Overview */}
      <div className="panel">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs opacity-60">{t.home.level}</div>
            <div className="text-lg font-bold">{character.level}</div>
          </div>
          <div>
            <div className="text-xs opacity-60">{t.common.gold}</div>
            <div className="text-lg font-bold">{character.gold}</div>
          </div>
          <div>
            <div className="text-xs opacity-60">{t.home.daysLived}</div>
            <div className="text-lg font-bold">{character.days_lived}</div>
          </div>
          <div>
            <div className="text-xs opacity-60">{t.home.lifeStage}</div>
            <div className="text-lg font-bold">{character.life_stage}</div>
          </div>
        </div>
      </div>

      {/* Personal Stats */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.common.attributes}</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {(['strength', 'dexterity', 'intelligence', 'endurance', 'luck', 'charisma'] as const).map(stat => (
            <div key={stat} className="flex justify-between">
              <span className="opacity-60">{stat.charAt(0).toUpperCase() + stat.slice(1, 3)}</span>
              <span className="font-bold">{character[stat]}</span>
            </div>
          ))}
        </div>
        {character.stat_points > 0 && (
          <div className="mt-2 text-xs text-amber-400">
            {t.common.statPoints}: {character.stat_points}
          </div>
        )}
      </div>

      {/* Vitals */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.home.stress} / {t.home.fatigue}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs opacity-60">{t.home.stress}</div>
            <div className="progress-bar">
              <div className="progress-fill bg-red-500" style={{ width: `${Math.min(100, character.stress)}%` }} />
            </div>
            <div className="text-xs text-right">{character.stress}/100</div>
          </div>
          <div>
            <div className="text-xs opacity-60">{t.home.fatigue}</div>
            <div className="progress-bar">
              <div className="progress-fill bg-yellow-500" style={{ width: `${Math.min(100, character.fatigue)}%` }} />
            </div>
            <div className="text-xs text-right">{character.fatigue}/100</div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="panel opacity-60 text-xs">
        <span className="font-bold">{t.common.tip}: </span>
        {t.common.tips[Math.floor(Math.random() * 10) + 1 as keyof typeof t.common.tips]}
      </div>
    </div>
  )
}
