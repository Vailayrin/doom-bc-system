const TALENT_APTITUDES = ["WS", "BS", "S", "T", "A", "I", "P", "W", "F", "Off", "Fin", "Def", "Knw", "FC", "Psy", "Soc", "Gen", "Tec"];

const APTITUDE_ALIASES = {
  WS: "WS",
  BS: "BS",
  S: "S",
  T: "T",
  A: "A",
  I: "I",
  P: "P",
  W: "W",
  F: "F",
  OFF: "Off",
  FIN: "Fin",
  DEF: "Def",
  KNW: "Knw",
  FC: "FC",
  PSY: "Psy",
  PSI: "Psy",
  SOC: "Soc",
  GEN: "Gen",
  TEC: "Tec"
};

const META_LEVEL = /^Уровень\s*:\s*(\d)/i;
const META_GOD = /Бог\s*:\s*([^|]+)/i;
const META_SKILLS = /Скл\.\s*:\s*([^|]+)/i;
const LINE_REQUIREMENTS = /^Требования\s*:/i;
const LINE_SPECIALIZATIONS = /^Специализации\s*:/i;
const LINE_LEVEL = /^Уровень\s*:/i;

function normalizeAptitudeToken(raw) {
  const token = String(raw ?? "").trim();
  if (!token) return "Gen";
  const upper = token.toUpperCase();
  const normalized = APTITUDE_ALIASES[upper] ?? "Gen";
  return TALENT_APTITUDES.includes(normalized) ? normalized : "Gen";
}

function parseAptitudes(raw) {
  const text = String(raw ?? "").trim();
  if (!text || /как\s+у/i.test(text)) return { first: "Gen", second: "Gen" };
  const tokens = text
    .split(",")
    .map((part) => normalizeAptitudeToken(part))
    .filter(Boolean);
  return {
    first: tokens[0] ?? "Gen",
    second: tokens[1] ?? "Gen"
  };
}

function parseMeta(talent, line) {
  const tierMatch = line.match(META_LEVEL);
  if (tierMatch) talent.tier = Number.parseInt(tierMatch[1], 10) || 1;

  const godMatch = line.match(META_GOD);
  if (godMatch) talent.god = godMatch[1].trim();

  const aptitudeMatch = line.match(META_SKILLS);
  if (aptitudeMatch) {
    const parsed = parseAptitudes(aptitudeMatch[1]);
    talent.aptitudes.first = parsed.first;
    talent.aptitudes.second = parsed.second;
  }
}

function isCategoryLine(line) {
  const text = String(line ?? "").trim();
  if (!text) return false;
  if (!text.endsWith(":")) return false;
  if (text.includes("/")) return false;
  if (LINE_LEVEL.test(text) || LINE_REQUIREMENTS.test(text) || LINE_SPECIALIZATIONS.test(text)) return false;
  return /^[A-ZА-ЯЁ0-9\s-]+:\s*$/u.test(text);
}

function isTalentStartLine(line) {
  if (!line.includes("/")) return false;
  if (LINE_LEVEL.test(line) || LINE_REQUIREMENTS.test(line) || LINE_SPECIALIZATIONS.test(line)) return false;
  if (line.startsWith("•")) return false;
  const titleOnly = String(line).split(/\s+Уровень\s*:/i)[0].trim();
  const parts = titleOnly.split("/").map((part) => part.trim());
  if (parts.length !== 2) return false;

  const [left, right] = parts;
  if (!left || !right) return false;
  if (!/^[A-Z0-9]/.test(left)) return false;
  if (left.length > 80 || right.length > 120) return false;

  // Reject common slash patterns from description lines.
  if (/\bи\s*\/\s*или\b/i.test(titleOnly)) return false;
  if (/\d+\s*\/\s*\d+/.test(titleOnly)) return false;
  if (/,/.test(titleOnly)) return false;

  return true;
}

function buildTalentName(line) {
  const inlineMetaSplit = line.split(/\s+Уровень\s*:\s*/i);
  const titlePart = inlineMetaSplit[0].trim();
  const inlineMeta = inlineMetaSplit.length > 1
    ? `Уровень: ${inlineMetaSplit.slice(1).join(" ").trim()}`
    : "";

  const slashIndex = titlePart.indexOf("/");
  if (slashIndex < 0) return { name: titlePart, inlineMeta };

  const left = titlePart.slice(0, slashIndex).trim();
  const right = titlePart.slice(slashIndex + 1).trim();
  return { name: `${left} / ${right}`, inlineMeta };
}

function finalizeTalent(talent) {
  const description = talent.descriptionLines.join("\n").trim();
  return {
    name: talent.name,
    type: "talent",
    system: {
      tier: talent.tier,
      aptitudes: {
        first: talent.aptitudes.first,
        second: talent.aptitudes.second
      },
      description,
      requirements: talent.requirements || "Нет",
      god: talent.god || "Неделимый",
      category: talent.category,
      specializations: talent.specializations
    }
  };
}

function parseTalentsFromText(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim());

  const talents = [];
  let category = "";
  let current = null;
  let expectMeta = false;

  for (const line of lines) {
    if (!line) continue;

    if (isCategoryLine(line)) {
      category = line.replace(/:\s*$/, "").trim();
      continue;
    }

    if (isTalentStartLine(line)) {
      if (current) talents.push(finalizeTalent(current));
      const built = buildTalentName(line);
      current = {
        name: built.name,
        tier: 1,
        god: "",
        aptitudes: { first: "Gen", second: "Gen" },
        requirements: "",
        specializations: "",
        category,
        descriptionLines: []
      };

      if (built.inlineMeta) {
        parseMeta(current, built.inlineMeta);
        expectMeta = false;
      } else {
        expectMeta = true;
      }
      continue;
    }

    if (!current) continue;

    if (expectMeta && LINE_LEVEL.test(line)) {
      parseMeta(current, line);
      expectMeta = false;
      continue;
    }

    if (LINE_REQUIREMENTS.test(line)) {
      current.requirements = line.replace(LINE_REQUIREMENTS, "").trim();
      continue;
    }

    if (LINE_SPECIALIZATIONS.test(line)) {
      current.specializations = line.replace(LINE_SPECIALIZATIONS, "").trim();
      continue;
    }

    current.descriptionLines.push(line);
  }

  if (current) talents.push(finalizeTalent(current));
  return talents;
}

export async function generateTalents() {
  const response = await fetch("systems/doom-bc-system/talents-source.txt");
  if (!response.ok) {
    throw new Error(`Failed to load talents-source.txt (${response.status})`);
  }

  const raw = await response.text();
  const generated = parseTalentsFromText(raw);
  if (!generated.length) {
    throw new Error("No talents parsed from talents-source.txt");
  }

  return generated;
}

