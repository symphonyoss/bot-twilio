Package('Controller.Services', {
	Ondobot : new Class({
		implements : ['select'],

		initialize : function()
		{
			SYMPHONY.services.make('ondobot:controller', this, this.implements, true);
			var count = 0;
			this.symbolList = $H({});
			this.modules = {}
			this.docked = [];
			this.deleted = [];

			SAPPHIRE.application.listen('start', this.onStart.bind(this));
			SAPPHIRE.application.listen('ready', this.onReady.bind(this));
		},

		showModule : function()
		{
			var options = {
				canFloat: true
			};

			this.modulesService.show('ondobot:config', {title: 'Symfuny Chat Bot', icon: CONTROLLER.baseUrl + 'ob-controller/assets/images/icon.png'}, 'ondobot:controller', CONTROLLER.baseUrl + 'ondobot', options);
		},

	// This method is invoked by the navService when our navigation item is selected
		select: function(id)
		{
			this.showModule();
		},

		onStart : function(callback)
		{
		// hand shake with the Symphony client
			SYMPHONY.remote.hello()
				.then(function(data) {
					callback();
				}.bind(this));
		},

		onReady : function()
		{
		// register our application. Pass along our main service so that the module can get it
			SYMPHONY.application.register(CONTROLLER.appId, ['ui', 'modules', 'applications-nav', 'commerce', 'share'], ['ondobot:controller'])
				.then(function(response)
				{
					this.userId = response.userReferenceId;

					this.navService = SYMPHONY.services.subscribe('applications-nav');
					this.modulesService = SYMPHONY.services.subscribe('modules');

				// add us to the left nav, and add a button to cash tags
					this.navService.add('ondobot-nav-main', {title: 'Symfuny Chat Bot', icon: CONTROLLER.baseUrl + 'ob-controller/assets/images/icon.png'}, 'ondobot:controller');
				}.bind(this))
				.fail(function(e) {
					console.log(e.stack);
				});
		}
	})
});

new Controller.Services.Ondobot();
