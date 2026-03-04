import { DoomBCActorSheet } from "./sheets/actor-sheet.js";
import { DoomBCItemSheet } from "./sheets/item-sheet.js";

const CHARACTERISTIC_KEYS = ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel", "inf"];
const IDENTITY_KEYS = ["homeworld", "race", "subrace", "archetype", "eliteArchetype", "pride", "motivation", "shame"];

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function clampInt(value, min, max) {
  return Math.min(Math.max(toInt(value, min), min), max);
}

Hooks.once("init", () => {
  console.log("Doom BC | Initializing system");

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("doom-bc-system", DoomBCActorSheet, {
    types: ["pc", "npc", "vehicle"],
    makeDefault: true
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("doom-bc-system", DoomBCItemSheet, {
    makeDefault: true
  });
});

Hooks.once("ready", async () => {
  const updates = [];

  for (const actor of game.actors) {
    if (actor.type !== "pc") continue;
    const update = {};
    let changed = false;

    for (const key of IDENTITY_KEYS) {
      const current = actor.system?.identity?.[key];
      if (typeof current === "string") continue;
      const value = typeof current?.value === "string" ? current.value : String(current ?? "");
      update[`system.identity.${key}`] = value;
      changed = true;
    }

    for (const key of CHARACTERISTIC_KEYS) {
      const basePath = `system.characteristics.${key}`;
      const charData = actor.system?.characteristics?.[key] ?? {};
      const initial = clampInt(charData.initial ?? 0, 0, 100);
      const advances = clampInt(charData.advances ?? 0, 0, 100);
      const modifier = clampInt(charData.modifier ?? 0, -100, 100);
      const unnatural = Math.max(toInt(charData.unnatural ?? 0), 0);
      const current = Math.min(Math.max(initial + advances + modifier, 0), 100);
      const bonus = Math.floor(current / 10);

      if (toInt(charData.initial, 0) !== initial) {
        update[`${basePath}.initial`] = initial;
        changed = true;
      }
      if (toInt(charData.advances, 0) !== advances) {
        update[`${basePath}.advances`] = advances;
        changed = true;
      }
      if (toInt(charData.modifier, 0) !== modifier) {
        update[`${basePath}.modifier`] = modifier;
        changed = true;
      }
      if (toInt(charData.unnatural, 0) !== unnatural) {
        update[`${basePath}.unnatural`] = unnatural;
        changed = true;
      }
      if (toInt(charData.current, -1) !== current) {
        update[`${basePath}.current`] = current;
        changed = true;
      }
      if (toInt(charData.bonus, -1) !== bonus) {
        update[`${basePath}.bonus`] = bonus;
        changed = true;
      }
    }

    const resources = actor.system?.resources ?? {};
    const roll = actor.system?.roll ?? {};
    if (typeof resources.corruption !== "number") { update["system.resources.corruption"] = toInt(resources.corruption, 0); changed = true; }
    if (typeof resources.insanity !== "number") { update["system.resources.insanity"] = toInt(resources.insanity, 0); changed = true; }
    if (typeof resources.wounds !== "number") { update["system.resources.wounds"] = toInt(resources.wounds, 0); changed = true; }
    if (typeof resources.fatigue !== "number") { update["system.resources.fatigue"] = toInt(resources.fatigue, 0); changed = true; }
    if (typeof roll.lastTestType !== "string") { update["system.roll.lastTestType"] = "basic"; changed = true; }
    if (typeof roll.lastModifier !== "number") { update["system.roll.lastModifier"] = toInt(roll.lastModifier, 0); changed = true; }

    if (changed) {
      updates.push(actor.update(update, { diff: false, recursive: true, noHook: true }));
    }
  }

  if (updates.length > 0) {
    await Promise.all(updates);
    console.log(`Doom BC | Migrated ${updates.length} PC actor(s) to current schema`);
  }
});

Hooks.on("renderChatMessage", (_message, html) => {
  html.find(".doom-bc-reroll").on("click", async (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    const actorId = button.dataset.actorId;
    const characteristicKey = button.dataset.characteristic;
    const testName = button.dataset.testName ?? "Characteristic Test";
    const finalModifier = Number.parseInt(button.dataset.finalModifier ?? "0", 10) || 0;

    const actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications?.warn(game.i18n.localize("DOOMBC.Roll.actorMissing"));
      return;
    }

    await DoomBCActorSheet.rollCharacteristicTest({
      actor,
      characteristicKey,
      testName,
      finalModifier,
      isReroll: true,
      canReroll: false
    });
  });
});
