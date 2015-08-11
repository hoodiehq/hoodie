#!/usr/bin/env node

// npm dedupe is awesome
// bundleDependencies is awesome
// together they don't work
// this script fixes that manually

var exec = require('child_process').execSync
var fs = require('fs')
var path = require('path')

var pkgpath = path.join(__dirname, '..', 'package.json')
var pkg = JSON.parse(fs.readFileSync(pkgpath))

exec('npm prune --production')

exec('npm dedupe')

var bundleDependencies = fs.readdirSync(path.join(__dirname, '..', 'node_modules'))

var bin = bundleDependencies.indexOf('.bin')

if (bin !== -1) {
  bundleDependencies.splice(bin, 1)
}

pkg.bundleDependencies = bundleDependencies

exec('npm install semantic-release@' + pkg.devDependencies['semantic-release'])

fs.writeFileSync(pkgpath, JSON.stringify(pkg, null, 2))
