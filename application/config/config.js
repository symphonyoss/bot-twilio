var config = {
	useCompression: false,
	builderCache: false,
	minify : false,
	port: 8081,
	cors : {
	   origin: [/\.symphony\.com:.*$/, /\.symphony\.com$/]
	},
}

var env = process.env.node_env||'devs';
envConfig = {};
try
{
	if (env) envConfig = require('./config.' + env);
}
catch (e)
{
	console.log(e.stack);
}

module.exports = Object.merge(config, envConfig);
