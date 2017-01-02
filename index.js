const resemble = require('node-resemble-js');
const fs = require('fs');
const fse = require('fs-extra');
const streamToPromise = require('stream-to-promise');
const parseArgs = require('minimist');
const chalk = require('chalk');

const config = require('./config');
let {
    REFERENCE_IMAGES_PATH,
    TEST_IMAGES_PATH,
    DIFF_IMAGES_PATH } = config;

const {
    MIS_MATCH_THRESHOLD,
    RESEMABLE_SETTINGS
} = config;

function log(message, type) {
    const log = console.log;
    const COLOR = {
        error: 'red',
        warn: 'yellow',
        log: 'gray',
        success: 'green'
    }
    const chalkColor = chalk[COLOR[type]] || chalk.gray;

    if(!type) {
        return log(message);
    }

    log(chalkColor(message));
}

function reportLog(item) {
    const COLOR = {
        FAILED: 'red',
        INVALID: 'yellow',
        PASS: 'green'
    };

    const chalkColor = chalk[COLOR[item.status]] || chalk.gray;
    const status = chalkColor.dim(item.status);
    const filename = chalkColor.bold(item.filename);
    const misMatch = chalk.white.bgRed(item.misMatchPercentage || '');
    const imageUrl = chalkColor.underline(item.diffImage || '');

    console.log(`${status} | ${filename} ${misMatch}| ${imageUrl}`);
}

function getConfigFromArgs() {
    const argsOptions = parseArgs(process.argv.slice(2), {
        boolean: ['h', 'help'],
        string: ['config']
    });

    if (argsOptions.h || argsOptions.help) {
        console.log("Reference images path, Test images path, diff path"); //eslint-disable-line
        process.exit();
    }

    let args = argsOptions['_'];
    if (args.length == 0) return;

    REFERENCE_IMAGES_PATH = args[0] || REFERENCE_IMAGES_PATH;
    TEST_IMAGES_PATH = args[1] || TEST_IMAGES_PATH;
    DIFF_IMAGES_PATH = args[2] || DIFF_IMAGES_PATH;
}

function ignoreSystemFiles(filenames) {
    const systemFiles = ['.DS_Store'];
    debugger;
    return filenames.filter(
        (file) =>!(systemFiles.indexOf(file) > -1) );
}

function getAllReferenceImages(){
    return new Promise(function(resolve, reject){

        fs.readdir(REFERENCE_IMAGES_PATH, (err, filenames) => {
            if (err) {
                return reject(`"${REFERENCE_IMAGES_PATH}" doesnt exists`, err);
            }

            if (!filenames.length) {
                return reject(`There are no files inside ${REFERENCE_IMAGES_PATH}`, err);
            }

            filenames = ignoreSystemFiles(filenames);
            return resolve(filenames.map((filename)=>({
                filename,
                referenceFile: `${REFERENCE_IMAGES_PATH}/${filename}`,
                testFile: `${TEST_IMAGES_PATH}/${filename}`})
            ));
        });
    });
}

function createFolder(dir) {
    if (fs.existsSync(dir)){
        return fse.emptyDir(dir);
    }
    return fs.mkdirSync(dir);
}

function getTheImageDiff({referenceFile, testFile}) {
    return new Promise(function (resolve, reject) {

        if (!fs.existsSync(testFile)) {
            return reject(`Test image not found ${testFile}`);
        }

        resemble.outputSettings(RESEMABLE_SETTINGS);

        return resemble(referenceFile)
            .compareTo(testFile)
            .onComplete((data) => resolve(data));
    });
}

function getAllImageDiff(files) {
    return files.map((file)=>{
        let {filename} = file;


        return getTheImageDiff(file)
            .then((diff)=>{
                if (diff.isSameDimensions && (diff.misMatchPercentage <= MIS_MATCH_THRESHOLD)) {
                    return {
                        filename,
                        status: 'PASSES'
                    };
                }

                let diffImageName = `${DIFF_IMAGES_PATH}/${filename}`

                saveDiffImage(diffImageName, diff);
                return {
                    filename,
                    status: 'FAILED',
                    diffImage: diffImageName,
                    misMatchPercentage: diff.misMatchPercentage
                };
            }).catch((err)=>{
                log(err, 'error');
                return {
                    filename,
                    status: 'INVALID'
                }
            });
    });
}

function saveDiffImage (filename, data) {
    var fileStream = fs.createWriteStream(filename);

    var storageStream = data.getDiffImage()
        .pack()
        .pipe(fileStream);

    return streamToPromise(storageStream);
}

function generateReport(reportData) {
    reportData.forEach((item)=>{
        reportLog(item)
    });
}

function RUN() {
    getConfigFromArgs();

    getAllReferenceImages()
    .then((files)=>{
        createFolder(DIFF_IMAGES_PATH);
        Promise.all(getAllImageDiff(files))
            .then((reportData)=> generateReport(reportData));
    }).catch((err)=>log(err, 'error'));
}

RUN();
