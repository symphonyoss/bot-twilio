Package('Ondobot.Controllers', {
	Forms : new Class({
		Extends : Sapphire.Controller,

		initialize : function()
		{
			this.parent();

			SAPPHIRE.application.listen('ready', this.onReady.bind(this));
		},

		onReady : function()
		{
			this.view = new Ondobot.Views.Forms();
			this.view.draw()
		}
	})
});

SAPPHIRE.application.registerController('forms', new Ondobot.Controllers.Forms());
