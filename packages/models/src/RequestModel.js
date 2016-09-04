var Q = require('q');
var crypto = require('crypto');
var request = require('request');
//require('request-debug')(request);

module.exports = new Class({
	initialize : function(agent, headers)
	{
		this.agentOptions = agent;
		this.headers = headers || {};
	},


	request : function(url, method, passedOptions)
	{
		passedOptions = passedOptions || {};
		method = method || 'GET';
		var deferred = Q.defer();
		var headers = Object.merge({}, this.headers, passedOptions.headers || {})
		var cookies = passedOptions.cookies;

		var options = {
			url: url,
			method: method,
			headers: headers,
			strictSSL: false,
			json: passedOptions.json,
			agentOptions: this.agentOptions,
            timeout: 5 * 60 * 60 * 1000
		};

//		console.log(url, 'passedOptions', passedOptions);
//		console.log(url, 'options', options);
		console.log(url);

		if (cookies)
		{
			var jar = request.jar();
			cookies.each(function(cookie)
			{
				jar.setCookie(cookie, url);
			}, this);

			options.jar = jar;
		}

//		console.log('url', url);
//		console.log('options', options);
//		console.log('headers', this.headers);

		if (method.toUpperCase() === 'GET')
		{
			options.qs = passedOptions.params;
		}
		else if (method.toUpperCase() === 'POST')
		{
			options.form = passedOptions.params || passedOptions.form;
			options.body = passedOptions.body;
		}

		request(options, function(error, response, body)
		{
//			console.log(url, error, body, response.status);
//			console.log(url, error, body);
//			console.log(body);
			if (error) console.log(body);
			if (response) {
				var contentType = response.headers['content-type'];
				if (passedOptions.contentType && passedOptions.contentTypes.indexOf(contentType) === -1)
					deferred.reject(new Error('invalid content type'));
			}
			if (error) deferred.reject(error);
			else if (response.statusCode < 200 || response.statusCode > 299)
			{
				console.log(body);
				deferred.reject(new Error(response.statusCode));
			}
			else
			{
				try
				{
					deferred.resolve(JSON.parse(body));
				}
				catch (e)
				{
					deferred.resolve(body);
				}

			}
		}.bind(this));

		return deferred.promise;
	}
});
