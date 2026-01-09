"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function StyledSignInButton() {
  return (
    <Button onClick={() => signIn("google")} size="lg">
      Sign in with Google
    </Button>
  );
}
