const fs = require("fs");
const path = require("path");
const Tools = require("../../utils/Tools");
const untar = require("untar.js");
const zlib = require("zlib");

module.exports = async (filePath, outDir) => {
    const pathToPackedVoicePack = path.resolve(filePath);
    if (!fs.existsSync(pathToPackedVoicePack)) {
        console.error(`ERROR: "${pathToPackedVoicePack}" does not exist.`);

        console.log("\n\nExiting..");
        process.exit(-1);
    }

    const outDirPath = path.resolve(outDir);
    if (!fs.existsSync(outDirPath)) {
        console.log(`Directory "${outDirPath}" does not exist. Creating..`);

        Tools.MK_DIR_PATH(outDirPath);
    }

    console.log(`Starting to decrypt, decompress and unpack "${pathToPackedVoicePack}"...`);


    const packedEncryptedVoicePack = fs.readFileSync(pathToPackedVoicePack);

    if (packedEncryptedVoicePack.length > 30*1024*1024) {
        console.error(`ERROR: "${pathToPackedVoicePack}" is too large.`);

        console.log("\n\nExiting..");
        process.exit(-1);
    }

    const packedVoicePack = Buffer.alloc(packedEncryptedVoicePack.length - 32);

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

    const inputPointer = rrvoice.create_buffer(packedEncryptedVoicePack.length);
    const outputPointer = rrvoice.create_buffer(packedVoicePack.length);

    const inputArray = new Uint8Array(rrvoice.memory.buffer, inputPointer, packedEncryptedVoicePack.length);
    const outputArray = new Uint8Array(rrvoice.memory.buffer, outputPointer, packedVoicePack.length);

    for (let i = 0; i < packedEncryptedVoicePack.length; i++) {
        inputArray[i] = packedEncryptedVoicePack[i];
    }

    rrvoice.decrypt(inputPointer, outputPointer, packedEncryptedVoicePack.length);

    for (let i = 0; i < packedVoicePack.length; i++) {
        packedVoicePack[i] = outputArray[i];
    }

    if (!(packedVoicePack[0] === 0x1F && packedVoicePack[1] === 0x8B)) {
        console.error("ERROR: Decrypt result doesn't seem to be gzipped. Either decryption failed or the .pkg file is invalid.");

        console.log("\n\nExiting..");
        process.exit(-1);
    } else {
        console.log("Decryption successful");
    }

    const voiceTar = zlib.gunzipSync(packedVoicePack);

    console.log("Gunzip successful");

    untar.untar(voiceTar).forEach(file => {
        fs.writeFileSync(path.join(outDirPath, file.filename), file.fileData);
    });

    console.log(`Sucessfully unpacked: "${pathToPackedVoicePack}" to "${outDirPath}"`);


    console.log("You can now replace those files to your heart's content.");
    console.log("Please make sure that those .wav files have the correct format");
    console.log("\tExpected file format: \"pcm_s16le, 16000 Hz, mono, s16, 256 kb/s\"");

    console.log("\nExiting..");
    process.exit(0);
};
