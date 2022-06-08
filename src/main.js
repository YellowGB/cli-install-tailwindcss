import chalk from "chalk";
import fs from "fs";
import ncp from "ncp";
import path from "path";
import { promisify } from "util";
import execa from 'execa';
import Listr from "listr";

const access = promisify(fs.access);
const copy = promisify(ncp);

async function copyTemplateFiles(options) {
    return copy(options.templateDirectory, options.targetDirectory, {
        clobber: true, // Indique d'écraser les fichiers existants
    });
}

async function installTailwindModule(options) {
    const result = await execa('npm', ['install', '-D', 'tailwindcss'], {
        cwd: options.targetDirectory,
    });
    if (result.failed) {
        return Promise.reject(new Error('Failed to install Tailwind CSS node module'));
    }
    return;
}

async function initializeTailwind(options) {
    const result = await execa('npx', ['tailwindcss', 'init'], {
        cwd: options.targetDirectory,
    });
    if (result.failed) {
        return Promise.reject(new Error('Failed to initialize Tailwind CSS configuration'));
    }
    return;
}

async function setWatchCommand(options) {
    const packageJsonFile = fs.readFileSync(options.targetDirectory + '\\package.json', 'ascii');
    let json = JSON.parse(packageJsonFile);

    const watchCommand = options.template.toLowerCase() === 'vanilla' ? 'npx tailwindcss -i input.css -o style.css --watch' : '';
    json.scripts.watch = watchCommand;

    fs.writeFileSync(options.targetDirectory + '\\package.json', JSON.stringify(json, null, 4)); // 4 est important si on veut conserver l'indentation, sinon le json sera en version 'minifiée'

    return;
}

export async function installTailwind(options) {
    options = {
        ...options,
        targetDirectory: options.targetDirectory || process.cwd(),
    };

    const currentFileUrl = import.meta.url;
    let templateDir = path.resolve(
        new URL(currentFileUrl).pathname,
        '../../templates',
        options.template.toLowerCase()
    );
    if (templateDir.includes('D:\\D:\\')) templateDir = templateDir.substring(3); // Parfois, sur windows, la méthode resolve retourne une URL contenant deux fois la lettre du lecteur, rendant l'accès au répertoire impossible
    options.templateDirectory = templateDir;

    try {
        await access(templateDir, fs.constants.R_OK);
    }
    catch (err) {
        console.error('%s ' + err, chalk.red.bold('ERROR'));
        process.exit(1);
    }

    const tasks = new Listr([
        {
            title: 'Install Tailwind CSS Node module',
            task: () => installTailwindModule(options),
        },
        {
            title: 'Initialize Tailwind CSS configuration',
            task: () => initializeTailwind(options),
        },
        {
            title: 'Copy Tailwind CSS config files',
            task: () => copyTemplateFiles(options),
        },
        {
            title: 'Set npm run watch command',
            task: () => setWatchCommand(options),
        }
    ]);

    await tasks.run();

    console.log('%s Tailwind CSS installed', chalk.green.bold('DONE'));
    console.log(chalk.yellow.bold('Use "npm run watch" to build the CSS as you code'));
    return true;
}