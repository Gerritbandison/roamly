import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[var(--ink)]">
            Roam<span className="italic text-[var(--amber)]">ly</span>
          </h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            Create an account to start planning trips
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border border-[var(--sand)]",
            },
          }}
        />
      </div>
    </div>
  );
}
