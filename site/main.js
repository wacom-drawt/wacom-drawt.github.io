// Global Objects
var api = new ApiService();
var modalOpener = new ModalOpener();
var drawt = new Drawt();

function Drawt() {
	// Check if sample
	var url_string = window.location.href
	var url = new URL(url_string);
	var s = url.searchParams.get("sample");
	var d = url.searchParams.get("debug");
	this.isMock = !!s;
	this.isDebug = !!d;
	this.debug = function (msg) {
		if (this.isDebug) {
			console.log(msg);
		}
	}
}

//TODO: move all global graph related vars to "graphSettings" global object, maybe inside "drawt"
var width = window.innerWidth,
	height = window.innerHeight,
	bgColor = "#3f3f3f",
	centered,
	root;

//TODO: move all global graph related vars to "graphSettings" global object, maybe inside "drawt"
var force = d3.layout.force()
	.size([width, height])
	.on("tick", tick);

//TODO: move all global graph related vars to "graphSettings" global object, maybe inside "drawt"
var active = d3.select(null);

//TODO: move all global graph related vars to "graphSettings" global object, maybe inside "drawt"
var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height)
	.call(d3.behavior.zoom().on("zoom", zoomed))
	.append("g")

//TODO: move all global graph related vars to "graphSettings" global object, maybe inside "drawt"
var drag = d3.behavior.drag()
	.origin(function (d) {
		return d;
	})
	.on("dragstart", dragstarted)
	.on("drag", dragged)
	.on("dragend", dragended);

function zoomed() {
	svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
	links.style("stroke-width", 1 + (d3.event.scale * 0.000000001))
	nodes.style("stroke-width", 1 + (d3.event.scale * 0.000000001));
}

function dragstarted(d) {
	d3.event.sourceEvent.stopPropagation();
	d3.select(this).classed("dragging", true);
	//update();

}

function dragged(d) {
	d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);

	//update();
}

function dragended(d) {
	d3.select(this).classed("dragging", false);
	update();
}

svg.append("rect")
	.attr("width", width)
	.attr("height", height)
	.attr("fill", bgColor);

//TODO: move all global graph related vars to "graphSettings" global object, maybe inside "drawt"
var links = svg.selectAll(".link"),
	nodes = svg.selectAll(".node");

function init() {
	api.getTree(
		//on success
		function (resp) {
			root = resp;
			console.log('ROOT AFTER INIT: ');
			console.log(root);
			createThumbnails(svg, root);
			update();
		},
		//on failure
		function (resp) {
			drawt.debug('Request for tree failed :(');
			drawt.debug(resp);

		}, drawt.isMock);
}

init();