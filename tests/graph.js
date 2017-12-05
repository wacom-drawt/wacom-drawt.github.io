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
        .style("fill", color)
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
function handleMouseEnter(d, i) {

    d.prevSize = d3.select(this).attr("r");

    console.log("prev size: ");
    console.log(d.prevSize);

    // Use D3 to select element, change color and size
    d3.select(this).attr({
        //prevSize: d3.selectAll(".node").attr("r"),
        fill: "orange",
        r: d3.select(this).attr("r") * 2
    });


}

function handleMouseOut(d, i) {

    console.log("out:");
    console.log(d.prevSize);

    // Use D3 to select element, change color back to normal
    d3.select(this).attr({
        fill: "black",
        r: d.prevSize
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