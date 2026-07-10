"use client";

import { useState } from "react";
import { adminLogin } from "./actions";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await adminLogin(password, rememberMe);
      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error || "Неуспешен вход.");
      }
    } catch (err) {
      console.error(err);
      setError("Възникна системна грешка при входа.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background blobs for premium glassmorphism design */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full filter blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/5 rounded-full filter blur-[80px]" />

      <div className="w-full max-w-md border border-zinc-200 bg-white rounded-2xl p-6 sm:p-8 shadow-xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Кейсове<span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">.нет</span>
          </h2>
          <p className="text-sm text-zinc-500 mt-2">
            Вход в административния панел
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Парола</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-zinc-300 bg-white text-violet-600 focus:ring-violet-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2.5 text-sm text-zinc-500 select-none cursor-pointer">
              Запомни ме за 2 седмици
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-sm hover:brightness-110 shadow-lg disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
          >
            {isLoading ? "Проверка..." : "Вход"}
          </button>
        </form>
      </div>
    </div>
  );
}
