export class DoomBCItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["doom-bc", "sheet", "item"],
      width: 620,
      height: 520
    });
  }

  get template() {
    return "systems/doom-bc-system/templates/item/item-sheet.hbs";
  }

  async getData(options) {
    const data = await super.getData(options);
    data.system = data.item.system;
    data.isTrait = data.item.type === "trait";
    data.effects = data.item.effects.map((effect) => ({
      id: effect.id,
      label: effect.name || effect.label || "Effect",
      transfer: Boolean(effect.transfer),
      changeCount: Array.isArray(effect.changes) ? effect.changes.length : 0
    })).sort((a, b) => a.label.localeCompare(b.label));
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='create-effect']").on("click", this._onCreateEffect.bind(this));
    html.find("[data-action='edit-effect']").on("click", this._onEditEffect.bind(this));
    html.find("[data-action='delete-effect']").on("click", this._onDeleteEffect.bind(this));
  }

  async _onCreateEffect(event) {
    event.preventDefault();
    await this.item.createEmbeddedDocuments("ActiveEffect", [{
      name: "New Effect",
      icon: this.item.img,
      transfer: true,
      changes: []
    }]);
  }

  _onEditEffect(event) {
    event.preventDefault();
    const effectId = event.currentTarget.dataset.effectId;
    const effect = this.item.effects.get(effectId);
    effect?.sheet?.render(true);
  }

  async _onDeleteEffect(event) {
    event.preventDefault();
    const effectId = event.currentTarget.dataset.effectId;
    if (!effectId) return;
    await this.item.deleteEmbeddedDocuments("ActiveEffect", [effectId]);
  }
}
