import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * ThemeProvider — 방 전체의 Light / Dark 분위기를 관리한다.
 * data-theme 속성을 <html>에 반영하여 CSS 변수 기반으로 방 전체가 함께 바뀐다.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // 기본값은 낮(day). 창문을 클릭하면 낮 ↔ 밤(Light/Dark)이 전환된다.
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
