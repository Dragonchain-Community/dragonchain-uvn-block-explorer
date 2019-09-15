var db = {
	instance: false,

	getDB: async function() {
		if (!db.instance)
		{
			db.instance = new Dexie("dcbe");

			db.instance.version(1).stores({
				blocks: "++id, public_id, block_id, timestamp"
			})
		}

		return db.instance;		
	},

	addBlocks: async function(blocks) {
		var docs = [];

		for (var i = 0; i < blocks.length; i++)
		{
			docs.push({
				public_id: node.public_id, block_id: Number(blocks[i].header.block_id), timestamp: Number(blocks[i].header.timestamp), block: blocks[i]
			});
		}

		var instance = await db.getDB();

		return instance.blocks.bulkAdd(docs);
	},

	findLastBlock: async function () {		
		var instance = await db.getDB();

		return instance.blocks.orderBy('block_id').last();
	},

	findBlocksByTimestampAboveOrEqual: async function (criteria) {
		var instance = await db.getDB();
		return instance.blocks.where("timestamp").aboveOrEqual(criteria).sortBy("timestamp");

	},

	destroy: async function () {
		var instance = await db.getDB();

		return instance.delete()
	}

}