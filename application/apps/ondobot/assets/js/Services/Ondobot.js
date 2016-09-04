Package('Ondobot.Services', {
	Ondobot : new Class({
		initialize : function()
		{
			SAPPHIRE.application.listen('start', this.onStart.bind(this));
			SAPPHIRE.application.listen('ready', this.onReady.bind(this));
			this.serviceName = 'ondobot:module';
			this.navId = 'ondobot-nav-main';
			this.moduleId = 'ondobot:config';
		},

		implements : [],

		focus : function()
		{
			this.modulesService.focus(this.moduleId);
			this.navService.focus(this.navId);
		},

		onStart : function(callback)
		{
		// handshake with the Symphony client
			SYMPHONY.remote.hello()
				.then(function(data) {
					this.setTheme(data.themeV2);
					callback();
				}.bind(this));
		},

		onReady : function()
		{
		// connect to the main application. Register our service so that the controller can use it to talk to us
			SYMPHONY.services.make(this.serviceName, this, this.implements, true);
			SYMPHONY.application.connect(ONDOBOT.appId, ['ui', 'modules', 'applications-nav'], [this.serviceName])
				.then(function(response)
				{
					console.log(response);
					this.userId = response.userReferenceId;
					ONDOBOT.userId = this.userId;

					this.uiService = SYMPHONY.services.subscribe('ui');
					this.navService = SYMPHONY.services.subscribe('applications-nav');
					this.modulesService = SYMPHONY.services.subscribe('modules');

					this.uiService.listen('themeChangeV2', this.onThemeChange.bind(this));

					this.focus();

					$(window).on('focus', function() {
						this.focus();
					}.bind(this));

					ONDOBOT.events.fire('connected');
				}.bind(this)).done();
		},

		setTheme : function(theme)
		{
			$(document.body).removeClass(theme.classes.join(' '));
			$(document.html).removeClass(theme.classes.join(' '));
			$(document.body).addClass(theme.name);
			$(document.html).addClass(theme.size);
		},

		onThemeChange : function(theme)
		{
			this.setTheme(theme);
		},
	})
});

new Ondobot.Services.Ondobot();
