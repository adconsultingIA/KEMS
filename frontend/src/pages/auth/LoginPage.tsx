import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react"
import {
  useState,
} from "react"
import type {
  FormEvent,
} from "react"
import {
  Navigate,
  useNavigate,
} from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

export function LoginPage() {
  const {
    auth,
    login,
    loading,
  } = useAuth()

  const navigate = useNavigate()

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [showPassword, setShowPassword] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-mark">
          K
        </div>

        <span>
          Chargement de KEMS…
        </span>
      </div>
    )
  }

  if (auth) {
    return (
      <Navigate
        to={
          auth.account_type
            === "client"
            ? "/client"
            : "/hub"
        }
        replace
      />
    )
  }

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()

    setSubmitting(true)
    setError(null)

    try {
      const context =
        await login(
          email,
          password,
        )

      navigate(
        context.account_type
          === "client"
          ? "/client"
          : "/hub",
        {
          replace: true,
        },
      )
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Connexion impossible.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <img
            src="/brand/kems-logo.jpeg"
            alt="KEMS Concept"
            className="kems-logo-login"
          />
        </div>

        <div className="login-brand-signature">
          <span />
          <span />
          <span />
        </div>

        <div className="login-brand-content">
          <span className="login-kicker">
            KEMS Intelligence Platform
          </span>

          <h1>
            Un seul accès.
            <br />
            La bonne vision.
          </h1>

          <p>
            Voir selon son rôle.
            Comprendre selon son contexte.
            Agir depuis un seul endroit.
          </p>

          <div className="login-principle">
            <ShieldCheck size={20} />

            <div>
              <strong>
                360° côté client.
                720° côté KEMS.
              </strong>

              <span>
                Une même source de vérité,
                projetée selon le contexte.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <span className="eyebrow">
            Accès sécurisé
          </span>

          <h2>
            Se connecter à KEMS
          </h2>

          <p className="login-intro">
            Utilisez votre accès KEMS
            pour rejoindre votre espace.
          </p>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <label>
              <span>
                Adresse e-mail
              </span>

              <div className="login-field">
                <Mail size={17} />

                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(
                      event.target.value,
                    )
                    setError(null)
                  }}
                  placeholder="prenom@kems.ch"
                />
              </div>
            </label>

            <label>
              <span>
                Mot de passe
              </span>

              <div className="login-field">
                <LockKeyhole size={17} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(
                      event.target.value,
                    )
                    setError(null)
                  }}
                  placeholder="••••••••••••"
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            {error ? (
              <div
                className="login-error"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="button primary login-submit"
              disabled={submitting}
            >
              {submitting
                ? "Connexion…"
                : "Se connecter"}

              {!submitting ? (
                <ArrowRight size={17} />
              ) : null}
            </button>
          </form>

          <div className="login-footer-note">
            <ShieldCheck size={14} />
            Session KEMS sécurisée
          </div>
        </div>
      </section>
    </main>
  )
}
