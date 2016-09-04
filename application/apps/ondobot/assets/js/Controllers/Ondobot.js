Package('Ondobot.Controllers', {
	Ondobot : new  Class({
		Extends: Sapphire.Controller,

		initialize : function()
		{
			this.parent();
			SAPPHIRE.application.listen('start', this.onStart.bind(this));
//			SAPPHIRE.application.listen('ready', this.onReady.bind(this));
			ONDOBOT.events.listen('connected', this.onConnected.bind(this));
		},

		onStart : function(callback)
		{
			callback();
		},

		getBot : function()
		{
			return this.botModel.loadBot()
				.then(function(bot)
				{
					this.bot = bot;
				}.bind(this));
		},

		getScripts : function()
		{
			return this.scriptsModel.getScripts('glenn')
				.then(function(scripts)
				{
					this.scripts = scripts;
				}.bind(this));
		},

		getPublicScripts : function()
		{
			return this.scriptsModel.getPublicScripts()
				.then(function(scripts)
				{
					this.publicScripts = scripts;
				}.bind(this));
		},

		onConnected : function()
		{
			this.botModel = SAPPHIRE.application.getModel('bot');
			this.scriptsModel = SAPPHIRE.application.getModel('scripts');
			this.getBot()
				.then(this.getScripts.bind(this))
				.then(this.getPublicScripts.bind(this))
				.then(function()
				{
					console.log(this.bot, this.scripts, this.publicScripts);

					this.view = new Ondobot.Views.Ondobot();
					this.view.listen('bot-page', this.onPage.bind(this, 'bot'));
                    this.view.listen('scripts-page', this.onPage.bind(this, 'scripts'));
                    this.view.listen('help-page', this.onPage.bind(this, 'help'));
					SAPPHIRE.application.showPage('bot');
				}.bind(this));
		},

		onPage : function(which)
		{
			SAPPHIRE.application.showPage(which);
		}
	})
});

SAPPHIRE.application.registerController('ondobot', new Ondobot.Controllers.Ondobot());
