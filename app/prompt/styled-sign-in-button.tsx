"use client";

import { signIn } from "next-auth/react";

export function StyledSignInButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-8 text-sm font-medium text-white shadow-lg transition-all hover:bg-violet-500 hover:shadow-xl"
    >
      Sign in with Google
    </button>
  );
}

