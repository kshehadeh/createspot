import Link from "next/link";
import { Logo } from "./logo";

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:px-12">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-zinc-900 dark:text-white">
          <Logo className="h-6 w-10" />
          <span className="text-xl font-normal">Prompts</span>
        </Link>
        {title && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-lg text-zinc-600 dark:text-zinc-400">{title}</span>
          </>
        )}
      </div>
      {children && (
        <nav className="flex items-center gap-4">
          {children}
        </nav>
      )}
    </header>
  );
}
