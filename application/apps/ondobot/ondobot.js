var Q = require('q');
var sapphire = require('sapphire-express');
var botPage = require('./pages/bot/bot.js');
var scriptsPage = require('./pages/scripts/scripts.js');
var helpPage = require('./pages/help/help.js');

function main(req, res, app)
{
	app.addCSS([
		'https://www.symphony.com/resources/api/v1.1/symphony-style.css',
	], true);

	app.addJS([
		'https://www.symphony.com/resources/api/v1.0/symphony-api.js',
	], true);

	app.addCSS([
		'/ondobot/assets/css/ondobot.css',
	]);

	app.addJS([
		'/assets/js/lib/translate.js',
		'/assets/js/lib/templates.js',
		'/assets/js/lib/ajax-service.js',
		'/ondobot/assets/js/Views/Ondobot.js',
		'/ondobot/assets/js/Controllers/Ondobot.js',
		'/ondobot/assets/js/Services/Ondobot.js',
		'/ondobot/assets/js/Models/Service.js',
		'/ondobot/assets/js/Models/Bot.js',
		'/ondobot/assets/js/Models/Scripts.js',
		'/ondobot/assets/js/3rdParty/ace/ace.js',
		'/ondobot/assets/js/3rdParty/jquery-sortable.js',
	]);


	return Q(app)
}

exports.getApplication = function(req, res)
{
	var session = req.session.get();
	var app = new sapphire.Application('ONDOBOT', req, res);

	app.setTitle('Sym-Fun-y Chat Bot');
	app.setBody('apps/ondobot/templates/body.html');
	app.setMaster('apps/ondobot/templates/master.html');
	app.addVariable('baseUrl', CONFIG.baseUrl);
	app.addVariable('appId', CONFIG.appId);
	app.addUrl('createBot', '/ondobot/services/bot/createBot');
	app.addUrl('saveBot', '/ondobot/services/bot/saveBot');
	app.addUrl('getBots', '/ondobot/services/bot/getBots');
	app.addUrl('getBotScripts', '/ondobot/services/scripts/getBotScripts');
	app.addUrl('getPublicScripts', '/ondobot/services/scripts/getPublicScripts');
	app.addUrl('saveScript', '/ondobot/services/scripts/saveScript');
	app.addUrl('createScript', '/ondobot/services/scripts/createScript');
	app.addUrl('saveScript', '/ondobot/services/scripts/saveScript');
	app.addUrl('download', '/ondobot/services/scripts/download');

	return main(req, res, app)
		.then(sapphire.features.animator.bind(sapphire.features.animator, req, res))
		.then(sapphire.features.dialogs.bind(sapphire.features.dialogs, req, res))
		.then(botPage.bind(botPage, req, res))
		.then(scriptsPage.bind(scriptsPage, req, res))
        .then(helpPage.bind(helpPage, req, res))
		.then(function(app)
		{
			return Q(app);
		})
}
