// const toxicity = require("@tensorflow-models/toxicity");
import * as toxicity from '@tensorflow-models/toxicity';

let toxicityModel;

async function loadModel() {
    console.log("Function loadModel Called..");
    try {
        console.log("Try called");
        const threshold = 0.5;
        global.toxicityModel = await toxicity.load(threshold);
        console.log("Model loaded");
    } catch (error) {
        console.error("Error loading model:", error);
    }
}

async function moderateMessage(message) {
    console.log("Function called");
    if (!toxicityModel) {
        await loadModel();
        console.log("Loaded model in moderateMessage");

    }

    if (toxicityModel) {
        const predictions = await toxicityModel.classify([message]);

        for (const item of predictions) {
            for (const result of item.results) {
                if (result.match) {
                    return true;
                }
            }
        }
        return false;
    }
}

async function moderateResult() {
    const message = "I kill you";
    console.log(message);
    const moderated = await moderateMessage(message);

    if (moderated) {
        console.log("Message has been moderated:", moderated);
    } else {
        console.log("Safe message:", message);
    }
}

moderateResult(); // Call moderateResult function when the script is loaded