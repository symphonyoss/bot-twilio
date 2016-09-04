var fs = require('fs');
var events = require('events');
var Q = require('q');
var AuthModel = require('@symphony/ondobot-models').AuthModel;
var ServiceModel = require('@symphony/ondobot-models').ServiceModel;
var MessagesModel = require('@symphony/ondobot-models').MessagesModel;
var WebControllerModel = require('@symphony/ondobot-models').WebControllerModel;

function Base64EncodeUrl(str){
	return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}

var SymphonyClient = new Class({
	initialize : function(config, agentOptions)
	{
		this.config = config;
		this.agentOptions = agentOptions;
//		console.log('initialize', agentOptions);
		this.streams = {};
		this.users = {};
		this.authModel = new AuthModel(config.sessionUrl, config.keyUrl, agentOptions);
	},

	sayOneHello : function(conversation)
	{
		var roomName = '';
		if (conversation.type === 'room') {
			roomName = conversation.roomView.name;
		} else if (conversation.type === 'im') {
			roomName = conversation.instantChatView.userPrettyNames.join(', ');
		}
		data = {
			name : this.getName(),
			fullName : this.account.prettyName || this.account.username,
			mention: '<mention email="' + this.account.emailAddress + '"/>',
			id: this.account.userName,
			reference: Base64EncodeUrl(conversation.threadId),
		};
		this.emit('join', data, roomName);
	},

	sayHello : function(conversation)
	{
		this.conversations.each(function(conversation) {
			this.sayOneHello(conversation);
		}, this);
	},

	start : function()
	{
		return this.authModel.auth()
			.then(function(result)
			{
				console.log('started');
				this.serviceModel = new ServiceModel(this.config.podUrl, this.agentOptions, result);
				this.messagesModel = new MessagesModel(this.config.agentUrl, this.agentOptions, result);
				this.webControllerModel = new WebControllerModel(this.config.webControllerUrl, {}, result);
				return this.serviceModel.start()
					.then(this.webControllerModel.getAccount.bind(this.webControllerModel))
					.then(this.webControllerModel.getConversations.bind(this.webControllerModel))
					.then(this.messagesModel.start.bind(this.messagesModel, this.onMessages.bind(this)))
					.then(function()
					{
						this.account = this.webControllerModel.account;
						this.conversations = this.webControllerModel.conversations;
						this.botId = this.serviceModel.getBotId();

						this.sayHello();
					}.bind(this));
			}.bind(this));
	},

	stop : function()
	{
		this.messagesModel.stop();
	},

	getName : function()
	{
		return this.webControllerModel.account.prettyName.split(' ')[0];
	},

	emote : function(response, streamId)
	{
		this.post(response, streamId);
	},

	post : function(response, streamId)
	{
		if (!response) return;
		if (response.toLowerCase().indexOf('<messageml>') === -1)
			response = '<messageML>' + response +'</messageML>'
		if (response.length > 10000) response = '<messageML><b>response is too big to post</b></messageML>';
		var type = (response.toLowerCase().indexOf('<messageml>') === 0)?'messageml':'text';
		console.log('posting', response);
		this.messagesModel.post(streamId, type, response)
	},

	privateMessage : function(who, response, streamId)
	{
	},

	normalizeId : function(id)
	{
		return '' + id;
	},

	getUser : function(id) {
		if (this.users[id]) return Q(this.users[id]);
		return this.webControllerModel.getUser(id)
			.then(function(response)
			{
				response.each(function(user)
				{
					var person = user.person;
					if (person)
					{
						this.users[person.id] = person;
						return person
					}
				}, this);
				return this.users[id];
			}.bind(this))
	},

	getWho : function(id, cb)
	{
		this.getUser(id)
			.then(function(user)
			{
//				  console.log(user);
				if (!user) cb(null);
				else cb(user);
			}.bind(this)).done();
	},

	getUsers : function(ids)
	{
		var promises = [];
		ids.each(function(id) {
			promises.push(this.getUser(id));
		}, this);

		return Q.allSettled(promises)
	},

	fixMentions : function(text) {
		var regex = /<mention.*?uid="(.*?)"/g;
		var ids = []

		var match = regex.exec(text);
		while(match && match[0] != '')
		{
			ids.push(match[1]);
			match = regex.exec(text);
		}

		return this.getUsers(ids)
			.then(function()
			{
				var xlat = {};
				ids.each(function(id)
				{
					xlat[id] = this.users[id] && this.users[id].emailAddress;
				}, this);

				Object.each(xlat, function(value, key) {
					text = text.replace(new RegExp('uid="' + key +'"', 'g'), 'email="' + value + '"');
				}, this);

				return text;
			}.bind(this));
	},

	removeTags : function(text, type) {
		var reStart = new RegExp('<' + type + '>', 'gi');
		var reStop = new RegExp('</' + type + '>', 'gi');
		var reSolo = new RegExp('<' + type + '.*/>', 'gi');
		text = text.replace(reStart, '');
		text = text.replace(reStop, '');
		text = text.replace(reSolo, '');

		return text;
	},

	onMessages : function(messages)
	{
		if (!messages) return;
		messages.each(function(message)
		{
			if (message.fromUserId == this.botId) return;

			var streamId = message.streamId
			var text = message.message;

			text = this.removeTags(text, 'messageML');
			text = this.removeTags(text, 'b');
			text = this.removeTags(text, 'strong');
			text = this.removeTags(text, 'i');
			text = this.removeTags(text, 'em');
			text = this.removeTags(text, 'br');


			this.fixMentions(text)
				.then(function(text)
				{
					console.log(message.message, '=>', text);
					this.getWho(message.fromUserId, function(user)
					{
						data = {
							name : user.firstName || user.prettyName || user.username,
							fullName : user.prettyName || user.username,
							mention: '<mention email="' + user.emailAddress + '"/>',
							id: user.id,
							reference: streamId,
						};
						this.emit('post', data, message.message, text);
					}.bind(this));
				}.bind(this));
		}, this);
	}
});

SymphonyClient.implement(events.EventEmitter.prototype);
module.exports = SymphonyClient;
