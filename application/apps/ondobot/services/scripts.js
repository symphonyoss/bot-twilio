var Q = require('q');
var Service = require('sapphire-express').Service;
var ScriptsModel = require('@symphony/ondobot-models').ScriptsModel;
var uuid = require('node-uuid');
var Archiver = require('archiver');

BotService = new Class({
	Implements : [Service],

	initialize : function()
	{
		this.export('getBotScripts', module);
		this.export('getPublicScripts', module);
		this.export('saveScript', module);
		this.export('createScript', module);
		this.export('saveScript', module);
		this.export('download', module);

		this.addCSRFException('download');
	},

	verify : function(req, res)
	{
		return true;
	},

	getBotScripts : function(req, res)
	{
		var session = req.session.get();
		var id = req.body.userId;
		var scriptsModel = new ScriptsModel();

		return scriptsModel.getByUser(id)
			.then(function(response)
			{
				return Q({success: true, result: response});
			}.bind(this))
	},

	getPublicScripts : function(req, res)
	{
		var session = req.session.get();
		var id = req.body.userId;
		var scriptsModel = new ScriptsModel();

		return scriptsModel.getPublic()
			.then(function(response)
			{
				return Q({success: true, result: response});
			}.bind(this))
	},

	createScript : function(req, res)
	{
		var session = req.session.get();
		var script = JSON.parse(req.body.script);
		var name = req.body.name;
		var public = req.body.public;
		var owner = req.body.userId;

		var scriptsModel = new ScriptsModel();
		var id = uuid.v4();

		script.owner = owner;
		script.id = id;
		script._id = id;

		return scriptsModel.upsert(script)
			.then(function(script)
			{
				return Q({success: true, result: script});
			}.bind(this));
	},

	saveScript : function(req, res)
	{
		var script = JSON.parse(req.body.script);
		var scriptsModel = new ScriptsModel();

		return scriptsModel.upsert(script)
			.then(function(script)
			{
				return Q({success: true, result: script});
			}.bind(this));
	},

	download : function(req, res)
	{
		var session = req.session.get();
		var id = req.query.userId;
		var scriptsModel = new ScriptsModel();

		console.log(req.query);
		console.log('id', id);

		return scriptsModel.getByUser(id)
			.then(function(scripts)
			{
				res.writeHead(200, {
					'Content-Type': 'application/zip',
					'Content-disposition': 'attachment; filename=bot_scripts.zip'
				});

				var zip = new Archiver('zip');
				zip.on('end', function()
				{
//					res.end();
					console.log('ended');
					return Q(null);
				}.bind(this));
				zip.pipe(res);

				console.log(scripts);
				scripts.each(function(script)
				{
					var filename = script.name.toLowerCase().replace(/ /g, '_') + '.brf';
					zip.append(script.content, {name: filename});
				}, this);

				zip.finalize();
			}.bind(this))
	}
});

new BotService();
