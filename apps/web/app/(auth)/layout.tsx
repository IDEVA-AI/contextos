import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="canvas-paper relative min-h-screen flex flex-col">
      <div className="grain" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-md"
            style={{ background: '#C5F432' }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-zinc-900"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <title>ContextOS</title>
              <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
            </svg>
          </span>
          <span className="brand-mark text-base">CONTEXTOS</span>
        </Link>
        <span className="mono text-[10px] text-zinc-400">v0.1.0-alpha</span>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
