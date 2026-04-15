"use client";

import { useAuth } from "@clerk/nextjs";
import { SignInButton, UserButton } from "@clerk/nextjs";

export default function AuthButtons() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <div className="w-8 h-8" />;

  if (isSignedIn) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
      />
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="px-3.5 py-1.5 rounded-xl border border-[var(--sand)] bg-[var(--card)] text-[var(--ink)] text-sm font-medium hover:border-[var(--amber)] hover:text-[var(--amber)] transition-all">
        Sign in
      </button>
    </SignInButton>
  );
}
