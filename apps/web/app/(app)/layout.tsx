import { Sidebar } from '@/components/sidebar'
import { requireSession } from '@/lib/guards'

export default async function AppLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await requireSession()

  return (
    <div className="canvas-paper relative min-h-screen flex">
      <div className="grain" />
      <Sidebar userId={session.userId} email={session.email} />
      <main className="relative z-10 flex-1 min-w-0 px-8 py-8">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
