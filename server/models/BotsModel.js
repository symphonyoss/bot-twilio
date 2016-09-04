var DB = require('./db');
var MongoModel = require('./MongoModel');

module.exports = new Class({
	Extends : MongoModel,

	initialize : function()
	{
		this.parent();
	},

	getUserBots : function(userId)
	{
		return this.getCollection('bots')
			.then(this.find.bind(this, {'userId': userId}))

	},

	getAllBots : function()
	{
		return this.getCollection('bots')
			.then(this.find.bind(this, {}))
	},

	upsert(bot)
	{
		return this.getCollection('bots')
			.then(function(collection)
			{
				return collection.save(bot);
			}.bind(this))
	}
});
