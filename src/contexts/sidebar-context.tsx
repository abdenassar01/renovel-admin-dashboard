import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

type SidebarContextType = {
  isOpen: boolean
  isMobileOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  toggleMobile: () => void
  closeMobile: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setMobileOpen] = useState(false)

  const openSidebar = useCallback(() => setIsOpen(true), [])
  const closeSidebar = useCallback(() => setIsOpen(false), [])
  const toggleSidebar = useCallback(() => setIsOpen((p) => !p), [])
  const toggleMobile = useCallback(() => setMobileOpen((p) => !p), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isMobileOpen,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        toggleMobile,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
