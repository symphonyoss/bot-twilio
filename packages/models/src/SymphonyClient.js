var fs = require('fs');
var events = require('events');
var Q = require('q');
var AuthModel = require('./AuthModel');
var ServiceModel = require('./ServiceModel');
var MessagesModel = require('./MessagesModel');
var WebControllerModel = require('./WebControllerModel');

//var config = require('../config/config.js');

var server = 'nexus.symphony.com';
//nexus-dev-ause1-all
var keyUrl = 'https://' + server + ':8444/keyauth';
var sessionUrl = 'https://' + server + ':8444/sessionauth';
var agentUrl = 'https://' + server + ':8444/agent';
var podUrl = 'https://' + server + ':443/pod';
var webControllerUrl = 'https://' + server + '/webcontroller';

/*
var keyUrl = 'https://qa5-qa-ause1-aha1.symphony.com:8444/keyauth';
var sessionUrl = 'https://qa5-qa-ause1-aha1.symphony.com:8444/sessionauth';
var agentUrl = 'https://qa5-qa-ause1-aha1.symphony.com:8444/agent';
var podUrl = 'https://qa5-qa-ause1-aha1.symphony.com:8444/pod';
var webControllerUrl = 'https://qa5.symphony.com:8444/webcontroller';
*/

var streamId = Base64EncodeUrl('IjtirCYPlNfLbKpYfFtR0X///qvpyqkSdA==');
/*
var agentOptions = {
		cert: fs.readFileSync(__dirname + '/certs/bot.user2-cert.pem'),
		key: fs.readFileSync(__dirname + '/certs/bot.user2-key.pem'),
		passphrase: 'changeit',
		requestCert: false,
		ca: [fs.readFileSync(__dirname + '/certs/cc1.pem'), fs.readFileSync(__dirname + '/certs/cc2.pem')]
}
*/

function Base64EncodeUrl(str){
	return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}

var SymphonyClient = new Class({
	initialize : function(agentOptions)
	{
		this.streams = {};
		this.users = {};
		this.agentOptions = agentOptions;
		this.authModel = new AuthModel(sessionUrl, keyUrl, this.agentOptions);
	},

	start : function()
	{
		return this.authModel.auth()
			.then(function(result)
			{
				this.serviceModel = new ServiceModel(podUrl, this.agentOptions, result);
				this.messagesModel = new MessagesModel(agentUrl, this.agentOptions, result);
				this.webControllerModel = new WebControllerModel(webControllerUrl, {}, result);
				return this.serviceModel.start()
					.then(this.webControllerModel.getAccount.bind(this.webControllerModel))
					.then(this.messagesModel.start.bind(this.messagesModel))
					.then(function()
					{
						this.account = this.webControllerModel.account;
						this.botId = this.serviceModel.getBotId();
					}.bind(this));
			}.bind(this));
	},

	startListening : function(streamId)
	{
		this.streams[streamId] = this.messagesModel.startStream(streamId, this.onMessages.bind(this, streamId));
	},

	getName : function()
	{
		console.log('full name', this.webControllerModel.account.prettyName);
		console.log('parts', this.webControllerModel.account.prettyName.split(' '));
		console.log('short', this.webControllerModel.account.prettyName.split(' ')[0]);
		return this.webControllerModel.account.prettyName.split(' ')[0];
	},

	emote : function(response, streamId)
	{
		this.messagesModel.post(streamId, 'text', response)
	},

	post : function(response, streamId)
	{
		console.log('posting', response, streamId);
		this.messagesModel.post(streamId, 'text', response)
	},

	privateMessage : function(who, response, streamId)
	{
	},

	normalizeId : function(id)
	{
		return '' + id;
	},

	getWho : function(id, cb)
	{
//		console.log('getWho', id);
		if (this.users[id]) return cb(this.users[id].username);
		this.webControllerModel.getUser(id)
			.then(function(response)
			{
				response.each(function(user)
				{
					var person = user.person;
					if (person)
					{
						this.users[person.id] = person;
					}
				}, this);
				cb(this.users[id].username);
			}.bind(this)).done();
	},

// [{"id":"SuLgNhCKU0-FsRs8vqKUZX___qwY2BIVdA","timestamp":"1459872067053","messageType":"message","streamId":"seLsDGj8LfwrRM6rbOy6On___qw7ny4OdA","message":"<messageML>message</messageML>","fromUserId":7627861917906}]
	onMessages : function(messages)
	{
		if (!messages) return;
		messages.each(function(message)
		{
			var plainText = message.message.replace(/<(?:.|\n)*?>/gm, '');
			if (message.fromUserId == this.botId) return;
			this.getWho(message.fromUserId, function(name)
			{
				this.emit('post', name, message.message, plainText, message.streamId);
			}.bind(this));
		}, this);
	}
});

SymphonyClient.implement(events.EventEmitter.prototype);
module.exports = SymphonyClient;
