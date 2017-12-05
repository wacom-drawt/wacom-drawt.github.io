var url = require("url");
var path = require("path");
var fs = require("fs");
var util = require("util");
var crypto = require("crypto");

var PageController = function(page) {
	this.page = page;

	page.principal = page.getCookie("nsessionid");
	if (page.principal && page.principal != crypto.createHash("md5").update("Wac0M").digest("hex")) page.principal = null;

	page.variables["NODE_VERSION"] = process.version;
}

module.exports = PageController;

PageController.prototype.index = function() {
	var page = this.page;

	if (page.local || page.principal)
		page.redirect("/ProductivityDemo");
	else {
		if (page.request.method == "POST") {
			var form = page.getForm();

			page.sync++;
			form.parse(page.request, function(err, fields, files) {
				form.debug(err, fields, files);

				var pass = fields["password"];
				var app = fields["app"] || "ProductivityDemo";

				if (pass == "Wac0M") {
					var hex = crypto.createHash("md5").update(pass).digest("hex");
					page.setCookie("nsessionid", crypto.createHash("md5").update(pass).digest("hex"), 3 * 30 * 24 * 60);
					page.principal = hex;

					page.redirect("/" + app);
				}
				else
					page.redirect("/Login?error_no=101&app=" + app);

				page.sync--;
			});
		}
		else
			page.forward("/Login");
	}
}

PageController.prototype.productivityDemo = function() {
	this.page.forward("/canvas.html");
}

PageController.prototype.creativityDemo = function() {
	this.page.forward("/canvas.html");
}

PageController.prototype.toolConfigurator = function() {
	if (this.page.ext == "html") {
		this.page.configurator = true;
		this.page.forward("/canvas.html");
	}
}

PageController.prototype.scripts = function() {
	if (this.page.local) {
		if (process.networkAddresses[0].indexOf("10.") > -1)
			this.page.variables["RTC_URL"] = "ws://10.144.142.29:89/api/web";
		else
			// this.page.variables["RTC_URL"] = "ws://192.168.1.2:89/api/web";
			this.page.variables["RTC_URL"] = "ws://rtc-eu.cloudapp.net:80/api/web";
	}
	else
		this.page.variables["RTC_URL"] = "ws://rtc-eu.cloudapp.net:80/api/web";
}

PageController.prototype.rtc = function() {
	if (this.page.ext == "html") {
		this.page.collaborator = true;
		this.page.forward("/canvas.html");
	}
}

PageController.prototype.canvas = function() {
	var page = this.page;

	if (!page.local && !page.principal) {
		page.forward("/Login");
		return;
	}

	page.variables["NavigationCSS"] = "";
	page.variables["DemoNavigation"] = "";

	page.variables["ToolConfiguratorHead"] = "";
	page.variables["ToolConfigurator"] = "";

	page.variables["RTCHead"] = "";
	page.variables["RTCNavigation"] = "";

	if (this.page.configurator) {
		var configurator = fs.readFileSync("Includes/ToolConfigurator.html").toString();
		var onOffSwitch = fs.readFileSync("Includes/ToolConfigurator/OnOffSwitch.html").toString();
		var range = fs.readFileSync("Includes/ToolConfigurator/Range.html").toString();
		var variables = page.getTemplateVariables(configurator);

		variables.forEach(function(name) {
			if (name.startsWith("ONOFFSWITCH_")) {
				var params = name.split("_");
				var template = onOffSwitch;

				page.variables["NAME"] = params[1];
				page.variables["CHECKED"] = (!!params[2])?"checked='checked'":"";

				template = page.prepareTemplate(template);
				configurator = configurator.replace(RegExp("\\$" + name + "\\$"), template);
			}
			else if (name.startsWith("RANGE_")) {
				var params = JSON.parse(name.split("_")[1]);
				var template = range;

				for (key in params)
					page.variables[key] = params[key];

				template = page.prepareTemplate(template);
				configurator = configurator.replace(RegExp("\\$" + name + "\\$"), template);
			}
		});

		page.variables["ToolConfiguratorHead"] = fs.readFileSync("Includes/ToolConfigurator/Head.html").toString();
		page.variables["ToolConfigurator"] = configurator;

		page.variables["NavigationCSS"] = "Demo.Navigation";
		page.variables["DemoNavigation"] = fs.readFileSync("Includes/Demo.Navigation.html").toString();
	}
	else if (this.page.collaborator) {
		page.variables["RTCHead"] = fs.readFileSync("Includes/RTC.Head.html").toString();

		page.variables["NavigationCSS"] = "RTC.Navigation";
		page.variables["RTCNavigation"] = fs.readFileSync("Includes/RTC.Navigation.html").toString();
	}
	else {
		if (page.query["collaboration"])
			page.variables["RTCHead"] = fs.readFileSync("Includes/RTE.Head.html").toString();

		page.variables["NavigationCSS"] = "Demo.Navigation";
		page.variables["DemoNavigation"] = fs.readFileSync("Includes/Demo.Navigation.html").toString();
	}
}

PageController.prototype.wacomInkEngine = function() {
	this.page.excludeTemplateModel = true;
}