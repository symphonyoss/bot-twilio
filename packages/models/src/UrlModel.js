var Q = require('q');
RequestModel = require('./RequestModel');

module.exports = new Class({
	Extends: RequestModel,

	initialize : function()
	{
		this.parent();
	},

	cleanupUrl : function(url)
	{
		console.log('cleanupUrl', url);
		var segments = url.split('?');
		if (segments.length === 1) return {url: segments[0], qs: {}};
		var queryStr = segments[1];
		var params = queryStr.split('&');
		var qs = {};

		params.each(function(param) {
			var parts = param.split('=');
			if (parts.length === 0) return;
			var key = parts[0];
			parts.shift();
			var value = parts.join('=');
			value = encodeURIComponent(value);
			qs[key] = value;
		});

		return {url: segments[0], qs: qs};
	},

	getMessageMl : function(url)
	{
		var cleanUrl = this.cleanupUrl(url);

		var options = {
			params : cleanUrl.qs,
			contentTypes: ['application/messageml'],
		}

		return this.request(cleanUrl.url, 'GET', options)
	}
});
