import { requireSession } from '@/lib/guards'

export default async function BrainLayoutGroup({
  children
}: {
  children: React.ReactNode
}) {
  await requireSession()
  return <>{children}</>
}
