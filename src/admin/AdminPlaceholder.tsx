import { Hammer } from 'lucide-react';

export function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-8">{title}</h1>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-16 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center border-dashed">
        <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mb-6">
          <Hammer size={40} />
        </div>
        <h3 className="text-2xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-3">Under Construction</h3>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
          The {title.toLowerCase()} management module is currently being built. Check back soon for updates.
        </p>
      </div>
    </div>
  );
}
