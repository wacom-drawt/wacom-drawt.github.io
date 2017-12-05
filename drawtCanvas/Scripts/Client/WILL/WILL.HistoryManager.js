/**
 * @namespace WILL.history
 */
WILL.history = {
	state: new Array(),
	length: 20,
	step: -1,

	/**
	 * Copy data from canvas area for history
	 *
	 * @param {Module.Rectangle} rect canvas area
	 */
	add: function(rect) {
		this.step++;

		if (WILL.type == WILL.Type.VECTOR)
			this.state[this.step] = WILL.strokes.clone();
		else {
			var bytes = WILL.strokesLayer.readPixels(rect);
			this.state[this.step] = {bytes: bytes, rect: rect};
		}

		if (this.state.length-1 > this.step)
			this.state = this.state.splice(0, this.step+1);;

		if (this.step > this.length-1) {
			this.step = this.length-1;
			this.state = this.state.splice(1, this.step+1);
		}
	},

	/**
	 * Removes step from history
	 */
	remove: function() {
		if (this.state.length > 0) {
			this.step--;
			this.state.remove(this.state.last())
		}
	},

	/**
	 * Step back in history if available
	 */
	undo: function() {
		if (this.step > -1) {
			this.restore();
			this.step--;
		}
	},

	/**
	 * Step forward in history if available
	 */
	redo: function() {
		if (this.step < this.state.length-1) {
			this.step++;
			this.restore();
		}
	},

	restore: function() {
		WILL.selection.hide();

		var state = this.state[this.step];

		if (WILL.type == WILL.Type.VECTOR) {
			this.state[this.step] = WILL.strokes.clone();
			WILL.strokes = state;

			WILL.redraw(WILL.VIEW_AREA);
		}
		else {
			var prevBytes = WILL.strokesLayer.readPixels(state.rect);
			var bytes = state.bytes;

			WILL.strokesLayer.writePixels(bytes, state.rect);
			WILL.refresh(state.rect);

			this.state[this.step] = {bytes: prevBytes, rect: state.rect};
		}
	}
};