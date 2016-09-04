var Q = require('q');
var Feature = require('sapphire-express').Feature;

module.exports = function(req, res, app)
{
	var scripts = new Feature(app, '/ondobot/pages/scripts/');

	scripts.addPage({
		name: 'scripts',
		url: 'assets/pages/scripts.html',
		javascript: ['assets/js/Controllers/Scripts.js', 'assets/js/Views/Scripts.js'],
		css: ['assets/css/scripts.css']
	});

	return Q(app);
}
