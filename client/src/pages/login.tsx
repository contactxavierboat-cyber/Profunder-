import { useState } from "react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { ProfundrLogo } from "@/components/profundr-logo";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/register" : "/api/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Something went wrong" }));
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("studio_logged_in", "true");
      window.location.href = data.subscriptionStatus === "active" ? "/" : "/subscription";
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#eee] px-6 py-4 flex items-center justify-between">
        <button onClick={() => setLocation("/")} data-testid="login-logo">
          <ProfundrLogo size="sm" variant="dark" />
        </button>
        <button onClick={() => setLocation("/")} className="text-[13px] text-[#888] hover:text-[#111] transition-colors" data-testid="login-back">
          ← Back to Home
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <h1
              className="text-[28px] font-[800] tracking-[-0.025em] text-[#000] mb-2"
              data-testid="login-heading"
            >
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-[14px] text-[#888]">
              {isRegister
                ? "Sign up to access your capital operating system."
                : "Sign in to your capital operating system."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-600"
                data-testid="login-error"
              >
                {error}
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-[#555] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#ddd] rounded-lg text-[#111] text-[14px] placeholder:text-[#bbb] focus:outline-none focus:border-[#999] transition-colors"
                placeholder="you@company.com"
                autoComplete="email"
                data-testid="input-email"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#555] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#ddd] rounded-lg text-[#111] text-[14px] placeholder:text-[#bbb] focus:outline-none focus:border-[#999] transition-colors"
                placeholder="••••••••"
                autoComplete={isRegister ? "new-password" : "current-password"}
                data-testid="input-password"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-[12px] font-medium text-[#555] mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#ddd] rounded-lg text-[#111] text-[14px] placeholder:text-[#bbb] focus:outline-none focus:border-[#999] transition-colors"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  data-testid="input-confirm-password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#111] text-white text-[14px] font-semibold rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-login-submit"
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setConfirmPassword("");
              }}
              className="text-[13px] text-[#888] hover:text-[#111] transition-colors"
              data-testid="toggle-auth-mode"
            >
              {isRegister
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>
          </div>

          <p className="mt-8 text-center text-[11px] text-[#bbb]">
            Banks approve profiles, not people.
          </p>
        </div>
      </div>
    </div>
  );
}
