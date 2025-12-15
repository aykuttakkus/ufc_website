// src/pages/RegisterPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { token, user } = await register(name.trim(), email.trim(), password);
      loginUser(user, token);
      navigate("/fighters");
    } catch (err) {
      console.error("register error:", err);
      setError("Kayıt başarısız. Email kullanılıyor olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-black text-white px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/70 p-8 text-white shadow-lg backdrop-blur space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Hesap Oluştur</h1>
          <p className="text-sm text-slate-400 mt-1">
            UFC Fighters deneyiminden tam verim almak için kaydol.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-900/30 border border-red-700/50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300">
              İsim
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/40"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">
              E-posta
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">
              Şifre
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-500 text-white font-semibold py-3 transition hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Kayıt olunuyor..." : "Devam"}
          </button>
        </form>

        <button
          onClick={() => navigate("/login")}
          className="w-full rounded-xl border border-white/15 py-3 font-semibold text-white hover:border-white/40"
        >
          Zaten hesabın var mı? Giriş yap
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;