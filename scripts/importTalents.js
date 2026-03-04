import { generateTalents } from "./talentGenerator.js";

function listPackFolders(pack) {
  const folders = pack?.folders;
  if (!folders) return [];
  if (Array.isArray(folders)) return folders;
  if (Array.isArray(folders.contents)) return folders.contents;
  if (typeof folders.values === "function") return Array.from(folders.values());
  return [];
}

function normalizeCategoryName(raw) {
  const name = String(raw ?? "").trim();
  return name || "Без категории";
}

async function ensureFolder(pack, folderMap, categoryName) {
  const key = normalizeCategoryName(categoryName);
  if (folderMap.has(key)) return folderMap.get(key);

  const folder = await Folder.create(
    {
      name: key,
      type: "Item",
      sorting: "a"
    },
    { pack: pack.collection }
  );

  folderMap.set(key, folder.id);
  return folder.id;
}

export async function importTalents(options = {}) {
  const replace = Boolean(options?.replace);
  const talents = await generateTalents();
  const pack = game.packs.get("doom-bc-system.talents");

  if (!pack) {
    throw new Error("Compendium 'doom-bc-system.talents' not found");
  }

  if (!game.user?.isGM) {
    throw new Error("Only GM can import talents into compendium");
  }

  const wasLocked = Boolean(pack.locked);
  if (wasLocked) {
    await pack.configure({ locked: false });
  }

  try {
    const folderMap = new Map();
    for (const folder of listPackFolders(pack)) {
      if (!folder?.name || !folder?.id) continue;
      folderMap.set(folder.name, folder.id);
    }

    if (replace) {
      const existingIds = pack.index.map((entry) => entry._id).filter(Boolean);
      if (existingIds.length > 0) {
        await Item.deleteDocuments(existingIds, { pack: pack.collection });
      }
    }

    for (const talent of talents) {
      const folderId = await ensureFolder(pack, folderMap, talent?.system?.category);
      const item = new CONFIG.Item.documentClass({
        ...talent,
        folder: folderId
      });
      await pack.importDocument(item);
    }
  } finally {
    if (wasLocked) {
      await pack.configure({ locked: true });
    }
  }

  ui.notifications?.info(`Talents imported successfully: ${talents.length}${replace ? " (replace mode)" : ""}`);
  return talents.length;
}
