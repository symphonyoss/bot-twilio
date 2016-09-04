var Q = require('q');
var Feature = require('sapphire-express').Feature;

module.exports = function(req, res, app)
{
	var bot = new Feature(app, '/ondobot/pages/bot/');

	bot.addPage({
		name: 'bot',
		url: 'assets/pages/bot.html',
		javascript: ['assets/js/Controllers/Bot.js', 'assets/js/Views/Bot.js'],
		css: ['assets/css/bot.css']
	});

	return Q(app);
}
