import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'it'

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  tr: (en: string, it: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  tr: (en) => en,
})

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const params = new URLSearchParams(window.location.search)
  const urlLang = params.get('lang')?.toLowerCase()
  if (urlLang === 'it' || urlLang === 'en') return urlLang
  try {
    const saved = window.localStorage.getItem('matrix-warp-lang')
    if (saved === 'it' || saved === 'en') return saved
  } catch {
    // ignore storage errors
  }
  const nav = navigator.language?.toLowerCase() ?? 'en'
  return nav.startsWith('it') ? 'it' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang)

  const setLang = (next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem('matrix-warp-lang', next)
    } catch {
      // ignore storage errors
    }
  }

  useEffect(() => {
    document.documentElement.lang = lang
    document.title =
      lang === 'it'
        ? 'Matrix Warp — Visualizzatore 2D & 3D di Algebra Lineare, Spettro, Norme Lp e Solutori Ax=b'
        : 'Matrix Warp — Interactive 2D & 3D Linear Algebra, Eigenvalues, Lp Norms & Ax=b Solver Visualizer'
  }, [lang])

  const tr = (en: string, it: string) => (lang === 'it' ? it : en)

  return <I18nContext.Provider value={{ lang, setLang, tr }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
