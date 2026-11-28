"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import type { SesionUsuario } from "@espacio/shared";
import { api, ErrorApi } from "@/lib/api";

export default function FormularioLogin() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [documento, setDocumento] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!documento.trim() || !contrasena) {
      setError("Escribe tu documento y tu contraseña.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await api.post<SesionUsuario>("/auth/login", { documento: documento.trim(), contrasena });
      // Solo se vuelve a rutas internas (evita redirecciones a otros sitios)
      const volver = parametros.get("volver");
      router.replace(volver && volver.startsWith("/") && !volver.startsWith("//") ? volver : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo conectar con el servidor. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-alerta/30 bg-alerta/10 px-3 py-2.5 text-sm text-alerta">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <div>
        <label htmlFor="documento" className="mb-1.5 block text-sm font-medium">
          Documento
        </label>
        <input
          id="documento"
          inputMode="numeric"
          autoComplete="username"
          autoFocus
          value={documento}
          onChange={(e) => {
            setDocumento(e.target.value);
            setError(null);
          }}
          className="h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-marca focus:ring-2 focus:ring-marca/20"
          placeholder="Número de documento"
        />
      </div>

      <div>
        <label htmlFor="contrasena" className="mb-1.5 block text-sm font-medium">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="contrasena"
            type={verContrasena ? "text" : "password"}
            autoComplete="current-password"
            value={contrasena}
            onChange={(e) => {
              setContrasena(e.target.value);
              setError(null);
            }}
            className="h-11 w-full rounded-lg border border-black/15 bg-white px-3 pr-10 text-sm outline-none focus:border-marca focus:ring-2 focus:ring-marca/20"
            placeholder="Tu contraseña"
          />
          <button
            type="button"
            onClick={() => setVerContrasena((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-tinta/50 hover:text-tinta"
            aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-marca text-sm font-medium text-white transition-colors hover:bg-marca-claro disabled:opacity-60"
      >
        {enviando && <Loader2 size={16} className="animate-spin" />}
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>

      <p className="text-center text-xs text-tinta/50">¿Olvidaste tu contraseña? Comunícate con el área de TI.</p>
    </form>
  );
}
