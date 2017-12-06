var api = new ApiService();
var modalOpener = new ModalOpener();

var width = window.innerWidth,
    height = window.innerHeight,
    bgColor = "#3f3f3f",
    centered,
    root;

var force = d3.layout.force()
    .size([width, height])
    .on("tick", tick);

var active = d3.select(null);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.behavior.zoom().on("zoom", zoomed))
    .append("g")

var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);

function zoomed(){
    svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
    link.style("stroke-width", 1 + (d3.event.scale*0.000000001))
    node.style("stroke-width", 1 + (d3.event.scale*0.000000001));
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

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

function init() {
    api.getTree(
        //on success
        function (resp) {
            root = resp;
            saveImagesAsPatternsInCanvas(svg, root);
            update();
        },
        //on failure
        function (resp) {
            console.log('Request for tree failed :(');
            console.log(resp);
        }, true);
}


init();