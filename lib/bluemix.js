// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var path = require('path');
var g = require('strong-globalize')();
var fs = require('fs');
var helpers = require('../lib/helpers');
var helpText = require('../lib/help');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;

var bluemix = exports;

// All actions defined in this file should be called with `this` pointing
// to a generator instance

/**
 * Prepare prompts for bluemix options
 */
bluemix.configurePrompt = function() {
  // https://github.com/strongloop/generator-loopback/issues/38
  // yeoman-generator normalize the appname with ' '
  this.appName = path.basename(process.cwd())
                .replace(/[\/@\s\+%:\.]+?/g, '-');

  var appMemoryPrompt = {
    name: 'appMemory',
    message: g.f('How much memory to allocate for the app?'),
    default: 256,
    validate: helpers.validateAppMemory,
  };

  var appInstancesPrompt = {
    name: 'appInstances',
    message: g.f('How many instances of app to run?'),
    default: 1,
    validate: helpers.validateAppInstances,
  };

  var appDomainPrompt = {
    name: 'appDomain',
    message: g.f('What is the domain name of the app?'),
    default: 'mybluemix.net',
    validate: helpers.validateAppDomain,
  };

  var appHostPrompt = {
    name: 'appHost',
    message: g.f('What is the subdomain of the app?'),
    default: this.appName,
    validate: helpers.validateAppHost,
  };

  var appDiskQuotaPrompt = {
    name: 'appDiskQuota',
    message: g.f('How much disk space to allocate for the app?'),
    default: 1024,
    validate: helpers.validateAppDiskQuota,
  };

  var toolchainPrompt = {
    name: 'toolchain',
    message: g.f('Do you want to create toolchain files?'),
    default: 'yes',
    validate: helpers.validateYesNo,
  };

  var dockerPrompt = {
    name: 'docker',
    message: g.f('Do you want create Dockerfile?'),
    default: 'no',
    validate: helpers.validateYesNo,
  };

  this.prompts = [];
  if (this.options.bluemix) {
    var allPrompts = [
      appMemoryPrompt, appInstancesPrompt, appDomainPrompt, appHostPrompt,
      appDiskQuotaPrompt, toolchainPrompt, dockerPrompt,
    ];
    this.prompts = allPrompts;
    this.bluemixCommand = 'bluemix';
  } else {
    if (this.options.datasource) {
      this.bluemixCommand = 'datsource';
    } else if (this.options.toolchain) {
      this.bluemixCommand = 'toolchain';
      this.prompts.push(toolchainPrompt);
    } else if (this.options.service) {
      this.bluemixCommand = 'service';
    } else if (this.options.docker) {
      this.bluemixCommand = 'docker';
    } else {
      this.prompts.push(appMemoryPrompt);
      this.prompts.push(appInstancesPrompt);
      this.prompts.push(appDomainPrompt);
      this.prompts.push(appHostPrompt);
      this.prompts.push(appDiskQuotaPrompt);
      if (this.options.manifest) {
        this.bluemixCommand = 'manifest';
      } else {
        this.bluemixCommand = 'bluemix';
        this.prompts.push(dockerPrompt);
        this.prompts.push(toolchainPrompt);
      }
    }
  }
};

bluemix.promptSettings = function() {
  if (this.bluemixCommand === 'bluemix' || this.bluemixCommand === 'manifest') {
    this.log();
    return this.prompt(this.prompts).then(function(answers) {
      this.appMemory = answers.appMemory;
      this.appInstances = answers.appInstances;
      this.appDomain = answers.appDomain;
      this.appHost = answers.appHost;
      this.appDiskQuota = answers.appDiskQuota;
      this.enableDocker = answers.docker === 'no' ? false : true;
      this.enableToolchain = answers.toolchain === 'no' ? false : true;
    }.bind(this));
  }
};

bluemix.generateFiles = function() {
  if (this.bluemixCommand === 'bluemix' || this.bluemixCommand === 'manifest' ||
      this.bluemixCommand === 'toolchain' || this.bluemixCommand === 'docker') {
    var bluemixOptions = {
      destDir: this.destinationRoot(),
      bluemixCommand: this.bluemixCommand,
      enableDocker: this.enableDocker,
      enableToolchain: this.enableToolchain,
    };
    Workspace.generateBluemixFiles(bluemixOptions,
                                  this.copy.bind(this),
                                  this.directory.bind(this));
  }
};

bluemix.promptDefaultServices = function() {
  if (this.bluemixCommand === 'bluemix') {
    var prompts = [
      {
        name: 'enableAutoScaling',
        message: g.f('Do you want to enable autoscaling?'),
        default: 'no',
        validate: helpers.validateYesNo,
      },
      {
        name: 'enableAppMetrics',
        message: g.f('Do you want to enable appmetrics?'),
        default: 'no',
        validate: helpers.validateYesNo,
      },
    ];

    var self = this;
    return this.prompt(prompts).then(function(answers) {
      self.enableAutoScaling = answers.enableAutoScaling;
      self.enableAppMetrics = answers.enableAppMetrics;
    }.bind(this));
  }
};

bluemix.addDefaultServices = function() {
  if (this.bluemixCommand === 'bluemix' || this.options.bluemix) {
    var options = {
      bluemix: true,
      enableAutoScaling: this.enableAutoScaling,
      enableAppMetrics: this.enableAppMetrics,
      destDir: this.destinationRoot(),
    };
    Workspace.addDefaultServices(options);
  }
};
