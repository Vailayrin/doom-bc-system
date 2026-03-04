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
  { key: "eliteArchetype", i18nKey: "DOOMBC.Identity.divination" }
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

const SPECIALIST_CATEGORY_META = [
  { key: "commonLore", label: "Common Lore" },
  { key: "forbiddenLore", label: "Forbidden Lore" },
  { key: "linguistics", label: "Linguistics" },
  { key: "navigate", label: "Navigate" },
  { key: "operate", label: "Operate" },
  { key: "scholasticLore", label: "Scholastic Lore" },
  { key: "trade", label: "Trade" }
];

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function clampInt(value, min, max) {
  return Math.min(Math.max(toInt(value, min), min), max);
}

function deriveCharacteristic(rawData = {}) {
  const initial = clampInt(rawData.initial ?? 0, 0, 100);
  const advances = clampInt(rawData.advances ?? 0, 0, 100);
  const modifier = clampInt(rawData.modifier ?? 0, -100, 100);
  const unnatural = Math.max(toInt(rawData.unnatural ?? 0, 0), 0);
  const current = Math.min(Math.max(initial + advances + modifier, 0), 100);
  const bonus = Math.floor(current / 10);
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

function skillTotal(characteristicsByKey, characteristicKey, advances) {
  const charCurrent = characteristicsByKey[characteristicKey]?.current ?? 0;
  return clampInt(charCurrent + (toInt(advances, 0) * 10), 0, 200);
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
      return {
        key: definition.key,
        shortLabel: definition.shortLabel,
        longLabel: game.i18n.localize(definition.i18nKey),
        ...derived
      };
    });

    const characteristicsByKey = {};
    for (const characteristic of data.characteristics) characteristicsByKey[characteristic.key] = characteristic;

    const basicSkillMap = new Map((data.system.skills?.basic ?? []).map((entry) => [entry?.name, entry]));
    data.basicSkills = BASIC_SKILL_NAMES.map((name, index) => {
      const stored = basicSkillMap.get(name) ?? {};
      const characteristic = CHARACTERISTICS.some((charData) => charData.key === stored.characteristic) ? stored.characteristic : "ag";
      const advances = Math.max(toInt(stored.advances ?? 0, 0), 0);
      return {
        index,
        name,
        characteristic,
        advances,
        total: skillTotal(characteristicsByKey, characteristic, advances)
      };
    });

    data.specialistCategories = SPECIALIST_CATEGORY_META.map((category) => {
      const entries = (data.system.skills?.specialistGroups?.[category.key] ?? []).map((entry, index) => {
        const skillName = String(entry?.name ?? "").trim();
        const characteristic = CHARACTERISTICS.some((charData) => charData.key === entry?.characteristic) ? entry.characteristic : "int";
        const advances = Math.max(toInt(entry?.advances ?? 0, 0), 0);
        return {
          index,
          name: skillName,
          characteristic,
          advances,
          total: skillTotal(characteristicsByKey, characteristic, advances)
        };
      });
      return { ...category, entries };
    });

    data.characteristicOptions = CHARACTERISTICS.map((charData) => ({ key: charData.key, label: charData.shortLabel }));
    data.traitItems = this.actor.items.filter((item) => item.type === "trait").sort((a, b) => a.name.localeCompare(b.name));
    data.talentItems = this.actor.items.filter((item) => item.type === "talent").sort((a, b) => a.name.localeCompare(b.name));
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
    html.find("[data-action='add-specialist-skill']").on("click", this._onAddSpecialistSkill.bind(this));
    html.find("[data-action='remove-specialist-skill']").on("click", this._onRemoveSpecialistSkill.bind(this));
  }

  async _updateObject(_event, formData) {
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
      const bonus = Math.floor(current / 10);

      formData[`${basePath}.initial`] = initial;
      formData[`${basePath}.advances`] = advances;
      formData[`${basePath}.modifier`] = modifier;
      formData[`${basePath}.unnatural`] = unnatural;
      formData[`${basePath}.current`] = current;
      formData[`${basePath}.bonus`] = bonus;
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
    const item = this.actor.items.get(itemId);
    item?.sheet?.render(true);
  }

  async _onDeleteItem(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    if (!itemId) return;
    await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }

  async _onAddSpecialistSkill(event) {
    event.preventDefault();
    const category = event.currentTarget.dataset.category;
    if (!SPECIALIST_CATEGORY_META.some((meta) => meta.key === category)) return;
    const current = foundry.utils.deepClone(this.actor.system.skills?.specialistGroups?.[category] ?? []);
    current.push({ name: "", advances: 0, characteristic: "int" });
    await this.actor.update({ [`system.skills.specialistGroups.${category}`]: current });
  }

  async _onRemoveSpecialistSkill(event) {
    event.preventDefault();
    const category = event.currentTarget.dataset.category;
    const index = toInt(event.currentTarget.dataset.index, -1);
    if (!SPECIALIST_CATEGORY_META.some((meta) => meta.key === category) || index < 0) return;
    const current = foundry.utils.deepClone(this.actor.system.skills?.specialistGroups?.[category] ?? []);
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
