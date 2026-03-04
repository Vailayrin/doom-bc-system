import { generateTraits } from "./traitGenerator.js";

export async function importTraits(options = {}) {
  const replace = Boolean(options?.replace);
  const traits = await generateTraits();
  const pack = game.packs.get("doom-bc-system.traits");

  if (!pack) {
    throw new Error("Compendium 'doom-bc-system.traits' not found");
  }

  if (!game.user?.isGM) {
    throw new Error("Only GM can import traits into compendium");
  }

  const wasLocked = Boolean(pack.locked);
  if (wasLocked) {
    await pack.configure({ locked: false });
  }

  try {
    if (replace) {
      const existingIds = pack.index.map((entry) => entry._id).filter(Boolean);
      if (existingIds.length > 0) {
        await Item.deleteDocuments(existingIds, { pack: pack.collection });
      }
    }

    for (const trait of traits) {
      const item = new CONFIG.Item.documentClass(trait);
      await pack.importDocument(item);
    }
  } finally {
    if (wasLocked) {
      await pack.configure({ locked: true });
    }
  }

  ui.notifications?.info(`Traits imported successfully: ${traits.length}${replace ? " (replace mode)" : ""}`);
  return traits.length;
}
