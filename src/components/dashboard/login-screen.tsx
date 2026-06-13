"use client";

import { signIn } from "next-auth/react";
import { CalendarDays, LogIn } from "lucide-react";

export function LoginScreen() {
  const handleLogin = () => {
    signIn("google");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl glass-card border-none p-8 text-center shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-violet-500/5 opacity-100 transition-opacity"></div>
        
        <div className="relative space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-violet-600 shadow-lg shadow-primary/20">
            <CalendarDays className="h-7 w-7 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Presenze<span className="text-primary font-bold">.</span>
            </h1>
            <p className="mx-auto max-w-sm text-sm text-slate-400">
              Estrai i tuoi turni dalle foto di planning aziendali e sincronizzali istantaneamente sul tuo Google Calendar.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleLogin}
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-slate-900 shadow-md transition-all duration-300 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.45 21.35,11.1z" fill="#4285F4" />
                  <path d="M12,20.68c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.33,0.98 -2.33,0 -4.31,-1.57 -5.02,-3.69H2.9v2.66C4.38,18.82 8.01,20.68 12,20.68z" fill="#34A853" />
                  <path d="M6.98,13.19c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7s0.1,-1.16 0.28,-1.7V7.13H2.9C2.31,8.31 2,9.62 2,11c0,1.38 0.31,2.69 0.9,3.87L6.98,13.19z" fill="#FBBC05" />
                  <path d="M12,5.22c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.47,2.51 14.43,1.7 12,1.7 8.01,1.7 4.38,3.56 2.9,6.54l4.08,3.19c0.71,-2.12 2.69,-3.69 5.02,-3.69z" fill="#EA4335" />
                </g>
              </svg>
              Accedi con Google
            </button>
          </div>

          <div className="border-t border-slate-800/80 pt-6">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Questa è un&apos;applicazione ad uso personale. Accedendo concedi il permesso di gestire gli eventi del calendario Google. I dati delle immagini dei turni non vengono salvati sul server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
