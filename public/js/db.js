var db = {
	instance: false,

	getDB: async function() {
		if (!db.instance)
		{
			db.instance = new PouchDB('dcbe');

			var result = await db.instance.createIndex({
			  index: {
			  	name: "blockid",
			    fields: ['block.header.block_id', 'block.header.dc_id']
			  }
			})

			var result = await db.instance.createIndex({
			  index: {
			  	name: "timestamp",
			    fields: ['block.header.timestamp', 'block.header.dc_id', ]
			  }
			})
		}

		return db.instance;		
	},

	addBlocks: async function(blocks) {
		var docs = [];

		for (var i = 0; i < blocks.length; i++)
		{
			id = blocks[i].header.block_id;
			blocks[i].header.block_id = Number(blocks[i].header.block_id);
			blocks[i].header.timestamp = Number(blocks[i].header.timestamp);
			docs.push({_id: id, block: blocks[i]});
		}

		var instance = await db.getDB();

		instance.bulkDocs(docs);
	},

	findLastBlock: async function () {
		//return db.getDB().allDocs({descending: true, limit: 1})
		var instance = await db.getDB();

		return instance.find(
		{
			selector: {
				"block.header.block_id": {"$gte": null},
				"block.header.dc_id": {"$eq": node.public_id}				
			}, 
			sort: 
			[				
				{"block.header.block_id": "desc"},
				{"block.header.dc_id": "desc"}
			], 			
			limit: 1
		});
	},

	findBlocksByTimestamp: async function (criteria) {
		var instance = await db.getDB();
		return instance.find(
			{
				selector: 
				{
					"block.header.timestamp": criteria,
					"block.header.dc_id": {"$eq": node.public_id}					
				}, 
				sort: 
				[					
					{"block.header.timestamp": "asc"},
					{"block.header.dc_id": "desc"}
				] 
			});

	},

	findBlocksByBlockId: async function (criteria) {
		var instance = await db.getDB();

		return instance.find(
			{
				selector: 
				{
					"block.header.block_id": criteria,
					"block.header.dc_id": {"$eq": node.public_id}					
				}, 
				sort: 
				[					
					{"block.header.block_id": "asc"},
					{"block.header.dc_id": "desc"}
				] 
			});

	},

	destroy: async function () {
		var instance = await db.getDB();

		instance.destroy()
	}

}