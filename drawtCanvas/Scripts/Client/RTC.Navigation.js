var menu = {
	disableLibrary: true,

	init: function() {
		WILL.contextMenu.show = function(e) {
			// if (e.button != 2) return;
			if (e.button != 2 || WILL.writer.context || this.discarded) return;

			// if (WILL.writer.context) rtc.abortStroke();
			// if (WILL.writer.context) $(document).trigger(jQuery.Event("mouseup", {button: 0}));

			var name = WILL.selection.visible()?"Actions":"Tools";

			$(".nav .Clipboard").css("display", "none");
			$(".nav .Menus").css("display", "");
			$(".nav .Menu").css("display", "none");
			$(".nav .Menu." + name).css("display", "");

			if (WILL.writer.tool.type == WILL.Tool.Type.STROKE) {
				$(".nav .Menu.Tools .ItemBlock.C .Item").css("background-color", "rgba(" + Module.Color.toArray(WILL.writer.color) + ")");
				$(".nav .Menu.Actions .ItemBlock.C .Item").css("background-color", "rgba(" + Module.Color.toArray(WILL.writer.color) + ")");
			}

			$(".nav .Menus").addClass("SmallItems");
			$(".nav").css("display", "");

			$(".ClearAll").css("display", "none");

			setTimeout(function() {
				menu.animate("TransitionBegin");
				$(".Dim").addClass("Visible");
			}, 10);
		};

		$("body").on("contextmenu", function(e) {
			e.preventDefault();
			e.stopPropagation();
		});

		$(".nav .Dim").on("click", function(e) {
			menu.hide();
		});

		$(".OnlineStatus").on("click", function(e) {
			if (!this.className.contains("NotConnected")) return;

			var center = this.toRect().center;
			var button = Module.RectTools.create(center.x - 50, center.y - 20, 100, 40);
			var click = Module.RectTools.create(e.clientX, e.clientY, 1, 1);

			if (Module.RectTools.intersect(button, click))
				client.reconnect();
		});

		$(".ClearAll").on("click", function() {
			WILL.clear(true);
			$(".Menu.Tools .Item[id=" + WILL.writer.prevTool.id + "]").trigger("click");
			$(this).css("display", "none");
		});

		$(".Menu.Tools .Item").filter("[id]").on("click", function() {
			if (this.classList.contains("Selected")) return;

			WILL.setTool(this.id);

			$(".Menu.Tools .Item.Selected").each(function() {
				$(this).removeClass("Selected");
			});

			$(this).addClass("Selected");

			if (WILL.writer.tool.type != WILL.Tool.Type.STROKE)
				menu.hide();
		});

		$(".Menu.Colors .Color").on("click", function() {
			var color = tools.extractColor(this);

			if (WILL.selection.visible())
				WILL.selection.changeStrokesColor(color);
			else {
				WILL.setColor(color);
				$(".Menu.Tools .Item[id=" + WILL.writer.tool.id + "]").trigger("click");
			}

			$(".Menu.Colors .Item.Selected").each(function() {
				$(this).removeClass("Selected");
			});

			$(this).addClass("Selected");

			if (menu.from == "Actions")
				menu.hide();
		});

		$(".Menu.Actions .Cut").on("click", function() {
			WILL.selection.cut();
			menu.hide();
		});

		$(".Menu.Actions .Copy").on("click", function() {
			WILL.selection.copy();
			menu.hide();
		});

		$(".Menu.Actions .Delete").on("click", function() {
			WILL.selection.delete();
			menu.hide();
		});

		$(".Menu.Tools .ItemBlock.T .Item").on("click", function(e) {menu.clipboard.show();});

		$(".Menu.Tools .ItemBlock.C .Item").on("click", function(e) {menu.navigate("Tools");});
		$(".Menu.Colors .ItemBlock.C .Item").on("click", function(e) {menu.navigate("Colors");});
		$(".Menu.Actions .ItemBlock.C .Item").on("click", function(e) {menu.navigate("Actions");});
	},

	navigate: function(from) {
		if (from == "Colors") {
			$(".nav .Menu.Tools .ItemBlock.C .Item").css("background-color", "rgba(" + Module.Color.toArray(WILL.writer.color) + ")");
			$(".nav .Menus").addClass(menu.from);

			this.animate("TransitionFromColors", function() {
				$(".nav .Menus").addClass("SmallSelected");
				$(".nav .Menus").removeClass(menu.from);
				$(".nav .Menu").css("display", "none");
				$(".nav .Menu." + menu.from).css("display", "");

				setTimeout(function() {menu.animate("TransitionSelected");}, 10);
				// menu.animate("TransitionSelected");
			});
		}
		else {
			this.from = from;

			this.animate("TransitionToColors", function() {
				$(".nav .Menus").addClass("SmallSelected");
				$(".nav .Menu").css("display", "none");
				$(".nav .Menu.Colors").css("display", "");

				setTimeout(function() {menu.animate("TransitionSelected");}, 10);
				// menu.animate("TransitionSelected");
			});
		}
	},

	hide: function() {
		if (this.animation) return;
		$(".nav .Menus").addClass("SmallItems");

		var callback = function() {
			$(".nav").css("display", "none");
			$(".nav .Clipboard").css("display", "none");
			$(".nav .Menus").css("display", "none");

			if (WILL.writer.tool.eraser) {
				var clearAll = $(".ClearAll");

				clearAll.css("visibility", "hidden").css("display", "");
				clearAll.css("left", ($(clearAll.parents()[0]).width() / 2 - clearAll.outerWidth() / 2) + "px");
				clearAll.css("visibility", "visible");
				clearAll.css("z-index", WILL.canvas.surface.style.zIndex);
			}
		};

		if (document.querySelector(".Clipboard").style.display == "")
			callback();
		else
			this.animate("TransitionEnd", callback);

		$(".Dim").removeClass("Visible");
	},

	animate: function(className, callback) {
		this.animation = true;
		$(".nav .Menus").addClass("SmallSelected").addClass(className);

		var time = 400;

		if (className == "TransitionEnd")
			time = 450;
		else if (className == "TransitionBegin")
			time = 900;

		setTimeout(function(className, callback) {
			$(".nav .Menus").removeClass("SmallItems").removeClass("SmallSelected").removeClass(className);
			if (callback) callback();
			menu.animation = false;
		}, time, className, callback);
	},

	showOnlineStatus: function(notConnected) {
		$(".OnlineStatus").removeClass("NotConnected").removeClass("Connecting").css("display", "");

		if (notConnected)
			$(".OnlineStatus").addClass("NotConnected");
		else
			$(".OnlineStatus").addClass("Connecting");

		if (window.TouchEvent) $(".TouchMenuButton").css("display", "none");
	},

	hideOnlineStatus: function() {
		document.querySelector(".OnlineStatus").style.display = "none";
		if (window.TouchEvent) $(".TouchMenuButton").css("display", "");
	},

	selectColor: function(input) {
		$(".nav .Menu.Tools .ItemBlock.C .Item").css("background-color", input.value);
		WILL.writer.setColor(input);

		if (WILL.selection.visible()) {
			WILL.selection.changeStrokesColor(WILL.writer.color);
			this.hide();
		}
	},

	clipboard: {
		items: ["eiffel_tower", "sydney_opera", "fuji", "golden_gate", "fish"],

		init: function() {
			var self = this;
			var offset = 0;

			this.content = document.querySelector(".nav .Clipboard .Content");
			this.content.style.width = 0;
			this.width = this.content.parentNode.getMathStyle("width");

			$(this.content.parentNode.parentNode).swipe({
				// threshold: 50,
				tap: function(event, target) {
					if (self.content.parentNode.style.display == "none") return;

					if (target.tagName == "IMG") {
						if (navigator.userAgent.contains("Safari")) {
							WILL.dirtySafariMobilePatch = true;

							setTimeout(function() {
								delete WILL.dirtySafariMobilePatch;
							}, 1300);
						}

						var wRect = Module.RectTools.create(0, 0, $(window).width(), $(window).height());
						var tx = Math.floor(wRect.width / 2 - target.clipboard.rect.width / 2) + wRect.left;
						var ty = Math.floor(wRect.height / 2 - target.clipboard.rect.height / 2) + wRect.top;

						WILL.selection.clipboard = target.clipboard;
						WILL.selection.paste({clientX: tx, clientY: ty});
						menu.hide();
					}
				},

				swipeStatus: function(event, phase, direction, distance, duration, fingerCount, fingerData) {
					if (self.content.parentNode.style.display == "none") return;

					if (phase == "start")
						offset = self.content.getTransformStyle("translate").x;

					if (phase == "move" && ["left", "right"].contains(direction)) {
						distance = distance * ((direction == "left")?-1:1) + offset;

						if (distance > 0)
							distance = 0;
						else if (distance < self.width - self.content.getMathStyle("width"))
							distance = self.width - self.content.getMathStyle("width");

						$(self.content).css("transition-duration", (duration / 1000).toFixed(1) + "s");
						$(self.content).css("transform", "translate(" + distance + "px, 0)");
					}
				}
			});

			this.layer = WILL.canvas.createLayer();
			WILL.selection.create();
			if (!menu.disableLibrary) this.initLibraryItem(0);
		},

		initLibraryItem: function(i) {
			var request = new XMLHttpRequest();
			request.onreadystatechange = function() {
				 if (this.readyState == this.DONE) {
					WILL.io.restoreFromFile(this.response, false, {clientX: 0, clientY: 0});

					if (i < menu.clipboard.items.length-1)
						menu.clipboard.initLibraryItem(i+1);
				}
			};

			request.open("GET", "Clipboard/" + encodeURIComponent(this.items[i]) + ".will", true);
			request.responseType = "arraybuffer";
			request.send();
		},

		show: function() {
			var width = 10;

			$(".nav .Menus").css("display", "none");
			$(".nav .Clipboard .Content").css("visibility", "hidden");
			$(".nav .Clipboard").css("display", "");

			$("img", this.content).each(function() {
				width += $(this).outerWidth(true);
			});

			$(this.content).css("width", width + "px");
			$(this.content).css("transform", "translate(" + ((width > this.width)?this.width - width:0) + "px, 0)");
			$(this.content).css("visibility", "");
		},

		add: function(clipboard, canvas) {
			var img = new Image();
			img.src = canvas.toDataURL();
			img.clipboard = clipboard;

			this.content.appendChild(img);
			this.content.style.width = (this.content.getMathStyle("width") + img.width + 40) + "px";
		}
	}
};