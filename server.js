const dct = require('./dragon-tools')
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
	app.use('/moment', express.static(__dirname + '/node_modules/moment/'));
	app.use('/underscore', express.static(__dirname + '/node_modules/underscore/'));
	app.use('/dexie', express.static(__dirname + '/node_modules/dexie/dist/'));
	app.use('/chartjs', express.static(__dirname + '/node_modules/chart.js/dist/'));

	app.get('/', awaitHandlerFactory(async (req, res) => {
		res.render('index', {title: "Dragonchain UVN Block Explorer"});
	}));

	app.get('/login', awaitHandlerFactory(async (req, res) => {
		res.render('login', {title: "Dragonchain UVN Block Explorer Login"});
	}));

	app.post('/login', awaitHandlerFactory(async (req, res) => {					
		res.send(CryptoJS.AES.encrypt(req.body.credentials_string, config.salt).toString());
	}));
	
	app.get('/noblocks', awaitHandlerFactory(async (req, res) => {
		res.render('empty-node', {title: "Dragonchain UVN Block Explorer", layout: false});
	}));	

	app.get('/get-takara-price', awaitHandlerFactory(async (req, res) => {

		try {			
			const price = await dct.getTakaraPrice();

			res.send(JSON.stringify({takara_price: price}));		
		} catch (e) {
			console.log(e);
			res.send(JSON.stringify({"error":e}));
            return;
		}
	}));

	app.post('/get-status', awaitHandlerFactory(async (req, res) => {

		try {			
			const client = await dct.createClient(req.body.credentials_secure, config.salt);	

			const status = await dct.getStatus(client);

			res.send(JSON.stringify(status));		
		} catch (e) {
			console.log(e);
			res.send(JSON.stringify({"error":e}));
            return;
		}
	}));

	app.post('/get-blocks', awaitHandlerFactory(async (req, res) => {

		try {			
			const client = await dct.createClient(req.body.credentials_secure, config.salt);	

			const blocks = await dct.getBlocks(client, req.body.start_timestamp);

			res.send(JSON.stringify(blocks));		
		} catch (e) {
			console.log(e);
			res.send(JSON.stringify({"error":e}));
            return;
		}
	}));

	app.post('/get-transaction', awaitHandlerFactory(async (req, res) => {

		try {			
			const client = await dct.createClient(req.body.credentials_secure, config.salt);	

			const transaction = await dct.getTransaction(client, req.body.txn_id);

			res.send(JSON.stringify(transaction));		
		} catch (e) {
			console.log(e);
			res.send(JSON.stringify({"error":e}));
            return;
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
	const server = app.listen(3000, '127.0.0.1', () => {
		console.log(`Express running → PORT ${server.address().port}`);
	});
}


main().then().catch(console.error)


