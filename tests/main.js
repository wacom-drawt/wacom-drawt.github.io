var api = new ApiService();

var width = window.innerWidth,
    height = window.innerHeight,
    bgColor = "#f1f1f1",
    root;

var force = d3.layout.force()
    .size([width, height])
    .on("tick", tick);

var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)

svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", bgColor)
    //.call(drag); //TODO: not working yet :(

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

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


