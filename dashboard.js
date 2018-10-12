var data;
var usadata;
var data1;
var COLOR_COUNTS = 9;
var COLOR_FIRST = "#c3e2ff",
    COLOR_LAST = "#08306B";
var rgb = hexToRgb(COLOR_FIRST);
var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);
rgb = hexToRgb(COLOR_LAST);
var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);
var startColors = COLOR_START.getColors(),
    endColors = COLOR_END.getColors();
var colors = [];
for (var i = 0; i < COLOR_COUNTS; i++) {
    var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
    var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
    var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
    colors.push(new Color(r, g, b));
}

var quantize = d3.scaleQuantize()
    .domain([0, 300000000])
    .range(d3.range(COLOR_COUNTS).map(function(i) {
        return i
    }));


function Interpolate(start, end, steps, count) {
    var s = start,
        e = end,
        final = s + (((e - s) / steps) * count);
    return Math.floor(final);
}

function Color(_r, _g, _b) {
    var r, g, b;
    var setColors = function(_r, _g, _b) {
        r = _r;
        g = _g;
        b = _b;
    };

    setColors(_r, _g, _b);
    this.getColors = function() {
        var colors = {
            r: r,
            g: g,
            b: b
        };
        return colors;
    };
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}






function loadDashboard() {
    d3.csv("https://raw.githubusercontent.com/divskivs/tableau1/master/losses2015_transformed.csv", function(error, data) {
        if (error) throw error;
        // dataset = data;
            d3.json("https://raw.githubusercontent.com/divskivs/tableau1/master/usa.json", function(error, us) {
                usdata = us
                if (error) throw error;
                createBar()
                createMap()
            });
        });
    
}

function generateBar(data1, state) {
        console.log(state + "  State Bar Chart \n")

        if(state === 'all' || state === 'All' || state === null){
          myBarData = d3.nest()
                      .key(function(d) { return d.Damage_Descp;})
                      .rollup(function(d) { 
                        return d3.sum(d, function(g) {return g.Amount; });
                      })
                      .entries(masterData)
                      .sort(function(a, b){ return d3.ascending(a.values, b.values); });
          myBarData.sort(function (a, b) {return a.value - b.value;})
        }else{
          if(state < 10){
            state = state.replace(/^0+(?!\.|$)/, '')   // removing leading 0 from state code
          }
          myBarData = d3.nest()
                      .key(function(d) { return d.Damage_Descp;})
                      .rollup(function(d) { 
                        return d3.sum(d, function(g) {return g.Amount; });
                      })
                      .entries(masterData.filter(function(d) {return d.State_Code === state;}))
                      .sort(function(a, b){ return d3.ascending(a.values, b.values); });
          myBarData.sort(function (a, b) {return a.value - b.value;})
        }
        // console.log("BARCHART DATA \n")
        // console.log(myBarData)
      }










function createBar(state_name = "") {

    
    var svg = d3.select("#svg_bar"),
        margin = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 200
        },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    var tooltip = d3.select("body").append("div").attr("class", "toolTip");

    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleBand().range([height, 0]);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        data1 = d3.nest()
            .key(function(d) {
                return d.Damage_Descp;
            })
            .rollup(function(d) { //rollup --->sum the values -->aggreagte
                return d3.sum(d, function(g) {
                    return g.Losses;
                });
            })
            .entries(data);




    console.log(data1);

    data1.sort(function(a, b) {
        return b.value - a.value;
    });

    x.domain([0, d3.max(data1, function(d) {
        return d.value;
    })]);

    y.domain(data1.map(function(d) {
        return d.key;
    })).padding(0.1);

    g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5).tickFormat(function(d) {
            return parseInt(d / 1000);
        }).tickSizeInner([-height]));

    g.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

    g.selectAll(".bar")
        .data(data1)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("y", function(d) {
            return y(d.key);
        })
        .attr("width", function(d) {
            return x(d.value);
        })
        .style("fill", function(d) {
            var i = quantize(d.value);
            var color = colors[i].getColors();
            return "rgb(" + color.r + "," + color.g +
                "," + color.b + ")";
        })
        .on("mousemove", function(d) {
            tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "inline-block")
                .html(d.value);
        })
        .on("mouseout", function(d) {
            tooltip.style("display", "none");
        });
}


function createMap(damage_name = "") {
    var svg = d3.select("#svg_map");
    var path = d3.geoPath();
    var SCALE = 0.7;


   
        data1 = d3.nest()
            .key(function(d) {
                return d.State_Code;
            })
            .rollup(function(d) { //rollup --->sum the values -->aggreagte
                return d3.sum(d, function(g) {
                    return g.Losses;
                });
            })
            .entries(data);
   

   console.log(data1);


    name_id_map = {};

    for (var i = 0; i < data1.length; i++) {

        var dataState = data1[i].key;
        var dataValue = data1[i].value;
        name_id_map[dataState] = dataValue;
        for (var j = 0; j < usa.objects.states.length; j++) {
            var jsonState = usa.objects.states[j].id;

            if (dataState == jsonState) {
                usa.states[j].properties.value = dataValue;
                break;
            }
        }

    }

    
    svg.append("g")
        .attr("class", "cate")
        .selectAll("path")
        .data(topojson.feature(usdata, usdata.objects.states).features)
        .enter().append("path")
        .attr("d", path)
        .attr("transform","scale("+ SCALE + ")")
        .style("fill", function(d) {
            var temp = parseInt(d.id, 10)
            if (name_id_map[temp]) {
                var i = quantize(name_id_map[temp]);
                var color = colors[i].getColors();
                return "rgb(" + color.r + "," + color.g +
                    "," + color.b + ")";
            } else {
                return "";
            }
        })
        .on("mousemove", function(d) {
            
            var html = "";
            var val = name_id_map[parseInt(d.id)];
            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += val;
            html += "</span>";
            html += "</div>";

            $("#tooltip-container").html(html);
            $(this).attr("fill-opacity", "0.8");
            $("#tooltip-container").show();

            var coordinates = d3.mouse(this);

            var map_width = $('.cate')[0].getBoundingClientRect().width;

            if (d3.event.pageX < map_width / 2) {
                d3.select("#tooltip-container")
                    .style("top", (d3.event.pageY + 15) + "px")
                    .style("left", (d3.event.pageX + 15) + "px");
            } else {
                var tooltip_width = $("#tooltip-container").width();
                d3.select("#tooltip-container")
                    .style("top", (d3.event.pageY + 15) + "px")
                    .style("left", (d3.event.pageX - tooltip_width - 30) + "px");
            }
        })
        .on("mouseout", function() {
            
            $(this).attr("fill-opacity", "1.0");
            $("#tooltip-container").hide();
        });

    svg.append("path")
        .datum(topojson.mesh(usadata, usadata.objects.states, function(a, b) {
            return a !== b;
        }))
        .attr("class", "cat1")
        .attr("transform","scale("+ SCALE + ")")
        .attr("d", path);


}


































            function createMap(damage_name) {
                var usa;
                d3.json("https://raw.githubusercontent.com/divskivs/tableau1/master/usa.json", function(error, data) {
                    usa = data;

    

                    var div = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);

                    //Sets dimensions
                    var margin = {
                            top: 10,
                            left: 10,
                            bottom: 10,
                            right: 10
                        },
                        width = window.outerWidth,
                        width = width - margin.left - margin.right,
                        mapRatio = .5,
                        height = width * mapRatio;

                    //Tells the map what projection to use
                    var projection = d3.geo.albersUsa()
                        .scale(width)
                        .translate([width / 2, height / 2]);

                    //Tells the map how to draw the paths from the projection
                    var path = d3.geo.path()
                        .projection(projection);

                    //Appened svg to page

                    var map = d3.select("#map1").attr("width", width)
                        .attr("height", height)

                    console.log("div map")
                    console.log(map)
                    d3.csv("https://raw.githubusercontent.com/divskivs/tableau1/master/losses2015_transformed.csv", function(error, data) {
                        if (error) throw error;

                        var data1;

        console.log(damage_name)
                      if (damage_name == "") {
           
            data1 = d3.nest()
                .key(function(d) {
                    return d.State_Code;
                })
                .rollup(function(d) { //rollup --->sum the values -->aggreagte
                    return d3.sum(d, function(g) {
                        return g.Losses;
                    });
                })
                .entries(data);

        } else {
           
            data1 = d3.nest()
                .key(function(d) {
                    return d.State_Code;
                })
                .rollup(function(d) { //rollup --->sum the values -->aggreagte
                    return d3.sum(d, function(g) {
                        return g.Losses;
                    });
                })
                .entries(data.filter(function(d) {

                    return d.Damage_Descp == damage_name;
                }));
        }

    console.log("MAP DATA")
    console.log(data1)


                        //Sets color scale
                        var numMedian = d3.median(data1, function(d) {
                            return d.values;
                        });
                        var quantize = d3.scale.quantize()
                            .domain([0, numMedian])
                            .range(d3.range(5).map(function(i) {
                                return "q" + i + "-9";
                            }));



                        //Appends chart headline
                        d3.select(".g-hed").text("Losses 2015 Damage Type : All");

                        //Appends chart intro text
                        d3.select(".g-intro").text("Agricultural losses by state");



                        name_id_map = {};

                        for (var i = 0; i < data1.length; i++) {

                            var dataState = data1[i].key;
                            var dataValue = data1[i].values;
                            name_id_map[dataState] = dataValue;
                            for (var j = 0; j < usa.objects.states.length; j++) {
                                var jsonState = usa.objects.states[j].id;

                                if (dataState == jsonState) {
                                    usa.states[j].properties.value = dataValue;
                                    break;
                                }
                            }

                        }

                        //Append states
                        map.append("g")
                            .attr("class", "states")
                            .selectAll("path")
                            .data(topojson.feature(usa, usa.objects.states).features)
                            .enter().append("path")
                            .attr("d", path)
                            //Color states
                            .attr("class", function(d) {
                                return quantize(d.values);
                            })
                            //Hovers
                            .on("mouseover", function(d) {
                                
                                var html = "";

                                html += "<div class=\"tooltip_kv\">";
                                html += "<span class=\"tooltip_key\">";
                                html += //id_name_map[d.id];
                                    html += "</span>";
                                html += "<span class=\"tooltip_value\">";
                                html += name_id_map[parseInt(d.id)];
                                html += "";
                                html += "</span>";
                                html += "</div>";

                                $("#tooltip-container").html(html);
                                $(this).attr("fill-opacity", "0.8");
                                $("#tooltip-container").show();

                                var coordinates = d3.mouse(this);

                                //var map_width = $('.categories-choropleth')[0].getBoundingClientRect().width;

                                var tooltip_width = $("#tooltip-container").width();
                                d3.select("#tooltip-container")
                                    .style("top", (d3.event.pageY + 15) + "px")
                                    .style("left", (d3.event.pageX - tooltip_width - 30) + "px");


                                function createBar(){ 
                              if (State_Abv == "") {
                                      $("#state_lb").html("All");
                                      data1 = d3.nest()
                                          .key(function(d) {
                                        return d.Damage_Descp;
                })
                                  .rollup(function(d) { //rollup --->sum the values -->aggreagte
                                  return d3.sum(d, function(g) {
                                  return g.Losses;
                    });
                })
                                  .entries(data);

          } else {
                              $("#State_Abv").html(State_Abv);
                              data1 = d3.nest()
                              .key(function(d) {
                              return d.Damage_Descp;
                              })
                              .rollup(function(d) { //rollup --->sum the values -->aggreagte
                              return d3.sum(d, function(g) {
                              return g.Losses;
                    });
                })
                .entries(dataset.filter(function(d) {
                    return d.State_Abv == State_Code;
                }));
        }



                                }


                            })
                            .on("mouseout", function() {
                                $(this).attr("fill-opacity", "1.0");
                                $("#tooltip-container").hide();
                                /*var sel = d3.select(this);
                                  sel.moveToBack();
                                d3.select(this)
                                .transition().duration(300)
                                .style("opacity", 1);
                                div.transition().duration(300)
                                .style("opacity", 0);*/

                                createBar("")
                            });

                        //Appends chart source
                        d3.select(".g-source-bold")
                            .text("SOURCE: ")
                            .attr("class", "g-source-bold");

                        d3.select(".g-source-reg")
                            .text("Chart source info goes here")
                            .attr("class", "g-source-reg");

                    });
                });
            }

            function createBar(state_name) {
                var margin = {
                        top: 20,
                        right: 20,
                        bottom: 50,
                        left: 100
                    },
                    width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
                    height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

                var yScale = d3.scale.ordinal()
                    .rangeRoundBands([height, 0], 0.1);

                var xScale = d3.scale.linear()
                    .range([0, width]);

                //var dollarFormatter = d3.format(",.0f")


                // .tickFormat(function(d) { return "$" + dollarFormatter(d);});

                var svg_bar = d3.select("#chart")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                var yAxis = d3.svg.axis()
                    .scale(yScale)
                    .orient("left");

                var xAxis = d3.svg.axis()
                    .scale(xScale)
                    .orient("bottom")



                var tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .offset([-10, 0])
                    .html(function(d) {
                        return "<div><span>Damage_Descp:</span> <span style='color:white'>" + d.key + "</span></div>" +

                            "<div><span>losses:</span> <span style='color:white'>" + d.values;
                    })

                svg_bar.call(tip);

                d3.csv("https://raw.githubusercontent.com/divskivs/tableau1/master/losses2015_transformed.csv", function(error, data) {
                    if (error) throw error;

                    //

                    data1 = d3.nest()
                        .key(function(d) {
                            return d.Damage_Descp;
                        })
                        .rollup(function(d) { //rollup --->sum the values -->aggreagte
                            return d3.sum(d, function(g) {
                                return g.Losses;
                            });
                        })
                        .entries(data)


                    console.log(data1)
                    // Filter to select a subset
                    var subset = data1
                    /*?.filter(function(el){
                    / return  (el["metric"] === "Sales")
                     //           && (el["Sub-Category"] === "Bookcases")
                      //          && (el["Type"] === "Customer");
                     //}); */

                    // Sort the data so bar chart is sorted in decreasing order
                    subset = subset.sort(function(a, b) {
                        return a.values - b.values;
                    });
                    console.log(JSON.stringify(subset, null, 2));

                    yScale.domain(subset.map(function(d) {
                        return d.key;
                    }));
                    xScale.domain([0, d3.max(subset, function(d) {
                        return d.values;
                    })]);

                    svg_bar.append("g")
                        .attr("class", "y axis")
                        .call(yAxis);

                    svg_bar.append("g")
                        .attr("class", "x axis")
                        .call(xAxis)
                        .attr("transform", "translate(0," + height + ")")
                        .append("text")
                        .attr("class", "label")
                        .attr("transform", "translate(" + width / 2 + "," + margin.bottom / 1.5 + ")")
                        .style("text-anchor", "middle")
                        .text("losses");

                    svg_bar.selectAll(".bar")
                        .data(subset)
                        .enter().append("rect")
                        .attr("class", "bar")
                        .attr("width", function(d) {
                            return xScale(d.values);
                        })
                        .attr("y", function(d) {
                            return yScale(d.key);
                        })
                        .attr("height", yScale.rangeBand())
                        .on('mouseover', function(d) {
                          tip.show
                          console.log("map key "+d.key)
                          createMap(d.key)
                        })
                        .on('mouseout', function(d) {

                          tip.hide
                          createMap("")
                        })


                });

            }
        </script>
    </head>


    <body onload="myFunction()">

        <h5 class="g-hed"></h5>
        <p class="g-intro"></p>
        <div class="mapchart"></div>
        <div class="legend">
            <div class="block" id="q0-9"></div>
            <div class="block" id="q1-9"></div>
            <div class="block" id="q2-9"></div>
            <div class="block" id="q3-9"></div>
            <div class="block" id="q4-9"></div>
        </div>
        <div class="g-source"><span class="g-source-bold"></span><span class="g-source-reg"></span></div>
        <div id="tooltip-container"></div>
        <!--  CHOROPLETH MAP -->
        <svg id="map1"> </svg>

        <svg id="chart"> </svg>


    </body>