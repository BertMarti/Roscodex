import { readFile } from "node:fs/promises";

const bank = JSON.parse(await readFile(new URL("../demo/data/question-bank.json", import.meta.url), "utf8"));
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const gamesPerDifficulty = 20;

for (const pack of bank.packs) {
  const used = new Set();
  const byLetter = new Map(letters.map((letter) => [letter, pack.questions.filter((question) => question.letter === letter)]));

  for (let game = 1; game <= gamesPerDifficulty; game += 1) {
    const rosco = letters.map((letter) => {
      const candidates = byLetter.get(letter).filter((question) => !used.has(question.id));
      if (!candidates.length) throw new Error(`${pack.difficulty}: no hay preguntas nuevas para ${letter} en el rosco ${game}`);
      return candidates[(game - 1) % candidates.length];
    });

    const ids = rosco.map((question) => question.id);
    if (new Set(ids).size !== letters.length) throw new Error(`${pack.difficulty}: el rosco ${game} contiene IDs repetidos`);
    if (rosco.filter((question) => question.rule === "starts_with").length !== 18) {
      throw new Error(`${pack.difficulty}: el rosco ${game} no conserva 18 preguntas starts_with`);
    }
    if (rosco.filter((question) => question.rule === "contains").length !== 8) {
      throw new Error(`${pack.difficulty}: el rosco ${game} no conserva 8 preguntas contains`);
    }
    ids.forEach((id) => used.add(id));
  }

  if (used.size !== pack.questions.length || used.size !== 520) {
    throw new Error(`${pack.difficulty}: la simulación terminó con ${used.size} preguntas usadas de ${pack.questions.length}`);
  }
  console.log(`${pack.difficulty}: ${gamesPerDifficulty} roscos simulados, ${used.size} preguntas únicas, sin repeticiones.`);
}

console.log(`Simulación correcta: ${bank.packs.length} dificultades, ${bank.packs.length * gamesPerDifficulty} partidas y ${bank.packs.length * gamesPerDifficulty * 26} preguntas consumidas.`);
