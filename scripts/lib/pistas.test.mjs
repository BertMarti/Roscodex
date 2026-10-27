import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildClue, highestStat, highestStatIsTied, letterKey, preparePokemon, templateCount } from "./pistas.mjs";

const stats = (values) => ["hp", "attack", "defense", "special-attack", "special-defense", "speed"].map((name, index) => ({ name, value: values[index] }));
const pokemonDePrueba = (values) => ({
  id: 191, displayName: "Sunkern", letterKey: "sunkern", types: ["grass"], generation: 2, heightM: 0.3, weightKg: 1.8,
  baseExperience: 36, abilitiesEs: ["Clorofila"], movesEs: ["Absorber"], stats: stats(values)
});
const dificultades = ["beginner", "normal", "hard", "extreme"];

describe("pistas de estadística más alta", () => {
  it("detecta el empate en el máximo", () => {
    expect(highestStatIsTied(pokemonDePrueba([30, 30, 30, 30, 30, 30]))).toBe(true);
    expect(highestStatIsTied(pokemonDePrueba([100, 100, 100, 100, 100, 100]))).toBe(true);
    expect(highestStatIsTied(pokemonDePrueba([45, 49, 49, 65, 65, 45]))).toBe(true);
    expect(highestStatIsTied(pokemonDePrueba([45, 49, 49, 65, 64, 45]))).toBe(false);
  });

  it("con empate nunca da una estadística como la única más alta", () => {
    const sunkern = pokemonDePrueba([30, 30, 30, 30, 30, 30]);
    let conEstadistica = 0;
    for (const difficulty of dificultades) {
      for (let variant = 0; variant < templateCount(difficulty); variant += 1) {
        const clue = buildClue(sunkern, difficulty, variant);
        if (!clue.facts.has("statHigh")) continue;
        conEstadistica += 1;
        expect(clue.text).not.toMatch(/estadística más alta/);
        expect(clue.text).toMatch(/una de sus estadísticas más altas/);
      }
    }
    expect(conEstadistica).toBeGreaterThan(0);
  });

  it("sin empate mantiene «su estadística más alta»", () => {
    const unico = pokemonDePrueba([45, 49, 49, 65, 64, 45]);
    expect(highestStat(unico).name).toBe("special-attack");
    const textos = dificultades.flatMap((difficulty) => Array.from({ length: templateCount(difficulty) }, (_, variant) => buildClue(unico, difficulty, variant)))
      .filter((clue) => clue.facts.has("statHigh")).map((clue) => clue.text);
    expect(textos.length).toBeGreaterThan(0);
    for (const texto of textos) expect(texto).toMatch(/estadística más alta/);
  });

  it("ninguna pregunta del banco publicado da como única una estadística empatada", () => {
    const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), "utf8"));
    const pokemon = new Map(preparePokemon(leer("../../data/pokeapi-pokemon-cache.json"), leer("../../data/pokeapi-nombres-es.json")).map((entry) => [entry.letterKey, entry]));
    const banco = leer("../../public/data/question-bank.json");
    const malas = [];
    let revisadas = 0;
    for (const pack of banco.packs) {
      for (const question of pack.questions) {
        if (!/estadística más alta/.test(question.question)) continue;
        revisadas += 1;
        const respuesta = question.options.find((option) => option.id === question.correctOptionId).text;
        if (highestStatIsTied(pokemon.get(letterKey(respuesta)))) malas.push(question.id);
      }
    }
    expect(revisadas).toBeGreaterThan(100);
    expect(malas).toEqual([]);
  });
});
