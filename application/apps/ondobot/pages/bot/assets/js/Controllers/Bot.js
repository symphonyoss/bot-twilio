Package('Ondobot.Controllers', {
	Bot : new Class({
		Extends : Sapphire.Controller,

		initialize : function()
		{
			this.parent();

			SAPPHIRE.application.listenPageEvent('load', 'bot', this.onLoad.bind(this));
			SAPPHIRE.application.listenPageEvent('show', 'bot', this.onShow.bind(this));
		},

		onLoad : function()
		{
			this.view = new Ondobot.Views.Bot();
			this.view.listen('create', this.onCreate.bind(this));
			this.view.listen('update', this.onUpdate.bind(this));
			this.botModel = SAPPHIRE.application.getModel('bot');
			this.scriptsModel = SAPPHIRE.application.getModel('scripts');
		},

		getScripts : function()
		{
			return this.scriptsModel.getScripts()
				.then(function(scripts)
				{
					this.scripts = scripts;
					return this.scriptsModel.getPublicScripts()
						.then(function(scripts)
						{
							this.publicScripts = scripts;
						}.bind(this));
				}.bind(this));
		},

		onShow : function(panel, query)
		{
			this.getScripts()
				.then(function(scripts)
				{
					var bot = this.botModel.getBot();
					this.view.draw(bot, this.scripts, this.publicScripts)
				}.bind(this));
		},

		onCreate : function(cert, key, passphrase)
		{
			this.botModel.create(cert, key, passphrase)
				.then(function(bot)
				{
					this.view.draw(bot, this.scripts, this.publicScripts);
				}.bind(this))
		},

		onUpdate : function(bot)
		{
			this.botModel.save(bot)
				.then(function(bot)
				{
					this.view.draw(bot, this.scripts, this.publicScripts);
				}.bind(this))
		},
	})
});

SAPPHIRE.application.registerController('bot', new Ondobot.Controllers.Bot());
