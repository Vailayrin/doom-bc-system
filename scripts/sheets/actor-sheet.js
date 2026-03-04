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
  { key: "race", i18nKey: "DOOMBC.Identity.race" },
  { key: "subrace", i18nKey: "DOOMBC.Identity.subrace" },
  { key: "archetype", i18nKey: "DOOMBC.Identity.archetype" },
  { key: "eliteArchetype", i18nKey: "DOOMBC.Identity.eliteArchetype" },
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
  const unnatural = Math.max(toInt(rawData.unnatural ?? 0), 0);
  const current = Math.min(Math.max(initial + advances + modifier, 0), 100);
  const bonus = Math.floor(current / 10);
  return { initial, advances, modifier, unnatural, current, bonus };
}

function identityIdFromValue(fieldKey, value) {
  if (!value) return "";
  const slug = foundry.utils.slugify(value, { strict: true });
  return slug || `${fieldKey}-${foundry.utils.randomID(6)}`;
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
        return "templates/actor/npc-sheet.hbs";
      case "vehicle":
        return "templates/actor/vehicle-sheet.hbs";
      case "pc":
      default:
        return "templates/actor/pc-sheet.hbs";
    }
  }

  async getData(options) {
    const data = await super.getData(options);
    data.system = data.actor.system;
    data.isGM = game.user.isGM;
    data.identityFields = IDENTITY_FIELDS.map((field) => {
      const value = data.system.identity?.[field.key]?.value ?? "";
      const id = data.system.identity?.[field.key]?.id ?? "";
      return {
        key: field.key,
        label: game.i18n.localize(field.i18nKey),
        value,
        id
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
    data.rollDifficultyOptions = buildDifficultyOptions();
    data.testTypes = TEST_TYPES.map((type) => ({
      value: type.value,
      label: game.i18n.localize(type.i18nKey)
    }));
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='roll-characteristic']").on("click", this._onCharacteristicRoll.bind(this));
    html.find(".characteristics-table input[data-char-field]").on("input", this._onCharacteristicFieldInput.bind(this));
  }

  async _updateObject(_event, formData) {
    for (const field of IDENTITY_FIELDS) {
      const valuePath = `system.identity.${field.key}.value`;
      const idPath = `system.identity.${field.key}.id`;
      const value = String(formData[valuePath] ?? "").trim();
      formData[valuePath] = value;
      formData[idPath] = identityIdFromValue(field.key, value);
    }

    for (const charData of CHARACTERISTICS) {
      const basePath = `system.characteristics.${charData.key}`;
      formData[`${basePath}.initial`] = clampInt(formData[`${basePath}.initial`], 0, 100);
      formData[`${basePath}.advances`] = clampInt(formData[`${basePath}.advances`], 0, 100);
      formData[`${basePath}.modifier`] = clampInt(formData[`${basePath}.modifier`], -100, 100);
      formData[`${basePath}.unnatural`] = Math.max(toInt(formData[`${basePath}.unnatural`], 0), 0);
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
          <label>${game.i18n.localize("DOOMBC.Roll.difficulty")}</label>
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
            return { testName, difficulty, customModifier, finalModifier, testType };
          }
        },
        cancel: {
          label: game.i18n.localize("Cancel")
        }
      },
      default: "roll"
    });

    if (!dialogResult) return;

    if (dialogResult.testType !== "basic") {
      await DoomBCActorSheet.createPlaceholderRollMessage(this.actor, dialogResult.testType, dialogResult.testName);
      return;
    }

    await DoomBCActorSheet.rollCharacteristicTest({
      actor: this.actor,
      characteristicKey,
      testName: dialogResult.testName,
      finalModifier: dialogResult.finalModifier
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

  static async rollCharacteristicTest({ actor, characteristicKey, testName, finalModifier = 0, isReroll = false }) {
    const characteristic = deriveCharacteristic(actor.system.characteristics?.[characteristicKey] ?? {});
    const target = Math.min(Math.max(characteristic.current + toInt(finalModifier, 0), 0), 100);
    const roll = await (new Roll("1d100")).evaluate();
    const rollTotal = toInt(roll.total, 100);
    const success = rollTotal <= target;

    const baseDegrees = success ? Math.floor((target - rollTotal) / 10) + 1 : 0;
    const totalDegrees = success ? baseDegrees + characteristic.unnatural : 0;
    const failureDegrees = success ? 0 : Math.floor((rollTotal - target) / 10) + 1;

    const resultLabel = success ? game.i18n.localize("DOOMBC.Roll.success") : game.i18n.localize("DOOMBC.Roll.failure");
    const degreesLabel = success ? game.i18n.localize("DOOMBC.Roll.degreesSuccess") : game.i18n.localize("DOOMBC.Roll.degreesFailure");
    const degreesValue = success ? totalDegrees : failureDegrees;
    const modifierLabel = toInt(finalModifier, 0);
    const safeTestName = foundry.utils.escapeHTML(testName);

    const content = `
      <div class="doom-bc-roll-card ${success ? "success" : "failure"}">
        <div class="roll-title">${safeTestName}${isReroll ? ` (${game.i18n.localize("DOOMBC.Roll.rerollTag")})` : ""}</div>
        <div class="roll-line"><span>${game.i18n.localize("DOOMBC.Roll.target")}:</span> <strong>${target}</strong></div>
        <div class="roll-line"><span>${game.i18n.localize("DOOMBC.Roll.roll")}:</span> <strong>${rollTotal}</strong></div>
        <div class="roll-line"><span>${game.i18n.localize("DOOMBC.Roll.modifier")}:</span> <strong>${modifierLabel >= 0 ? "+" : ""}${modifierLabel}</strong></div>
        <div class="roll-line roll-result"><span>${game.i18n.localize("DOOMBC.Roll.result")}:</span> <strong>${resultLabel}</strong></div>
        <div class="roll-line"><span>${degreesLabel}:</span> <strong>${degreesValue}</strong></div>
        ${success ? `<div class="roll-line"><span>${game.i18n.localize("DOOMBC.Roll.baseDegrees")}:</span> <strong>${baseDegrees}</strong></div>` : ""}
        ${success ? `<div class="roll-line"><span>${game.i18n.localize("DOOMBC.Roll.unnatural")}:</span> <strong>+${characteristic.unnatural}</strong></div>` : ""}
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
      </div>
    `;

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      roll
    });
  }
}
