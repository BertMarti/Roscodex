// Versión visible de la app (portada y «Fuentes y créditos»). Sale de package.json para no repetirla a mano;
// Vite solo incluye el campo `version` en el bundle (importación con nombre de JSON).
import { version } from "../package.json";

export const APP_VERSION: string = version;
