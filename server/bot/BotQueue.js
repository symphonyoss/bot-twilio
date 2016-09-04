var List = require('./List');

module.exports = new Class({
	initialize : function(bot, client)
	{
		this.client = client;
		this.bot = bot;

		this.queue = new List();
		this.queue.setSorted(false);
		this.queue.setTrim(false);

		this.lastPostTimes = {};

		this.lastResponseTime = 0;

		this.ihdl = setInterval(this.execute.bind(this), 1000);
	},

	calculatePostDelay : function(post)
	{
		var seconds;

		seconds = ((post.length / 6) * 60) / this.typingSpeed || 60;
		seconds = Math.max(seconds, 5);
		return Math.min(seconds * 1000, 15000);
	},

	addToLastPostTime : function(user, time)
	{
		var now = Date.now();

		this.lastPostTimes[user] = this.lastPostTimes[user] || now;
		this.lastPostTimes[user] += time;
		if (this.lastPostTimes[user] < now) this.lastPostTimes[user] = now;

		return this.lastPostTimes[user];
	},

	calculateQueueTime : function(user, post)
	{
		var result = this.addToLastPostTime(user, this.calculatePostDelay(post));
		return result;
	},

	performTimer : function(item)
	{
		if (!this.bot.running) return;
		this.bot.onTimer(item.text, item.reference);
		this.addTimer(item.text, parseInt(item.user, 10) || 10, item.reference);
	},

	performStateTimeout : function(item)
	{
		if (!this.bot.running) return;
		this.bot.onStateTimeout(item.user, item.text, item.source);
	},

	perform : function(item)
	{
		if (!this.bot.running) return;
		switch (item.type)
		{
			case 'POST':
				if (item.text !== '') this.client.post(item.text, item.reference);
				break;
			case 'EMOTE':
				if (item.text !== '') this.client.emote(item.text, item.reference);
				break;
			case 'PM':
				if (item.text !== '') this.client.privateMessage(item.text, item.user, item.reference);
				break;
			case 'COMMAND':
				this.bot.executeCommand(item.text, item.reference);
				break;
			case 'TIMER':
				this.performTimer(item, item.reference);
				break;
			case 'IMPLICIT_STATE':
				this.bot.setUserState(item.user, item.text, 1, item.reference);
				break;
			case 'STATE_TIMEOUT':
				this.performStateTimeout(item, item.reference);
				break;
		}
	},

	checkQueue : function()
	{
		var idx;
		var item;
		var now = Date.now();

		for (idx = this.queue.count() - 1; idx >= 0; idx--)
		{
			item = this.queue.data(idx);
			if (item.timeToDequeue <= now)
			{
				this.perform(item);
				this.queue.deleteIndex(idx);
			}
		}
	},

	clearTimer : function(timer, reference)
	{
		var item;

		item = this.queue.find('\u0007' + timer + ':' + reference);
		if (item)
		{
			item.type = 'DELETE_ME';
			item.timeToDequeue = Date.now();
		}
	},

	clearStateTimeout : function(user, state, reference)
	{
		var item;

		item = this.queue.find('\u0009' + user + '.' + state + '.' + reference);
		if (item)
		{
			item.type = 'DELETE_ME';
			item.timeToDequeue = Date.now();
		}
	},

	execute : function()
	{
		this.checkQueue();
	},

	clear : function()
	{
		this.queue.clear();
		this.lastPostTimes = {};
		this.lastResponseTime = Date.now();
	},

	setReadDelayTime : function(time)
	{
		this.readDelayTime = time;
	},

	setTypingSpeed : function(wordsPerMinute)
	{
		this.typingSpeed = wordsPerMinute;
	},

	setSelfSpamTime : function(time)
	{
		this.selfSpamTime = time;
	},

	setOtherSpamTime: function(time)
	{
		this.otherSpamTime = time;
	},

	setNestTimeoutTime : function(time)
	{
		this.nestTimeoutTime = time;
	},

	clearResponded : function()
	{
		this.lastResponseTime = 0;
	},

	responded : function()
	{
		this.lastResponseTime = Date.now();
	},

	canRespond : function()
	{
		return true;
		return Date.now() - this.lastResponseTime >= this.readDelayTime;
	},

	addPost : function(post, reference)
	{
		this.queue.add(post, {text: post, user: '', type: 'POST', reference: reference, timeToDequeue: this.calculateQueueTime('CHATROOM', post), source: 'CHAT_SRC'});
	},

	addEmote : function(post, reference)
	{
		this.queue.add(post, {text: post, user: '', type: 'EMOTE', reference: reference, timeToDequeue: this.calculateQueueTime('CHATROOM', post), source: 'CHAT_SRC'});
	},

	addPM(post, user, reference)
	{
		this.queue.add(post, {text: post, user: user, type: 'PM', reference: reference, timeToDequeue: this.calculateQueueTime(user, post), source: 'CHAT_SRC'});
	},

	addCommand : function(command, reference)
	{
		// Add to the queue
		this.queue.add(command, {text: command, user: '', type: 'COMMAND', reference: reference, timeToDequeue: this.calculateQueueTime('CHATROOM', command), source: 'CHAT_SRC'});
	},

	addTimer : function(name, intervalSec, reference)
	{
		this.clearTimer(name, reference);
		this.queue.add('\u0007' + name + ':' + reference, {text: name, user: intervalSec.toString(), type: 'TIMER', reference: reference, timeToDequeue: Date.now() + intervalSec * 1000, source: 'CHAT_SRC'});
	},

	addImplicitState : function(user, state, src, reference)
	{
	// When to queue this depends on if it is chat or PM
		if (source === 'CHAT_SRC') user = 'CHATROOM';

		this.queue.add('\u0008' + user + '.' + state, {text: state, user: user, type: 'IMPLICIT_STATE', reference: reference, timeToDequeue: this.calculateQueueTime(user, ''), source: src});
	},

	addStateTimeout : function(user, state, source, reference)
	{
		this.queue.add('\u0009' + user + '.' + state, {text: state, user: user, type: 'STATE_TIMEOUT', reference: reference, timeToDequeue: Date.now() + this.nestTimeoutTime, source: src});
	},

	trackUserPost : function(post, user, reference)
	{
		this.queue.add('\u0001' + user + ': ' + post, {text: post, user: user, type: 'SPAM_TRACK', reference: reference, timeToDequeue: Date.now() + this.otherSpamTime, source: 'CHAT_SRC'});
	},

	trackUserEmote : function(post, user, reference)
	{
		this.queue.add('\u0002' + user + ': ' + post, {text: post, user: user, type: 'SPAM_TRACK', reference: reference, timeToDequeue: Date.now() + this.otherSpamTime, source: 'CHAT_SRC'});
	},

	trackUserPM : function(post, user, reference)
	{
		this.queue.add('\u0003' + user + ' whispers ' + post, {text: post, user: user, type: 'SPAM_TRACK', reference: reference, timeToDequeue: Date.now() + this.otherSpamTime, source: 'PM_SRC'});
	},

	trackBotPost : function(post, reference)
	{
		this.queue.add('\u0004' + post, {text: post, user: '', type: 'SPAM_TRACK', reference: reference, timeToDequeue: Date.now() + this.selfSpamTime, source: 'CHAT_SRC'});
	},

	trackBotEmote : function(post, reference)
	{
		this.queue.add('\u0005' + post, {text: post, user: '', type: 'SPAM_TRACK', reference: reference, timeToDequeue: Date.now() + this.selfSpamTime, source: 'CHAT_SRC'});
	},

	trackBotPM : function(post, user, reference)
	{
		this.queue.add('\u0006' + user + ' whispers ' + post, {text: post, user: '', type: 'SPAM_TRACK', reference: reference, timeToDequeue: Date.now() + this.selfSpamTime, source: 'CHAT_SRC'});
	},

	botPostExists : function(post)
	{
		return false;
		return this.queue.exist('\u0004' + post);
	},

	botEmoteExists : function(post)
	{
		return false;
		return this.queue.exist('\u0005' + post);
	},

	botPMExists : function(post, user)
	{
		return false;
		return this.queue.exist('\u0006' + user + ' whispers ' + post);
	},

	userPostExists(post, user)
	{
		return false;
		return this.queue.exist('\u0001' + user + ': ' + post);
	},

	userEmoteExists(post, user)
	{
		return false;
		return this.queue.exist('\u0002' + user + ': ' + post);
	},

	userPMExists(post, user)
	{
		return false;
		return this.queue.exist('\u0003' + user + ' whispers ' + post);
	},

	pause : function(which, seconds, reference)
	{
		this.addToLastPostTime(which, seconds * 1000);
	},
});
