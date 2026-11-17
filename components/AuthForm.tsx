"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login, register } from "@/lib/api";
import { saveSession } from "@/lib/auth";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { token, user } = isRegister
        ? await register(name, email, password)
        : await login(email, password);
      saveSession(token, user);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const label = "kicker mb-1.5 block";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-0 px-5 py-10 sm:px-8 lg:grid-cols-2">
      {/* Color block with the pitch */}
      <div className="flex min-h-[18rem] flex-col justify-between border-2 border-line bg-mustard p-7 lg:border-r-0">
        <p className="kicker">{isRegister ? "New account" : "Members"}</p>
        <div>
          <h1 className="display text-[clamp(3rem,8vw,6rem)]">
            {isRegister ? "Join" : "Sign"}
            <br />
            {isRegister ? "Nexa." : "in."}
          </h1>
          <p className="mt-4 max-w-sm text-sm font-semibold">
            {isRegister
              ? "Your own Drive, videos and calendar, all inside the same search."
              : "Reach your files, videos, calendar and private search results."}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 border-2 border-line bg-surface p-7">
        {isRegister && (
          <div>
            <label className={label}>Name</label>
            <input className="input" value={name} required onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div>
          <label className={label}>Email</label>
          <input className="input" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={label}>Password</label>
          <input className="input" type="password" value={password} required minLength={isRegister ? 8 : undefined}
            onChange={(e) => setPassword(e.target.value)} />
          {isRegister && <p className="mt-1.5 text-xs font-medium text-mute">At least 8 characters.</p>}
        </div>

        {error && <p className="border-2 border-danger px-3 py-2 text-sm font-bold text-danger">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full py-3.5">
          {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>

        <p className="text-sm font-medium">
          {isRegister ? "Already have an account? " : "No account yet? "}
          <Link href={isRegister ? "/login" : "/register"} className="link">
            {isRegister ? "Sign in" : "Create one"}
          </Link>
        </p>
      </form>
    </div>
  );
}
