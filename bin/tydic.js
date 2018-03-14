#!/usr/bin/env node
'use strict'
const program = require('commander');
const version = require('../package').version;

program.version(version)
        .usage('<command> 命令')
        .command('init','初始化项目')
        .parse(process.argv);
