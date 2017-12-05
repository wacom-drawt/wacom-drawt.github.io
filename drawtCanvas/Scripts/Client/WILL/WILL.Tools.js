WILL.tools = {
	init: function() {
		this.brush = new Module.DirectBrush();
		this.brush.id = 10;

		this.solidColorBrush = new Module.SolidColorBrush();
		this.solidColorBrush.id = 20;

		if (WILL.type == WILL.Type.VECTOR)
			this.vectors();
		else
			this.rasters();

		this.commons();
	},

	vectors: function() {
		var tool;

		/* ********* P E N ********* */
		tool = new WILL.Tool("Pen", WILL.Tool.Type.STROKE);
		tool.brush = this.brush;
		// tool.createBrush(WILL.Tool.BrushType.SOLID_COLOR);

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(5, 210);
		tool.configureWidthChanel(1, 3.2, NaN, NaN, Module.PropertyFunction.Sigmoid, 0.6191646, true);
		tool.createSmoothener();

		tool.createPathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
		tool.configureNormalization(0.195, 0.88);
		tool.configureWidthChanel(1, 3.2, NaN, NaN, Module.PropertyFunction.Sigmoid, 0.6191646, false);
		tool.createSmoothener();

		this[tool.id] = tool;

		/* ********* F E L T ********* */
		tool = new WILL.Tool("Felt", WILL.Tool.Type.STROKE);
		tool.brush = this.brush;

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(33, 628);
		tool.configureWidthChanel(1.026596*2, 2.430851*2, 0, 0, Module.PropertyFunction.Periodic, 3, true);
		tool.createSmoothener();

		tool.createPathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
		tool.configureNormalization(0.195, 0.88);
		tool.configureWidthChanel(1.026596*2, 2.430851*2, 0, 0, Module.PropertyFunction.Periodic, 3, false);
		tool.createSmoothener();

		this[tool.id] = tool;

		/* ********* B R U S H ********* */
		tool = new WILL.Tool("Brush", WILL.Tool.Type.STROKE);
		tool.brush = this.solidColorBrush;

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(182, 3547);
		tool.configureWidthChanel(1.026596*2, 17.2633*2, 0.7194245, NaN, Module.PropertyFunction.Power, 1.186609, false);
		tool.createSmoothener();

		tool.createPathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
		tool.configureNormalization(0.195, 0.88);
		tool.configureWidthChanel(1.026596*2, 17.2633*2, 0.7194245, NaN, Module.PropertyFunction.Power, 1.186609, false);
		tool.createSmoothener();

		tool.alpha = 0.3;
		this[tool.id] = tool;

		/* ********* M A R K E R ********* */
		tool = new WILL.Tool("Marker", WILL.Tool.Type.STROKE);
		tool.brush = this.brush;

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(182, 3547);
		tool.configureWidthChanel(3.396277*2, 3.396277*2, NaN, NaN, Module.PropertyFunction.Power, 1.029754, false);
		tool.createSmoothener();

		tool.createPathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
		tool.configureNormalization(0.195, 0.88);
		tool.configureWidthChanel(3.396277*2, 3.396277*2, NaN, NaN, Module.PropertyFunction.Power, 1.029754, false);
		tool.createSmoothener();

		this[tool.id] = tool;

		/* ********* E R A S E R ********* */
		tool = new WILL.Tool("Eraser - Splitter", WILL.Tool.Type.ERASER, "Eraser");

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(720, 3900);
		tool.configureWidthChanel(8, 112, 4, 4, Module.PropertyFunction.Power, 1, false);
		tool.createSmoothener();

		tool.eraser = true;
		this[tool.id] = tool;

		/* ********* E R A S E R   -   W H O L E   S T R O K E ********* */
		tool = new WILL.Tool("Eraser - WholeStroke", WILL.Tool.Type.ERASER, "EraserWholeStroke");

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(720, 3900);
		tool.configureWidthChanel(8, 112, 4, 4, Module.PropertyFunction.Power, 1, false);
		tool.createSmoothener();

		tool.eraser = true;
		tool.whole = true;
		this[tool.id] = tool;

		/* ********* S E L E C T O R   -   W H O L E   S T R O K E ********* */
		tool = new WILL.Tool("Selector - WholeStroke", WILL.Tool.Type.SELECTOR, "SelectorWholeStroke");
		tool.brush = this.brush;

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(0, 7000);
		tool.configureWidthChanel(1.25, 1.25, NaN, NaN, Module.PropertyFunction.Power, 1, false);
		tool.createSmoothener();

		tool.color = Module.Color.from(0, 151, 212);
		tool.whole = true;
		this[tool.id] = tool;
	},

	rasters: function() {
		var tool;

		/* ********* P E N C I L ********* */
		tool = new WILL.Tool("Pencil", WILL.Tool.Type.STROKE);
		tool.createBrush(WILL.Tool.BrushType.PARTICLE);
		tool.configureParticleBrush(true, 0.15, 0.15, Module.RotationMode.RANDOM, "essential_shape_11.png", "essential_fill_11.png");

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(80, 1400);
		tool.configureWidthChanel(2*2, 2.5*2, NaN, NaN, Module.PropertyFunction.Power, 1, true);
		tool.configureAlphaChanel(0.05, 0.2, NaN, NaN, Module.PropertyFunction.Power, 1, true);
		tool.createSmoothener();

		tool.createPathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
		tool.configureNormalization(0.195, 0.88);
		tool.configureWidthChanel(2*2, 2.5*2, NaN, NaN, Module.PropertyFunction.Power, 1, false);
		tool.configureAlphaChanel(0.05, 0.2, NaN, NaN, Module.PropertyFunction.Power, 1, false);
		tool.createSmoothener();

		this[tool.id] = tool;

		/* ********* W A T E R   B R U S H ********* */
		tool = new WILL.Tool("Water Brush", WILL.Tool.Type.STROKE);
		tool.createBrush(WILL.Tool.BrushType.PARTICLE, Module.BlendMode.MAX);
		tool.configureParticleBrush(true, 0.1, 0.03, Module.RotationMode.RANDOM, "essential_shape_14.png", "essential_fill_14.png");

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED, 4);
		tool.configureNormalization(38, 1500);
		tool.configureWidthChanel(14*2, 16*2, 14*2, 14*2, Module.PropertyFunction.Power, 3, false);
		tool.configureAlphaChanel(0.02, 0.25, NaN, NaN, Module.PropertyFunction.Power, 3, true);
		tool.createSmoothener();

		tool.createPathBuilder(WILL.Tool.PathBuilderType.PRESSURE, 4);
		tool.configureNormalization(0.195, 0.88);
		tool.configureWidthChanel(14*2, 16*2, 14*2, 14*2, Module.PropertyFunction.Power, 3, true);
		tool.configureAlphaChanel(0.02, 0.25, NaN, NaN, Module.PropertyFunction.Power, 3, false);
		tool.createSmoothener();

		this[tool.id] = tool;

		/* ********* I N K   B R U S H ********* */
		tool = new WILL.Tool("Ink Brush", WILL.Tool.Type.STROKE);
		tool.createBrush(WILL.Tool.BrushType.PARTICLE);
		tool.configureParticleBrush(true, 0.035, 0, Module.RotationMode.NONE, "fountain_brush", "essential_fill_8.png");

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(50, 2000);
		tool.configureWidthChanel(2.5*2, 14*2, 2.5*2, 2.5*2, Module.PropertyFunction.Power, 1, false);
		tool.configureAlphaChanel(1, 1, 1, 1, Module.PropertyFunction.Power, 1, true);
		tool.createSmoothener();

		tool.createPathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
		tool.configureNormalization(0.195, 0.88);
		tool.configureWidthChanel(2.5*2, 14*2, 2.5*2, 2.5*2, Module.PropertyFunction.Power, 1, false);
		tool.configureAlphaChanel(1, 1, 1, 1, Module.PropertyFunction.Power, 1, false);
		tool.createSmoothener();

		this[tool.id] = tool;

		/* ********* C R A Y O N ********* */
		tool = new WILL.Tool("Crayon", WILL.Tool.Type.STROKE);
		tool.createBrush(WILL.Tool.BrushType.PARTICLE);
		tool.configureParticleBrush(true, 0.15, 0.05, Module.RotationMode.RANDOM, "essential_shape_17.png", "essential_fill_17.png");

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(10, 1400);
		tool.configureWidthChanel(9*2, 14*2, NaN, NaN, Module.PropertyFunction.Power, 1, false);
		tool.configureAlphaChanel(0.1, 0.6, NaN, NaN, Module.PropertyFunction.Power, 1, true);
		tool.createSmoothener();

		tool.createPathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
		tool.configureNormalization(0.195, 0.88);
		tool.configureWidthChanel(9*2, 14*2, NaN, NaN, Module.PropertyFunction.Power, 1, true);
		tool.configureAlphaChanel(0.1, 0.6, NaN, NaN, Module.PropertyFunction.Power, 1, false);
		tool.createSmoothener();

		this[tool.id] = tool;

		/* ********* E R A S E R ********* */
		tool = new WILL.Tool("Eraser - Magic", WILL.Tool.Type.STROKE, "Eraser");
		tool.brush = this.brush;
		// tool.createBrush(WILL.Tool.BrushType.DIRECT);
		// tool.createBrush(WILL.Tool.BrushType.DIRECT, Module.BlendMode.ERASE);

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.configureNormalization(720, 3900);
		tool.configureWidthChanel(8, 112, 4, 4, Module.PropertyFunction.Power, 1, false);
		tool.createSmoothener();

		tool.strokeLayerBlendMode = Module.BlendMode.ERASE;
		tool.color = Module.Color.WHITE;
		tool.eraser = true;
		this[tool.id] = tool;
	},

	commons: function() {
		var tool;

		/* ********* S E L E C T O R ********* */
		tool = new WILL.Tool("Selector", WILL.Tool.Type.SELECTOR);
		tool.brush = this.brush;

		tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
		tool.createSmoothener();

		tool.color = Module.Color.from(0, 151, 212);
		// tool.color = Module.Color.from(134, 134, 134);
		this[tool.id] = tool;
	},

	findBrush: function(id) {
		for (var name in this) {
			if (this[name] instanceof WILL.Tool && this[name].brush && this[name].brush.id == id)
				return this[name].brush;
		}

		return this.brush;
	}
};