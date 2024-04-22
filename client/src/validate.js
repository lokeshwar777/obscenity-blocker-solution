import * as toxicity from '@tensorflow-models/toxicity';

let toxicityModel

const loadModel = async () => {
    console.log("Function loadModel Called..");
    try {
        console.log("Try called");
        const threshold = 0.9;
        toxicityModel = await toxicity.load(threshold)
        console.log("Model loaded");
    } catch (error) {
        console.error("Error loading model:", error);
    }
}

const moderateMessage = async (message) => {

    toxicity.load().then((model) => {
        toxicityModel = model
    })

    console.log('moderateMessage called..')
    if (!toxicityModel) {
        await loadModel();
        console.log("Loaded model in moderateMessage");
        // return false // Model not loaded yet
    }
    console.log(message)
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