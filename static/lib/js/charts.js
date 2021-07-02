queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function makeGraphs(error, recordsJson) {
    //Clean data
	var records = recordsJson;

	console.log("records")
	console.log(records)
	var dateFormat = d3.timeParse("%Y-%m-%d");

	records.forEach(function(d) {
		console.log(d)
		d["date"] = dateFormat(d["date_iso_format"]);
		d["date"].setMinutes(0);
		d["date"].setSeconds(0);
		d["long"] = +d["long"];
		d["lat"] = +d["lat"];
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(records);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["date"]; });
	var genderDim = ndx.dimension(function(d) { return d["name_day_en"]; });
	// var ageSegmentDim = ndx.dimension(function(d) { return d["age_segment"]; });
	var phoneBrandDim = ndx.dimension(function(d) { return d["manufacturer_short_name"]; });
	var locationdDim = ndx.dimension(function(d) { return d["location"]; });
	var allDim = ndx.dimension(function(d) {return d;});


	//Group Data
	var numRecordsByDate = dateDim.group();
	var genderGroup = genderDim.group();
	// var ageSegmentGroup = ageSegmentDim.group();
	var phoneBrandGroup = phoneBrandDim.group();
	var locationGroup = locationdDim.group();
	var all = ndx.groupAll();


	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["date"];
	var maxDate = dateDim.top(1)[0]["date"];


    //Charts
    // var numberRecordsND = dc.numberDisplay("#number-records-nd");
	window.timeChart = dc.barChart("#time-chart");
	window.dayChart = dc.rowChart("#gender-row-chart");
	// var ageSegmentChart = dc.rowChart("#age-segment-row-chart");
	window.manufacturerChart = dc.rowChart("#manufacturer-row-chart");
	var locationChart = dc.rowChart("#location-row-chart");

	// numberRecordsND
	// 	.formatNumber(d3.format("d"))
	// 	.valueAccessor(function(d){return d; })
	// 	.group(all);


	timeChart
		.width(1040)
		.height(140)
		.margins({top: 20, right: 20, bottom: 20, left: 20})
		.dimension(dateDim)
		.group(numRecordsByDate)
		.transitionDuration(500)
		.x(d3.scaleTime().domain([minDate, maxDate]))
		.elasticY(true)
		.elasticX(true)
		.yAxis().ticks(4);

	dayChart
		.width(500)
		.height(400)
        .dimension(genderDim)
        .group(genderGroup)
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .xAxis().ticks(5);

	// ageSegmentChart
	// 	.width(300)
	// 	.height(150)
    //     .dimension(ageSegmentDim)
    //     .group(ageSegmentGroup)
    //     .colors(['#6baed6'])
    //     .elasticX(true)
    //     .labelOffsetY(10)
    //     .xAxis().ticks(4);

	manufacturerChart
		.width(500)
		.height(400)
        .dimension(phoneBrandDim)
        .group(phoneBrandGroup)
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
		.rowsCap(10)
        .xAxis().ticks(5);

    locationChart
    	.width(1000)
		.height(400)
        .dimension(locationdDim)
        .group(locationGroup)
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .labelOffsetY(10)
        .xAxis().ticks(4);
	
	// -----------------------------------start of test table
	var nasdaqCount = dc.dataCount('.dc-data-count');
	nasdaqCount /* dc.dataCount('.dc-data-count', 'chartGroup'); */
	.dimension(ndx)
	.group(all)
	// (_optional_) `.html` sets different html when some records or all records are selected.
	// `.html` replaces everything in the anchor with the html given using the following function.
	// `%filter-count` and `%total-count` are replaced with the values obtained.
	.html({
		some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
			' | <a href=\'javascript:timeChart.filterAll(); manufacturerChart.filterAll(); dayChart.filterAll(); dc.redrawAll();\'>Reset All</a>',
		all: 'All records selected. Please click on the graph to apply filters.'
	});

	var nasdaqTable = dc_datatables.datatable('.dc-data-table');
	nasdaqTable /* dc_datatables.datatable('.dc-data-table') */
        .dimension(dateDim)
        // Data table does not use crossfilter group but rather a closure
        // as a grouping function
        .group(function (d) {
            var format = d3.format('02d');
            return d.dd.getFullYear() + '/' + format((d.dd.getMonth() + 1));
        })
        // (_optional_) max number of records to be shown, `default = 25`
        .size(10)
        // There are several ways to specify the columns; see the data-table documentation.
        // This code demonstrates generating the column header automatically based on the columns.
        .columns([
            // Use the `d.date` field; capitalized automatically; specify sorting order
            {
                label: 'date',
                type: 'date',
                format: function(d) {
                    return d.date_us_format;
                }
            },
			{
                label: 'Manufacturer',
                format: function(d) {
                    return d.manufacturer_short_name;
                }
            },
			{
                label: 'Model',
                format: function(d) {
                    return d.model;
                }
            },
			{
                label: 'Day of the Week',
                format: function(d) {
                    return d.name_day_en;
                }
            }
			
            // Use `d.open`, `d.close`; default sorting order is numeric
            // 'open',
            // 'close',
            // {
            //     // Specify a custom format for column 'Change' by using a label with a function.
            //     label: 'Change',
            //     format: function (d) {
            //         return numberFormat(d.close - d.open);
            //     }
            // },
            // Use `d.volume`
            // 'volume'
        ])

        // (_optional_) sort using the given field, `default = function(d){return d;}`
        .sortBy(function (d) {
            return d.dd;
        })
        // (_optional_) sort order, `default = d3.ascending`
        .order(d3.ascending)
        // (_optional_) custom renderlet to post-process chart using [D3](http://d3js.org)
        .on('renderlet', function (table) {
            table.selectAll('.dc-table-group').classed('info', true);
        });
	
	// -----------------------------------end of test table
    var map = L.map('map');

	var drawMap = function(){

	    map.setView([43.7, -79.384293], 10);
		mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
		L.tileLayer(
			'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; ' + mapLink + ' Contributors',
				maxZoom: 15,
			}).addTo(map);

		//HeatMap
		var geoData = [];
		_.each(allDim.top(Infinity), function (d) {
			geoData.push([d["lat"], d["long"], 1]);
	      });
		var heat = L.heatLayer(geoData,{
			radius: 10,
			blur: 20, 
			maxZoom: 1,
		}).addTo(map);

	};

	//Draw Map
	drawMap();

	//Update the heatmap if any dc chart get filtered
	// dcCharts = [timeChart, dayChart, ageSegmentChart, manufacturerChart, locationChart];
	dcCharts = [timeChart, dayChart, manufacturerChart, locationChart];
	_.each(dcCharts, function (dcChart) {
		dcChart.on("filtered", function (chart, filter) {
			map.eachLayer(function (layer) {
				map.removeLayer(layer)
			}); 
			drawMap();
		});
	});

	dc.renderAll();

};


    