const moment = require('moment');
const _ = require('underscore');
const util = require('util');

module.exports  = {
    poll: async function (client) {
        const status_response = await client.getStatus();
        const last_block_response = await client.queryBlocks({ limit: 1, sort: "block_id:desc"});

        let blocks_day = [];
        let done = false;
        let page = 0;
        let dayAgoTimestamp = moment().subtract(1,'d').startOf('hour').format("X");

	const start_time = new Date().getTime() / 1000;
        while (!done) {
            const blocks_response = await client.queryBlocks({ limit: 50, offset: page, sort: "block_id:desc"});

            for (let i = 0; i < blocks_response.response.results.length; i++)
            {
                element = blocks_response.response.results[i];

                if (element.header.timestamp >= dayAgoTimestamp)
                    blocks_day.push(element);
                else
                {
                    done = true;
                    break;
                }
            }

            page += 50;
        }
	const end_time = new Date().getTime() / 1000;

	// To get blocks for the week (by day): pull counts for current date - [0...6] by timestamp
	const start_time_test = new Date().getTime() / 1000;
	let blocks_week = [];
	for (let i = 0; i < 7; i++)
	{
		let current_day_start = moment.utc().subtract(i, "days").startOf("day").format("X");
		let current_day_end = moment.utc().subtract(i, "days").endOf("day").format("X");

		// queryBlocks with luceneQuery (TODO: replace with redisearch on next DC release)
		const blocks_response = await client.queryBlocks({ limit: 1, luceneQuery: "header.timestamp[" + current_day_start.toString() +" TO " + current_day_end.toString() + "]", sort: "block_id:desc"});

		blocks_week.push({"day" : moment.unix(current_day_start).format("MMM Do"), "blocks": blocks_response.response.total});

	}
	const end_time_test = new Date().getTime() / 1000;

        return {status: status_response.response, last_block: last_block_response.response.results[0], blocks_day: blocks_day, blocks_week: blocks_week};
    },


    parseBlocksByHour: function (blocks) {
        const occurences = [];

        blocks.forEach(function (element) {
            occurences.push(element.header.timestamp * 1000);
        });

        return _.map(
            _.groupBy(occurences, function (timestamp) {
                return moment(timestamp).startOf('hour').format("HH:mm");
            }),
            function (group, hour) {
                return {hour: hour, times: group}
            }
        );
    }

}
