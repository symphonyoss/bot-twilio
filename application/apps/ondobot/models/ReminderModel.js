var MongoModel = require('@symphony/ondobot-models').MongoModel;

module.exports = new Class({
	Extends: MongoModel,

	initialize : function()
	{
		this.parent();
	},

	delete : function(collection, spec)
	{
		return this.getCollection('reminders')
			.then(function(collection)
			{
				return collection.deleteMany(spec);
			}.bind(this));

	},

	saveReminder : function(thread, when, text)
	{
		return this.getCollection('reminders')
			.then(function(collection) {
				var reminder = {
					thread: thread,
					when: when,
					text: text,
				}
				return collection.save(reminder)
			 }.bind(this));
	},

	getReminders : function(threadId)
	{
		var now = Date.now();
		return this.getCollection('reminders')
			.then(this.find.bind(this, {thread: threadId, when: {$lt: now}}))
			.then(function(results)
			{
				if (!results || results.length === 0) return null;
				return this.delete('reminders', {thread: threadId, when: {$lt: now}})
					.then(function()
					{
						return results;
					}.bind(this));
			}.bind(this));
	},
});
