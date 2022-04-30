const { Command } = require("commander");

const roborockCcryptCommands = require("./commands/roborock_ccrypt");
const Tools = require("./utils/Tools");

const version = `${Tools.GET_VERSION()} (${Tools.GET_COMMIT_ID()})`;

const program = new Command();

program
    .name("valetudo-helper-voicepacks")
    .description("CLI tool to build and install voicepacks using valetudo")
    .version(version);


const roborockCcrypt = program.command("roborock")
    .description("build voicepacks for roborock V1 and S5 (non-max!!)");

roborockCcrypt.command("unpack")
    .description("unpack an existing .pkg voicepack")
    .argument("<filepath>", "path to the encrypted voicepack .pkg")
    .argument("<outdir>", "path to unpack to")
    .action((filePath, outDir) => {
        roborockCcryptCommands.unpackCommand(filePath, outDir).catch(err => {
            console.error("Error during execution of command", err);
            process.exit(-1);
        });
    });

roborockCcrypt.command("pack")
    .description("create a new .pkg voicepack from a folder of .wav files")
    .argument("<inDir>", "path to directory containing voice .wav files")
    .argument("<outFile>", "output filename")
    .action((inDir, outFile) => {
        roborockCcryptCommands.packCommand(inDir, outFile).catch(err => {
            console.error("Error during execution of command", err);
            process.exit(-1);
        });
    });



program.parse();
