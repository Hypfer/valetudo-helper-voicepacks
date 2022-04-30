const fs = require("fs");
const path = require("path");
const Tarts = require("../../ext/Tarts");
const Tools = require("../../utils/Tools");
const zlib = require("zlib");


const EXPECTED_FILES = [
    "back_dock_failed.wav",
    "binout_error10.wav",
    "bin_in.wav",
    "bin_out.wav",
    "charging.wav",
    "clean_bin.wav",
    "clean_finish.wav",
    "di.wav",
    "ding.wav",
    "error1.wav",
    "error10.wav",
    "error11.wav",
    "error12.wav",
    "error13.wav",
    "error14.wav",
    "error15.wav",
    "error16.wav",
    "error17.wav",
    "error18.wav",
    "error2.wav",
    "error21.wav",
    "error22.wav",
    "error23.wav",
    "error24.wav",
    "error3.wav",
    "error4.wav",
    "error5.wav",
    "error6.wav",
    "error7.wav",
    "error8.wav",
    "error9.wav",
    "error_internal.wav",
    "findme.wav",
    "finish.wav",
    "goto.wav",
    "goto_complete.wav",
    "goto_failed.wav",
    "home.wav",
    "map_restore.wav",
    "no_power.wav",
    "no_power_charging.wav",
    "no_spot_on_dock.wav",
    "pause.wav",
    "positioning.wav",
    "power_off.wav",
    "power_off_rejected.wav",
    "power_resume_clean.wav",
    "relocate_failed.wav",
    "remote.wav",
    "remote_complete.wav",
    "restart_backtodock_ignore_forbidden_zone.wav",
    "restart_clean.wav",
    "restart_clean_fromdock.wav",
    "restart_clean_ignore_forbidden_zone.wav",
    "restart_clean_nodock.wav",
    "restart_spot_ignore_forbidden_zone.wav",
    "resume_backtodock.wav",
    "resume_clean.wav",
    "resume_home.wav",
    "resume_room.wav",
    "resume_spot.wav",
    "resume_zone.wav",
    "return_no.wav",
    "return_yes.wav",
    "room.wav",
    "room_complete.wav",
    "room_failed.wav",
    "room_partialdone.wav",
    "saving_map.wav",
    "spot.wav",
    "start.wav",
    "stop_clean.wav",
    "stop_goto.wav",
    "stop_room.wav",
    "stop_scheduled_clean.wav",
    "stop_spot.wav",
    "stop_zone.wav",
    "sysupd_complete.wav",
    "sysupd_failed.wav",
    "sysupd_notready.wav",
    "sysupd_start.wav",
    "sysupd_wip.wav",
    "timed_clean.wav",
    "wifi_reset.wav",
    "zone.wav",
    "zone_complete.wav",
    "zone_failed.wav",
    "zone_partialdone.wav"
];

module.exports = async (inDir, outFile) => {
    const pathToVoiceFilesFolder = path.resolve(inDir);
    if (!fs.existsSync(pathToVoiceFilesFolder)) {
        console.error(`ERROR: Directory "${pathToVoiceFilesFolder}" does not exist.`);

        console.log("\n\nExiting..");
        process.exit(-1);
    }

    const outFilePath = path.resolve(outFile);
    if (!fs.existsSync(path.dirname(outFilePath))) {
        console.log(`Directory "${path.dirname(outFilePath)}" does not exist. Creating..`);

        Tools.MK_DIR_PATH(path.dirname(outFilePath));
    }

    console.log(`Starting to pack, compress and encrypt "${pathToVoiceFilesFolder}"...`);

    const files = fs.readdirSync(pathToVoiceFilesFolder);

    const missingFiles = EXPECTED_FILES.filter(eF => {
        return !files.includes(eF);
    });
    const surplusFiles = files.filter(f => {
        return !EXPECTED_FILES.includes(f);
    });

    if (missingFiles.length > 0) {
        console.error("ERROR: Some voice files are missing. Pack is incomplete");
        console.error(`Missing files: ${missingFiles.join(", ")}`);

        console.log("\n\nExiting..");
        process.exit(-1);
    }

    if (surplusFiles.length > 0) {
        console.warn("WARNING: There are additional unexpected files in the source directory");
        console.warn(`Surplus files: ${surplusFiles.join(", ")}`);
    }

    const tarBuf = Tarts(
        files.map(f => {
            return {
                name: f,
                content: fs.readFileSync(path.join(pathToVoiceFilesFolder, f))
            };
        })
    );



    console.log("Tar creation successful");

    const gzipBuf = zlib.gzipSync(tarBuf);
    
    console.log("Compression successful");

    if (gzipBuf.length > 30*1024*1024) {
        console.error("ERROR: Voicepack is too large.");

        console.log("\n\nExiting..");
        process.exit(-1);
    }

    const voicePack = Buffer.alloc(gzipBuf.length + 32);

    const wasmBuffer = fs.readFileSync(path.join(__dirname,"../../wasm/dist/rrvoice.wasm"));

    const importObject = {
        wasi_snapshot_preview1: {
            clock_time_get: () => {
                return 1337; //¯\_(ツ)_/¯
            }
        }
    };

    const rrvoiceInstance = await WebAssembly.instantiate(wasmBuffer, importObject);
    const rrvoice = rrvoiceInstance.instance.exports;

    const inputPointer = rrvoice.create_buffer(gzipBuf.length);
    const outputPointer = rrvoice.create_buffer(gzipBuf.length + 32);

    const inputArray = new Uint8Array(rrvoice.memory.buffer, inputPointer, gzipBuf.length);
    const outputArray = new Uint8Array(rrvoice.memory.buffer, outputPointer, voicePack.length);

    for (let i = 0; i < gzipBuf.length; i++) {
        inputArray[i] = gzipBuf[i];
    }

    rrvoice.encrypt(inputPointer, outputPointer, gzipBuf.length);

    for (let i = 0; i < voicePack.length; i++) {
        voicePack[i] = outputArray[i];
    }

    console.log("Encryption successful");

    fs.writeFileSync(outFilePath, voicePack);



    console.log(`Sucessfully packed: "${inDir}" to "${outFilePath}"`);
    console.log("You can now install the voicepack.");

    console.log("\n\tIf you like this application, you may want to consider donating:");
    console.log("\thttps://github.com/sponsors/Hypfer");
    
    console.log("\nExiting..");
    process.exit(0);
};
