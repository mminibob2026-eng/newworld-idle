'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import en, { type TranslationKeys } from './en'
import zh from './zh'

type Locale = 'en' | 'zh'

const dictionaries: Record<Locale, any> = { en, zh }

type I18nContextType = {
  locale: Locale
  t: TranslationKeys
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  t: en,
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('nw-locale') as Locale) || 'en'
    }
    return 'en'
  })

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('nw-locale', l)
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'
  }, [])

  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return useContext(I18nContext)
}
