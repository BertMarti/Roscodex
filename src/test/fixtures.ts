import { LETTERS } from "../game";
import type { Difficulty, Question, QuestionPack } from "../game";

/** Almacén en memoria con la interfaz de localStorage que usan los módulos. */
export function crearAlmacenFalso() {
  const mapa = new Map<string, string>();
  return {
    mapa,
    getItem: (clave: string) => mapa.get(clave) ?? null,
    setItem: (clave: string, valor: string) => { mapa.set(clave, String(valor)); },
    removeItem: (clave: string) => { mapa.delete(clave); },
    clear: () => { mapa.clear(); }
  };
}

export function preguntaDePrueba(letter: string, difficulty: Difficulty = "beginner"): Question {
  return {
    id: `${difficulty}-${letter}`,
    difficulty,
    letter,
    rule: "starts_with",
    question: `Pregunta de la ${letter}`,
    options: ["a", "b", "c", "d"].map((id) => ({ id, text: `Opción ${id.toUpperCase()} de la ${letter}` })),
    correctOptionId: "a",
    explanation: `Explicación de la ${letter}`
  };
}

export function roscoDePrueba(difficulty: Difficulty = "beginner"): Question[] {
  return LETTERS.map((letter) => preguntaDePrueba(letter, difficulty));
}

export function bancoDePrueba(): { packs: QuestionPack[] } {
  const dificultades: Difficulty[] = ["beginner", "normal", "hard", "extreme"];
  return { packs: dificultades.map((difficulty) => ({ id: `pack-${difficulty}`, difficulty, questions: roscoDePrueba(difficulty) })) };
}
