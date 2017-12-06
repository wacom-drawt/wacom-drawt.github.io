var api = new ApiService();

var width = window.innerWidth,
    height = window.innerHeight,
    bgColor = "#f1f1f1",
    root;

var force = d3.layout.force()
    .size([width, height])
    .on("tick", tick);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)//;
    .call(d3.behavior.zoom().on("zoom", function () {
        svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
    }))
    .append("g")

svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", bgColor);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

api.getTree(
    //on success
    function (resp) {
        root = resp['graph'];
        saveImagesAsPatternsInCanvas(svg, root);
        update();
    },
    //on failure
    function (resp) {
        console.log('Request for tree failed :(');
        console.log(resp);
    }, true);



