// URL de base de l'API backend.
// - Développement : http://localhost:5001 (valeur par défaut)
// - Production derrière Nginx : VITE_API_URL=/api (même origine que le site)
// La valeur est figée au moment du build (npm run build).
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/+$/, "");
