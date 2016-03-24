(function () {
    var clientlibToVisualize = "guides.touchAuthoring",
        serverUrl = "/content/freeworks/visualizeclientlibs.json?clientlib=",
        getNodes = function (clientlibs, nodeIndex, clientlibToVisualize) {
            return clientlibs.map(function (clientlib, index) {
                clientlib.categories.forEach(function (cat) {
                    if (nodeIndex[cat] == null) {
                        nodeIndex[cat] = index
                    }
                });
                var node = {
                    category : clientlib.categories.join(","),
                    path : clientlib.path
                };
                if (clientlib.categories.indexOf(clientlibToVisualize) > -1) {
                    node.highlight = true;
                }
                return node;
            })
        },
        createLinks = function (nodes, links, clientlibs, nodeIndex) {
            clientlibs.forEach(function (clientlib, index) {
                clientlib.deps.forEach(function (dep) {
                    if (nodeIndex[dep.categories[0]] == null) {
                        nodes.push({
                            category : dep.categories.join(","),
                            path : dep.path
                        });
                        dep.categories.forEach(function (cat) {
                            nodeIndex[cat] = nodes.length - 1;
                        });
                    }
                    links.push({
                        source : index,
                        target : nodeIndex[dep.categories[0]],
                        type : "dependent"
                    });
                });
                clientlib.embeds.forEach(function (embed) {
                    if (nodeIndex[embed.categories[0]] == null) {
                        nodes.push({
                            category : embed.categories.join(","),
                            path : embed.path
                        });
                        embed.categories.forEach(function (cat) {
                            nodeIndex[cat] = nodes.length - 1;
                        });
                    }
                    links.push({
                        source : index,
                        target : nodeIndex[embed.categories[0]],
                        type : "embed"
                    })
                });
            });
        },
        Visualizer = {
            visualizeClientlib : function (clientLibCategory) {
                var url = serverUrl + clientLibCategory;
                d3.select('svg').remove();
                d3.json(url, function (error, clientlibs) {
                    if (clientlibs != null) {
                        var nodeIndex = {},
                            nodes = getNodes(clientlibs, nodeIndex, clientLibCategory),
                            links = [],
                            width = 1400,
                            height = 480,
                            svg = d3.select('body').append('svg')
                                .attr('width', width)
                                .attr('height', height),
                            radius = 8;
                        createLinks(nodes, links, clientlibs, nodeIndex);
                        var tick = function () {
                            paths.attr("d", linkArc);
                            //circles.attr("transform", transform);
                            circles.attr("cx", function (d) {
                                return d.x = Math.max(radius, Math.min(width - radius, d.x));
                            })
                                .attr("cy", function (d) {
                                    return d.y = Math.max(radius, Math.min(height - radius, d.y));
                                });
                            text.attr("x", function (d) {
                                return d.x = Math.max(radius, Math.min(width - radius, d.x));
                            })
                                .attr("y", function (d) {
                                    return d.y = Math.max(radius, Math.min(height - radius, d.y));
                                });
                        };
                        var linkArc = function (d) {
                            var dx = d.target.x - d.source.x,
                                dy = d.target.y - d.source.y,
                                dr = Math.sqrt(dx * dx + dy * dy);
                            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                        };
                        var transform = function (d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        };
                        window.force = d3.layout.force()
                            .charge(-300)
                            .size([width, height])
                            .linkDistance(100)
                            .nodes(nodes)
                            .links(links).on("tick", tick);
                        svg.append("defs").selectAll("marker")
                            .data(["embed", "dependent"])
                            .enter().append("marker")
                            .attr("id", function (d) {
                                return d;
                            })
                            .attr("viewBox", "0 -5 10 10")
                            .attr("refX", 15)
                            .attr("refY", -1.5)
                            .attr("markerWidth", 6)
                            .attr("markerHeight", 6)
                            .attr("orient", "auto")
                            .append("path")
                            .attr("d", "M0,-5L10,0L0,5");
                        var paths = svg.append('g').selectAll('.link')
                            .data(links)
                            .enter().append('path')
                            .attr('class', function (d) {
                                return 'link ' + d.type
                            })
                            .attr("marker-end", function (d) {
                                return "url(#" + d.type + ")";
                            });
                        var circles = svg.append('g').selectAll('.node')
                            .data(nodes)
                            .enter().append('circle')
                            .attr('r', 8)
                            .attr('class', function (d) {
                                return "node " + (d.highlight ? "highlight" : "")
                            })
                            .call(force.drag);
                        var text = svg.append("g").selectAll("text")
                            .data(force.nodes())
                            .enter().append("text")
                            .attr("x", 8)
                            .attr("y", ".31em")
                            .text(function (d) {
                                return d.category;
                            });

                        force.start();
                    }
                })
            }
        },
        visualize = function () {
            var clientlibName = $("#clientlib-name").val();
            Visualizer.visualizeClientlib(clientlibName);
        };
    $(function () {
        $("button").click(visualize);
        visualize();
    })
}());