Package('Ondobot.Controllers', {
	Help : new Class({
		Extends : Sapphire.Controller,

		initialize : function()
		{
			this.parent();

			SAPPHIRE.application.listenPageEvent('load', 'help', this.onLoad.bind(this));
			SAPPHIRE.application.listenPageEvent('show', 'help', this.onShow.bind(this));
		},

		onLoad : function()
		{
			this.view = new Ondobot.Views.Help();
		},

		onShow : function(panel, query)
		{
			this.view.draw()
		},
	})
});

SAPPHIRE.application.registerController('help', new Ondobot.Controllers.Help());
