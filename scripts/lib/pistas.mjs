// Pistas del banco de preguntas: plantillas, hechos que usa cada una y comprobación de que un Pokémon cumple una pista.
// La comparten el generador (para elegir distractores que NO cumplan la pista) y el validador (para comprobarlo).

export const typeNames = {
  bug: "Bicho", dark: "Siniestro", dragon: "Dragón", electric: "Eléctrico", fairy: "Hada",
  fighting: "Lucha", fire: "Fuego", flying: "Volador", ghost: "Fantasma", grass: "Planta",
  ground: "Tierra", ice: "Hielo", normal: "Normal", poison: "Veneno", psychic: "Psíquico",
  rock: "Roca", steel: "Acero", water: "Agua"
};

export const statNames = {
  hp: "PS", attack: "Ataque", defense: "Defensa", "special-attack": "Ataque especial",
  "special-defense": "Defensa especial", speed: "Velocidad"
};

export const generationNames = {
  1: "primera", 2: "segunda", 3: "tercera", 4: "cuarta", 5: "quinta",
  6: "sexta", 7: "séptima", 8: "octava", 9: "novena"
};

// Clave para las reglas del rosco: igual que el validador (sin tildes ni diéresis, en minúsculas).
export function letterKey(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Último recurso si PokéAPI no tiene nombre en español: «basculin-red-striped» → «Basculin Red Striped».
export function readableSlug(slug) {
  return slug.split("-").filter(Boolean).map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(" ");
}

// Cifras con coma decimal, como se escriben en España (0,7 m; 6,9 kg).
export function decimal(value) {
  return String(value).replace(".", ",");
}

export function typeLabel(pokemon) {
  return pokemon.types.map((type) => typeNames[type] || type).join(" y ");
}

export function highestStat(pokemon) {
  return pokemon.stats.reduce((best, current) => current.value > best.value ? current : best, pokemon.stats[0]);
}

/** ¿Comparte otra estadística el valor máximo? Entonces no se puede decir «su estadística más alta es X». */
export function highestStatIsTied(pokemon) {
  const max = highestStat(pokemon).value;
  return pokemon.stats.filter((stat) => stat.value === max).length > 1;
}

export function statTotal(pokemon) {
  return pokemon.stats.reduce((total, stat) => total + stat.value, 0);
}

// Si PokéAPI no tiene el nombre en español de algo, se añade aquí a mano (nombre oficial de España), p. ej.
// moves: { "nuevo-movimiento": "Nombre oficial" }. Sin nombre, el generador se para: nada de slugs en el banco.
export const NAME_OVERRIDES = { species: {}, moves: {}, abilities: {} };

/** Añade nombre en español, clave de letras y habilidades/movimientos en español. Lanza si falta algún nombre o hay repetidos. */
export function preparePokemon(rawPokemon, names) {
  const missing = new Set();
  const translated = (group, key) => {
    const name = NAME_OVERRIDES[group][key] ?? names[group]?.[key];
    if (name) return name;
    missing.add(`${group}/${key}`);
    return readableSlug(key);
  };
  const pokemon = rawPokemon.map((entry) => {
    const displayName = translated("species", String(entry.id));
    return {
      ...entry,
      displayName,
      letterKey: letterKey(displayName),
      abilitiesEs: entry.abilities.map((slug) => translated("abilities", slug)),
      movesEs: entry.moves.map((slug) => translated("moves", slug))
    };
  });
  if (missing.size) {
    throw new Error(`Sin nombre oficial en español: ${[...missing].join(", ")}. Añádelos a NAME_OVERRIDES en scripts/lib/pistas.mjs.`);
  }
  const duplicated = pokemon.filter((entry, index) => pokemon.findIndex((other) => other.letterKey === entry.letterKey) !== index);
  if (duplicated.length) throw new Error(`Nombres repetidos tras normalizar: ${duplicated.map((entry) => entry.displayName).join(", ")}`);
  return pokemon;
}

const TEMPLATES = {
    beginner: [
      (f) => `es de tipo ${f.types}`,
      (f) => `pertenece al tipo ${f.types}`,
      (f) => `es un Pokémon de tipo ${f.types}`,
      (f) => `su tipo es ${f.types}`,
      (f) => `se clasifica como Pokémon de tipo ${f.types}`,
      (f) => `su afinidad elemental es ${f.types}`,
      (f) => `en la Pokédex figura como Pokémon de tipo ${f.types}`,
      (f) => `es una especie de tipo ${f.types}`,
      (f) => `forma parte del grupo de tipo ${f.types}`,
      (f) => `se reconoce por ser de tipo ${f.types}`,
      (f) => `fue introducido en la ${f.generation} generación`,
      (f) => `pertenece a la ${f.generation} generación`,
      (f) => `apareció por primera vez en la ${f.generation} generación`,
      (f) => `forma parte de la ${f.generation} generación`,
      (f) => `su debut corresponde a la ${f.generation} generación`,
      (f) => `se incorporó en la ${f.generation} generación`,
      (f) => `es una especie de la ${f.generation} generación`,
      (f) => `su origen está en la ${f.generation} generación`,
      (f) => `figura desde la ${f.generation} generación`,
      (f) => `se estrenó durante la ${f.generation} generación`
    ],
    normal: [
      (f) => `${f.combina} y pertenece a la ${f.generation} generación`,
      (f) => `es de tipo ${f.types} y mide ${f.heightM} m`,
      (f) => `es de tipo ${f.types} y pesa ${f.weightKg} kg`,
      (f) => `es de tipo ${f.types} y tiene ${f.baseExperience} puntos de experiencia base`,
      (f) => `pertenece a la ${f.generation} generación y mide ${f.heightM} m`,
      (f) => `pertenece a la ${f.generation} generación y pesa ${f.weightKg} kg`,
      (f) => `pertenece a la ${f.generation} generación y tiene ${f.ability} como habilidad`,
      (f) => `mide ${f.heightM} m y pesa ${f.weightKg} kg`,
      (f) => `mide ${f.heightM} m y tiene ${f.baseExperience} puntos de experiencia base`,
      (f) => `pesa ${f.weightKg} kg y tiene ${f.baseExperience} puntos de experiencia base`,
      (f) => `tiene ${f.ability} como habilidad y es de tipo ${f.types}`,
      (f) => `tiene ${f.ability} como habilidad y pertenece a la ${f.generation} generación`,
      (f) => `tiene ${f.baseExperience} puntos de experiencia base y es de tipo ${f.types}`,
      (f) => `${f.tieneStatHigh}`,
      (f) => `es de tipo ${f.types} y ${f.tieneStatHigh}`,
      (f) => `pertenece a la ${f.generation} generación y tiene ${f.baseExperience} puntos de experiencia base`,
      (f) => `${f.combina} y pesa ${f.weightKg} kg`,
      (f) => `${f.combina} y tiene ${f.ability} como habilidad`,
      (f) => `es de tipo ${f.types} y aprende el movimiento ${f.move}`,
      (f) => `pertenece a la ${f.generation} generación y aprende el movimiento ${f.move}`
    ],
    hard: [
      (f) => `${f.combina}, pesa ${f.weightKg} kg y pertenece a la generación ${f.generationNumber}`,
      (f) => `${f.tieneStatHigh}, con ${f.statValue} puntos, y mide ${f.heightM} m`,
      (f) => `tiene ${f.ability} como habilidad y suma ${f.total} puntos de estadísticas base`,
      (f) => `puede aprender el movimiento ${f.move} y pertenece a la generación ${f.generationNumber}`,
      (f) => `tiene ${f.baseExperience} puntos de experiencia base y es de tipo ${f.types}`,
      (f) => `es de tipo ${f.types}, mide ${f.heightM} m y tiene ${f.ability} como habilidad`,
      (f) => `pertenece a la generación ${f.generationNumber}, pesa ${f.weightKg} kg y ${f.tieneStatHigh}`,
      (f) => `aprende ${f.move}, tiene ${f.baseExperience} puntos de experiencia base y es de tipo ${f.types}`,
      (f) => `suma ${f.total} puntos de estadísticas base, pesa ${f.weightKg} kg y pertenece a la generación ${f.generationNumber}`,
      (f) => `mide ${f.heightM} m, tiene ${f.ability} como habilidad y alcanza ${f.statValue} puntos en ${f.statIn}`,
      (f) => `${f.combina}, aprende ${f.move} y tiene ${f.baseExperience} puntos de experiencia base`,
      (f) => `es de tipo ${f.types}, pesa ${f.weightKg} kg y ${f.suStatHigh}`,
      (f) => `pertenece a la generación ${f.generationNumber}, aprende ${f.move} y suma ${f.total} puntos de estadísticas base`,
      (f) => `tiene ${f.ability} como habilidad, mide ${f.heightM} m y pesa ${f.weightKg} kg`,
      (f) => `alcanza ${f.statValue} puntos en ${f.statIn}, tiene ${f.baseExperience} puntos de experiencia base y es de tipo ${f.types}`,
      (f) => `pesa ${f.weightKg} kg, aprende ${f.move} y pertenece a la generación ${f.generationNumber}`,
      (f) => `mide ${f.heightM} m, es de tipo ${f.types} y suma ${f.total} puntos de estadísticas base`,
      (f) => `tiene ${f.ability} como habilidad, pertenece a la generación ${f.generationNumber} y alcanza ${f.statValue} puntos en ${f.statIn}`,
      (f) => `aprende ${f.move}, mide ${f.heightM} m y pesa ${f.weightKg} kg`,
      (f) => `es de tipo ${f.types}, tiene ${f.baseExperience} puntos de experiencia base y ${f.suStatHigh}`
    ],
    extreme: [
      (f) => `${f.combinaCorto}, pesa ${f.weightKg} kg y tiene ${f.baseExperience} puntos de experiencia base`,
      (f) => `mide ${f.heightM} m, suma ${f.total} puntos base y ${f.suStatHigh}`,
      (f) => `tiene ${f.ability} como habilidad, aprende ${f.move} y pertenece a la generación ${f.generationNumber}`,
      (f) => `pertenece a la generación ${f.generationNumber}, pesa ${f.weightKg} kg y alcanza ${f.statValue} puntos en ${f.statIn}`,
      (f) => `es de tipo ${f.types}, mide ${f.heightM} m y suma ${f.total} puntos de estadísticas base`,
      (f) => `${f.combinaCorto}, aprende ${f.move} y alcanza ${f.statValue} puntos en ${f.statIn}`,
      (f) => `pesa ${f.weightKg} kg, tiene ${f.ability} como habilidad y suma ${f.total} puntos de estadísticas base`,
      (f) => `mide ${f.heightM} m, aprende ${f.move} y tiene ${f.baseExperience} puntos de experiencia base`,
      (f) => `pertenece a la generación ${f.generationNumber}, ${f.combinaCorto} y aprende ${f.move}`,
      (f) => `tiene ${f.ability} como habilidad, pesa ${f.weightKg} kg y ${f.suStatHigh}`,
      (f) => `es de tipo ${f.types}, alcanza ${f.statValue} puntos en ${f.statIn} y tiene ${f.baseExperience} puntos de experiencia base`,
      (f) => `suma ${f.total} puntos de estadísticas base, mide ${f.heightM} m y pertenece a la generación ${f.generationNumber}`,
      (f) => `aprende ${f.move}, pesa ${f.weightKg} kg y es de tipo ${f.types}`,
      (f) => `tiene ${f.ability} como habilidad, mide ${f.heightM} m y pertenece a la generación ${f.generationNumber}`,
      (f) => `${f.combinaCorto}, pesa ${f.weightKg} kg y ${f.suStatHigh}`,
      (f) => `alcanza ${f.statValue} puntos en ${f.statIn}, aprende ${f.move} y suma ${f.total} puntos de estadísticas base`,
      (f) => `es de tipo ${f.types}, pertenece a la generación ${f.generationNumber} y tiene ${f.ability} como habilidad`,
      (f) => `tiene ${f.baseExperience} puntos de experiencia base, mide ${f.heightM} m y pesa ${f.weightKg} kg`,
      (f) => `pertenece a la generación ${f.generationNumber}, aprende ${f.move} y ${f.suStatHigh}`,
      (f) => `${f.combinaCorto}, tiene ${f.ability} como habilidad y suma ${f.total} puntos de estadísticas base`,
      (f) => `pesa ${f.weightKg} kg, alcanza ${f.statValue} puntos en ${f.statIn} y aprende ${f.move}`
    ]
};

// Qué hecho del Pokémon representa cada campo de las plantillas (statIn solo nombra la estadística de statValue).
const FIELD_FACT = {
  types: "types", combina: "types", combinaCorto: "types", generation: "generation", generationNumber: "generation",
  heightM: "heightM", weightKg: "weightKg", baseExperience: "baseExperience", ability: "ability", move: "move",
  statHigh: "statHigh", tieneStatHigh: "statHigh", suStatHigh: "statHigh", statIn: null, statValue: "statValue", total: "total"
};

function fieldsFor(pokemon, variant) {
  const types = typeLabel(pokemon);
  const stat = highestStat(pokemon);
  const statName = statNames[stat.name] || stat.name;
  const mono = pokemon.types.length < 2;
  // Con empate en el máximo (p. ej. Sunkern: todas valen 30) solo es cierto «una de sus estadísticas más altas».
  const tied = highestStatIsTied(pokemon);
  return {
    types,
    // «Combina los tipos Fuego» con un solo tipo no tiene sentido: entonces «es de tipo Fuego».
    combina: mono ? `es de tipo ${types}` : `combina los tipos ${types}`,
    combinaCorto: mono ? `es de tipo ${types}` : `combina ${types}`,
    generation: generationNames[pokemon.generation] || `generación ${pokemon.generation}`,
    generationNumber: pokemon.generation,
    heightM: decimal(pokemon.heightM),
    weightKg: decimal(pokemon.weightKg),
    baseExperience: pokemon.baseExperience,
    ability: pokemon.abilitiesEs[variant % pokemon.abilitiesEs.length] || "habilidad registrada",
    move: pokemon.movesEs[variant % pokemon.movesEs.length] || "un movimiento registrado",
    statHigh: statName,
    tieneStatHigh: tied ? `tiene ${statName} como una de sus estadísticas más altas` : `tiene ${statName} como estadística más alta`,
    suStatHigh: tied ? `una de sus estadísticas más altas es ${statName}` : `su estadística más alta es ${statName}`,
    statIn: statName, statValue: stat.value, total: statTotal(pokemon)
  };
}

export function templateCount(difficulty) {
  return TEMPLATES[difficulty].length;
}

/** Texto de la pista y hechos que usa (para descartar distractores que también la cumplan). */
export function buildClue(pokemon, difficulty, variant) {
  const template = TEMPLATES[difficulty][variant % TEMPLATES[difficulty].length];
  const fields = fieldsFor(pokemon, variant);
  const probe = Object.fromEntries(Object.keys(fields).map((key) => [key, `\u0000${key}\u0000`]));
  const probed = template(probe);
  const facts = new Set(Object.keys(fields).filter((key) => probed.includes(`\u0000${key}\u0000`)).map((key) => FIELD_FACT[key]).filter(Boolean));
  return { text: template(fields), facts, ability: fields.ability, move: fields.move };
}

const statValue = (pokemon, name) => pokemon.stats.find((stat) => stat.name === name)?.value;

/**
 * ¿El candidato también cumple la pista de target? Criterio prudente (ante la duda, «sí» y se descarta como distractor):
 * tipos = los de la pista están entre los suyos; habilidad/movimiento = los tiene; estadística más alta = empata en el máximo.
 */
export function satisfiesClue(candidate, target, clue) {
  const high = highestStat(target);
  const checks = {
    types: () => target.types.every((type) => candidate.types.includes(type)),
    generation: () => candidate.generation === target.generation,
    heightM: () => candidate.heightM === target.heightM,
    weightKg: () => candidate.weightKg === target.weightKg,
    baseExperience: () => candidate.baseExperience === target.baseExperience,
    ability: () => candidate.abilitiesEs.includes(clue.ability),
    move: () => candidate.movesEs.includes(clue.move),
    statHigh: () => statValue(candidate, high.name) === highestStat(candidate).value,
    statValue: () => statValue(candidate, high.name) === high.value,
    total: () => statTotal(candidate) === statTotal(target)
  };
  return [...clue.facts].every((fact) => checks[fact]());
}
