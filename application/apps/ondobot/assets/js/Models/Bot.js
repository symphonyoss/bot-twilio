Package('Ondobot.Models', {
	Bot : new Class({
		Extends : Sapphire.Model,

		initialize : function()
		{
			this.parent();
		},

		create : function(cert, key, passphrase)
		{
			var data = {
				cert: JSON.stringify(cert),
				key: JSON.stringify(key),
				passphrase: JSON.stringify(passphrase),
				userId: ONDOBOT.userId,
			};

			return ONDOBOT.service.call(ONDOBOT.urls.createBot, data, 'POST')
				.then(function(data) {
					if (data && !data.success) return Q.reject(data.result);

					this.bot = data.result;
					return this.bot;
				}.bind(this));
		},

		loadBot : function()
		{
			return ONDOBOT.service.call(ONDOBOT.urls.getBots, {userId : ONDOBOT.userId, userId: ONDOBOT.userId}, 'POST')
				.then(function(data) {
					if (data && !data.success) return Q.reject(data.result);

					this.bot = data.result.length > 0 && data.result[0];
					console.log('loadedBot', this.bot);
					return Q(this.bot);
				}.bind(this));
		},

		getBot : function()
		{
			return this.bot;
		},

		save : function(bot)
		{
			return ONDOBOT.service.call(ONDOBOT.urls.saveBot, {bot : JSON.stringify(bot), userId: ONDOBOT.userId}, 'POST')
				.then(function(data) {
					if (data && !data.success) return Q.reject(data.result);

					this.bot = data.result;
					return this.bot;
				}.bind(this));
		}
	})
});

SAPPHIRE.application.registerModel('bot', new Ondobot.Models.Bot());

