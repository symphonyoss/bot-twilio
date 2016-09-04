const child = require('child_process');
var Q = require('q');
var fs = require('fs');
var path = require('path');
var cwd = process.cwd();
var install = [cwd + '/server', cwd + '/application'];
var cwd = process.cwd();

install.forEach(function(path) {
	process.chdir(path);
	console.log(process.cwd(), 'npm install');
	child.execSync('npm install');
});

process.chdir(cwd);
