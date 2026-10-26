import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildClue, generationNames, preparePokemon, satisfiesClue, typeLabel } from "./lib/pistas.mjs";

const API = "https://pokeapi.co/api/v2";
const DATA_DIR = new URL("../public/data/", import.meta.url);
// La caché de PokéAPI solo sirve para generar el banco: vive fuera de public/ para no publicarse ni precachearse.
const SOURCE_DIR = new URL("../data/", import.meta.url);
const CACHE_URL = new URL("./pokeapi-pokemon-cache.json", SOURCE_DIR);
// Nombres oficiales en español (PokéAPI, idioma «es») de especies, movimientos y habilidades. También es caché: no se publica.
const NAMES_URL = new URL("./pokeapi-nombres-es.json", SOURCE_DIR);
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



function chooseTargets(pokemon, letter, rule, count) {
  const normalizedLetter = letter.toLowerCase();
  const eligible = pokemon.filter((entry) => {
    const starts = entry.letterKey.startsWith(normalizedLetter);
    return rule === "starts_with" ? starts : entry.letterKey.includes(normalizedLetter) && !starts;
  });
  if (!eligible.length) throw new Error(`No hay candidatos para ${rule} ${letter}`);
  return Array.from({ length: count }, (_, index) => eligible[(index * 7 + index * index) % eligible.length]);
}

function buildOptions(pokemon, target, letter, rule, variant, difficultyOffset, clue) {
  const normalizedLetter = letter.toLowerCase();
  // Un distractor nunca puede cumplir también la pista: si no, habría dos respuestas válidas.
  const valid = (entry) => entry.id !== target.id && !satisfiesClue(entry, target, clue);
  const sameRule = pokemon.filter((entry) => {
    const starts = entry.letterKey.startsWith(normalizedLetter);
    return valid(entry) && (rule === "starts_with" ? starts : entry.letterKey.includes(normalizedLetter) && !starts);
  });
  // Si con la misma letra no hay tres distractores válidos, se completa con otros (la letra ya los descarta).
  const pool = sameRule.length >= 3 ? sameRule : [...sameRule, ...pokemon.filter((entry) => valid(entry) && !sameRule.includes(entry))];
  const distractors = [];
  for (let offset = 0; distractors.length < 3 && offset < pool.length * 2; offset += 1) {
    const candidate = pool[((variant + difficultyOffset) * 13 + offset) % pool.length];
    if (candidate.id !== target.id && !distractors.some((entry) => entry.id === candidate.id)) distractors.push(candidate);
  }
  if (distractors.length < 3) throw new Error(`No hay tres distractores únicos para ${target.displayName}`);
  const choices = [target, ...distractors];
  const correctIndex = (target.id + (variant + difficultyOffset) * 3) % 4;
  [choices[0], choices[correctIndex]] = [choices[correctIndex], choices[0]];
  return choices.map((choice, index) => ({ id: String.fromCharCode(97 + index), text: choice.displayName, pokemonId: choice.id }));
}

function buildQuestion(pokemon, difficulty, letter, variant, usedQuestionTexts) {
  const difficultyOffset = DIFFICULTY_OFFSETS[difficulty];
  const rule = CONTAINS_LETTERS_BY_DIFFICULTY[difficulty].has(letter) ? "contains" : "starts_with";
  const target = chooseTargets(pokemon, letter, rule, QUESTIONS_PER_LETTER)[(variant + difficultyOffset) % QUESTIONS_PER_LETTER];
  const clueInfo = buildClue(target, difficulty, variant);
  const clue = clueInfo.text;
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
  const options = buildOptions(pokemon, target, letter, rule, variant, difficultyOffset, clueInfo);
  const correctOptionId = options.find((option) => option.pokemonId === target.id).id;
  for (const option of options) delete option.pokemonId;
  return {
    id: `${difficulty}-${letter.toLowerCase()}-${String(variant + 1).padStart(3, "0")}`,
    letter,
    rule,
    question,
    options,
    correctOptionId,
    category: difficulty === "beginner" ? "datos básicos" : difficulty === "normal" ? "datos combinados" : difficulty === "hard" ? "datos avanzados" : "datos expertos",
    difficulty,
    // Línea de contexto que se enseña tras fallar: tipo y generación, sin repetir números del enunciado.
    explanation: `${target.displayName} es de tipo ${typeLabel(target)}; apareció en la ${generationNames[target.generation]} generación.`,
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
  await mkdir(SOURCE_DIR, { recursive: true });
  await writeFile(CACHE_URL, `${JSON.stringify(details)}\n`, "utf8");
  return details;
}

function spanishName(resource) {
  return resource.names?.find((entry) => entry.language?.name === "es")?.name?.trim() || null;
}

// Descarga solo lo que falte en la caché (especies por número, movimientos y habilidades por nombre).
async function loadSpanishNames(pokemon) {
  let cached = { species: {}, moves: {}, abilities: {} };
  try {
    const parsed = JSON.parse(await readFile(NAMES_URL, "utf8"));
    if (parsed && typeof parsed === "object") cached = { species: parsed.species ?? {}, moves: parsed.moves ?? {}, abilities: parsed.abilities ?? {} };
  } catch {
    // Todavía no hay caché de nombres.
  }
  const wanted = [
    ...pokemon.map((entry) => ["species", String(entry.id), `pokemon-species/${entry.id}`]),
    ...[...new Set(pokemon.flatMap((entry) => entry.moves))].map((slug) => ["moves", slug, `move/${slug}`]),
    ...[...new Set(pokemon.flatMap((entry) => entry.abilities))].map((slug) => ["abilities", slug, `ability/${slug}`])
  ].filter(([group, key]) => !(key in cached[group]));
  if (wanted.length) {
    console.log(`Consultando ${wanted.length} nombres en español a PokéAPI...`);
    await mapConcurrent(wanted, 6, async ([group, key, path]) => {
      cached[group][key] = spanishName(await fetchJson(`${API}/${path}`));
    });
    const sorted = (record) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })));
    await mkdir(SOURCE_DIR, { recursive: true });
    await writeFile(NAMES_URL, `${JSON.stringify({ species: sorted(cached.species), moves: sorted(cached.moves), abilities: sorted(cached.abilities) }, null, 1)}\n`, "utf8");
  }
  return cached;
}
const rawPokemon = await loadPokemon();
const pokemon = preparePokemon(rawPokemon, await loadSpanishNames(rawPokemon));
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
