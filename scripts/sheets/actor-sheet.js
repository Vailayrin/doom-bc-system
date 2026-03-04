const CHARACTERISTICS = [
  { key: "ws", shortLabel: "WS", i18nKey: "DOOMBC.Char.ws" },
  { key: "bs", shortLabel: "BS", i18nKey: "DOOMBC.Char.bs" },
  { key: "s", shortLabel: "S", i18nKey: "DOOMBC.Char.s" },
  { key: "t", shortLabel: "T", i18nKey: "DOOMBC.Char.t" },
  { key: "ag", shortLabel: "Ag", i18nKey: "DOOMBC.Char.ag" },
  { key: "int", shortLabel: "Int", i18nKey: "DOOMBC.Char.int" },
  { key: "per", shortLabel: "Per", i18nKey: "DOOMBC.Char.per" },
  { key: "wp", shortLabel: "WP", i18nKey: "DOOMBC.Char.wp" },
  { key: "fel", shortLabel: "Fel", i18nKey: "DOOMBC.Char.fel" },
  { key: "inf", shortLabel: "Inf", i18nKey: "DOOMBC.Char.inf" }
];

const IDENTITY_FIELDS = [
  { key: "homeworld", i18nKey: "DOOMBC.Identity.homeworld" },
  { key: "race", i18nKey: "DOOMBC.Identity.background" },
  { key: "subrace", i18nKey: "DOOMBC.Identity.role" },
  { key: "archetype", i18nKey: "DOOMBC.Identity.elite" },
  { key: "eliteArchetype", i18nKey: "DOOMBC.Identity.divination" },
  { key: "pride", i18nKey: "DOOMBC.Identity.pride" },
  { key: "motivation", i18nKey: "DOOMBC.Identity.motivation" },
  { key: "shame", i18nKey: "DOOMBC.Identity.shame" }
];

const TEST_TYPES = [
  { value: "basic", i18nKey: "DOOMBC.Roll.type.basic" },
  { value: "opposed", i18nKey: "DOOMBC.Roll.type.opposed" },
  { value: "extended", i18nKey: "DOOMBC.Roll.type.extended" },
  { value: "combined", i18nKey: "DOOMBC.Roll.type.combined" }
];

const BASIC_SKILL_NAMES = [
  "Acrobatics", "Athletics", "Awareness", "Charm", "Command", "Commerce", "Deceive",
  "Dodge", "Inquiry", "Interrogation", "Intimidate", "Logic", "Medicae", "Parry",
  "Psyniscience", "Scrutiny", "Security", "Sleight of Hand", "Stealth", "Survival", "Tech Use"
];

const BASIC_SKILL_ADVANCE_OPTIONS = [
  { value: 0, label: "+0" },
  { value: 1, label: "+10" },
  { value: 2, label: "+20" },
  { value: 3, label: "+30" }
];

const SPECIALIST_CATEGORY_META = [
  { key: "commonLore", label: "Common Lore" },
  { key: "forbiddenLore", label: "Forbidden Lore" },
  { key: "linguistics", label: "Linguistics" },
  { key: "navigate", label: "Navigate" },
  { key: "operate", label: "Operate" },
  { key: "scholasticLore", label: "Scholastic Lore" },
  { key: "trade", label: "Trade" }
];

const APTITUDE_OPTIONS = [
  "WS", "BS", "S", "T", "A", "I", "P", "W", "F",
  "Off", "Fin", "Def", "Knw", "FC", "Psy", "Soc", "Gen", "Tec"
];
const ACTOR_APTITUDE_OPTIONS = ["Off", "Fin", "Def", "Knw", "FC", "Psy", "Soc", "Gen", "Tec"];

const TALENT_APTITUDE_FIRST_OPTIONS = ["Off", "Fin", "Def", "Knw", "FC", "Psy", "Soc", "Gen", "Tec"];
const TALENT_APTITUDE_SECOND_OPTIONS = ["Off", "Fin", "Def", "Knw", "FC", "Psy", "Soc", "Gen", "Tec"];

const CHARACTERISTIC_APTITUDES = {
  ws: ["WS", "Off"],
  bs: ["BS", "Fin"],
  s: ["S", "Off"],
  t: ["T", "Def"],
  ag: ["A", "Fin"],
  int: ["I", "Knw"],
  per: ["P", "FC"],
  wp: ["W", "Psy"],
  fel: ["F", "Soc"],
  inf: ["Gen", "Soc"]
};

const CHARACTERISTIC_XP_COSTS = {
  allied: { 5: 100, 10: 250, 15: 500, 20: 750, 25: 1000 },
  neutral: { 5: 250, 10: 500, 15: 750, 20: 1000, 25: 1500 },
  opposed: { 5: 500, 10: 750, 15: 1000, 20: 1500, 25: 2500 }
};

const SKILL_XP_COSTS = {
  allied: { 0: 100, 1: 200, 2: 350, 3: 550 },
  neutral: { 0: 200, 1: 350, 2: 500, 3: 750 },
  opposed: { 0: 300, 1: 500, 2: 700, 3: 900 }
};

const TALENT_XP_COSTS = {
  allied: { 1: 150, 2: 300, 3: 400 },
  neutral: { 1: 250, 2: 500, 3: 750 },
  opposed: { 1: 400, 2: 750, 3: 1000 }
};
const ACTOR_APTITUDE_FIELDS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6", "slot7", "slot8", "slot9"];

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function clampInt(value, min, max) {
  return Math.min(Math.max(toInt(value, min), min), max);
}

function normalizeIndexedCollection(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  return Object.keys(raw)
    .sort((a, b) => toInt(a, 0) - toInt(b, 0))
    .map((key) => raw[key]);
}

function deriveCharacteristic(rawData = {}) {
  const initial = clampInt(rawData.initial ?? 0, 0, 100);
  const advances = clampInt(rawData.advances ?? 0, 0, 100);
  const modifier = clampInt(rawData.modifier ?? 0, -100, 100);
  const unnatural = Math.max(toInt(rawData.unnatural ?? 0, 0), 0);
  const current = Math.min(Math.max(initial + advances + modifier, 0), 100);
  const bonus = Math.floor(current / 10) + unnatural;
  const extraSuccesses = Math.floor(unnatural / 2);
  return { initial, advances, modifier, unnatural, current, bonus, extraSuccesses };
}

function difficultyLabel(modifier) {
  const map = {
    30: "DOOMBC.Roll.difficulty.veryEasy",
    20: "DOOMBC.Roll.difficulty.easy",
    10: "DOOMBC.Roll.difficulty.routine",
    0: "DOOMBC.Roll.difficulty.challenging",
    "-10": "DOOMBC.Roll.difficulty.hard",
    "-20": "DOOMBC.Roll.difficulty.veryHard"
  };
  const key = map[String(modifier)] ?? null;
  if (!key) return `${modifier >= 0 ? "+" : ""}${modifier}`;
  const text = game.i18n.localize(key);
  return `${text} (${modifier >= 0 ? "+" : ""}${modifier})`;
}

function buildDifficultyOptions() {
  const options = [];
  for (let value = -60; value <= 60; value += 10) {
    options.push({ value, label: difficultyLabel(value) });
  }
  return options;
}

function skillTotal(characteristicsByKey, characteristicKey, advances, bonus) {
  const charCurrent = characteristicsByKey[characteristicKey]?.current ?? 0;
  const total = charCurrent + (toInt(advances, 0) * 10) + toInt(bonus, 0);
  return clampInt(total, -200, 300);
}

function normalizeAptitude(value, fallback = "Gen") {
  const asString = String(value ?? "").trim();
  return APTITUDE_OPTIONS.includes(asString) ? asString : fallback;
}

function relationFromMatches(matches) {
  if (matches >= 2) return "allied";
  if (matches === 1) return "neutral";
  return "opposed";
}

function relationLabel(relation) {
  if (relation === "allied") return "Allied";
  if (relation === "neutral") return "Neutral";
  return "Opposed";
}

function calculateAptitudeRelation(actorAptitudes, targetAptitudes) {
  const actorSet = new Set(actorAptitudes.map((apt) => normalizeAptitude(apt, "Gen")));
  const targetSet = new Set(targetAptitudes.map((apt) => normalizeAptitude(apt, "Gen")));
  let matches = 0;
  for (const aptitude of targetSet) {
    if (actorSet.has(aptitude)) matches += 1;
  }
  const relation = relationFromMatches(matches);
  return { matches, relation, relationLabel: relationLabel(relation) };
}

function characteristicAptitudes(key) {
  return CHARACTERISTIC_APTITUDES[key] ?? ["Gen", "Gen"];
}

function characteristicAdvanceStep(advances) {
  const next = Math.min(Math.max((Math.floor(toInt(advances, 0) / 5) + 1) * 5, 5), 25);
  return next;
}

function skillAptitudes(characteristicKey, storedAptitudes = {}) {
  const [firstFromChar] = characteristicAptitudes(characteristicKey);
  return {
    first: normalizeAptitude(storedAptitudes?.first, firstFromChar),
    second: normalizeAptitude(storedAptitudes?.second, "Gen")
  };
}

export class DoomBCActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["doom-bc", "sheet", "actor"],
      width: 960,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  get template() {
    switch (this.actor.type) {
      case "npc":
        return "systems/doom-bc-system/templates/actor/npc-sheet.hbs";
      case "vehicle":
        return "systems/doom-bc-system/templates/actor/vehicle-sheet.hbs";
      case "pc":
      default:
        return "systems/doom-bc-system/templates/actor/pc-sheet.hbs";
    }
  }

  async getData(options) {
    const data = await super.getData(options);
    data.system = data.actor.system;
    data.aptitudeOptions = ACTOR_APTITUDE_OPTIONS.map((value) => ({ value, label: value }));
    const actorAptitudes = ACTOR_APTITUDE_FIELDS.map((field, index) => {
      const fallback = index === 0 ? normalizeAptitude(data.system.aptitudes?.primary, "Gen")
        : (index === 1 ? normalizeAptitude(data.system.aptitudes?.secondary, "Gen") : "Gen");
      return normalizeAptitude(data.system.aptitudes?.[field], fallback);
    });
    data.actorAptitudes = ACTOR_APTITUDE_FIELDS.map((field, index) => ({
      field,
      value: actorAptitudes[index]
    }));
    data.identityFields = IDENTITY_FIELDS.map((field) => {
      const rawValue = data.system.identity?.[field.key];
      const value = typeof rawValue === "string" ? rawValue : String(rawValue?.value ?? "");
      return {
        key: field.key,
        label: game.i18n.localize(field.i18nKey),
        value
      };
    });
    data.characteristics = CHARACTERISTICS.map((definition) => {
      const raw = data.system.characteristics?.[definition.key] ?? {};
      const derived = deriveCharacteristic(raw);
      const aptitudes = characteristicAptitudes(definition.key);
      const relationData = calculateAptitudeRelation(actorAptitudes, aptitudes);
      const nextAdvance = characteristicAdvanceStep(derived.advances);
      return {
        key: definition.key,
        shortLabel: definition.shortLabel,
        longLabel: game.i18n.localize(definition.i18nKey),
        aptitudes,
        relation: relationData.relationLabel,
        xpCost: CHARACTERISTIC_XP_COSTS[relationData.relation][nextAdvance] ?? "-",
        nextAdvanceLabel: `+${nextAdvance}`,
        ...derived
      };
    });

    const characteristicsByKey = {};
    for (const characteristic of data.characteristics) characteristicsByKey[characteristic.key] = characteristic;

    const basicSkillSource = normalizeIndexedCollection(data.system.skills?.basic ?? []);
    const basicSkillMap = new Map(basicSkillSource.map((entry) => [entry?.name, entry]));
    data.basicSkills = BASIC_SKILL_NAMES.map((name, index) => {
      const stored = basicSkillMap.get(name) ?? {};
      const characteristic = CHARACTERISTICS.some((charData) => charData.key === stored.characteristic) ? stored.characteristic : "ag";
      const advances = clampInt(stored.advances ?? 0, 0, 3);
      const bonus = clampInt(stored.bonus ?? 0, -200, 200);
      const aptitudes = skillAptitudes(characteristic, stored.aptitudes);
      const relationData = calculateAptitudeRelation(actorAptitudes, [aptitudes.first, aptitudes.second]);
      return {
        index,
        name,
        characteristic,
        advances,
        bonus,
        total: skillTotal(characteristicsByKey, characteristic, advances, bonus),
        aptitudes,
        relation: relationData.relationLabel,
        xpCost: SKILL_XP_COSTS[relationData.relation][advances] ?? "-"
      };
    });

    data.specialistCategories = SPECIALIST_CATEGORY_META.map((category) => {
      const specialistSource = normalizeIndexedCollection(data.system.skills?.specialistGroups?.[category.key] ?? []);
      const entries = specialistSource.map((entry, index) => {
        const skillName = String(entry?.name ?? "").trim();
        const characteristic = CHARACTERISTICS.some((charData) => charData.key === entry?.characteristic) ? entry.characteristic : "int";
        const advances = clampInt(entry?.advances ?? 0, 0, 3);
        const bonus = clampInt(entry?.bonus ?? 0, -200, 200);
        const aptitudes = skillAptitudes(characteristic, entry?.aptitudes);
        const relationData = calculateAptitudeRelation(actorAptitudes, [aptitudes.first, aptitudes.second]);
        return {
          index,
          categoryKey: category.key,
          name: skillName,
          characteristic,
          advances,
          bonus,
          total: skillTotal(characteristicsByKey, characteristic, advances, bonus),
          aptitudes,
          relation: relationData.relationLabel,
          xpCost: SKILL_XP_COSTS[relationData.relation][advances] ?? "-"
        };
      });
      return { ...category, entries };
    });

    data.characteristicOptions = CHARACTERISTICS.map((charData) => ({ key: charData.key, label: charData.shortLabel }));
    data.basicSkillAdvanceOptions = BASIC_SKILL_ADVANCE_OPTIONS;
    data.traitItems = this.actor.items
      .filter((item) => item.type === "trait")
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        id: item.id,
        name: item.name,
        system: item.system
      }));
    data.talentItems = this.actor.items
      .filter((item) => item.type === "talent")
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => {
        const tier = clampInt(item.system?.tier ?? 1, 1, 3);
        const first = normalizeAptitude(item.system?.aptitudes?.first, "Gen");
        const second = normalizeAptitude(item.system?.aptitudes?.second, "Gen");
        const relationData = calculateAptitudeRelation(actorAptitudes, [first, second]);
        return {
          id: item.id,
          name: item.name,
          system: item.system,
          tier,
          aptitudes: { first, second },
          relation: relationData.relationLabel,
          xpCost: TALENT_XP_COSTS[relationData.relation][tier] ?? "-"
        };
      });
    data.advancementData = {
      characteristics: data.characteristics.map((charData) => ({
        label: charData.shortLabel,
        relation: charData.relation,
        xpCost: charData.xpCost,
        step: charData.nextAdvanceLabel
      })),
      basicSkills: data.basicSkills.map((skill) => ({
        label: skill.name,
        relation: skill.relation,
        xpCost: skill.xpCost,
        advance: `+${toInt(skill.advances, 0) * 10}`
      })),
      specialistSkills: data.specialistCategories.flatMap((category) => category.entries.map((entry) => ({
        label: entry.name || category.label,
        relation: entry.relation,
        xpCost: entry.xpCost,
        advance: `+${toInt(entry.advances, 0) * 10}`
      }))),
      talents: data.talentItems.map((talent) => ({
        label: talent.name,
        relation: talent.relation,
        xpCost: talent.xpCost,
        tier: talent.tier
      }))
    };
    data.hasOwner = this.actor.isOwner;
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='roll-characteristic']").on("click", this._onCharacteristicRoll.bind(this));
    html.find(".characteristics-table input[data-char-field]").on("input", this._onCharacteristicFieldInput.bind(this));
    html.find("[data-action='create-item']").on("click", this._onCreateItem.bind(this));
    html.find("[data-action='edit-item']").on("click", this._onEditItem.bind(this));
    html.find("[data-action='delete-item']").on("click", this._onDeleteItem.bind(this));
    html.find("[data-action='toggle-trait-description']").on("click", this._onToggleTraitDescription.bind(this));
    html.find("[data-action='toggle-talent-description']").on("click", this._onToggleTraitDescription.bind(this));
    html.find("[data-action='add-specialist-skill']").on("click", this._onAddSpecialistSkill.bind(this));
    html.find("[data-action='remove-specialist-skill']").on("click", this._onRemoveSpecialistSkill.bind(this));
  }

  async _updateObject(_event, formData) {
    for (const field of ACTOR_APTITUDE_FIELDS) {
      formData[`system.aptitudes.${field}`] = normalizeAptitude(formData[`system.aptitudes.${field}`], "Gen");
    }

    for (const field of IDENTITY_FIELDS) {
      const path = `system.identity.${field.key}`;
      formData[path] = String(formData[path] ?? "").trim();
    }

    for (const charData of CHARACTERISTICS) {
      const basePath = `system.characteristics.${charData.key}`;
      const initial = clampInt(formData[`${basePath}.initial`], 0, 100);
      const advances = clampInt(formData[`${basePath}.advances`], 0, 100);
      const modifier = clampInt(formData[`${basePath}.modifier`], -100, 100);
      const unnatural = Math.max(toInt(formData[`${basePath}.unnatural`], 0), 0);
      const current = Math.min(Math.max(initial + advances + modifier, 0), 100);
      const bonus = Math.floor(current / 10) + unnatural;

      formData[`${basePath}.initial`] = initial;
      formData[`${basePath}.advances`] = advances;
      formData[`${basePath}.modifier`] = modifier;
      formData[`${basePath}.unnatural`] = unnatural;
      formData[`${basePath}.current`] = current;
      formData[`${basePath}.bonus`] = bonus;
    }

    for (let index = 0; index < BASIC_SKILL_NAMES.length; index += 1) {
      const characteristicPath = `system.skills.basic.${index}.characteristic`;
      const aptitudeFirstPath = `system.skills.basic.${index}.aptitudes.first`;
      const aptitudeSecondPath = `system.skills.basic.${index}.aptitudes.second`;
      const characteristicKey = String(formData[characteristicPath] ?? "ag");
      const [firstFromCharacteristic] = characteristicAptitudes(characteristicKey);
      formData[aptitudeFirstPath] = firstFromCharacteristic;
      formData[aptitudeSecondPath] = normalizeAptitude(formData[aptitudeSecondPath], "Gen");
    }

    const specialistKeys = Object.keys(formData);
    for (const category of SPECIALIST_CATEGORY_META) {
      const prefix = `system.skills.specialistGroups.${category.key}.`;
      const indices = new Set();
      for (const key of specialistKeys) {
        if (!key.startsWith(prefix)) continue;
        const remainder = key.slice(prefix.length);
        const index = toInt(remainder.split(".")[0], -1);
        if (index >= 0) indices.add(index);
      }
      for (const index of indices) {
        const characteristicPath = `${prefix}${index}.characteristic`;
        const aptitudeFirstPath = `${prefix}${index}.aptitudes.first`;
        const aptitudeSecondPath = `${prefix}${index}.aptitudes.second`;
        const characteristicKey = String(formData[characteristicPath] ?? "int");
        const [firstFromCharacteristic] = characteristicAptitudes(characteristicKey);
        formData[aptitudeFirstPath] = firstFromCharacteristic;
        formData[aptitudeSecondPath] = normalizeAptitude(formData[aptitudeSecondPath], "Gen");
      }
    }

    await this.actor.update(formData);
  }

  _onCharacteristicFieldInput(event) {
    const row = event.currentTarget.closest("tr[data-characteristic]");
    if (!row) return;
    const raw = {
      initial: row.querySelector("input[data-char-field='initial']")?.value,
      advances: row.querySelector("input[data-char-field='advances']")?.value,
      modifier: row.querySelector("input[data-char-field='modifier']")?.value,
      unnatural: row.querySelector("input[data-char-field='unnatural']")?.value
    };
    const derived = deriveCharacteristic(raw);
    const current = row.querySelector("input[data-derived='current']");
    const bonus = row.querySelector("input[data-derived='bonus']");
    if (current) current.value = String(derived.current);
    if (bonus) bonus.value = String(derived.bonus);
  }

  async _onCreateItem(event) {
    event.preventDefault();
    const itemType = String(event.currentTarget.dataset.itemType ?? "").trim();
    if (!["trait", "talent"].includes(itemType)) return;
    const itemName = itemType === "trait" ? "New Trait" : "New Talent";
    const item = await this.actor.createEmbeddedDocuments("Item", [{ name: itemName, type: itemType }]);
    item[0]?.sheet?.render(true);
  }

  _onEditItem(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    item?.sheet?.render(true);
  }

  async _onDeleteItem(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    if (!itemId) return;
    await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }

  _onToggleTraitDescription(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    if (!itemId) return;
    const row = this.element?.find(`tr[data-desc-for='${itemId}']`)?.get(0);
    if (!row) return;
    row.classList.toggle("is-open");
  }

  async _onAddSpecialistSkill(event) {
    event.preventDefault();
    const category = event.currentTarget.dataset.category;
    if (!SPECIALIST_CATEGORY_META.some((meta) => meta.key === category)) return;
    const current = normalizeIndexedCollection(this.actor.system.skills?.specialistGroups?.[category] ?? []);
    current.push({ name: "", advances: 0, characteristic: "int", bonus: 0, aptitudes: { first: "I", second: "Gen" } });
    await this.actor.update({ [`system.skills.specialistGroups.${category}`]: current });
  }

  async _onRemoveSpecialistSkill(event) {
    event.preventDefault();
    const category = event.currentTarget.dataset.category;
    const index = toInt(event.currentTarget.dataset.index, -1);
    if (!SPECIALIST_CATEGORY_META.some((meta) => meta.key === category) || index < 0) return;
    const current = normalizeIndexedCollection(this.actor.system.skills?.specialistGroups?.[category] ?? []);
    if (index >= current.length) return;
    current.splice(index, 1);
    await this.actor.update({ [`system.skills.specialistGroups.${category}`]: current });
  }

  async _onCharacteristicRoll(event) {
    event.preventDefault();
    const characteristicKey = event.currentTarget.dataset.characteristic;
    if (!characteristicKey) return;

    const characteristicName = CHARACTERISTICS.find((charData) => charData.key === characteristicKey)?.shortLabel ?? characteristicKey.toUpperCase();
    const defaultName = `${characteristicName} ${game.i18n.localize("DOOMBC.Roll.testSuffix")}`;
    const difficultyOptions = buildDifficultyOptions();
    const testTypeOptions = TEST_TYPES
      .map((type) => `<option value="${type.value}">${game.i18n.localize(type.i18nKey)}</option>`)
      .join("");
    const difficultyHtml = difficultyOptions
      .map((option) => `<option value="${option.value}" ${option.value === 0 ? "selected" : ""}>${option.label}</option>`)
      .join("");

    const content = `
      <div class="doom-bc-roll-dialog">
        <div class="form-group">
          <label>${game.i18n.localize("DOOMBC.Roll.testName")}</label>
          <input type="text" name="testName" value="${defaultName}" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("DOOMBC.Roll.difficultyLabel")}</label>
          <select name="difficulty">${difficultyHtml}</select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("DOOMBC.Roll.customModifier")}</label>
          <input type="number" name="customModifier" value="0" min="-60" max="60" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("DOOMBC.Roll.testType")}</label>
          <select name="testType">${testTypeOptions}</select>
        </div>
      </div>
    `;

    const dialogResult = await Dialog.wait({
      title: game.i18n.localize("DOOMBC.Roll.dialogTitle"),
      content,
      buttons: {
        roll: {
          label: game.i18n.localize("DOOMBC.Roll.button"),
          callback: (html) => {
            const testName = String(html.find("[name='testName']").val() ?? defaultName).trim() || defaultName;
            const difficulty = clampInt(html.find("[name='difficulty']").val(), -60, 60);
            const customModifier = clampInt(html.find("[name='customModifier']").val(), -60, 60);
            const finalModifier = clampInt(difficulty + customModifier, -60, 60);
            const testType = String(html.find("[name='testType']").val() ?? "basic");
            return { testName, finalModifier, testType };
          }
        },
        cancel: {
          label: game.i18n.localize("Cancel")
        }
      },
      default: "roll"
    });

    if (!dialogResult) return;

    await this.actor.update({
      "system.roll.lastTestType": dialogResult.testType,
      "system.roll.lastModifier": dialogResult.finalModifier
    });

    if (dialogResult.testType !== "basic") {
      await DoomBCActorSheet.createPlaceholderRollMessage(this.actor, dialogResult.testType, dialogResult.testName);
      return;
    }

    await DoomBCActorSheet.rollCharacteristicTest({
      actor: this.actor,
      characteristicKey,
      testName: dialogResult.testName,
      finalModifier: dialogResult.finalModifier,
      canReroll: true
    });
  }

  static async createPlaceholderRollMessage(actor, testType, testName) {
    const typeMap = {
      opposed: "DOOMBC.Roll.placeholder.opposed",
      extended: "DOOMBC.Roll.placeholder.extended",
      combined: "DOOMBC.Roll.placeholder.combined"
    };
    const placeholder = game.i18n.localize(typeMap[testType] ?? "DOOMBC.Roll.placeholder.generic");
    const safeTestName = foundry.utils.escapeHTML(testName);
    const content = `
      <div class="doom-bc-roll-card placeholder">
        <div class="roll-title">${safeTestName}</div>
        <div class="roll-result">${placeholder}</div>
      </div>
    `;

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content
    });
  }

  static async rollCharacteristicTest({ actor, characteristicKey, testName, finalModifier = 0, isReroll = false, canReroll = true }) {
    const characteristic = deriveCharacteristic(actor.system.characteristics?.[characteristicKey] ?? {});
    const target = Math.min(Math.max(characteristic.current + toInt(finalModifier, 0), 0), 100);
    const roll = await (new Roll("1d100")).evaluate();
    const rollTotal = toInt(roll.total, 100);
    const isCriticalSuccess = rollTotal >= 1 && rollTotal <= 5;
    const isCriticalFailure = rollTotal >= 96 && rollTotal <= 100;
    const success = isCriticalSuccess ? true : (isCriticalFailure ? false : rollTotal <= target);

    const baseDegrees = success ? Math.floor((target - rollTotal) / 10) + 1 : 0;
    const totalDegrees = success ? baseDegrees + characteristic.extraSuccesses : 0;
    const failureDegrees = success ? 0 : Math.floor((rollTotal - target) / 10) + 1;

    let resultLabel = success ? game.i18n.localize("DOOMBC.Roll.success") : game.i18n.localize("DOOMBC.Roll.failure");
    if (isCriticalSuccess) resultLabel = game.i18n.localize("DOOMBC.Roll.criticalSuccess");
    if (isCriticalFailure) resultLabel = game.i18n.localize("DOOMBC.Roll.criticalFailure");

    const degreesLabel = success ? game.i18n.localize("DOOMBC.Roll.degreesSuccess") : game.i18n.localize("DOOMBC.Roll.degreesFailure");
    const degreesValue = success ? totalDegrees : failureDegrees;
    const modifierLabel = toInt(finalModifier, 0);
    const safeTestName = foundry.utils.escapeHTML(testName);

    const rerollButton = canReroll ? `
      <div class="roll-actions">
        <button
          type="button"
          class="doom-bc-reroll"
          data-actor-id="${actor.id}"
          data-characteristic="${characteristicKey}"
          data-test-name="${safeTestName}"
          data-final-modifier="${modifierLabel}">
          ${game.i18n.localize("DOOMBC.Roll.reroll")}
        </button>
      </div>
    ` : "";

    const content = `
      <div class="doom-bc-roll-card ${success ? "success" : "failure"}">
        <div class="roll-title">${safeTestName}${isReroll ? ` (${game.i18n.localize("DOOMBC.Roll.rerollTag")})` : ""}</div>
        <div class="roll-line"><span>${game.i18n.localize("DOOMBC.Roll.target")}:</span> <strong>${target}</strong></div>
        <div class="roll-line"><span>${game.i18n.localize("DOOMBC.Roll.roll")}:</span> <strong>${rollTotal}</strong></div>
        <div class="roll-line"><span>${game.i18n.localize("DOOMBC.Roll.modifier")}:</span> <strong>${modifierLabel >= 0 ? "+" : ""}${modifierLabel}</strong></div>
        <div class="roll-line roll-result"><span>${game.i18n.localize("DOOMBC.Roll.result")}:</span> <strong>${resultLabel}</strong></div>
        <div class="roll-line"><span>${degreesLabel}:</span> <strong>${degreesValue}</strong></div>
        ${success ? `<div class="roll-line"><span>${game.i18n.localize("DOOMBC.Roll.baseDegrees")}:</span> <strong>${baseDegrees}</strong></div>` : ""}
        ${success ? `<div class="roll-line"><span>${game.i18n.localize("DOOMBC.Roll.extraSuccesses")}:</span> <strong>+${characteristic.extraSuccesses}</strong></div>` : ""}
        ${rerollButton}
      </div>
    `;

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      roll
    });
  }
}
