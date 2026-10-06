"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createAccount, getCurrentUser, signIn } from "../api/auth-api";
import { ApiError } from "@/lib/api-client";

export default function AuthPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    identifier: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser();
        if (active && currentUser) router.replace("/product");
      } catch (sessionError) {
        if (active) setError(errorMessage(sessionError));
      } finally {
        if (active) setChecking(false);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      if (mode === "login") {
        await signIn(form.identifier.trim(), form.password);
      } else {
        await createAccount(
          form.username.trim(),
          form.email.trim(),
          form.password,
        );
      }
      router.replace("/product");
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setFieldErrors(submitError.fields);
        setError(submitError.message);
      } else {
        setError(errorMessage(submitError));
      }
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <main className="auth-shell">
        <div className="auth-check" role="status">
          <span className="spinner" /> Checking your session
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-layout">
        <div className="auth-aside">
          <a className="brand" href="#account" aria-label="Fieldnotes home">
            <span className="brand-mark" aria-hidden="true">
              F
            </span>
            <span>
              fieldnotes<span className="brand-period">.</span>
            </span>
          </a>
          <div className="auth-aside-copy">
            <div className="eyebrow">
              FIELDNOTES <span>·</span> PRIVATE WORKSPACE
            </div>
            <h1>Good records start here.</h1>
            <p>Sign in to manage your product inventory.</p>
          </div>
          <div className="auth-aside-footer">
            <span className="status-dot" aria-hidden="true" /> Inventory
            workspace
            <span>2026</span>
          </div>
        </div>
        <div className="auth-main" id="account">
          <div className="auth-form-wrap">
            <div className="auth-switch" aria-label="Account access">
              <button
                type="button"
                className={mode === "login" ? "selected" : ""}
                aria-pressed={mode === "login"}
                onClick={() => changeMode("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={mode === "register" ? "selected" : ""}
                aria-pressed={mode === "register"}
                onClick={() => changeMode("register")}
              >
                Create account
              </button>
            </div>
            <div className="auth-heading">
              <div className="eyebrow">ACCOUNT ACCESS</div>
              <h2>{mode === "login" ? "Welcome back" : "Join Fieldnotes"}</h2>
              <p>
                {mode === "login"
                  ? "Enter your account details to continue."
                  : "Create an account to access the inventory."}
              </p>
            </div>
            {error && (
              <div className="form-alert" role="alert">
                {error}
              </div>
            )}
            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === "register" ? (
                <>
                  <AuthField
                    label="Username"
                    name="username"
                    value={form.username}
                    error={fieldErrors.username?.[0]}
                    onChange={(value) => setForm({ ...form, username: value })}
                  />
                  <AuthField
                    label="Email address"
                    name="email"
                    type="email"
                    value={form.email}
                    error={fieldErrors.email?.[0]}
                    onChange={(value) => setForm({ ...form, email: value })}
                  />
                </>
              ) : (
                <AuthField
                  label="Username or email"
                  name="identifier"
                  autoComplete="username"
                  value={form.identifier}
                  error={fieldErrors.identifier?.[0]}
                  onChange={(value) => setForm({ ...form, identifier: value })}
                />
              )}
              <AuthField
                label="Password"
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={form.password}
                error={fieldErrors.password?.[0]}
                onChange={(value) => setForm({ ...form, password: value })}
              />
              <button
                className="button button-primary auth-submit"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
                {!saving && <span aria-hidden="true">→</span>}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
    setFieldErrors({});
  }
}

function AuthField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <div className={`form-field auth-field${error ? " has-error" : ""}`}>
      <label htmlFor={name}>
        {label}
        <span aria-hidden="true">*</span>
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        required
        autoComplete={autoComplete}
        maxLength={
          name === "username" ? 100 : name === "email" ? 150 : undefined
        }
        minLength={name === "password" ? 8 : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
