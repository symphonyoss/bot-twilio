var Q = require('q');
RequestModel = require('./RequestModel');

module.exports = new Class({
	Extends: RequestModel,

	initialize : function(baseUrl, cert, headers)
	{
		this.parent(cert, headers);

		this.baseUrl = baseUrl;
	},

	getConversations : function()
	{
		var options = {
			headers: {
				'X-Symphony-CSRF-Token': 1
			},

			cookies: [
				'skey=' + this.headers['sessionToken'] + '; path=/; domain=symphony.com'
			],

			params : {
				count: 5000,
				excludeMessages: false,
				nonHiddenThreads: true,
			},
		}

		return this.request(this.baseUrl + '/dataquery/conversations', 'GET', options)
			.then(function(response) {
				this.conversations = response.items || [];
				return response;
			}.bind(this));

	},

	getAccount : function()
	{
		var options = {
			headers: {
				'X-Symphony-CSRF-Token': 1
			},

			cookies: [
				'skey=' + this.headers['sessionToken'] + '; path=/; domain=symphony.com'
			],

			params : {
				clienttype: 'DESKTOP'
			},
		}

		return this.request(this.baseUrl + '/maestro/Account', 'GET', options)
			.then(function(response) {
				this.account = response;
				return response;
			}.bind(this));
	},

	getUser : function(userId)
	{
		var options = {
			headers: {
				'X-Symphony-CSRF-Token': 1
			},

			cookies: [
				'skey=' + this.headers['sessionToken'] + '; path=/; domain=symphony.com'
			],

			form : {
				action: 'usercurrent',
				userids: userId
			},
		}

		return this.request(this.baseUrl + '/maestro/UserInfo', 'POST', options)
			.then(function(response) {
				return response;
			}.bind(this));
	}

});
