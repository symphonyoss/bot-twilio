var Q = require("q");
var Service = require('sapphire-express').Service;
var TickerModel = require('../models/TickerModel');
var math = require('mathjs');
var SunCalc = require('suncalc');

var CommandsService = new Class({
	Implements : [Service],

	initialize : function()
	{
		this.export('test', module);
		this.export('news', module);
		this.export('headlines', module);
		this.export('quote', module);
		this.export('math', module);
		this.export('roll', module);
		this.export('moon', module);

		this.addCSRFException('test');
		this.addCSRFException('news');
		this.addCSRFException('headlines');
		this.addCSRFException('quote');
		this.addCSRFException('math');
		this.addCSRFException('moon');
	},

	verify : function(req, res)
	{
		return true;
	},

	news : function(req, res)
	{
		var session = req.session.get();
		var symbol = req.query.symbol;

		var tickerModel = new TickerModel();
		return tickerModel.getNews(symbol)
			.then(function(response)
			{
				var news = response.items.slice(0, 5);
				console.log(news);
			}.bind(this))
	},

	test : function(req, res)
	{
		console.log(req.query);
		var content = decodeURIComponent(req.query.echo || 'Test');
		var result = '<messageML>' + content + '</messageML>';
		res.writeHead(200, {'Content-Type': 'application/messageml'});
		res.end(result);

		return Q(null);
	},

	headlines : function(req, res)
	{
		var session = req.session.get();

		var tickerModel = new TickerModel();
		return tickerModel.getHeadlines()
			.then(function(response)
			{
				var news = response.results.slice(0, 5);
				var response = '';
				news.each(function(news)
				{
					response += '<b>' + news.title + '</b><br/>';
					response += '' + news.abstract + '<br/>';
					response += '<a href="' + news.url + '"/><br/><br/>';
				}, this);
				var result = '<messageML>' + response + '</messageML>';
				res.writeHead(200, {'Content-Type': 'application/messageml'});
				res.end(result);
			}.bind(this))
	},

	quote : function(req, res)
	{
		var tickerModel = new TickerModel();
		var symbol = decodeURIComponent(req.query.symbol || 'goog');

		return tickerModel.getQuote(symbol)
			.then(function(response)
			{
				var result = response && response.quoteSummary && response.quoteSummary.result && response.quoteSummary.result.length && response.quoteSummary.result[0];
				if (!result) {
					var result = '<messageML>symbol not found</messageML>';
					res.writeHead(200, {'Content-Type': 'application/messageml'});
					res.end(result);
					return;
				}

				var summary = result.summaryDetail;
				var price = result.price;

				var value = Number(price.regularMarketPrice.raw).toFixed(2);
				var date = new Date(price.regularMarketTime * 1000);
				var name = price.longName;
				var response = '<b>' + name + '</b><br/>Last Price $' + value + '<br/>At ' + date.format() + '<br/>';

				var result = '<messageML>' + response + '</messageML>';
				res.writeHead(200, {'Content-Type': 'application/messageml'});
				res.end(result);
			}.bind(this))
	},

	math : function(req, res)
	{
		var expr = decodeURIComponent(req.query.expr);

		try
		{
			code = math.compile(expr);
			result = code.eval();
		}
		catch (e)
		{
			result = 'does not compute: ' + e.toString();
		}

		var result = '<messageML>' + result + '</messageML>';
		res.writeHead(200, {'Content-Type': 'application/messageml'});
		res.end(result);

		return Q(null);
	},

	roll : function(req, res)
	{
		var count = parseInt(decodeURIComponent(req.query.count).trim(), 10);
		var sides = parseInt(decodeURIComponent(req.query.sides).trim(), 10);

		if (isNaN(count)) result = 'invalid dice count';
		if (count > 100) result = 'you\'re a jerk';
		else if (isNaN(sides)) result = 'invalid number of sides';
		else if (sides <= 0) result = 'invalid number of sides';
		else
		{
			var roll = 0;
			for (idx = 0; idx < count; idx++)
				roll += Math.floor(Math.random() * sides) + 1;

			result = 'you rolled ' +  roll;
		}

		var result = '<messageML>' + result + '</messageML>';
		res.writeHead(200, {'Content-Type': 'application/messageml'});
		res.end(result);

		return Q(null);
	},

	moon : function(req, res)
	{
		var illumination = SunCalc.getMoonIllumination(Date.now())
		var phase = illumination.phase;
		var percent = Math.floor(illumination.fraction * 100);

		var phaseName = '';
        if (phase < 0.05) phaseName = 'new';
		else if (phase < 0.20) phaseName = 'waxing_crescent';
		else if (phase < 0.3) phaseName = 'first_quarter';
		else if (phase < 0.48) phaseName = 'waxing_gibbous';
		else if (phase < 0.52) phaseName = 'full';
		else if (phase < 0.7) phaseName = 'waining_gibbous';
		else if (phase < 0.8) phaseName = 'last_quarter';
        else if (phase < 0.95) phaseName = 'waining_crescent';
		else phaseName = 'new';

		var phaseString = phaseName.replace(/_/g, ' ').capitalize();

        result = '<messageML><b>Moon Phase:</b> ' + phaseString + '<br/><b>Illumination:</b> ' + percent + '%</messageML>';
		res.writeHead(200, {'Content-Type': 'application/messageml'});
		res.end(result);

		return Q(null);
	},

});

new CommandsService();
