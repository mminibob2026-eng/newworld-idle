'use client'

import { useTranslation } from '@/lib/i18n'

interface DiscoverTabProps {
  character: any
  onRefresh: () => Promise<void>
}

export function DiscoverTab({ character, onRefresh }: DiscoverTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t.discover.title}</h2>

      <div className="panel">
        <h3 className="font-bold mb-2">{t.discover.collections}</h3>
        <p className="text-sm opacity-60">{t.common.loading}</p>
      </div>

      <div className="panel">
        <h3 className="font-bold mb-2">{t.discover.achievements}</h3>
        <p className="text-sm opacity-60">{t.common.loading}</p>
      </div>

      <div className="panel">
        <h3 className="font-bold mb-2">{t.discover.talents}</h3>
        <p className="text-sm opacity-60">{t.common.loading}</p>
      </div>
    </div>
  )
}
