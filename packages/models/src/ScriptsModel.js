var DB = require('./db');
var Q = require('q');
var MongoModel = require('./MongoModel');
var userId = 'glenn';

module.exports = new Class({
	Extends : MongoModel,

	initialize : function()
	{
		this.parent();
		this.scripts = {};
	},

	reset : function()
	{
		this.scripts = {};
	},

	updateWithScripts : function(bot)
	{
		var find = [];
		bot.scriptLinks.each(function(id)
		{
			if (!this.scripts[id]) find.push(id);
		}, this);

		return this.getByIds(find)
			.then(function(scripts)
			{
				//console.log('scripts', scripts);
				scripts.each(function(script)
				{
					this.scripts[script.id] = script;
				}, this);

				bot.scripts = [];
//				console.log('bot.scriptLinks', bot.scriptLinks);
//				console.log(this.scripts);
				bot.scriptLinks.each(function(id)
				{
					if (this.scripts[id]) bot.scripts.push(this.scripts[id]);
				}, this);
			}.bind(this));
	},

	getByIds : function(ids)
	{
		if (ids.length === 0) return Q([]);
		return this.getCollection('scripts')
			.then(this.find.bind(this, {id: {$in: ids}}))
	},

	getByUser : function(userId)
	{
		return this.getCollection('scripts')
			.then(this.find.bind(this, {owner: userId}))
	},

	getByName : function(name)
	{
		return this.getCollection('scripts')
			.then(this.find.bind(this, {name: name}))
	},

	getPublic : function()
	{
		return this.getCollection('scripts')
			.then(this.find.bind(this, {public: true}))
	},

	getAScript : function(id)
	{
		return this.getCollection('scripts')
			.then(this.find.bind(this, {id: id}))
	},

	upsert : function(script)
	{
		return this.getCollection('scripts')
			.then(function(collection)
			{
				return collection.save(script)
					.then(function(result)
					{
						if (result.writeError) return Q.reject(new Error(result.writeError.errmsg));
						return this.getAScript(script.id)
							.then(function(scripts)
							{
								if (scripts && scripts.length) return scripts[0];
								return Q.reject(new Error('error saving script, no script found'));
							}.bind(this))
					}.bind(this));
			}.bind(this))
	},

	makePublic : function(scriptId)
	{
	},
});
