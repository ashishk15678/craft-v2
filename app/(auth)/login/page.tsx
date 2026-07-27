"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitted(true);
    setError("");

    const isEmail = formData.identifier.includes("@");
    const { error: signInError } = isEmail
      ? await authClient.signIn.email({
          email: formData.identifier,
          password: formData.password,
        }, {})
      : await authClient.signIn.username({
          username: formData.identifier,
          password: formData.password,
        });

    setIsSubmitted(false);

    if (signInError) {
      setError(signInError.message ?? "Invalid username, email, or passkey.");
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-2.5rem)] w-full flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl overflow-auto">

        <div className="w-full md:min-w-sm space-y-6 text-text font-sans py-1">
          <div className="space-y-2 px-4 pt-2">
            <h1 className="text-2xl font-black tracking-tight uppercase black-ops-one-regular">
              Authentication
            </h1>
            <p className="text-xs text-zinc-400">Enter your credentials to enter the arena.</p>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            {error && (
              <p
                role="alert"
                className="rounded-lg p-1 text-xs font-mono text-red-400"
              >
                {error}
              </p>
            )}

            {/* Identifier Field */}
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-zinc-400 flex justify-between">
                <span>Username or Email</span>
                {formData.identifier && <span className="text-emerald-400">✓ Ready</span>}
              </label>
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  placeholder="hero@realm.io"
                  className="w-full bg-accent text-sm px-4 py-2 rounded-lg text-text placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-zinc-400 flex justify-between">
                <span>Secret Passkey</span>
                {formData.password.length >= 6 && <span className="text-indigo-600">✓ Encrypted</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-accent text-sm px-4 py-2 rounded-lg text-text placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-text hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? "HIDE" : "VIEW"}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200">
                <input
                  type="checkbox"
                  className="rounded bg-zinc-900 border-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                />
                <span>Remember Guild</span>
              </label>
              <a href="#" className="text-indigo-400 hover:text-indigo-300 font-mono">
                Lost Cipher?
              </a>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className="w-full relative group overflow-hidden rounded-lg border-8 border-indigo-500 bg-indigo-600 py-2 text-sm font-bold text-white transition-all active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 font-mono uppercase tracking-wider">
                {isSubmitted ? (
                  <>
                    <span className="animate-spin">⚙</span> INITIALIZING SESSION...
                  </>
                ) : (
                  <>READY TO PLAY ➔</>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
      <p className="px-4 py-3 text-center text-xs text-zinc-400">
        New to the arena?{" "}
        <Link href="/register" className="font-mono text-indigo-400 hover:text-indigo-300">
          Create an account
        </Link>
      </p>
    </div>
  );
}
