import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";

export function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      const msg = error.message;
      const isNetworkError = /failed to fetch|network|fetch/i.test(msg);
      setError(
        isNetworkError
          ? `${msg} — Verifique: .env (VITE_SUPABASE_URL e chave), Supabase Auth URL Configuration (ex: http://localhost:5173), projeto ativo.`
          : msg
      );
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  if (loading) return <div className="auth-page"><div className="auth-card"><p>Carregando...</p></div></div>;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Entrar</h1>
        <p className="auth-subtitle">Painel do Café</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={submitting}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={submitting}
            />
          </label>
          <button type="submit" className="auth-btn" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="auth-footer">
          Não tem conta? <Link to="/signup">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
