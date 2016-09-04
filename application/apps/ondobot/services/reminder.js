var Q = require("q");
var Service = require('sapphire-express').Service;
var ReminderModel = require('../models/ReminderModel');
var chrono = require('chrono-node');

String.prototype.splice = function(idx, rem, s) {
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
}

var ReminderService = new Class({
	Implements : [Service],

	initialize : function()
	{
		this.export('add', module);
		this.export('get', module);

		this.addCSRFException('add');
		this.addCSRFException('get');
	},

	verify : function(req, res)
	{
		return true;
	},

	add : function(req, res)
	{
		var session = req.session.get();
		var thread = req.query.thread;
		var mention = req.query.mention;
		var text = req.query.text;

		text = decodeURIComponent(text);
		mention = decodeURIComponent(mention);
		thread = decodeURIComponent(thread);
		console.log('text', text);

		console.log(text);

		var reminderModel = new ReminderModel();
		var parsed = chrono.parse(text);
		if (!parsed || parsed.length === 0)
		{
			result = '<messageML>' + mention + 'no date found</messageML>';
			res.writeHead(200, {'Content-Type': 'application/messageml'});
			res.end(result);
			return Q(null);
		}
		parsed = parsed[0];

		var responseText = text;
		var startDateStr = parsed.start.date().format('%x at %X');
		responseText = responseText.splice(parsed.index, parsed.text.length, startDateStr);
		responseText = mention + ' reminder: "' + responseText + '"';

		return reminderModel.saveReminder(thread, parsed.start.date().getTime(), responseText)
			.then(function()
			{
				var result = '<messageML>' + mention + ', reminder set for ' + startDateStr + '</messageML>';
				res.writeHead(200, {'Content-Type': 'application/messageml'});
				res.end(result);
				return Q(null);
			}.bind(this));
	},

	get : function(req, res)
	{
		var thread = req.query.thread;
		thread = decodeURIComponent(thread);

		var reminderModel = new ReminderModel();
		return reminderModel.getReminders(thread)
			.then(function(reminders)
			{
				if (!reminders)
				{
					var result = '';
					res.writeHead(200, {'Content-Type': 'text/text'});
					res.end(result);
					return Q(null);
				}

				var result = '<messageML>';

				reminders.each(function(reminder, idx)
				{
					if (idx > 0) result += '<br/>';
					result += reminder.text;
				}, this);

				result += '</messageML>';
				res.writeHead(200, {'Content-Type': 'application/messageml'});
				res.end(result);
				return Q(null);
			}.bind(this));
	},
});
new ReminderService();
