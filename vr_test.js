const resemble = require('node-resemble-js');
const fs = require('fs');
const fse = require('fs-extra');
const streamToPromise = require('stream-to-promise');
const parseArgs = require('minimist');

const config = require('./config');
let {
    REFERENCE_IMAGES_PATH,
    TEST_IMAGES_PATH} = config;

const {
    DIFF_IMAGES_PATH,
    MIS_MATCH_THRESHOLD,
    RESEMABLE_SETTINGS
} = config;

function log(message, type) {
    console.log(message);
}

function getConfigFromArgs() {
    const argsOptions = parseArgs(process.argv.slice(2), {
        boolean: ['h', 'help'],
        string: ['config']
    });

    if (argsOptions.h || argsOptions.help) {
        console.log("Use refs - Reference images path \n Use test - Test images path"); //eslint-disable-line
        process.exit();
    }

    if (argsOptions['_'].length == 0) return;
    let {refs, test} = argsOptions['_'][0];
    REFERENCE_IMAGES_PATH = refs || REFERENCE_IMAGES_PATH;
    TEST_IMAGES_PATH = test || TEST_IMAGES_PATH;
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
            reject(`Test image not found ${testFile}`);
        }

        resemble.outputSettings(RESEMABLE_SETTINGS);

        resemble(referenceFile)
            .compareTo(testFile)
            .onComplete((data) => resolve(data));
    });
}

function getAllImageDiff(files) {
    return files.map((file)=>{
        let {filename} = file;
        let test = {
            filename,
            status: 'pass'
        };

        return getTheImageDiff(file)
            .then((diff)=>{
                if (diff.isSameDimensions && (diff.misMatchPercentage <= MIS_MATCH_THRESHOLD)) {
                    return test;
                }

                test.status = 'fail';
                saveDiffImage(filename, diff);
                return test;
            });
    });
}

function saveDiffImage (filename, data) {
    var fileStream = fs.createWriteStream(`${DIFF_IMAGES_PATH}/${filename}`);

    var storageStream = data.getDiffImage()
        .pack()
        .pipe(fileStream);

    return streamToPromise(storageStream);
}

function RUN() {
    getConfigFromArgs();

    getAllReferenceImages()
    .then((files)=>{
        createFolder(DIFF_IMAGES_PATH);
        Promise.all(getAllImageDiff(files))
            .then((d)=>{
                console.log(d); //eslint-disable-line
            });
    }).catch((err)=>log(err, 'error'));
}

RUN();
