'use client'

import { useTranslation } from '@/lib/i18n'

interface SettingsTabProps {
  character: any
  onRefresh: () => Promise<void>
}

export function SettingsTab({ character, onRefresh }: SettingsTabProps) {
  const { t, locale, setLocale } = useTranslation()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t.settings.title}</h2>

      {/* Language */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.settings.language}</h3>
        <div className="flex gap-2">
          <button
            className={`btn ${locale === 'zh' ? 'btn-active' : ''}`}
            onClick={() => setLocale('zh')}
          >
            {t.settings.chinese}
          </button>
          <button
            className={`btn ${locale === 'en' ? 'btn-active' : ''}`}
            onClick={() => setLocale('en')}
          >
            {t.settings.english}
          </button>
        </div>
      </div>

      {/* Character Info */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.settings.character}</h3>
        <div className="text-sm space-y-1">
          <div><span className="opacity-60">{t.common.name}:</span> {character.name}</div>
          <div><span className="opacity-60">{t.common.level}:</span> {character.level}</div>
          <div><span className="opacity-60">{t.settings.origin}:</span> {character.origin_id}</div>
          <div><span className="opacity-60">{t.home.daysLived}:</span> {character.days_lived}</div>
        </div>
      </div>

      {/* Delete Character */}
      <div className="panel border border-red-500/50">
        <h3 className="font-bold mb-2 text-red-400">{t.settings.deleteCharacter}</h3>
        <p className="text-xs opacity-60 mb-2">{t.settings.deleteWarning}</p>
        <button className="btn-sm bg-red-600 hover:bg-red-700">
          {t.settings.deleteCharacter}
        </button>
      </div>
    </div>
  )
}
