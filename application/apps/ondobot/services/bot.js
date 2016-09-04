var Q = require('q');
var Service = require('sapphire-express').Service;
var BotsModel = require('@symphony/ondobot-models').BotsModel;
var WebControllerModel = require('@symphony/ondobot-models').WebControllerModel;
var AuthModel = require('@symphony/ondobot-models').AuthModel;
var uuid = require('node-uuid');
var redis = require('redis');

var urlConfig = CONFIG.ondobot.urlConfig;

BotService = new Class({
	Implements : [Service],

	initialize : function()
	{
		this.export('getBots', module);
		this.export('createBot', module);
		this.export('saveBot', module);
		this.pub = redis.createClient();
	},

	verify : function(req, res)
	{
		return true;
	},


	extractCerts : function(certs)
	{
		var certArray = [];
		var lines;
		var line;
		var current = '';
		var inCert;

		certs = certs.replace(/\r/g, '');
		lines = certs.split('\n');
		inCert = false;
		for (idx = 0; idx < lines.length; idx++)
		{
			line = lines[idx];
			if (!inCert && line.indexOf('-----BEGIN') === 0)
			{
				current += line + '\n'
				inCert = true;
			}
			else if (inCert && line.indexOf('-----END') === 0)
			{
				inCert = false;
				current += line + '\r\n'
				certArray.unshift(current);
				current = '';
			}
			else if (inCert) current += line + '\n';
		}

		return certArray;
	},

	getBots : function(req, res)
	{
		var session = req.session.get();
		var id = req.body.userId;
		var botsModel = new BotsModel();

		return botsModel.getUserBots(id)
			.then(function(response)
			{
				return Q({success: true, result: response});
			}.bind(this))
	},

	createBot : function(req, res)
	{
		var authModel;
		var botModel;
		var session = req.session.get();
		var cert = JSON.parse(req.body.cert);
		var key = JSON.parse(req.body.key);
		var passphrase = req.body.passphrase;
		var id = req.body.userId;
		var chain = this.extractCerts(cert);
		var cert = chain.pop();
		var config = urlConfig;

		if (!chain.length) {
			return Q({success: false, result: 'invalid certificates'});
		}

		var agentOptions = {
			cert: cert,
			key: key,
			passphrase: passphrase,
			requestCert: false,
			ca: chain,
		}

		authModel = new AuthModel(config.sessionUrl, config.keyUrl, agentOptions);
		botsModel = new BotsModel();

		return authModel.auth()
			.then(function(response)
			{
				var webControllerModel = new WebControllerModel(config.webControllerUrl, {}, response);
				return webControllerModel.getAccount()
					.then(function(account)
					{
						var botId = uuid.v4();
						var bot = {
							_id: botId,
							id: botId,
							userName: account.prettyName,
							userId: account.userName,
							auth: agentOptions,
							owner: id,
							options: {
								readDelaySeconds: 5,
								typingSpeed: 60,
								selfSpamSeconds: 10,
								otherSpamSeconds: 10,
								singlePost : false,
							},
							scriptLinks: [],
						}
						return botsModel.upsert(bot)
							.then(function(bot) {
								this.pub.publish('bot-control', bot.id);
								return Q({success: true, result: bot});
							}.bind(this))
					}.bind(this));
			}.bind(this))
			.fail(function()
			{
				return Q({success: false, result: 'Authorization failed'});
			}.bind(this))
	},

	saveBot : function(req, res)
	{
		var bot = JSON.parse(req.body.bot);
		var botsModel = new BotsModel();

		return botsModel.upsert(bot)
			.then(function(bot)
			{
				console.log('sending reset', bot.id);
				this.pub.publish('bot-control', bot.id);
				return Q({success: true, result: bot});
			}.bind(this));
	}
});

new BotService();
