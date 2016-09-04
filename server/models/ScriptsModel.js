var DB = require('./db');
var Q = require('q');
var MongoModel = require('./MongoModel');

module.exports = new Class({
	Extends : MongoModel,

	initialize : function()
	{
		this.parent();
		this.scripts = {};
	},

	updateWithScripts : function(bot)
	{
		var find = [];
		bot.scriptLinks.each(function(id)
		{
			if (!this.scripts[id]) find.push(id);
		}, this);

		return this.getScripts(find)
			.then(function(scripts)
			{
				scripts.each(function(script)
				{
					this.scripts[script.id] = script;
				}, this);

				bot.scripts = [];
				bot.scriptsLinks.each(function(id)
				{
					if (this.scripts[id]) bot.scripts.push(this.scripts[id]);
				}, this);
			}.bind(this));
	},

	getScripts : function(ids)
	{
		if (ids.length === 0) return Q([]);
		return this.getCollection('scripts')
			.then(this.find.bind(this, {id: {$in: ids}}))
	},

	upsertScript(userId, bot)
	{
	}
});
