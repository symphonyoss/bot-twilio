var Q = require('q');
RequestModel = require('./RequestModel');
var events = require('events');

var MessagesModel = new Class({
	Extends: RequestModel,

	initialize : function(agentBase, cert, headers)
	{
		this.parent(cert, headers);

		this.agentBase = agentBase;
		this.streams = {};
		this.xreference = {};
		this.baseTime = Date.now();
	},

	start : function(cb)
	{
		return this.createFeed()
			.then(function(id)
			{
				this.feedId = id;
				this.runFeed(id);
				this.handler = cb;
			}.bind(this));
	},

	stop : function()
	{
		this.stopped = true;
	},

	createFeed : function()
	{
		return this.request(this.agentBase + '/v1/datafeed/create', 'POST')
			.then(function(response)
			{
				return response.id;
			}.bind(this));
	},

	handleMessage : function(message)
	{
		if (this.stopped) return;
		this.handler([message]);
		return;
	},

	runFeed : function(id)
	{
		return this.request(this.agentBase + '/v1/datafeed/' + id + '/read', 'GET')
			.then(function(response)
			{
				if (this.stopped) return;
				if (response)
				{
					response.each(function(message)
					{
						this.handleMessage(message);
					}, this);
				}

				return this.runFeed(id);
			}.bind(this))
			.fail(function(reason)
			{
				console.log(reason);
				return this.runFeed(id);
			}.bind(this));
	},

	startStream : function(threadId, cb)
	{
		var id = String.uniqueID();
		this.xreference[id] = threadId;
		this.streams[threadId] = this.streams[threadId] || {};
		this.streams[threadId][id] = cb;

		return id;
	},

	stopStream : function(id)
	{
		var threadId = xreference[id];

		if (!threadId) return;
		var handlers = this.streams[threadId];
		if (!handlers) return;
		delete handlers[id];
	},

	post : function(threadId, format, message)
	{
		var body = {
			format: format.toUpperCase(),
			message: message
		}

		var options = {
			json: true,
			body: body
		}

		return this.request(this.agentBase + '/v1/stream/' + threadId + '/message/create', 'POST', options)
	}
});

MessagesModel.implement(events.EventEmitter.prototype);
module.exports = MessagesModel;
