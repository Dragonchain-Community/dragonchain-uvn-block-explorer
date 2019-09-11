const tools = require('./dragon-tools')
const moment = require('moment')
const util = require('util');
const dcsdk = require('dragonchain-sdk')
const _ = require('underscore');
const express = require('express');
const exphbs = require('express-handlebars');

const app = express();

const main = async() => {
	const awaitHandlerFactory = (middleware) => {
		return async (req, res, next) => {
			try {
				await middleware(req, res, next)
			} catch (err) {
				next(err)
			}
		}
	}

	var hbs = exphbs.create({
		helpers: {
			json: function (context) {return JSON.stringify(context);},
			jsonPretty: function (context) {return JSON.stringify(context, null, 2);}			
		}
	})

	app.engine('handlebars', hbs.engine);
	app.set('view engine', 'handlebars');

	app.use(express.urlencoded({ extended: true }))
	app.use('/bower_components',  express.static(__dirname + '/bower_components'));
	app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));

	app.get('/', awaitHandlerFactory(async (req, res) => {
		res.render('index', {title: "Dragonchain UVN Block Explorer"});
	}));

	app.get('/login', awaitHandlerFactory(async (req, res) => {
		res.render('login', {title: "Dragonchain UVN Block Explorer Login"});
	}));

	app.get('/verify', awaitHandlerFactory(async (req, res) => {
		res.render('verify', {title: "Dragonchain UVN Block Explorer Login Verification"});
	}));

	app.get('/noblocks', awaitHandlerFactory(async (req, res) => {
		res.render('empty-node', {title: "Dragonchain UVN Block Explorer", layout: false});
	}));	

	app.post('/get-node-info', awaitHandlerFactory(async (req, res) => {

		const public_id = req.body.public_id;
		const access_id = req.body.access_id;
		const access_key = req.body.access_key;
		const endpoint_url = req.body.endpoint_url;

		const client = await dcsdk.createClient({authKeyId: access_id, authKey: access_key, dragonchainId: public_id, endpoint: endpoint_url});
		
    	const poll_response = await tools.poll(client);
        
		if (poll_response.empty)        
		{
    		res.redirect("/noblocks");
    	} else {
			const blocksByHour = tools.parseBlocksByHour(poll_response.blocks_day);

			res.render('node-info', {
				layout: false,			
				chain_id: poll_response.status.id,
				chain_level: poll_response.status.level,
				chain_version: poll_response.status.version,

				status: poll_response.status,

				last_block: poll_response.last_block,
				last_block_time: moment.utc(poll_response.last_block.header.timestamp * 1000).format('lll'),
				last_block_time_since: moment.utc(poll_response.last_block.header.timestamp * 1000).fromNow(),
				last_block_drgn_time: poll_response.last_block.header.current_ddss,

				block_height: poll_response.last_block.header.block_id,
				blocks: poll_response.blocks_day,
				blocks_by_hour: blocksByHour,
				blocks_by_day: poll_response.blocks_week,
				blocks_last_24_hours: poll_response.blocks_day.length,

				takara_price: poll_response.takara_price
			});
		}
	}));

    app.use(function (err, req, res, next) {
        console.log(err);

        res.render('error', {
            title: "Error - Dragonchain UVN Block Explorer",
            error: err
        });
    });

	// In production (optionally) use port 80 or, if SSL available, use port 443 //
	const server = app.listen(3000, () => {
		console.log(`Express running → PORT ${server.address().port}`);
	});
}


main().then().catch(console.error)


