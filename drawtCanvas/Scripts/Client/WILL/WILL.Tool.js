/**
 * Canvas writer
 *
 * @class WILL.Tool
 *
 * @param {string} name
 * @param {WILL.Tool.Type} type not required, default is STROKE
 * @param {string} id not required.
 * 		Describes relation between Tool and HTMLElement, which activates this tool.
 * 		When not available id is name without spaces.
 */
WILL.Tool = function(name, type, id) {
	this.id = id || name.replace(/\s/g, "");
	this.name = name;
	this.type = type || WILL.Tool.Type.STROKE;
	this.width = (this.type == WILL.Tool.Type.SELECTOR)?1.25:NaN;
	this.pathBuilders = new Object();
	this.pathBuilderType = WILL.Tool.PathBuilderType.SPEED;
	this.strokeLayerBlendMode = Module.BlendMode.NORMAL;
}

WILL.Tool.createEnum("Type", ["STROKE", "ERASER", "SELECTOR"]);
WILL.Tool.createEnum("BrushType", ["DIRECT", "SOLID_COLOR", "PARTICLE"]);
WILL.Tool.createEnum("PathBuilderType", ["SPEED", "PRESSURE"]);

WILL.Tool.PathBuilderClassNames = {
	"SPEED": "SpeedPathBuilder",
	"PRESSURE": "PressurePathBuilder"
};

Object.extend(WILL.Tool.prototype, {
	createBrush: function(type, blendMode) {
		if (type == WILL.Tool.BrushType.DIRECT)
			this.brush = new Module.DirectBrush();
		else if (type == WILL.Tool.BrushType.SOLID_COLOR)
			this.brush = new Module.SolidColorBrush();
		else
			this.brush = new Module.ParticleBrush(false);

		if (blendMode && type != WILL.Tool.BrushType.SOLID_COLOR)
			this.brush.blendMode = blendMode;

		if (!this.brush.id)
			this.brush.id = this.id.charsCode();
	},

	configureParticleBrush: function(randomizeFill, spacing, scattering, rotationMode, shape, fill) {
		this.brush.configure(randomizeFill, {x: 0, y: 0}, spacing, scattering, rotationMode);
		this.brush.configureShape(this.getImageSRC(shape));
		this.brush.configureFill(this.getImageSRC(fill));
	},

	getImageSRC: function(imageName) {
		var result;
		var src = WILL.TEXTURES_PATH + "/" + imageName;

		if (imageName.indexOf(".") == -1) {
			result = new Array();
			// var sizes = [128, 64, 32, 16, 8, 4, 2, 1];
			var sizes = [128, 64, 32, 16, 8];

			sizes.forEach(function(size) {
				result.push(src + "_" + size + "x" + size + ".png");
			}, this);
		}
		else
			result = src;

		return result;
	},

	createPathBuilder: function(pathBuilderType, movementThreshold) {
		var className = WILL.Tool.PathBuilderClassNames[pathBuilderType.name];
		var pathBuilder = new Module[className];
		if (movementThreshold) pathBuilder.setMovementThreshold(movementThreshold);

		this.pathBuilders[pathBuilderType.name] = pathBuilder;
		this.pathBuilder = pathBuilder;
	},

	configureNormalization: function(minValue, maxValue) {
		this.pathBuilder.setNormalizationConfig(minValue, maxValue);
	},

	configureWidthChanel: function(minValue, maxValue, initialValue, finalValue, propertyFunction, functionParameter, flip) {
		this.pathBuilder.setPropertyConfig(Module.PropertyName.Width, minValue, maxValue, initialValue, finalValue, propertyFunction, functionParameter, flip);
	},

	configureAlphaChanel: function(minValue, maxValue, initialValue, finalValue, propertyFunction, functionParameter, flip) {
		this.pathBuilder.setPropertyConfig(Module.PropertyName.Alpha, minValue, maxValue, initialValue, finalValue, propertyFunction, functionParameter, flip);
	},

	createSmoothener: function() {
		this.pathBuilder.smoothener = new Module.MultiChannelSmoothener(this.pathBuilder.stride);
		this.smoothener = this.pathBuilder.smoothener;
	},

	activatePathBuilder: function(pathBuilderType) {
		this.pathBuilderType = pathBuilderType;
		this.pathBuilder = this.pathBuilders[pathBuilderType.name];
		this.smoothener = this.pathBuilder.smoothener;

		this.variableWidth = this.pathBuilder.stride == 4 || (this.pathBuilder.stride == 3 && isNaN(this.width));
		this.variableAlpha = this.pathBuilder.stride == 4 || (this.pathBuilder.stride == 3 && !isNaN(this.width));
	},

	preparePathBuilder: function(e, inputPhase) {
		if (inputPhase == Module.InputPhase.Begin) {
			delete this.pathBuilderType;

			if (this.pathBuilders["PRESSURE"] && !isNaN(this.getPressure(e)))
				this.activatePathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
			else
				this.activatePathBuilder(WILL.Tool.PathBuilderType.SPEED);
		}

		if (this.pathBuilderType == WILL.Tool.PathBuilderType.PRESSURE)
			this.pathBuilderValue = this.getPressure(e);
		else
			this.pathBuilderValue = Date.now()/1000;
	},

	/**
	 * Depends on WACOM tablet plugin or PointerEvent support
	 *
	 * @param {MouseEvent | TouchEvent | PointerEvent} e
	 * @return {int} pen pressure or 0 when plugin not found
	 */
	getPressure: function(e) {
		var pressure = NaN;

		if (window.PointerEvent && e instanceof PointerEvent) {
			// if (e.pointerType == "pen")
			if (this.pathBuilderType == WILL.Tool.PathBuilderType.PRESSURE || e.pressure !== 0.5)
				pressure = e.pressure;
		}
		else if (WILL.pen) {
			pressure = WILL.pen.pressure;

			if (navigator.userAgent.contains("Safari") && pressure == 0)
				pressure = NaN;
		}

		return pressure;
	},

	/**
	 * Depends on WACOM tablet plugin
	 *
	 * @return {boolean} is wacom pen is eraser
	 */
	isEraser: function() {
		return WILL.pen && WILL.pen.isEraser;
	},

	delete() {
		if (this.brush)
			this.brush.delete();

		for (var name in this.pathBuilders) {
			this.pathBuilders[name].smoothener.delete();
			this.pathBuilders[name].delete();
		}
	}
});