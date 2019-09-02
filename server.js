const util = require('util');
const dcsdk = require('dragonchain-sdk')
const moment = require('moment');
const _ = require('underscore');
const express = require('express');
const app = express();

const parseBlocksByDay = function (blocks) {
	const occurences = [];

	blocks.forEach(function (element) {
		occurences.push(element.header.timestamp * 1000);
	});

	return _.map(
		_.groupBy(occurences, function (timestamp) {
			return moment(timestamp).startOf('day').format();
		}),
		function (group, day) {
			return {day: day, times: group}
		}
	);
}

const parseBlocksByHour = function (blocks) {
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


const main = async() => {
	const client = await dcsdk.createClient();

	const awaitHandlerFactory = (middleware) => {
		return async (req, res, next) => {
			try {
				await middleware(req, res, next)
			} catch (err) {
				next(err)
			}
		}
	}

	const poll = async() => {
		const status_response = await client.getStatus();
		const last_block_response = await client.queryBlocks({ limit: 1, sort: "block_id:desc"});

		let blocks_day = [];
		let done = false;
		let page = 0;
		let dayAgoTimestamp = moment().subtract(1,'d').startOf('hour').format("X");

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

		return {status: status_response.response, last_block: last_block_response.response.results[0], blocks_day};
	}


	app.set('view engine', 'pug');

	app.get('/', awaitHandlerFactory(async (req, res) => {
		const poll_response = await poll();

		const blocksByHour = parseBlocksByHour(poll_response.blocks_day);

		res.render('index', {
			title: "Dragonchain UVN Block Explorer",
			chain_id: poll_response.status.id,
			chain_level: poll_response.status.level,
			chain_version: poll_response.status.version,

			status: poll_response.status,

			last_block: poll_response.last_block,
			last_block_time: moment(poll_response.last_block.header.timestamp * 1000).format('llll'),
			last_block_time_since: moment(poll_response.last_block.header.timestamp * 1000).fromNow(),
			last_block_drgn_time: poll_response.last_block.header.current_ddss,

			block_height: poll_response.last_block.header.block_id,
			blocks: poll_response.blocks_day,
			blocks_by_hour: blocksByHour,
			blocks_last_24_hours: poll_response.blocks_day.length
		});
	}));


	// If SSL available, use port 443 //
	const server = app.listen(80, () => {
		console.log(`Express running → PORT ${server.address().port}`);
	});
}


main().then().catch(console.error)


