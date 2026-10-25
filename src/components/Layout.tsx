import type { ReactNode } from 'react'

export default function Layout({
  sidebar,
  children,
}: {
  sidebar: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col lg:flex-row w-screen h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside className="w-full lg:w-[410px] xl:w-[440px] h-[46vh] lg:h-full shrink-0 overflow-hidden z-20 shadow-2xl">
        {sidebar}
      </aside>
      <main className="flex-1 h-[54vh] lg:h-full relative overflow-hidden">{children}</main>
    </div>
  )
}
