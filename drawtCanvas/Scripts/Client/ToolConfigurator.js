var toolConfigurator = {
	TEXTURES_PATH: "Images/ToolConfigurator/Textures",
	defaults: {
		MinVelocity: 50,
		MaxVelocity: 2000,
		VelocityPower: 0.5,
		VelocitySigmoid: 0.62,
		VelocityPeriodic: 1,
		VelocityMinRadius: 1,
		VelocityMaxRadius: 3.3,
		VelocityStartRadius: 2.4,
		VelocityEndRadius: 1,
		VelocityMinAlpha: 0.05,
		VelocityMaxAlpha: 0.2,
		VelocityStartAlpha: 0,
		VelocityEndAlpha: 0,
		MinPressure: 0,
		MaxPressure: 1,
		PressurePower: 0.5,
		PressureSigmoid: 0.62,
		PressurePeriodic: 1,
		PressureMinRadius: 1,
		PressureMaxRadius: 3.3,
		PressureStartRadius: 2.4,
		PressureEndRadius: 1,
		PressureMinAlpha: 0.05,
		PressureMaxAlpha: 0.2,
		PressureStartAlpha: 0,
		PressureEndAlpha: 0,
		Spacing: 0.15,
		Scattering: 0.15,

		radios: ["VelocityFunctionB", "PressureFunctionB", "RotationModeB", "FillA", "ShapeA"]
	},

	init: function() {
		this.tool = new WILL.Tool("CustomTool", WILL.Tool.Type.STROKE);
		WILL.tools[this.tool.id] = this.tool;
		WILL.TEXTURES_PATH = this.TEXTURES_PATH;

		this.radios = new Array();

		$(".ToolConfigurator input[type=radio]").each(function() {
			if (!toolConfigurator.radios.contains(this.name))
				toolConfigurator.radios.push(this.name);
		});

		this.attachEvents();
		this.reset(true);
	},

	attachEvents: function() {
		var self = this;

		$(".ToolConfigurator input[type='radio']").on("click", function() {
			var buttons = document.getElementsByName(this.name);

			for (var i = 0; i < buttons.length; i++)
				buttons[i].nextElementSibling.style.color = "gray";

			this.nextElementSibling.style.color = "#0097D4";

			if (this.name.endsWith("Function")) {
				var prefix = this.name.split("Function")[0];

				$("#" + prefix + "Power").parents().filter("tr").first().css("display", "none");
				$("#" + prefix + "Sigmoid").parents().filter("tr").first().css("display", "none");
				$("#" + prefix + "Periodic").parents().filter("tr").first().css("display", "none");

				$("#" + prefix + this.value).parents().filter("tr").first().css("display", "");
			}

			if (this.name == "Fill" || this.name == "Shape") {
				var img = this.nextElementSibling.firstElementChild;

				$(".ToolConfigurator input[name='" + this.name + "']").each(function() {
					this.nextElementSibling.firstElementChild.style.border = "3px solid #C8C8C8";
					this.nextElementSibling.firstElementChild.style.backgroundColor = "#c8c8c8";
				});

				img.style.border = "3px solid gray";
				img.style.backgroundColor = "gray";
			}

			toolConfigurator.initTool();
		});

		$("#PressureSwitch").on("click", function() {
			if (this.checked)
				$(".PressureSection").fadeIn("slow");
			else
				$(".PressureSection").fadeOut("slow");
		});

		$("#TextureSwitch").on("click", function() {
			if (this.checked) {
				$(".TextureSection").fadeIn("slow", "swing", function() {
					if (!self.resetMode)
						document.querySelector(".ToolConfigurator").scrollTop = document.querySelector(".ToolConfigurator").scrollHeight;
				});
			}
			else
				$(".TextureSection").fadeOut("slow");
		});

		$(".ToolConfigurator input[type=range]").each(function() {
			if (this.name.contains("Min") || this.name.contains("Max"))
				$(this).on("change", function() {toolConfigurator.validateMinMax(this);});

			$(this).on("change", function() {
				window[this.name + "Output"].value = this.value;
				toolConfigurator.initTool();
			});

			$(this).on("keydown", function() {window[this.name + "Output"].value = this.value;});
			$(this).on("keyup", function() {$(this).trigger("change");});
		});

		$(".ToolConfigurator input[type=checkbox]").each(function() {
			var range = document.getElementById(this.name.replace("Switch", ""));
			if (range) $(this).on("click", function() {toolConfigurator.toggleRange(this);});

			$(this).on("change", function() {toolConfigurator.initTool();});
		});
	},

	toggle: function() {
		if ($(".ToolConfigurator")[0].classList.contains("Visible"))
			$(".ToolConfigurator").removeClass("Visible");
		else
			$(".ToolConfigurator").addClass("Visible");
	},

	reset: function(first) {
		var inputs = $(".ToolConfigurator input");
		this.resetMode = true;

		inputs.filter("[type=range]").each(function() {
			this.value = toolConfigurator.defaults[this.name];
			$(this).trigger("change");
		});

		inputs.filter("[type=checkbox]").each(function() {
			this.checked = !["VelocityStartRadiusSwitch", "VelocityEndRadiusSwitch"].contains(this.name);;
			$(this).trigger("click");
		});

		this.defaults.radios.forEach(function(id) {
			$("#" + id).trigger("click");
		});

		this.resetMode = false;
		this.initTool(first);
	},

	initTool: function(first) {
		if (this.resetMode) return;

		if (first) {
			this.tool.createBrush(WILL.Tool.BrushType.PARTICLE, Module.BlendMode.NORMAL);
			this.tool.particleBrush = this.tool.brush;

			this.tool.createBrush(WILL.Tool.BrushType.SOLID_COLOR);
			this.tool.solidColorBrush = this.tool.brush;

			this.tool.createBrush(WILL.Tool.BrushType.DIRECT, Module.BlendMode.NORMAL);
			this.tool.directBrush = this.tool.brush;

			this.tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
			this.tool.createPathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
		}

		if (this.valueOf("TextureSwitch")) {
			this.tool.brush = this.tool.particleBrush;
			this.tool.brush.blendMode = this.valueOf("MaxBlend")?Module.BlendMode.MAX:Module.BlendMode.NORMAL;
			this.tool.configureParticleBrush(true, this.valueOf("Spacing"), this.valueOf("Scattering"), Module.RotationMode[this.valueOf("RotationMode")], this.valueOf("Shape") + ".png", this.valueOf("Fill") + ".png");

			this.tool.activatePathBuilder(WILL.Tool.PathBuilderType.SPEED);
			this.tool.configureNormalization(this.valueOf("MinVelocity"), this.valueOf("MaxVelocity"));

			this.configurePathBuilderChanel("Width", "Velocity");
			this.configurePathBuilderChanel("Alpha", "Velocity");

			if (this.valueOf("PressureSwitch")) {
				this.tool.activatePathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
				this.tool.configureNormalization(this.valueOf("MinPressure"), this.valueOf("MaxPressure"));

				this.configurePathBuilderChanel("Width", "Pressure");
				this.configurePathBuilderChanel("Alpha", "Pressure");
			}
		}
		else {
			// this.tool.brush = this.tool.directBrush;
			this.tool.brush = this.tool.solidColorBrush;

			this.tool.activatePathBuilder(WILL.Tool.PathBuilderType.SPEED);
			this.tool.configureNormalization(this.valueOf("MinVelocity"), this.valueOf("MaxVelocity"));
			this.configurePathBuilderChanel("Width", "Velocity");

			if (this.valueOf("PressureSwitch")) {
				this.tool.activatePathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
				this.tool.configureNormalization(this.valueOf("MinPressure"), this.valueOf("MaxPressure"));
				this.configurePathBuilderChanel("Width", "Pressure");
			}
		}

		this.tool.activatePathBuilder(WILL.Tool.PathBuilderType.SPEED);
		if (this.tool.smoothener) this.tool.smoothener.delete();
		this.tool.createSmoothener();

		if (this.valueOf("PressureSwitch")) {
			this.tool.activatePathBuilder(WILL.Tool.PathBuilderType.PRESSURE);
			if (this.tool.smoothener) this.tool.smoothener.delete();
			this.tool.createSmoothener();
		}

		WILL.setTool(this.tool);
	},

	configurePathBuilderChanel: function(name, type) {
		var kind = (name == "Width")?"Radius":"Alpha";
		var args = [
			this.valueOf(type + "Min" + kind),
			this.valueOf(type + "Max" + kind),
			this.valueOf(type + "Start" + kind),
			this.valueOf(type + "End" + kind),
			Module.PropertyFunction[this.valueOf(type + "Function")],
			this.valueOf(type + "FunctionParameter"),
			type == "Velocity" && this.valueOf("Reverse")
		];

		if (name == "Width")
			this.tool.configureWidthChanel.apply(this.tool, args);
		else
			this.tool.configureAlphaChanel.apply(this.tool, args);
	},

	valueOf: function(name) {
		var result;

		if (name.endsWith("FunctionParameter")) {
			var type = name.replace("FunctionParameter", "");
			result = this.valueOf(type + this.valueOf(type + "Function"));
		}
		else {
			var input = (this.radios.contains(name)?$(".ToolConfigurator input[name=" + name + "]:checked"):$("#" + name))[0];

			if (input.type == "checkbox")
				result = input.checked;
			else if (input.type == "range") {
				var button = document.getElementById(input.name + "Switch");

				if (button)
					result = button.checked?parseFloat(input.value):NaN;
				else
					result = parseFloat(input.value);
			}
			else
				result = input.value;
		}

		return result;
	},

	toggleRange: function(button) {
		if (button.name.endsWith("Switch"))
			document.getElementById(button.name.replace("Switch", "")).disabled = !button.checked;
	},

	validateMinMax: function(range) {
		var min = range.name.contains("Min");
		var opositeRange = document.getElementById(range.name.replace(min?"Min":"Max", min?"Max":"Min"));
		var reset = false;

		if (min)
			reset = parseFloat(range.value) > parseFloat(opositeRange.value);
		else
			reset = parseFloat(range.value) < parseFloat(opositeRange.value);

		if (reset) {
			opositeRange.value = range.value;
			window[opositeRange.name + "Output"].value = range.value;
		}
	}
};