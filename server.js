const dcsdk = require('dragonchain-sdk')
const express = require ('express');
const app = express();


const main = async() => {

	const client = await dcsdk.createClient();
	const status = await client.getStatus();
	const blocks = await client.queryBlocks();

	app.set('view engine', 'pug');

	app.get('/', (req, res) => {
		res.render('index', {
			title: "Dragonchain UVN Block Explorer",
			status: status,
			blocks: blocks
		});
	});
	

	// If SSL available, use port 443 //
	const server = app.listen(80, () => {
		console.log(`Express running → PORT ${server.address().port}`);
	});

}

main().then().catch(console.error)


