Package('Ondobot.Models', {
	Scripts : new Class({
		Extends : Sapphire.Model,

		initialize : function()
		{
			this.parent();
		},

		getScripts : function()
		{
			return ONDOBOT.service.call(ONDOBOT.urls.getBotScripts, {userId: ONDOBOT.userId}, 'POST')
				.then(function(data) {
					return (data && data.success) ? Q(data.result) : Q.reject(data.result);
				});
		},

		getPublicScripts : function()
		{
			return ONDOBOT.service.call(ONDOBOT.urls.getPublicScripts, {userId: ONDOBOT.userId}, 'POST')
				.then(function(data) {
					return (data && data.success) ? Q(data.result) : Q.reject(data.result);
				});
		},

		create : function(content, name, public)
		{
			var script = {
				content: content,
				name: name,
				public: public,
			};

			var data = {
				script: JSON.stringify(script),
				userId: ONDOBOT.userId,
			}

			return ONDOBOT.service.call(ONDOBOT.urls.createScript, data, 'POST')
				.then(function(data) {
					return (data && data.success) ? Q(data.result.data) : Q.reject(data.result);
				});
		},

		save : function(script)
		{
			return ONDOBOT.service.call(ONDOBOT.urls.saveScript, {script: JSON.stringify(script), userId: ONDOBOT.userId}, 'POST')
				.then(function(data) {
					return (data && data.success) ? Q(data.result.data) : Q.reject(data.result);
				});
		},

		download : function(script)
		{
			window.open(ONDOBOT.urls.download + '?userId=' + encodeURIComponent(ONDOBOT.userId));
			return;
		}
	})
});

SAPPHIRE.application.registerModel('scripts', new Ondobot.Models.Scripts());

