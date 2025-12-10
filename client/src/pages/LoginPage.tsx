// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, checkEmail } from "../api/auth";
import { useAuth } from "../context/AuthContext";

type Step = "email" | "password";

function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const exists = await checkEmail(email.trim());
      if (!exists) {
        setError("Bu e-posta ile kayıtlı bir hesap bulunamadı.");
        return;
      }
      setStep("password");
    } catch (err) {
      console.error("checkEmail error:", err);
      setError("E-posta doğrulanırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { token, user } = await login(email.trim(), password);
      loginUser(user, token);
      navigate("/fighters");
    } catch (err) {
      console.error("login error:", err);
      setError("Şifre hatalı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep("email");
    setPassword("");
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-black text-white px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/70 p-8 text-white shadow-lg backdrop-blur space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Oturum Aç</h1>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-900/30 border border-red-700/50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              E-posta
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=""
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-500 text-white font-semibold py-3 transition hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Kontrol ediliyor..." : "Sonraki"}
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{email}</span>
              <button
                type="button"
                onClick={resetFlow}
                className="text-indigo-500 font-medium"
              >
                E-postayı değiştir
              </button>
            </div>
            <label className="text-sm font-medium text-slate-300">
              Şifre
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifreni gir"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-500 text-white font-semibold py-3 transition hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        )}

        <div className="flex items-center gap-4 text-slate-500 text-sm">
          <span className="flex-1 border-t border-white/10" />
          <span>Veya</span>
          <span className="flex-1 border-t border-white/10" />
        </div>

        <button
          onClick={() => navigate("/register")}
          className="w-full rounded-xl border border-white/15 py-3 font-semibold text-white hover:border-white/40"
        >
          Hesap Oluştur
        </button>
      </div>
    </div>
  );
}

export default LoginPage;