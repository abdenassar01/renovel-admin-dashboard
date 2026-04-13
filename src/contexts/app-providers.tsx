import { SidebarProvider } from '#/contexts/sidebar-context'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>
}
