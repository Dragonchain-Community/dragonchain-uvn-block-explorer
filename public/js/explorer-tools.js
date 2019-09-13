var node = {
	public_id: null,
	node_level: null,
	dragonchain_version: null,
	block_height: null,
	block_count_day: null,
	last_block: null,
	last_block_date: null,
	time_at_last_block: null,
	last_update: null,
	initialized: false
}

var tools = {	
	refreshUI: function () {
		console.log("Refreshing UI...");

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
	getStatus: function () {
		$.ajax({
			url: "/get-status",
			method: "POST",
			data: {
				credentials_secure: window.localStorage.credentials_secure
			},				
			dataType: "html"
		})		
			.done(function (data) {
					var dataObj = JSON.parse(data);

					if (dataObj.error)
					{
						tools.redirectToLogin();
					} else {						
						console.log(dataObj);

						node.public_id = dataObj.status.id;
						node.node_level = dataObj.status.level;
						node.dragonchain_version = dataObj.status.version;
					}
				})
			.always(function (data) {
				tools.refreshUI();
			})

	},
	getBlocks: function (start_block_id) {	
		$.ajax({
			url: "/get-blocks",
			method: "POST",
			data: {
				credentials_secure: window.localStorage.credentials_secure,
				start_block_id: start_block_id
			},				
			dataType: "html"
		})		
			.done(function (data) {
					var dataObj = JSON.parse(data);

					if (dataObj.error)
					{
						tools.redirectToLogin();
					} else {												
						if (dataObj.blocks.length > 0)
						{
							// Update the database //
							db.addBlocks(dataObj.blocks);

							// If there are more new blocks remaining, go again //
							if (dataObj.blocks_remaining > 0)
							{
								tools.setAppState("Retrieving new blocks (" + dataObj.blocks_remaining + " left)");
								tools.getBlocks(dataObj.last_block_id);
							} else {			
								tools.setAppState("");

								node.last_update = moment.utc();																

								// Update last block and chart data //
								tools.updateLastBlock();
								tools.updateBlocksLastDay();
								tools.updateChart();
							}
						} else {
							if (!node.initialized)
							{
								node.last_update = moment.utc();								
								node.initialized = true;

								tools.updateLastBlock();
								tools.updateBlocksLastDay();
								tools.updateChart();
							}
							if (node.last_block)
								node.last_block_date = moment.utc(node.last_block.header.timestamp * 1000).format('lll') + " UTC (" + moment.utc(node.last_block.header.timestamp * 1000).fromNow() + ")";							
							
							tools.refreshUI();
						}
					}
				})

	},
	updateLastBlock: function (block) {
		// Get the latest block and update node stats //
		db.findLastBlock()
			.then(function (result) {				
				if (result.docs.length > 0)
				{
					block = result.docs[0].block;					
					node.last_block = block;
					node.block_height = block.header.block_id;
					node.last_block_date = moment.utc(block.header.timestamp * 1000).format('lll') + " UTC (" + moment.utc(block.header.timestamp * 1000).fromNow() + ")";
					node.time_at_last_block = block.header.current_ddss;					
					tools.refreshUI();
				} 
			}).catch(function (err) {
				console.log(err)										
			})
	},
	updateChart: function () {
		// Get blocks for last x [timeframe] and draw //

		// By Day, 30 Day //
		var start_timestamp = moment.utc().subtract(13, "days").startOf("day").format("X");
		
		db.findBlocksByTimestamp({"$gte": Number(start_timestamp)})
			.then(function (result) {
				if (result.docs && result.docs.length > 0)
					tools.drawBlocksPerDay(tools.parseBlocksByDay(result.docs), "14 Day")
			})		
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
	parseBlocksByDay: function (blocks) {
        const occurences = [];

        blocks.forEach(function (element) {
            occurences.push(element.block.header.timestamp * 1000);
        });

        return _.map(
            _.groupBy(occurences, function (timestamp) {
                return moment.utc(timestamp).startOf('day').format("MMM Do");
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
                return moment.utc(timestamp).startOf('hour').format("HH:mm");
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