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
        let start_time = moment.utc().subtract(23,'hours').startOf('hour').unix();
        let end_time = moment.utc().unix();

        while (!done) {
            const blocks_response = await client.queryBlocks({ luceneQuery: "header.timestamp[" + start_time.toString() +" TO " + end_time.toString() + "]", limit: 50, offset: page, sort: "block_id:desc"});

            if (blocks_response.response.results.length > 0)
            {
                for (let i = 0; i < blocks_response.response.results.length; i++)
                {

                        element = blocks_response.response.results[i];
                        blocks_day.push(element);
                }

                page += 50;

            } else
                done = true;
        }

        let blocks_week = [];
        for (let i = 0; i < 7; i++)
        {
            let current_day_start = moment.utc().subtract(i, "days").startOf("day").format("X");
            let current_day_end = moment.utc().subtract(i, "days").endOf("day").format("X");

            // queryBlocks with luceneQuery (TODO: replace with redisearch on next DC release)
            const blocks_response = await client.queryBlocks({ limit: 1, luceneQuery: "header.timestamp[" + current_day_start.toString() +" TO " + current_day_end.toString() + "]", sort: "block_id:desc"});

            blocks_week.push({"day" : moment.unix(current_day_start).utc().format("MMM Do"), "blocks": blocks_response.response.total});

        }

        return {status: status_response.response, last_block: last_block_response.response.results[0], blocks_day: blocks_day, blocks_week: blocks_week};
    },


    parseBlocksByHour: function (blocks) {
        const occurences = [];

        blocks.forEach(function (element) {
            occurences.push(element.header.timestamp * 1000);
        });

        return _.map(
            _.groupBy(occurences, function (timestamp) {
                return moment.utc(timestamp).startOf('hour').format("HH:mm");
            }),
            function (group, hour) {
                return {hour: hour, times: group}
            }
        );
    }

}
