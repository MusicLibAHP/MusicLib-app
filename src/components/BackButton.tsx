// ============================================
// COMPOSANT — Bouton Retour Fixe
// ============================================
import type { Route } from "../hooks/useRouter";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  navigateTo: (route: Route) => void;
  target: Route;
}

export function BackButton({ navigateTo, target }: BackButtonProps) {
  return (
    <button
      className="back-btn-fixed"
      onClick={() => navigateTo(target)}
      aria-label="Retour"
    >
      <ChevronLeft size={20} />
    </button>
  );
}
