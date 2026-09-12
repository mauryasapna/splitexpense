import SplitForm from "@/components/SplitForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white text-lg font-black shadow-md shadow-violet-500/20">
              ➗
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-500 bg-clip-text text-transparent">
                  SplitKaro
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 -mt-0.5">6-Table Relational Schema Edition</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                🟢 DB Connected
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                ⚡ Node.js REST APIs
              </span>
            </div>
            <a
              href="#split-section"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition shadow-sm"
            >
              + Split Bill
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-8 pb-4 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-200/60 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 text-xs font-semibold">
          <span>🏗️</span> Architecture: 6 Relational Tables • Node.js REST API • Supabase PostgreSQL
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
          Smart Expense Splitting &amp; Settlement <br />
          <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-500 bg-clip-text text-transparent">
            Built Strictly to Your DB Schema
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Manage groups (<code className="font-mono text-violet-500">split_group</code>), members (<code className="font-mono text-violet-500">group_members</code>), users &amp; roles (<code className="font-mono text-violet-500">users</code>, <code className="font-mono text-violet-500">users_role</code>), categories (<code className="font-mono text-violet-500">expense_category</code>), and live logs (<code className="font-mono text-violet-500">expense_log</code>).
        </p>
      </section>

      {/* Main Split Form Section */}
      <main id="split-section" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4">
        <SplitForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 px-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <p>© {new Date().getFullYear()} SplitKaro • Built with Next.js, Node.js REST APIs &amp; Supabase PostgreSQL.</p>
      </footer>
    </div>
  );
}
