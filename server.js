const tools = require('./dragon-tools')
const moment = require('moment')
const util = require('util');
const dcsdk = require('dragonchain-sdk')
const _ = require('underscore');
const express = require('express');
const exphbs = require('express-handlebars');
const config = require('./config.json');
const CryptoJS = require('crypto-js');

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
	app.use('/public',  express.static(__dirname + '/public'));	
	app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));

	app.get('/', awaitHandlerFactory(async (req, res) => {
		res.render('index', {title: "Dragonchain UVN Block Explorer"});
	}));

	app.get('/login', awaitHandlerFactory(async (req, res) => {
		res.render('login', {title: "Dragonchain UVN Block Explorer Login", layout:false});
	}));

	app.post('/login', awaitHandlerFactory(async (req, res) => {					
		res.send(CryptoJS.AES.encrypt(req.body.credentials_string, config.salt).toString());
	}));
	
	app.get('/noblocks', awaitHandlerFactory(async (req, res) => {
		res.render('empty-node', {title: "Dragonchain UVN Block Explorer", layout: false});
	}));	

	app.post('/get-node-info', awaitHandlerFactory(async (req, res) => {

		let credentials = null;

		try {
			const credentials_string = CryptoJS.AES.decrypt(req.body.credentials_secure, config.salt).toString(CryptoJS.enc.Utf8);

			credentials = JSON.parse(credentials_string);
		} catch (e)
		{
			res.redirect("/login");
			return;
		}

		const client = await dcsdk.createClient({authKeyId: credentials.access_id, authKey: credentials.access_key, dragonchainId: credentials.public_id, endpoint: credentials.endpoint_url});
		
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


