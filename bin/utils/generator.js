// npm i handlebars metalsmith -D
const Metalsmith = require('metalsmith');
const Handlebars = require('handlebars');
const multimatch = require('multimatch');
const rm = require('rimraf').sync

module.exports = function ({metadata = {}, src, dest = '.'}) {
    if (!src) {
        return Promise.reject(new Error(`无效的source：${src}`))
    }

    return new Promise((resolve, reject) => {
        Metalsmith(process.cwd())
            .metadata(metadata)
            .clean(false)
            .source(src)
            .destination(dest)
            .use((files, metalsmith, done) => {
                const meta = metalsmith.metadata()
                Object.keys(files).forEach(fileName => {
                    if (multimatch(fileName, ['package.json']).length) {
                        const t = files[fileName].contents.toString()
                        files[fileName].contents = new Buffer(Handlebars.compile(t)(meta))
                    }
                })
                done()
            }).build(err => {
            rm(src)
            if(err){
                reject(err)
            }else{
                resolve()
            }
        })
    })
}