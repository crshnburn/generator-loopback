// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, it */
'use strict';
var path = require('path');
var fs = require('fs-extra');
var common = require('./common');
var assert = require('assert');
var ygAssert = require('yeoman-assert');
var helpers = require('yeoman-test');
var rimraf = require('rimraf');
var yaml = require('yaml-js');
var SANDBOX =  path.resolve(__dirname, 'sandbox');

var BASIC_BLUEMIX_FILES = [
  '.bluemix/datasources-config.json',
  'server/datasources.bluemix.js',
  '.cfignore',
  'manifest.yml',
];

var DOCKER_FILES = [
  '.dockerignore',
  'Dockerfile',
];

var TOOLCHAIN_FILES = [
  '.bluemix/deploy.json',
  '.bluemix/pipeline.yml',
  '.bluemix/toolchain.yml',
];

describe('loopback:bluemix generator', function() {
  beforeEach(common.resetWorkspace);

  beforeEach(function(done) {
    fs.ensureDir(SANDBOX, function() {
      process.chdir(SANDBOX);
      common.createDummyProject(SANDBOX, 'test-app', done);
    });
  });

  afterEach(function(done) {
    process.chdir('/');
    rimraf(SANDBOX, done);
  });

  it('should generate all Bluemix files', function(done) {
    var gen = givenBluemixGenerator('--force');
    helpers.mockPrompt(gen, {
      appMemory: 1024,
      appInstances: 5,
      appDomain: 'my.bluemix.net',
      appHost: 'cool-app',
      appDiskQuota: 1280,
      enableDocker: 'yes',
      enableToolchain: 'yes',
      enableAutoScaling: 'yes',
      enableAppMetrics: 'yes',
    });
    gen.run(function() {
      ygAssert.file(BASIC_BLUEMIX_FILES.concat(DOCKER_FILES)
      .concat(TOOLCHAIN_FILES));
      done();
    });
  });

  it('should generate only basic Bluemix files', function(done) {
    var gen = givenBluemixGenerator('--force');
    helpers.mockPrompt(gen, {
      appMemory: 1024,
      appInstances: 5,
      appDomain: 'my.bluemix.net',
      appHost: 'cool-app',
      appDiskQuota: 1280,
      enableDocker: 'no',
      enableToolchain: 'no',
      enableAutoScaling: 'no',
      enableAppMetrics: 'no',
    });
    gen.run(function() {
      ygAssert.file(BASIC_BLUEMIX_FILES);
      ygAssert.noFile(DOCKER_FILES);
      ygAssert.noFile(TOOLCHAIN_FILES);
      done();
    });
  });

  it('should generate only Docker files', function(done) {
    var gen = givenBluemixGenerator('--force --docker');
    helpers.mockPrompt(gen);
    gen.run(function() {
      ygAssert.noFile(BASIC_BLUEMIX_FILES);
      ygAssert.file(DOCKER_FILES);
      ygAssert.noFile(TOOLCHAIN_FILES);
      done();
    });
  });

  it('should generate only toolchain files', function(done) {
    var gen = givenBluemixGenerator('--force --toolchain');
    helpers.mockPrompt(gen);
    gen.run(function() {
      ygAssert.noFile(BASIC_BLUEMIX_FILES);
      ygAssert.noFile(DOCKER_FILES);
      ygAssert.file(TOOLCHAIN_FILES);
      done();
    });
  });

  it('should generate manifest file', function(done) {
    var gen = givenBluemixGenerator('--force --manifest');
    helpers.mockPrompt(gen, {
      appMemory: 1280,
      appInstances: 7,
      appDomain: 'my.blue.mix.net',
      appHost: 'cool.app',
      appDiskQuota: 512,
    });
    gen.run(function() {
      ygAssert.noFile(DOCKER_FILES);
      ygAssert.noFile(TOOLCHAIN_FILES);
      ygAssert.file('manifest.yml');
      var content = fs.readFileSync('./manifest.yml', 'utf8');
      var appplication = yaml.load(content).applications[0];
      assert('1280M', appplication.memory);
      assert(7, appplication.instances);
      assert('my.blue.mix.net', appplication.domain);
      assert('cool.app', appplication.host);
      assert('512M', appplication.disk_quota);
      done();
    });
  });
});

function givenBluemixGenerator(args) {
  var name = 'loopback:bluemix';
  var genPath = path.join(__dirname, '..', 'bluemix');
  var gen = common.createGenerator(name, genPath, [], args, {});
  gen.options['skip-install'] = true;
  return gen;
}
