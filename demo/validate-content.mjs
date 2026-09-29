import { access, readFile } from "node:fs/promises";

const dataUrl = (name) => new URL(`./data/${name}`, import.meta.url);
const errors = [];
const expectedLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const globalIds = new Set();
const globalQuestions = new Set();

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

async function loadBank() {
  try {
    await access(dataUrl("question-bank.json"));
    return JSON.parse(await readFile(dataUrl("question-bank.json"), "utf8"));
  } catch {
    const baseQuestions = JSON.parse(await readFile(dataUrl("questions.json"), "utf8"));
    const packData = JSON.parse(await readFile(dataUrl("question-packs.json"), "utf8"));
    return { packs: [{ id: "beginner-001", difficulty: "beginner", questions: baseQuestions }, ...packData.packs] };
  }
}

const bank = await loadBank();
for (const pack of bank.packs) {
  const seenLetters = new Set();
  const countsByLetter = Object.fromEntries([...expectedLetters].map((letter) => [letter, 0]));
  let startsWith = 0;
  let contains = 0;

  for (const question of pack.questions) {
    const answerOption = question.options.find((option) => option.id === question.correctOptionId);
    const answer = answerOption?.text ?? "";
    const normalizedAnswer = normalize(answer);
    const normalizedLetter = normalize(question.letter);
    const optionTexts = question.options.map((option) => normalize(option.text));
    const normalizedQuestion = normalize(question.question);
    const expectedPrefix = question.rule === "contains" ? `contiene la letra ${question.letter.toLowerCase()}.` : `empieza por la letra ${question.letter.toLowerCase()}.`;

    if (globalIds.has(question.id)) errors.push(`${question.id}: ID duplicado globalmente`);
    globalIds.add(question.id);
    if (globalQuestions.has(normalizedQuestion)) errors.push(`${question.id}: enunciado duplicado globalmente`);
    globalQuestions.add(normalizedQuestion);
    if (question.difficulty !== pack.difficulty) errors.push(`${question.id}: dificultad incorrecta`);
    if (!normalizedQuestion.startsWith(expectedPrefix)) errors.push(`${question.id}: el enunciado debe comenzar por "${expectedPrefix}"`);
    if (/pista\s+(directa|combinada|avanzada|experta)|la respuesta (empieza|contiene)/i.test(question.question)) errors.push(`${question.id}: conserva una etiqueta de pista antigua`);
    if (pack.difficulty === "beginner" && /\b(mide|pesa|kg|kilogramos?|experiencia|estadística|ataque|defensa|velocidad|habilidad|movimiento|número|altura|metros?|base)\b/i.test(question.question)) {
      errors.push(`${question.id}: Principiante contiene un dato avanzado o numérico`);
    }
    if (!expectedLetters.includes(question.letter)) errors.push(`${question.id}: letra fuera de A-Z`);
    seenLetters.add(question.letter);
    countsByLetter[question.letter] = (countsByLetter[question.letter] || 0) + 1;
    if (question.options.length !== 4) errors.push(`${question.id}: no tiene cuatro opciones`);
    if (!answerOption) errors.push(`${question.id}: no tiene una respuesta correcta válida`);
    if (new Set(question.options.map((option) => option.id)).size !== question.options.length) errors.push(`${question.id}: IDs de opciones duplicados`);
    if (new Set(optionTexts).size !== optionTexts.length) errors.push(`${question.id}: opciones duplicadas`);
    if (!question.source?.provider || !question.source?.endpoint || !question.source?.reviewedAt) errors.push(`${question.id}: fuente incompleta`);
    if (question.rule === "starts_with") {
      startsWith += 1;
      if (!normalizedAnswer.startsWith(normalizedLetter)) errors.push(`${question.id}: la respuesta no empieza por ${question.letter}`);
    } else if (question.rule === "contains") {
      contains += 1;
      if (!normalizedAnswer.includes(normalizedLetter)) errors.push(`${question.id}: la respuesta no contiene ${question.letter}`);
    } else {
      errors.push(`${question.id}: regla desconocida`);
    }
  }

  const missingLetters = [...expectedLetters].filter((letter) => !seenLetters.has(letter));
  const lowLetters = Object.entries(countsByLetter).filter(([, count]) => count < 20).map(([letter, count]) => `${letter}=${count}`);
  const percentage = ((startsWith / pack.questions.length) * 100).toFixed(1);
  console.log(`${pack.id}: ${pack.questions.length} preguntas · ${startsWith} empieza por (${percentage}%) · ${contains} contiene (${(contains / pack.questions.length * 100).toFixed(1)}%)`);
  if (pack.questions.length < 500) errors.push(`${pack.id}: necesita al menos 500 preguntas`);
  if (missingLetters.length) errors.push(`${pack.id}: faltan letras ${missingLetters.join(", ")}`);
  if (lowLetters.length) errors.push(`${pack.id}: menos de 20 preguntas para ${lowLetters.join(", ")}`);
  if (startsWith !== 360 || contains !== 160) errors.push(`${pack.id}: se esperaban 360 starts_with y 160 contains`);
}

if (globalIds.size !== globalQuestions.size) errors.push("La cantidad de IDs y enunciados únicos no coincide");

if (errors.length) {
  console.error("Errores de contenido:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Contenido válido: ${bank.packs.length} packs, ${globalIds.size} preguntas únicas, mínimo 20 por letra y sin duplicados globales.`);
}
