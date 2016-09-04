var Q = require('q');
var sapphire = require('sapphire-express');

function main(req, res, app)
{
	app.addCSS([
		'/ob-controller/assets/css/controller.css',
	]);

	app.addJS([
		'https://www.symphony.com/resources/api/v1.0/symphony-api.js',
	], true);

	app.addJS([
		'/ob-controller/assets/js/Services/Ondobot.js',
	]);

	return Q(app)
}

exports.getApplication = function(req, res)
{
	var session = req.session.get();
	var app = new sapphire.Application('CONTROLLER', req, res);

	app.setTitle('Controller');
	app.setBody('apps/ob-controller/templates/body.html');
	app.setMaster('apps/ob-controller/templates/master.html');
	app.addVariable('baseUrl', CONFIG.baseUrl);
	app.addVariable('appId', CONFIG.appId);

	return main(req, res, app)
		.then(function(app)
		{
			return Q(app);
		})
}
