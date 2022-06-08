import arg from 'arg';
import inquirer from 'inquirer';
import { installTailwind } from './main'

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--yes': Boolean,
            '--install': Boolean,
            '-y': '--yes',
            '-i': '--install',
        },
        {
            argv: rawArgs.slice(2), // On ne prend les arguments qu'à partir du 3ème car les 2 premiers sont node.exe et le bin de ce cli
        }
    );
    return {
        skipPrompts: args['--yes'] || false,
        template: args._[0],
        runInstall: args['--install'] || false,
    }
}

async function promptForMissingOptions(options) {
    const defaultTemplate = 'Vanilla';
    if (options.skipPrompts) {
        return {
            ...options,
            template: options.template || defaultTemplate,
        };
    }

    const questions = [];
    if (!options.template) {
        questions.push({
            type: 'list',
            name: 'template',
            message: 'Please choose which kind of JavaSript framework is used on the vite project',
            choices: ['Vanilla', 'Vue'],
            default: defaultTemplate,
        });
    }

    const answers = await inquirer.prompt(questions);
    return {
        ...options,
        template: options.template || answers.template,
    }
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    await installTailwind(options);
}