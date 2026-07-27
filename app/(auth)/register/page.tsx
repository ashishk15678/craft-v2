"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const stepTitles = { 1: "Identity", 2: "Security" };

  const handleNext = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passkeys do not match.");
      return;
    }

    setError("");
    setIsSubmitted(true);

    const { error: signUpError } = await authClient.signUp.email({
      name: formData.username,
      username: formData.username,
      email: formData.email,
      password: formData.password,
    });

    setIsSubmitted(false);

    if (signUpError) {
      setError(signUpError.message ?? "Unable to create your account.");
      return;
    }

    router.replace("/dashboard");
  };

  const handleBack = () => {
    setError("");
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2);
  };

  return (
    <div className="min-h-[calc(100vh-2.5rem)] w-full flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl overflow-hidden">
        <div className="w-full min-w-sm space-y-4 text-text font-sans">
          {/* Progress Bar */}
          <div className="h-1.5 w-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>

          {/* Header */}
          <div className="px-4 flex items-baseline justify-between overflow-hidden">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase black-ops-one-regular">
                Create Account
              </h1>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">
                Fill below form
              </p>
            </div>
            <div className="relative h-6 overflow-hidden flex items-center justify-end">
              <AnimatePresence mode="wait">
                <motion.span
                  key={step}
                  initial={{ y: 16, opacity: 0, filter: "blur(6px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -16, opacity: 0, filter: "blur(6px)" }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-sm text-zinc-400 font-bold uppercase font-mono tracking-wider"
                >
                  {stepTitles[step]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleNext} className="space-y-4 px-4 pb-4">
            {error && (
              <p
                role="alert"
                className="rounded-lg border p-1 text-xs font-mono text-red-400"
              >
                {error}
              </p>
            )}

            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-zinc-400 flex justify-between">
                    <span>Username</span>
                    {formData.username.length >= 3 && (
                      <span className="text-emerald-400">✓ Valid</span>
                    )}
                  </label>
                  <input
                    autoFocus
                    type="text"
                    required
                    minLength={3}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ShadowSlayer"
                    className="w-full bg-accent text-sm px-3 py-2 rounded-lg text-text placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-zinc-400 flex justify-between">
                    <span>Email Address</span>
                    {formData.email.includes("@") && (
                      <span className="text-emerald-400">✓ Valid</span>
                    )}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="hero@realm.io"
                    className="w-full bg-accent text-sm px-3 py-2 rounded-lg text-text placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: SECURITY */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-zinc-400 flex justify-between">
                    <span>Passkey</span>
                    {formData.password.length >= 6 && (
                      <span className="text-indigo-400">✓ Strong</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      autoFocus
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full bg-accent text-sm px-3 py-2 rounded-lg text-text placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono pr-12"
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

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-zinc-400 flex justify-between">
                    <span>Confirm Passkey</span>
                    {formData.confirmPassword && formData.confirmPassword === formData.password && (
                      <span className="text-emerald-400">✓ Matches</span>
                    )}
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full bg-accent text-sm px-3 py-2 rounded-lg text-text placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex gap-2 pt-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-1/3 bg-accent text-text font-mono text-xs py-2 rounded-lg border-8 border-border transition-all active:scale-[0.98]"
                >
                  BACK
                </button>
              )}

              <button
                type="submit"
                className={`relative group overflow-hidden rounded-lg border-8 border-indigo-500 bg-indigo-600 py-2 text-sm font-bold text-white transition-all active:scale-[0.98] ${
                  step > 1 ? "w-2/3" : "w-full"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 font-mono uppercase tracking-wider">
                  {isSubmitted ? (
                    <>Registering...</>
                  ) : step === 2 ? (
                    <>Register ➔</>
                  ) : (
                    <>NEXT STEP ➔</>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <p className="px-4 py-3 text-center text-xs text-zinc-400">
        Already registered?{" "}
        <Link href="/login" className="font-mono text-indigo-400 hover:text-indigo-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
