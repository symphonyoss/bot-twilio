var RequestModel = require('@symphony/ondobot-models').RequestModel;
var FeedMe = require('feedme');

module.exports = new Class({
	Extends: RequestModel,

	initialize : function()
	{
		this.parent();
	},

	getQuote : function(symbol) {
		var url = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary/' + symbol;
		var params = {
			formatted:'true',
			lang: 'en-US',
			region: 'US',
			modules: 'price,summaryDetail',
			corsDomain: 'finance.yahoo.com',
		};

		var options = {
			params : params
		}
		return this.request(url, 'GET', options)
			.then(function(response)
			{
				return response;
			}.bind(this))
			.fail(function(response)
			{
				return null;
			}.bind(this));
	},

	getNews : function(symbol)
	{
		console.log('getNews', symbol)

		var options = {
			params : {s: symbol, region: 'US', lang: 'en-US'},
		}


		return this.request('http://feeds.finance.yahoo.com/rss/2.0/headline', 'GET', options)
			.then(function(response)
			{
				var parser = new FeedMe(true);
				parser.write(response);
				return parser.done();

			}.bind(this));
	},

	getHeadlines : function()
	{
		var apiKey = process.env.nytimesApiKey;
		
		var options = {
			params : {'apikey': apiKey},
		}

		return this.request('https://api.nytimes.com/svc/topstories/v2/home.json', 'GET', options)
			.then(function(response)
			{
				return response;
			}.bind(this));
	}
});
