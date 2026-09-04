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
      ? await authClient.signIn.email(
          {
            email: formData.identifier,
            password: formData.password,
          },
          {},
        )
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
    <div className="h-[calc(100vh-(var(--spacing)*10))] w-full flex flex-col items-center justify-center">
      <div className="bg-card border border-border rounded-xl ">
        <div className="w-full max-w-md min-w-sm mx-auto space-y-6 text-text font-sans py-1">
          <div className="space-y-2 px-4">
            <h1 className="text-2xl font-black tracking-tight uppercase black-ops-one-regular">
              Authentication
            </h1>
            <p className="text-xs text-zinc-400">
              Enter your credentials to enter the arena.
            </p>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4 p-2">
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
                {formData.identifier && (
                  <span className="text-emerald-400">✓ Ready</span>
                )}
              </label>
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                  placeholder="hero@realm.io"
                  className="w-full bg-accent text-sm px-4 py-1 rounded-lg text-text placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-zinc-400 flex justify-between">
                <span>Secret Passkey</span>
                {formData.password.length >= 6 && (
                  <span className="text-indigo-600">✓ Encrypted</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••••••"
                  className="w-full bg-accent text-sm px-4 py-1 rounded-lg text-text  placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono pr-12"
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
              <a
                href="#"
                className="text-indigo-500 hover:text-indigo-300 font-mono"
              >
                Lost Cipher?
              </a>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className="w-full relative group overflow-hidden rounded-lg  bg-linear-to-b from-indigo-400 to-indigo-600 py-2 text-sm font-bold text-white transition-all active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 font-mono uppercase tracking-wider">
                {isSubmitted ? (
                  <>
                    <span className="animate-spin text-xl">⚙</span> Logging
                    in...
                  </>
                ) : (
                  <>LOGIN</>
                )}
              </span>
            </button>
          </form>

          {/*<div className="relative flex items-center justify-center px-2">
        <div className="border-t border-zinc-800 w-full" />
        <span className="bg-accent px-3 text-[12px] font-mono uppercase text-text absolute">
          OR
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 px-2 py-1">
        <button
          type="button"
          onClick={() => handleOAuthLogin("google")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-accent border border-border rounded-lg text-xs font-mono text-text transition-all active:scale-[0.98] hover:border-indigo-500"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z"
            />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuthLogin("github")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-accent border border-zinc-700/50 rounded-lg text-xs font-mono text-text transition-all active:scale-[0.98] hover:border-indigo-500"
        >
          <svg className="w-4 h-4 fill-current shrink-0 text-text" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>GitHub</span>
        </button>
      </div>*/}
        </div>
      </div>
      <p className="px-4 py-2 text-center text-xs text-zinc-400">
        New to the arena?{" "}
        <Link
          href="/register"
          className="font-mono text-indigo-400 hover:text-indigo-300"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
