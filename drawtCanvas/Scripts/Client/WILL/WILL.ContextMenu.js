/**
 * @namespace WILL.contextMenu
 */
WILL.contextMenu = {
	ready: false,
	cancel: false,

	/**
	 * Displays context menu
	 *
	 * @param {Event} e mouse down event for right mouse button
	 * @param {WILL.contextMenu.Type} type menu type
	 */
	show: function(e, type) {
		if (e.button != 2) return;

		if (!this.menu) this.menu = document.querySelector(".ContextMenu");
		this.hide();

		if (!this.ready) {
			var self = this;

			setTimeout(function() {
				if (!self.cancel) {
					self.ready = true;
					self.show(e, type);
				}

				self.ready = false;
				self.cancel = false;
			}, 100);

			e.preventDefault();
			return;
		}

		if (type == WILL.contextMenu.Type.EDIT)
			$("body").addClass("StateEdit");
		else if (WILL.selection.clipboard || WILL.type == WILL.Type.VECTOR) {
			$("body").addClass("StatePaste");

			if (WILL.type == WILL.Type.RASTER)
				$("body").addClass("PasteOnly");
			else if (!WILL.selection.clipboard)
				$("body").addClass("ImportOnly");
		}
		else
			this.cancel = true;

		if (!this.cancel) {
			this.pos = tools.getMousePos(e);

			this.menu.style.left = this.pos.x + "px";
			this.menu.style.top = this.pos.y + "px";
			this.menu.style.display = "";

			if (this.pos.x + this.menu.offsetWidth > Module.canvas.offsetWidth)
				this.menu.style.left = (Module.canvas.offsetWidth - this.menu.offsetWidth) + "px";

			if (this.pos.y + this.menu.offsetHeight > Module.canvas.offsetHeight)
				this.menu.style.top = (Module.canvas.offsetHeight - this.menu.offsetHeight) + "px";
		}
	},

	/**
	 * Hides context menu
	 */
	hide: function() {
		if (!this.menu) return;

		this.cancel = false;
		this.menu.style.display = "none";

		$("body").removeClass("StateEdit");
		$("body").removeClass("StatePaste");
		$("body").removeClass("PasteOnly");
		$("body").removeClass("ImportOnly");
	},

	/**
	 * Check is context menu is available
	 */
	visible: function() {
		return !!(this.menu && this.menu.style.display == "");
	}
};

/**
 * Enum for Context Menu
 *
 * @readonly
 * @enum {Object}
 * @typedef {Object} WILL.contextMenu.Type
 * @property {Object} EDIT
 * @property {Object} PASTE
 */
Function.prototype.createEnum.call(WILL.contextMenu, "Type", ["EDIT", "PASTE"]);