var server = 'sym-corp-stage-guse1-aha1.symphony.com';
var controllerServer = 'corporate.symphony.com';

var config = {
	urlConfig : {
		keyUrl: 'https://' + server + ':8444/keyauth',
		sessionUrl: 'https://' + server + ':8444/sessionauth',
		agentUrl: 'https://' + server + ':8444/agent',
		podUrl: 'https://' + controllerServer + ':443/pod',
		webControllerUrl: 'https://' + controllerServer + '/webcontroller',
		streamingAgentUrl: 'https://' + server + ':8444/agent',
	},
}

var env = process.env.node_env;

envConfig = {};
try
{
	if (env) envConfig = require('./config.' + env);
}
catch (e)
{
}

module.exports = Object.merge(config, envConfig);
