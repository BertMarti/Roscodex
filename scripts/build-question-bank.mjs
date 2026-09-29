import { mkdir, readFile, writeFile } from "node:fs/promises";

const API = "https://pokeapi.co/api/v2";
const DATA_DIR = new URL("../public/data/", import.meta.url);
const CACHE_URL = new URL("./pokeapi-pokemon-cache.json", DATA_DIR);
const OUTPUT_URL = new URL("./question-bank.json", DATA_DIR);
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const CONTAINS_LETTERS_BY_DIFFICULTY = {
  beginner: new Set(["A", "E", "I", "N", "O", "R", "S", "T"]),
  normal: new Set(["B", "D", "G", "H", "L", "M", "P", "U"]),
  hard: new Set(["C", "F", "K", "V", "W", "X", "Y", "Z"]),
  extreme: new Set(["A", "E", "J", "Q", "R", "T", "U", "Y"])
};
const DIFFICULTY_OFFSETS = { beginner: 0, normal: 5, hard: 11, extreme: 17 };
const QUESTIONS_PER_LETTER = 20;
const REVIEWED_AT = new Date().toISOString().slice(0, 10);

const typeNames = {
  bug: "Bicho", dark: "Siniestro", dragon: "Dragón", electric: "Eléctrico", fairy: "Hada",
  fighting: "Lucha", fire: "Fuego", flying: "Volador", ghost: "Fantasma", grass: "Planta",
  ground: "Tierra", ice: "Hielo", normal: "Normal", poison: "Veneno", psychic: "Psíquico",
  rock: "Roca", steel: "Acero", water: "Agua"
};

const statNames = {
  hp: "PS", attack: "Ataque", defense: "Defensa", "special-attack": "Ataque especial",
  "special-defense": "Defensa especial", speed: "Velocidad"
};

const generationNames = {
  1: "primera", 2: "segunda", 3: "tercera", 4: "cuarta", 5: "quinta",
  6: "sexta", 7: "séptima", 8: "octava", 9: "novena"
};

const sourceFieldsByDifficulty = {
  beginner: ["types", "generation"],
  normal: ["types", "generation", "height", "weight", "base_experience", "abilities", "moves"],
  hard: ["types", "generation", "height", "weight", "stats", "base_experience", "abilities", "moves"],
  extreme: ["types", "generation", "height", "weight", "stats", "base_experience", "abilities", "moves"]
};

const questionDisambiguators = [
  " según los datos registrados",
  " tal como figura en la ficha de especie",
  " de acuerdo con la información de PokéAPI",
  " según la ficha nacional",
  " tal como aparece en sus datos base",
  " de acuerdo con su registro de especie"
];

async function fetchJson(url, attempts = 4) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { accept: "application/json" } });
      if (response.ok) return response.json();
      if (response.status === 429 || response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        continue;
      }
      throw new Error(`HTTP ${response.status} en ${url}`);
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
  throw new Error(`No se pudo consultar ${url}`);
}

async function mapConcurrent(items, limit, mapper) {
  const output = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(items[index], index);
      if ((index + 1) % 100 === 0) console.log(`Datos PokéAPI: ${index + 1}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return output;
}

function idFromUrl(url) {
  return Number(url.split("/").filter(Boolean).at(-1));
}

function generationForId(id) {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
}

function titleName(name) {
  return name.split("-").map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part).join("-");
}

function cleanAbility(name) {
  return name.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(" ");
}

function cleanMove(name) {
  return name.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(" ");
}

function typeLabel(pokemon) {
  return pokemon.types.map((type) => typeNames[type] || type).join(" y ");
}

function highestStat(pokemon) {
  return pokemon.stats.reduce((best, current) => current.value > best.value ? current : best, pokemon.stats[0]);
}

function statTotal(pokemon) {
  return pokemon.stats.reduce((total, stat) => total + stat.value, 0);
}

function buildClue(pokemon, difficulty, variant) {
  const types = typeLabel(pokemon);
  const stat = highestStat(pokemon);
  const total = statTotal(pokemon);
  const ability = cleanAbility(pokemon.abilities[variant % pokemon.abilities.length] || "habilidad registrada");
  const move = cleanMove(pokemon.moves[variant % pokemon.moves.length] || "un movimiento registrado");
  const generation = generationNames[pokemon.generation] || `generación ${pokemon.generation}`;
  const templates = {
    beginner: [
      `es de tipo ${types}`,
      `pertenece al tipo ${types}`,
      `es un Pokémon de tipo ${types}`,
      `su tipo es ${types}`,
      `se clasifica como Pokémon de tipo ${types}`,
      `su afinidad elemental es ${types}`,
      `en la Pokédex figura como Pokémon de tipo ${types}`,
      `es una especie de tipo ${types}`,
      `forma parte del grupo de tipo ${types}`,
      `se reconoce por ser de tipo ${types}`,
      `fue introducido en la ${generation} generación`,
      `pertenece a la ${generation} generación`,
      `apareció por primera vez en la ${generation} generación`,
      `forma parte de la ${generation} generación`,
      `su debut corresponde a la ${generation} generación`,
      `se incorporó en la ${generation} generación`,
      `es una especie de la ${generation} generación`,
      `su origen está en la ${generation} generación`,
      `figura desde la ${generation} generación`,
      `se estrenó durante la ${generation} generación`
    ],
    normal: [
      `combina los tipos ${types} y pertenece a la ${generation} generación`,
      `es de tipo ${types} y mide ${pokemon.heightM} m`,
      `es de tipo ${types} y pesa ${pokemon.weightKg} kg`,
      `es de tipo ${types} y tiene ${pokemon.baseExperience} puntos de experiencia base`,
      `pertenece a la ${generation} generación y mide ${pokemon.heightM} m`,
      `pertenece a la ${generation} generación y pesa ${pokemon.weightKg} kg`,
      `pertenece a la ${generation} generación y tiene ${ability} como habilidad`,
      `mide ${pokemon.heightM} m y pesa ${pokemon.weightKg} kg`,
      `mide ${pokemon.heightM} m y tiene ${pokemon.baseExperience} puntos de experiencia base`,
      `pesa ${pokemon.weightKg} kg y tiene ${pokemon.baseExperience} puntos de experiencia base`,
      `tiene ${ability} como habilidad y es de tipo ${types}`,
      `tiene ${ability} como habilidad y pertenece a la ${generation} generación`,
      `tiene ${pokemon.baseExperience} puntos de experiencia base y es de tipo ${types}`,
      `tiene ${statNames[stat.name] || stat.name} como estadística más alta`,
      `es de tipo ${types} y tiene ${statNames[stat.name] || stat.name} como estadística más alta`,
      `pertenece a la ${generation} generación y tiene ${pokemon.baseExperience} puntos de experiencia base`,
      `combina los tipos ${types} y pesa ${pokemon.weightKg} kg`,
      `combina los tipos ${types} y tiene ${ability} como habilidad`,
      `es de tipo ${types} y aprende el movimiento ${move}`,
      `pertenece a la ${generation} generación y aprende el movimiento ${move}`
    ],
    hard: [
      `combina los tipos ${types}, pesa ${pokemon.weightKg} kg y pertenece a la generación ${pokemon.generation}`,
      `tiene ${statNames[stat.name] || stat.name} como estadística más alta, con ${stat.value} puntos, y mide ${pokemon.heightM} m`,
      `tiene ${ability} como habilidad y suma ${total} puntos de estadísticas base`,
      `puede aprender el movimiento ${move} y pertenece a la generación ${pokemon.generation}`,
      `tiene ${pokemon.baseExperience} puntos de experiencia base y es de tipo ${types}`,
      `es de tipo ${types}, mide ${pokemon.heightM} m y tiene ${ability} como habilidad`,
      `pertenece a la generación ${pokemon.generation}, pesa ${pokemon.weightKg} kg y tiene ${statNames[stat.name] || stat.name} como estadística más alta`,
      `aprende ${move}, tiene ${pokemon.baseExperience} puntos de experiencia base y es de tipo ${types}`,
      `suma ${total} puntos de estadísticas base, pesa ${pokemon.weightKg} kg y pertenece a la generación ${pokemon.generation}`,
      `mide ${pokemon.heightM} m, tiene ${ability} como habilidad y alcanza ${stat.value} puntos en ${statNames[stat.name] || stat.name}`,
      `combina los tipos ${types}, aprende ${move} y tiene ${pokemon.baseExperience} puntos de experiencia base`,
      `es de tipo ${types}, pesa ${pokemon.weightKg} kg y su estadística más alta es ${statNames[stat.name] || stat.name}`,
      `pertenece a la generación ${pokemon.generation}, aprende ${move} y suma ${total} puntos de estadísticas base`,
      `tiene ${ability} como habilidad, mide ${pokemon.heightM} m y pesa ${pokemon.weightKg} kg`,
      `alcanza ${stat.value} puntos en ${statNames[stat.name] || stat.name}, tiene ${pokemon.baseExperience} puntos de experiencia base y es de tipo ${types}`,
      `pesa ${pokemon.weightKg} kg, aprende ${move} y pertenece a la generación ${pokemon.generation}`,
      `mide ${pokemon.heightM} m, es de tipo ${types} y suma ${total} puntos de estadísticas base`,
      `tiene ${ability} como habilidad, pertenece a la generación ${pokemon.generation} y alcanza ${stat.value} puntos en ${statNames[stat.name] || stat.name}`,
      `aprende ${move}, mide ${pokemon.heightM} m y pesa ${pokemon.weightKg} kg`,
      `es de tipo ${types}, tiene ${pokemon.baseExperience} puntos de experiencia base y su estadística más alta es ${statNames[stat.name] || stat.name}`
    ],
    extreme: [
      `combina ${types}, pesa ${pokemon.weightKg} kg y tiene ${pokemon.baseExperience} puntos de experiencia base`,
      `mide ${pokemon.heightM} m, suma ${total} puntos base y su estadística más alta es ${statNames[stat.name] || stat.name}`,
      `tiene ${ability} como habilidad, aprende ${move} y pertenece a la generación ${pokemon.generation}`,
      `pertenece a la generación ${pokemon.generation}, pesa ${pokemon.weightKg} kg y alcanza ${stat.value} puntos en ${statNames[stat.name] || stat.name}`,
      `es de tipo ${types}, mide ${pokemon.heightM} m y suma ${total} puntos de estadísticas base`,
      `combina ${types}, aprende ${move} y alcanza ${stat.value} puntos en ${statNames[stat.name] || stat.name}`,
      `pesa ${pokemon.weightKg} kg, tiene ${ability} como habilidad y suma ${total} puntos de estadísticas base`,
      `mide ${pokemon.heightM} m, aprende ${move} y tiene ${pokemon.baseExperience} puntos de experiencia base`,
      `pertenece a la generación ${pokemon.generation}, combina ${types} y aprende ${move}`,
      `tiene ${ability} como habilidad, pesa ${pokemon.weightKg} kg y su estadística más alta es ${statNames[stat.name] || stat.name}`,
      `es de tipo ${types}, alcanza ${stat.value} puntos en ${statNames[stat.name] || stat.name} y tiene ${pokemon.baseExperience} puntos de experiencia base`,
      `suma ${total} puntos de estadísticas base, mide ${pokemon.heightM} m y pertenece a la generación ${pokemon.generation}`,
      `aprende ${move}, pesa ${pokemon.weightKg} kg y es de tipo ${types}`,
      `tiene ${ability} como habilidad, mide ${pokemon.heightM} m y pertenece a la generación ${pokemon.generation}`,
      `combina ${types}, pesa ${pokemon.weightKg} kg y su estadística más alta es ${statNames[stat.name] || stat.name}`,
      `alcanza ${stat.value} puntos en ${statNames[stat.name] || stat.name}, aprende ${move} y suma ${total} puntos de estadísticas base`,
      `es de tipo ${types}, pertenece a la generación ${pokemon.generation} y tiene ${ability} como habilidad`,
      `tiene ${pokemon.baseExperience} puntos de experiencia base, mide ${pokemon.heightM} m y pesa ${pokemon.weightKg} kg`,
      `pertenece a la generación ${pokemon.generation}, aprende ${move} y su estadística más alta es ${statNames[stat.name] || stat.name}`,
      `combina ${types}, tiene ${ability} como habilidad y suma ${total} puntos de estadísticas base`,
      `pesa ${pokemon.weightKg} kg, alcanza ${stat.value} puntos en ${statNames[stat.name] || stat.name} y aprende ${move}`
    ]
  };
  return templates[difficulty][variant % templates[difficulty].length];
}

function chooseTargets(pokemon, letter, rule, count) {
  const normalizedLetter = letter.toLowerCase();
  const eligible = pokemon.filter((entry) => {
    const starts = entry.name.startsWith(normalizedLetter);
    return rule === "starts_with" ? starts : entry.name.includes(normalizedLetter) && !starts;
  });
  if (!eligible.length) throw new Error(`No hay candidatos para ${rule} ${letter}`);
  return Array.from({ length: count }, (_, index) => eligible[(index * 7 + index * index) % eligible.length]);
}

function buildOptions(pokemon, target, letter, rule, variant, difficultyOffset) {
  const normalizedLetter = letter.toLowerCase();
  const sameRule = pokemon.filter((entry) => {
    const starts = entry.name.startsWith(normalizedLetter);
    return rule === "starts_with" ? starts : entry.name.includes(normalizedLetter) && !starts;
  });
  const fallback = pokemon.filter((entry) => entry.id !== target.id);
  const pool = sameRule.length >= 4 ? sameRule : fallback;
  const distractors = [];
  for (let offset = 0; distractors.length < 3 && offset < pool.length * 2; offset += 1) {
    const candidate = pool[((variant + difficultyOffset) * 13 + offset) % pool.length];
    if (candidate.id !== target.id && !distractors.some((entry) => entry.id === candidate.id)) distractors.push(candidate);
  }
  if (distractors.length < 3) throw new Error(`No hay tres distractores únicos para ${target.name}`);
  const choices = [target, ...distractors];
  const correctIndex = (target.id + (variant + difficultyOffset) * 3) % 4;
  [choices[0], choices[correctIndex]] = [choices[correctIndex], choices[0]];
  return choices.map((choice, index) => ({ id: String.fromCharCode(97 + index), text: titleName(choice.name) }));
}

function buildQuestion(pokemon, difficulty, letter, variant, usedQuestionTexts) {
  const difficultyOffset = DIFFICULTY_OFFSETS[difficulty];
  const rule = CONTAINS_LETTERS_BY_DIFFICULTY[difficulty].has(letter) ? "contains" : "starts_with";
  const target = chooseTargets(pokemon, letter, rule, QUESTIONS_PER_LETTER)[(variant + difficultyOffset) % QUESTIONS_PER_LETTER];
  const clue = buildClue(target, difficulty, variant);
  const formattedClue = `${clue[0].toUpperCase()}${clue.slice(1)}`;
  const ruleHint = rule === "contains" ? `Contiene la letra ${letter}.` : `Empieza por la letra ${letter}.`;
  let disambiguatorIndex = -1;
  let question = `${ruleHint} ${formattedClue}.`;
  while (usedQuestionTexts.has(question)) {
    disambiguatorIndex += 1;
    if (disambiguatorIndex >= questionDisambiguators.length) throw new Error(`No se pudo desduplicar: ${question}`);
    question = `${ruleHint} ${formattedClue}${questionDisambiguators[(variant + disambiguatorIndex) % questionDisambiguators.length]}.`;
  }
  if (usedQuestionTexts.has(question)) throw new Error(`Pregunta repetida: ${question}`);
  usedQuestionTexts.add(question);
  const options = buildOptions(pokemon, target, letter, rule, variant, difficultyOffset);
  const correctOptionId = options.find((option) => option.text.toLowerCase() === titleName(target.name).toLowerCase()).id;
  return {
    id: `${difficulty}-${letter.toLowerCase()}-${String(variant + 1).padStart(3, "0")}`,
    letter,
    rule,
    question,
    options,
    correctOptionId,
    category: difficulty === "beginner" ? "datos básicos" : difficulty === "normal" ? "datos combinados" : difficulty === "hard" ? "datos avanzados" : "datos expertos",
    difficulty,
    explanation: `${titleName(target.name)}: ${clue}.`,
    source: {
      provider: "PokéAPI",
      endpoint: `${API}/pokemon/${target.name}`,
      fields: sourceFieldsByDifficulty[difficulty],
      reviewedAt: REVIEWED_AT,
      status: "generated-validated"
    }
  };
}

async function loadPokemon() {
  try {
    const cached = JSON.parse(await readFile(CACHE_URL, "utf8"));
    if (Array.isArray(cached) && cached.length >= 1000) {
      console.log(`Usando cache local de ${cached.length} Pokémon.`);
      return cached;
    }
  } catch {
    // El cache todavía no existe o está incompleto.
  }

  console.log("Consultando catálogo de PokéAPI...");
  const listing = await fetchJson(`${API}/pokemon?limit=1300`);
  const entries = listing.results.map((entry) => ({ name: entry.name, id: idFromUrl(entry.url) })).filter((entry) => entry.id >= 1 && entry.id <= 1025);
  const details = await mapConcurrent(entries, 12, async (entry) => {
    const raw = await fetchJson(`${API}/pokemon/${entry.id}`);
    return {
      id: raw.id,
      name: raw.name,
      types: raw.types.sort((a, b) => a.slot - b.slot).map((type) => type.type.name),
      abilities: raw.abilities.filter((ability) => !ability.is_hidden).map((ability) => ability.ability.name),
      moves: raw.moves.slice(0, 20).map((move) => move.move.name),
      heightM: raw.height / 10,
      weightKg: raw.weight / 10,
      baseExperience: raw.base_experience || 0,
      generation: generationForId(raw.id),
      stats: raw.stats.map((stat) => ({ name: stat.stat.name, value: stat.base_stat }))
    };
  });
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CACHE_URL, `${JSON.stringify(details)}\n`, "utf8");
  return details;
}

const pokemon = await loadPokemon();
const usedQuestionTexts = new Set();
const packs = [];

for (const difficulty of ["beginner", "normal", "hard", "extreme"]) {
  const questions = [];
  for (const letter of LETTERS) {
    for (let variant = 0; variant < QUESTIONS_PER_LETTER; variant += 1) {
      questions.push(buildQuestion(pokemon, difficulty, letter, variant, usedQuestionTexts));
    }
  }
  packs.push({
    id: `${difficulty}-generated-v1`,
    difficulty,
    questionCount: questions.length,
    questions
  });
}

const bank = {
  version: 1,
  generatedAt: new Date().toISOString(),
  questionsPerDifficulty: 520,
  questionsPerLetter: QUESTIONS_PER_LETTER,
  source: "PokéAPI",
  packs
};

await writeFile(OUTPUT_URL, `${JSON.stringify(bank)}\n`, "utf8");
console.log(`Banco generado: ${packs.length} dificultades, ${packs.reduce((total, pack) => total + pack.questions.length, 0)} preguntas únicas.`);
