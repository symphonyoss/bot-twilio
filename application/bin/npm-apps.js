/*
 *
 *
 * Copyright 2016 Symphony Communication Services, LLC
 *
 * Licensed to Symphony Communication Services, LLC under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

const child = require('child_process');
var Q = require('q');
var fs = require('fs');
var path = require('path');

function getDir(path)
{
	return fs.readdirSync(path);
}

function hasPackage(path)
{
	return fs.existsSync(path + '/package.json');
}

function isDirectory(path)
{
	var stats = fs.statSync(path);
	return stats && stats.isDirectory();
}

var root = process.cwd() + '/apps';

var apps = getDir(root);
var install = [];

apps.forEach(function(dir)
{
	var path = root + '/' + dir;
	if (isDirectory(path) && hasPackage(path))
		install.push(path);
});
var cwd = process.cwd();

install.forEach(function(path) {
	process.chdir(path);
	console.log(process.cwd(), 'npm install');
	child.execSync('npm install');
});

process.chdir(cwd);
