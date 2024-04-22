import React, { useState, useEffect } from 'react'
import * as toxicity from '@tensorflow-models/toxicity'

export const Model = () => {
  const [message, setMessage] = useState('')
  const [toxicityModel, setToxicityModel] = useState(null)

  useEffect(() => {
    // Load the toxicity model when the component mounts
    toxicity.load().then((model) => {
      setToxicityModel(model)
    })
  }, [])

  const loadModel = async () => {
    console.log("Function loadModel Called..");
    try {
      console.log("Try called");
      const threshold = 0.9;
      setToxicityModel(await toxicity.load(threshold));
      console.log("Model loaded");
    } catch (error) {
      console.error("Error loading model:", error);
    }
  }

  const moderateMessage = async (message) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const isToxic = await moderateMessage(message)
    if (isToxic) {
      alert('Your message contains toxic content. Please revise.')
      return
    }

    //Code to send message to chat server and display in chat window
    console.log('Message sent:', message)

    const moderated = await moderateMessage(message);

    if (moderated) {
      console.log("Message has been moderated:", moderated);
    } else {
      console.log("Safe message:", message);
    }
    setMessage('')
  }

  return (
    <div>
      <h1>Chat App</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}

export default Model;