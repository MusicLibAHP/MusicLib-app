// ============================================
// AUTO LOAD ARTISTS (VITE CLEAN VERSION)
// ============================================

// Charge automatiquement tous les fichiers artistes
import.meta.glob("./artists/*.js", { eager: true });