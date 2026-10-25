import { ReactNode } from 'react'

export default function Layout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="h-full w-full grid grid-cols-1 md:grid-cols-[340px_1fr]">
      <aside className="border-r border-white/10 overflow-auto">
        {sidebar}
      </aside>
      <main className="relative overflow-hidden">{children}</main>
    </div>
  )
}
