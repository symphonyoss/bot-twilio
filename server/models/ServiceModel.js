var Q = require('q');
RequestModel = require('./RequestModel');

module.exports = new Class({
	Extends: RequestModel,

	initialize : function(agentBase, cert, headers)
	{
		this.parent(cert, headers);

		this.agentBase = agentBase;
	},

	sessionInfo : function()
	{
		return this.request(this.agentBase + '/v1/sessioninfo', 'GET');
	},

	getBotId : function()
	{
		return this.botUserId;
	},

	start : function()
	{
		return this.sessionInfo()
			.then(function(response)
			{
				this.botUserId = response.userId;
			}.bind(this));
	},

	getBotInfo : function()
	{
		return this.request(this.agentBase + '/v1/admin/user/' + this.botUserId, 'GET')
	},

	echo : function(what)
	{
		options = {
			json: true,
			body: what
		}
		return this.request(this.agentBase + '/v1/util/echo', 'POST', options);
	}
});
