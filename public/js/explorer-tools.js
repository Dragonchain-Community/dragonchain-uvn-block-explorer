var node = {
	public_id: null,
	node_level: null,
	dragonchain_version: null,
	block_height: null,
	block_count_day: null,
	last_block: null,
	last_block_id: null,
	last_block_date: null,
	time_at_last_block: null,
	last_update: null,
	initialized: false
}

var config = {
	blocks_per_pull: 10000,
	ping_delay: 15000,	
	current_chart: null
}

var tools = {	
	refreshUI: function () {
		$("#public-id").html(node.public_id);
		$("#dc-node-level").html(node.node_level);
		$("#dc-version").html(node.dragonchain_version);

		if (node.last_block)
		{
			$("#last-block-date").html(node.last_block_date);
			$("#dc-time-at-last-block").html(node.time_at_last_block);
			$("#last-block").html(JSON.stringify(node.last_block, null, 2));
			$("#block-height").html(node.block_height);
			$("#block-count-day").html(node.block_count_day);
		}

		$("#loading").addClass("d-none");
		$("#node-info").removeClass("d-none");
	},
	setAppState: function (state) {
		$("#app-state").html(state);
	},
	getStatus: async function () {
		return $.ajax({
			url: "/get-status",
			method: "POST",
			data: {
				credentials_secure: window.localStorage.credentials_secure
			},				
			dataType: "html"
		})	
			.always(function (data) {
				tools.refreshUI();
			})

	},
	getBlocksChunk: async function (start_block_id)
	{
		return $.ajax({
			url: "/get-blocks",
			method: "POST",
			data: {
				credentials_secure: window.localStorage.credentials_secure,
				start_block_id: start_block_id
			},				
			dataType: "html"
		})	
	},
	getBlocks: async function (start_block_id, max_block_id) {	
		var chunk = JSON.parse(await tools.getBlocksChunk(start_block_id));

		//console.log(chunk);

		if (chunk.blocks_remaining > 0 && Number(chunk.last_block_id) + 50 <= max_block_id)
		{		
			tools.setAppState("Retrieving new blocks (" + chunk.blocks_remaining + " left)");
			return chunk.blocks.concat(await tools.getBlocks(chunk.last_block_id, max_block_id));
		} else {			
			return chunk.blocks;
		}
	},
	updateLastBlock: function (block) {		
		if (block)
		{
			node.last_block = block;
			node.last_block_id = block.header.block_id;
			node.block_height = block.header.block_id;
			node.last_block_date = moment(block.header.timestamp * 1000).format('lll') + " (" + moment(block.header.timestamp * 1000).fromNow() + ")";
			node.time_at_last_block = block.header.current_ddss;					
			tools.refreshUI();					
		} else {
			// Get the latest block and update node stats //
			db.findLastBlock()
				.then(function (result) {								
					if (result.docs.length > 0)
					{					
						block = result.docs[0].block;					
						node.last_block = block;
						node.last_block_id = block.header.block_id;
						node.block_height = block.header.block_id;
						node.last_block_date = moment(block.header.timestamp * 1000).format('lll') + " (" + moment(block.header.timestamp * 1000).fromNow() + ")";
						node.time_at_last_block = block.header.current_ddss;					
						tools.refreshUI();					
					} 
				}).catch(function (err) {
					console.log(err)										
				})
		}
	},
	updateChart: function () {
		// Get blocks for last x [timeframe] and draw //

		if (config.current_chart == "#chart-byweek")
		{
			var start_timestamp = moment.utc().subtract(11, "weeks").startOf("week").format("X");
			
			db.findBlocksByTimestamp({"$gte": Number(start_timestamp)})
				.then(function (result) {
					if (result.docs && result.docs.length > 0)
						tools.drawBlocksPerWeek(tools.parseBlocksByWeek(result.docs), "12 Weeks")
				})		

		} else if (config.current_chart == "#chart-byday")
		{		
			var start_timestamp = moment.utc().subtract(13, "days").startOf("day").format("X");
			
			db.findBlocksByTimestamp({"$gte": Number(start_timestamp)})
				.then(function (result) {
					if (result.docs && result.docs.length > 0)
						tools.drawBlocksPerDay(tools.parseBlocksByDay(result.docs), "14 Days")
				})		
		} else if (config.current_chart == "#chart-byhour")
		{		
			var start_timestamp = moment.utc().subtract(23, "hours").startOf("hour").format("X");
			
			db.findBlocksByTimestamp({"$gte": Number(start_timestamp)})
				.then(function (result) {
					if (result.docs && result.docs.length > 0)
						tools.drawBlocksPerHour(tools.parseBlocksByHour(result.docs), "24 Hours")
				})		
		}
	},
	drawBlocksPerWeek: function (block_groups, time_frame) {

		// Create the data table.
		var data = new google.visualization.DataTable();
		data.addColumn('string', 'Week Of');
		data.addColumn('number', 'Blocks');

		block_groups.forEach(function (element) {
			data.addRow([element.day, element.times.length])
		})

		// Set chart options
		var options = {'title':'Blocks by Week - ' + time_frame, 'width':'100%', 'height':450};
		// Instantiate and draw our chart, passing in some options.
		var chart = new google.visualization.ColumnChart(document.getElementById('chart'));
		chart.draw(data, options);

	},
	drawBlocksPerDay: function (block_groups, time_frame) {

		// Create the data table.
		var data = new google.visualization.DataTable();
		data.addColumn('string', 'Day');
		data.addColumn('number', 'Blocks');

		block_groups.forEach(function (element) {
			data.addRow([element.day, element.times.length])
		})

		// Set chart options
		var options = {'title':'Blocks by Day - ' + time_frame, 'width':'100%', 'height':450};
		// Instantiate and draw our chart, passing in some options.
		var chart = new google.visualization.ColumnChart(document.getElementById('chart'));
		chart.draw(data, options);

	},
	drawBlocksPerHour: function (block_groups, time_frame) {

		// Create the data table.
		var data = new google.visualization.DataTable();
		data.addColumn('string', 'Hour');
		data.addColumn('number', 'Blocks');

		block_groups.forEach(function (element) {
			data.addRow([element.hour, element.times.length])
		})

		// Set chart options
		var options = {'title':'Blocks by Hour - ' + time_frame, 'width':'100%', 'height':450};
		// Instantiate and draw our chart, passing in some options.
		var chart = new google.visualization.ColumnChart(document.getElementById('chart'));
		chart.draw(data, options);

	},
	updateBlocksLastDay: function () {
		
		var start_timestamp = moment.utc().subtract(23, "hours").startOf("hour").format("X");
		
		db.findBlocksByTimestamp({"$gte": Number(start_timestamp)})
			.then(function (result) {
				if (result.docs && result.docs.length > 0)
				{
					node.block_count_day = result.docs.length;
					tools.refreshUI();
				}
			})		
	},
	parseBlocksByWeek: function (blocks) {
        const occurences = [];

        blocks.forEach(function (element) {
            occurences.push(element.block.header.timestamp * 1000);
        });

        return _.map(
            _.groupBy(occurences, function (timestamp) {
                return moment(timestamp).startOf('week').format("MMM Do");
            }),
            function (group, day) {
                return {day: day, times: group}
            }
        );
    },
	parseBlocksByDay: function (blocks) {
        const occurences = [];

        blocks.forEach(function (element) {
            occurences.push(element.block.header.timestamp * 1000);
        });

        return _.map(
            _.groupBy(occurences, function (timestamp) {
                return moment(timestamp).startOf('day').format("MMM Do");
            }),
            function (group, day) {
                return {day: day, times: group}
            }
        );
    },
	parseBlocksByHour: function (blocks) {
        const occurences = [];

        blocks.forEach(function (element) {
            occurences.push(element.block.header.timestamp * 1000);
        });

        return _.map(
            _.groupBy(occurences, function (timestamp) {
                return moment(timestamp).startOf('hour').format("HH:mm");
            }),
            function (group, hour) {
                return {hour: hour, times: group}
            }
        );
    },
	redirectToLogin: function () {
		document.location.href = "/login";
	}
} 