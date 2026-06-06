import { Sparkles, X } from "lucide-react";

export function PromoBanner() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary/30 to-violet-600/30 backdrop-blur-md border border-primary/20 px-5 py-3 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)] animate-float">
      <Sparkles className="h-5 w-5 shrink-0 text-violet-300" />
      <p className="flex-1 text-sm font-medium">
        Carica una foto del planning per estrarre i turni e crearli su Google
        Calendar in pochi secondi.
      </p>
      <button className="rounded-full p-1.5 hover:bg-white/10 transition-colors">
        <X className="h-4 w-4 text-slate-300" />
      </button>
    </div>
  );
}
