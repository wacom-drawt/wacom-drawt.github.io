function update() {
    var nodes = flatten(root),
        links = d3.layout.tree().links(nodes);

    // Restart the force layout.
    force
        .nodes(nodes)
        .links(links)
        .start();

    // Update the links…
    link = link.data(links, function (d) {
        return d.target.id;
    });

    // Exit any old links.
    link.exit().remove();

    // Enter any new links.
    link.enter().insert("line", ".node")
        .attr("class", "link")
        .attr("x1", function (d) {
            return d.source.x;
        })
        .attr("y1", function (d) {
            return d.source.y;
        })
        .attr("x2", function (d) {
            return d.target.x;
        })
        .attr("y2", function (d) {
            return d.target.y;
        });

    // Update the nodes…
    node = node.data(nodes, function (d) {
        return d.id;
    }).style("fill", color);

    // Exit any old nodes.
    node.exit().remove();

    // Enter any new nodes.
    node.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function (d) {
            return d.x;
        })
        .attr("cy", function (d) {
            return d.y;
        })
        .attr("r", function (d) {
            return Math.sqrt(getSize(d)*50);
        })
		.attr("fill", function(d){
		  return "url(#"+d.node_id+")";
		})
        // .style("fill", color)
        .on("click", click)
        .on("mouseenter", handleMouseEnter)
        .on("mouseout", handleMouseOut)
        .call(force.drag);
}

function getSize(d) {
    if(d.children) {return d.children.length > 0 ? d.children.length : 1 ;} else {return 1}
}

function tick() {
    link.attr("x1", function (d) {
        return d.source.x;
    })
        .attr("y1", function (d) {
            return d.source.y;
        })
        .attr("x2", function (d) {
            return d.target.x;
        })
        .attr("y2", function (d) {
            return d.target.y;
        });

    node.attr("cx", function (d) {
        return d.x;
    })
        .attr("cy", function (d) {
            return d.y;
        });
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
    return d._children ? "#b7b7b7" : d.children ? "#b7b7b7" : "#b7b7b7";
}

// Makes sure all nodes drawings are available as patterns
function saveImagesAsPatternsInCanvas(canvasObj, root) {
	var data = flatten(root);
	var svg = canvasObj;

    svg.append("defs")
		.selectAll("pattern")
		.data(data)
		.enter()
		.append("pattern")
		// This id will help finding the image later
		.attr('id', function (d, i) {
			return d.node_id;
		})
		// Image will start filling by this offset
		.attr("viewBox", function(d, i){
			return "0 10 100 100";
		})
		// This will make the image
		.attr("patternContentUnits", function(d, i){
			return "objectBoundingBox";
		})
		// Image size
		.attr('width', '300%')
		.attr('height', '300%')
		.append("image")
		.attr("xlink:href", function (d) {
			return d.drawing;
		})
		.attr('width', 50)
		.attr('height', 50);
}

// Toggle children on click.
function click(d) {
    if (!d3.event.defaultPrevented) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update();
    }
}

function handleMouseEnter(d, i) {
    d3.select(this).transition()
        .ease("elastic")
        .duration("500")
        .attr("r", Math.sqrt(getSize(d)*50)*2);
}

function handleMouseOut(d, i) {
    d3.select(this).transition()
        .ease("quad")
        .delay("100")
        .duration("200")
        .attr("r", Math.sqrt(getSize(d)*50));
}

// Returns a list of all nodes under the root.
function flatten(root) {
    var nodes = [], i = 0;

    function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        if (!node.id) node.id = ++i;
        nodes.push(node);
    }

    recurse(root);
    return nodes;
}