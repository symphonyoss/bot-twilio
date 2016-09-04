var Q = require('q');
RequestModel = require('./RequestModel');

module.exports = new Class({
	Extends: RequestModel,

	initialize : function(authBase, keyBase, certOptions)
	{
		this.parent(certOptions);

		this.authBase = authBase;
		this.keyBase = keyBase;
	},

	auth : function() {
		var promises = [];
		promises.push(this.request(this.authBase + '/v1/authenticate', 'POST'));
		promises.push(this.request(this.keyBase + '/v1/authenticate', 'POST'));

		return Q.allSettled(promises).spread(function(r1, r2) {
			var result1 = r1.value;
			var result2 = r2.value;
			var auth = {};

			if (!result1 || !result2) throw('failed to auth');
			auth[result1.name] = result1.token;
			auth[result2.name] = result2.token;

			return auth;
		});
	}
});
