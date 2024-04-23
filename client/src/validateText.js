import * as toxicity from '@tensorflow-models/toxicity';

let toxicityModel

const loadModel = async () => {
    try {
        console.log("2 - Loading model...");
        const threshold = 0.9;
        toxicityModel = await toxicity.load(threshold)
        console.log("3 - Model loaded");
    } catch (error) {
        console.error("Error loading model:", error);
    }
}

const moderateMessage = async (message) => {

    toxicity.load().then((model) => {
        toxicityModel = model
    })

    console.log('1 - toxicityModel: ', toxicityModel);
    if (!toxicityModel) {
        await loadModel();
        console.log("4 - Loaded model in moderateMessage");
    }
    console.log("5 - ", message)
    const predictions = await toxicityModel.classify(message)
    // Check if any toxic label is detected
    for (const prediction of predictions) {
        for (const result of prediction.results) {
            if (result.match) {
                return true // Message is toxic
            }
        }
    }
    return false // Message is not toxic
}

export default moderateMessage;