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
			return d.name;
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
            return Math.sqrt(d.size) / 10 || 25;
        })
		.attr("fill", function(d){
		  return "url(#"+d.name+")";
		})
        // .style("fill", color)
        .on("click", click)
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .call(force.drag);
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

// Event Handlers for hover
function handleMouseOver(d, i) {
    console.log(d);
    // Use D3 to select element, change color and size
    d3.select(this).attr({
        fill: "orange",
        r: d3.selectAll(".node").attr("r") * 2
    });


}

function handleMouseOut(d, i) {
    // Use D3 to select element, change color back to normal
    d3.select(this).attr({
        fill: "black",
        r: d3.selectAll(".node").attr("r")
    });
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

function dragstarted(d) {
	console.log(d);
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
}

function dragged(d) {
	console.log(d);
  d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

function dragended(d) {
	console.log(d);
  d3.select(this).classed("dragging", false);
}