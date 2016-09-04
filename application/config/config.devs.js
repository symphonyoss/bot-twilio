var fs = require('fs');

module.exports = {
	useCompression: false,
	builderCache: false,
	minify : false,
	port: 8081,
	baseUrl : 'https://localhost:8081/',
    appId: 'ondobot',
	https: {
        key : fs.readFileSync(__dirname + '/certs/localhost/localhost.key', {encoding: 'utf-8'}),
        cert : fs.readFileSync(__dirname + '/certs/localhost/localhost.cert', {encoding: 'utf-8'}),
	},
};
