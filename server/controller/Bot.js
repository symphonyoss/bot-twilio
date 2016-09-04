var BotsModel = require('@symphony/ondobot-models').BotsModel;
var ScriptsModel = require('@symphony/ondobot-models').ScriptsModel;
var SymphonyClient = require('@symphony/ondobot-models').SymphonyClient;
var Q = require('q');
var Bot = require('../bot/Bot');
var SymphonyClient = require('../clients/SymphonyClient');
var config = require('../config');
var redis = require('redis');

module.exports = new Class({
	initialize : function()
	{
		this.bots = {};
		this.botsModel = new BotsModel();
		this.scriptsModel = new ScriptsModel();
		this.sub = redis.createClient();
		this.sub.subscribe('bot-control');
		this.sub.on('subscribe', function() {
			this.sub.on('message', this.onHandleMessage.bind(this));
		}.bind(this));
	},

	createBot : function(bot, tries)
	{
		tries = tries || 0;
		if (tries > 5) return Q(false);

		console.log('in createBot');

		var client = new SymphonyClient(config.urlConfig, bot.auth);
		var botAgent = new Bot(client);

		botAgent.setBotName(bot.name);
		botAgent.setReadDelaySeconds(bot.options.readDelaySeconds);
		botAgent.setTypingSpeed(bot.options.typingSpeed);
		botAgent.setSelfSpamSeconds(bot.options.selfSpamSeconds);
		botAgent.setOtherSpamSeconds(bot.options.otherSpamSeconds);
		botAgent.setNestTimeoutSeconds(60);
		botAgent.setPMsUseText(true);
		botAgent.setDefaultPmDst('CHAT_DST');
		botAgent.setSinglePost(false);

	// add scripts
		bot.scripts.each(function(script)
		{
			botAgent.addResponses(script.content);
		}, this);

		botAgent.load();
		botAgent.run(true);
		this.bots[bot.id] = botAgent;

		return client.start()
			.then(function()
			{
			}.bind(this))
	},

	getBotScripts : function(bots)
	{
		var promises = [];

		bots.each(function(bot)
		{
			promises.push(this.scriptsModel.updateWithScripts(bot))
		}, this);

		return Q.allSettled(promises)
			.then(function()
			{
				return Q(bots);
			}.bind(this));
	},

	start : function()
	{
		return this.botsModel.getAllBots()
			.then(this.getBotScripts.bind(this))
			.then(function(bots) {
				var promises = [];

				bots.each(function(bot)
				{
					promises.push(this.createBot(bot));
				}, this);

				return Q.allSettled(promises);
			}.bind(this));
	},

	onHandleMessage : function(channel, message)
	{
		console.log('restarting bot', message);
		if (channel === 'bot-control')
		{
			var botId = message;
			if (this.bots[botId])
			{
				this.bots[botId].run(false);
				delete this.bots[botId];
			}
			this.scriptsModel.reset();
			this.botsModel.getABot(botId)
				.then(this.getBotScripts.bind(this))
				.then(function(bots)
				{
					if (!bots || !bots.length) return
					var bot = bots[0];
					this.createBot(bot);
				}.bind(this));
		}
	}
});
