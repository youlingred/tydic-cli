#!/usr/bin/env node
'use strict'

const fs = require('fs');
const chalk = require('chalk');
const rm = require('rimraf').sync;
const path = require('path');
const download = require('./utils/download')
const generator = require('./utils/generator')
const inquirer = require('inquirer');
const program = require('commander');

program.option('-y | --yes', '跳过信息输入项')
    .usage('<template-name> 模板名称 [project-name] 项目目录名称,如果不传将在当前文件夹下创建项目')
    .parse(process.argv)

// 根据输入，获取项目模板名称 必填
let templateName = program.args[0];
// 根据输入，获取项目目录名称
let projectName = program.args[1];
// 生成目录
let createPath;
let next = undefined;

if (!templateName) {
    // project-name 必填
    // 相当于执行命令的--help选项，显示help信息，这是commander内置的一个命令选项
    program.help()
    return
}

if (projectName) {
    //检查当前目录下是否存在文件夹已存在
    let dirList = fs.readdirSync(process.cwd())
    let dirIndex;
    if ((dirIndex = dirList.indexOf(projectName)) > 0) {
        //判断是否是文件夹类型
        if (fs.statSync(path.join(process.cwd(), dirList[dirIndex])).isDirectory()) {
            next = inquirer.prompt([
                {
                    name: 'created',
                    message: `目录${projectName}已经存在,是否在此目录内构件项目?`,
                    type: 'confirm',
                    default: true
                }
            ]).then(answers => {
                if (answers.created) {
                    createPath = path.join(process.cwd(), projectName);
                    rm(createPath);
                    return Promise.resolve(createPath);
                } else {
                    process.exit(1);
                }
            }).catch(err => {
                console.log(err);
            })
        } else {
            createPath = path.join(process.cwd(), projectName);
            next = Promise.resolve(createPath);
        }
    } else {
        createPath = path.join(process.cwd(), projectName);
        next = Promise.resolve(createPath);
    }
} else {
    createPath = path.join(process.cwd());
    next = Promise.resolve(createPath);
}

next && go();

function go() {
    // 预留，处理子命令
    next.then(createPath => {
        return download(templateName, createPath).then(temp => {
            return {
                name: projectName || templateName,
                root: createPath,
                downloadTemp: temp
            }
        })
    }).then(context => {
        //如果参数包含-y --yes则跳过信息输入项
        if (program.yes) {
            return {
                src: context.downloadTemp,
                dest: context.root,
                metadata: {
                    projectName: context.name,
                    projectVersion: '1.0.0',
                    projectDescription: `A project named ${context.name}`,
                    projectAuthor: 'author',
                }
            }

        } else {
            return inquirer.prompt([
                {
                    name: 'projectName',
                    message: '项目的名称',
                    default: context.name
                }, {
                    name: 'projectVersion',
                    message: '项目的版本号',
                    default: '1.0.0'
                }, {
                    name: 'projectDescription',
                    message: '项目的简介',
                    default: `A project named ${context.name}`
                }
                , {
                    name: 'projectAuthor',
                    message: '作者',
                    default: `author`
                }
            ]).then(answers => {
                    return {
                        src: context.downloadTemp,
                        dest: context.root,
                        metadata: {
                            ...answers
                        }
                    }
                }
            )
        }

    }).then(context => {
            return generator(context);
        }
    ).then(context => {
        console.log(chalk.bold.green('创建成功:)'))
    }).catch(err => {
        console.error(chalk.bold.red(`创建失败：${err.message}`))
    })
}
