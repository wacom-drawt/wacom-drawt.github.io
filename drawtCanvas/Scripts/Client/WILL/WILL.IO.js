/**
 * @namespace WILL.io
 */
WILL.io = {
	brushes: [],

	serializeWithFileFormat: function(selection) {
		var ink = this.serialize(selection);

		if (WILL.model) {
			var paint = this.serializeBrushes();

			var encoder = new Module.WILLEncoder();
			encoder.encodeInk(ink);
			encoder.encodePaint(paint);

			return encoder.data;
		}
		else
			return ink;
	},

	/**
	 * Reads data from file buffer and draws it on canvas
	 *
	 * @param {ArrayBuffer} fileBuffer file content
	 * @param {boolean} selection where to restore data in selection or to replace canvas content
	 * @param {Object} pos mouse coordinates when selection needed
	 */
	restoreFromFile: function(fileBuffer, selection, pos) {
		if (WILL.model) {
			var decoder = new Module.WILLDecoder(fileBuffer);
			decoder.decode();

			if (decoder.ink) {
				if (decoder.paint) {
					this.restoreBrushes(decoder.paint, function() {
						WILL.io.restore(decoder.ink, selection, pos);
					});
				}
				else
					WILL.io.restore(decoder.ink, selection, pos);
			}
		}
		else
			this.restore(new Uint8Array(fileBuffer), selection, pos);
	},

	/**
	 * Serialize canvas data
	 *
	 * @param {boolean} selection where to read from
	 * @return {Uint8Array} serialized data
	 */
	serialize: function(selection) {
		this.brushes = new Array();

		var bytes;

		if (WILL.model) {
			var encoder = new Module.InkEncoder();
			var strokes = selection?WILL.selection.strokes:WILL.strokes;

			strokes.forEach(function(stroke) {
				if (stroke.brush instanceof Module.ParticleBrush && this.brushes.indexOf(stroke.brush) == -1) {
					// stroke.brush.id = this.brushes.length;
					this.brushes.push(stroke.brush);
				}

				encoder.encode(stroke, this.brushes.indexOf(stroke.brush));
			}, this);

			bytes = Module.readBytes(encoder.getBytes());
			encoder.delete();
		}
		else
			bytes = this.readPixels(WILL.strokesLayer);

		return bytes;
	},

	serializeBrushes: function() {
		if (this.brushes.length == 0) return null;

		var bytes;
		var encoder = new Module.BrushEncoder();

		this.brushes.forEach(function(brush) {
			encoder.encode(brush);
		}, this);

		bytes = Module.readBytes(encoder.getBytes());
		encoder.delete();

		return bytes;
	},

	restoreBrushes: function(bytes, callback) {
		var self = this;

		Module.writeBytes(bytes, function(int64Ptr) {
			var decoder = new Module.BrushDecoder(int64Ptr);

			decoder.onComplete = function(brushes) {
				self.brushes = brushes;
				callback();
			};

			decoder.decode();
			decoder.delete();
		}, this);
	},

	/**
	 * Deserialize data for canvas
	 *
	 * @param {Uint8Array} bytes serialized data
	 * @param {boolean} selection where to restore data in selection or to replace canvas content
	 * @param {Object} pos mouse coordinates when selection needed
	 */
	restore: function(bytes, selection, pos) {
		if (WILL.model) {
			if (selection) WILL.selection.create();

			var strokes = Module.InkDecoder.decode(bytes);

			WILL.strokes.pushArray(strokes);

			if (selection) {
				WILL.selection.strokes.pushArray(strokes);

				WILL.selection.show();
				WILL.selection.translate(pos);
			}
			else
				WILL.redraw(strokes.bounds);
		}
		else {
			WILL.strokesLayer.writePixels(bytes);
			WILL.refresh(WILL.VIEW_AREA);
		}
	},

	restoreToBezier: function(fileBuffer) {
		this.restore(new Uint8Array(fileBuffer));

		var canvas = document.body.appendChild(document.createElement("canvas"));;
		canvas.width = 1000;
		canvas.height = 500;
		canvas.style = "position: absolute; right: 0; top: 0; background-color: white; opacity: 0.5;";

		var context = c.getContext("2d");
		var bezierPath = new Module.BezierPath();

		WILL.strokes.forEach(function(stroke) {
			bezierPath.setStroke(stroke, WILL.MAX_SCALE_FACTOR);
			bezierPath.draw(context);
		});
	},

	serializeStrokes: function() {
		var strokes = new Array();

		WILL.strokes.forEach(function(stroke) {
			strokes.push(stroke.toJSON());
		}, this);

		return JSON.toBase64(strokes);
	},

	deserializeStrokes: function(base64) {
		var strokes = JSON.fromBase64(base64);

		strokes.forEach(function(data) {
			WILL.strokes.push(Module.Stroke.fromJSON(WILL.writer.tool.brush, data));
		}, this);
	},

	getExtension: function() {
		return WILL.model?".will":".wrg";
	}
};