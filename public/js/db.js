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

	findLastBlock: async function (public_id) {		
		var instance = await db.getDB();

		return instance.blocks.orderBy('timestamp').filter(function (record) {return record.public_id == public_id}).last();
	},

	findBlocksByTimestampAboveOrEqual: async function (public_id, criteria) {
		var instance = await db.getDB();
		return instance.blocks.where("timestamp").aboveOrEqual(criteria).filter(function (record) {return record.public_id == public_id}).sortBy("timestamp");

	},

	getBlockById: async function (public_id, id) {		
		var instance = await db.getDB();
		return instance.blocks.where("block_id").equals(Number(id)).filter(function (record) {return record.public_id == public_id}).first();
	},

	getBlocks: async function (public_id, limit) {
		if (limit === undefined || limit === null) limit = 50;

		var instance = await db.getDB();
		return instance.blocks.orderBy("timestamp").reverse().filter(function (record) {return record.public_id == public_id}).limit(limit).toArray();
	},

	destroy: async function () {
		var instance = await db.getDB();

		return instance.delete()
	}

}