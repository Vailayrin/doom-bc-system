function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveEffectChange(effect = {}) {
  if (typeof effect.key === "string" && effect.key.trim()) {
    return {
      key: effect.key.trim(),
      mode: 2,
      value: String(toNumber(effect.value, 0))
    };
  }

  const characteristic = String(effect.characteristic ?? "").trim().toLowerCase();
  const property = String(effect.type ?? "").trim();
  if (!characteristic || !property) return null;

  return {
    key: `system.characteristics.${characteristic}.${property}`,
    mode: 2,
    value: String(toNumber(effect.value, 0))
  };
}

export async function generateTraits() {
  const response = await fetch("systems/doom-bc-system/traits-source.json");
  if (!response.ok) {
    throw new Error(`Failed to load traits-source.json (${response.status})`);
  }

  const traits = await response.json();
  if (!Array.isArray(traits)) {
    throw new Error("traits-source.json must be an array");
  }

  const generated = [];

  for (const trait of traits) {
    const rating = Math.max(toNumber(trait.rating, 0), 0);
    const nameBase = String(trait.name ?? "").trim();
    if (!nameBase) continue;

    const item = {
      name: rating > 0 ? `${nameBase} (${rating})` : nameBase,
      type: "trait",
      system: {
        rating,
        traitType: String(trait.traitType ?? "rule").trim() || "rule",
        description: String(trait.description ?? "")
      },
      effects: []
    };

    if (Array.isArray(trait.effects)) {
      const changes = trait.effects
        .map(resolveEffectChange)
        .filter((change) => change !== null);

      if (changes.length > 0) {
        item.effects.push({
          name: `${nameBase} Effect`,
          changes,
          disabled: false,
          transfer: true
        });
      }
    }

    generated.push(item);
  }

  return generated;
}
