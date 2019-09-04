const tools = require('./dragon-tools')
const moment = require('moment')
const util = require('util');
const dcsdk = require('dragonchain-sdk')
const _ = require('underscore');
const express = require('express');
const app = express();


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

	app.set('view engine', 'pug');

	app.get('/', awaitHandlerFactory(async (req, res) => {

        const poll_response = await tools.poll(client);

		const blocksByHour = tools.parseBlocksByHour(poll_response.blocks_day);

		res.render('index', {
			title: "Dragonchain UVN Block Explorer",
			chain_id: poll_response.status.id,
			chain_level: poll_response.status.level,
			chain_version: poll_response.status.version,

			status: poll_response.status,

			last_block: poll_response.last_block,
			last_block_time: moment.utc(poll_response.last_block.header.timestamp * 1000).format('llll'),
			last_block_time_since: moment.utc(poll_response.last_block.header.timestamp * 1000).fromNow(),
			last_block_drgn_time: poll_response.last_block.header.current_ddss,

			block_height: poll_response.last_block.header.block_id,
			blocks: poll_response.blocks_day,
			blocks_by_hour: blocksByHour,
			blocks_by_day: poll_response.blocks_week,
			blocks_last_24_hours: poll_response.blocks_day.length
		});
	}));

    app.use(function (err, req, res, next) {
        console.log(err);

        res.render('error', {
            title: "Error - Dragonchain UVN Block Explorer",
            error: err
        });
    });




	// In production use port 80 or, if SSL available, use port 443 //
	const server = app.listen(3000, () => {
		console.log(`Express running → PORT ${server.address().port}`);
	});
}


main().then().catch(console.error)


