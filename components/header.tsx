import Image from "next/image";
import Link from "next/link";
import { Logo } from "./logo";

interface HeaderUser {
  name?: string | null;
  image?: string | null;
}

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
  user?: HeaderUser | null;
}

export function Header({ title, children, user }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:px-12">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-900 dark:text-white"
        >
          <Logo className="h-6 w-10" />
          <span className="text-xl font-normal">Prompts</span>
        </Link>
        {title && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-lg text-zinc-600 dark:text-zinc-400">
              {title}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {children && <nav className="flex items-center gap-4">{children}</nav>}
        {user && (
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-4 dark:border-zinc-700">
            {user.name && (
              <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:inline">
                {user.name}
              </span>
            )}
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || "User avatar"}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {user.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
