export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8 py-32 px-8">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          SimpleInvoice
        </h1>
        <p className="max-w-md text-center text-lg text-zinc-600 dark:text-zinc-400">
          Create and manage invoices for your freelance business. Fast, simple, and professional.
        </p>
        <a
          href="/invoices"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Get Started
        </a>
      </main>
    </div>
  );
}
