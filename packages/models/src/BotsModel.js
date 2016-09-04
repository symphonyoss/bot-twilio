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
			.then(this.find.bind(this, {'owner': userId}))

	},

	getAllBots : function()
	{
		return this.getCollection('bots')
			.then(this.find.bind(this, {}))
	},

	getABot : function(id)
	{
		return this.getCollection('bots')
			.then(this.find.bind(this, {id: id}))
	},

	upsert(bot)
	{
		return this.getCollection('bots')
			.then(function(collection)
			{
				return collection.save(bot)
					.then(function(result)
					{
						if (result.writeError) return Q.reject(new Error(result.writeError.errmsg));
						return this.getABot(bot.id)
							.then(function(bots) {
								if (bots && bots.length) return bots[0];
								return Q.reject(new Error('error saving bot, no bot found'));
							}.bind(this))
					}.bind(this));
			}.bind(this))
	}
});

