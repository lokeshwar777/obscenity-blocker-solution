import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import moderateMessage from "./validateText";
import { toast } from "react-toastify"
import axios from 'axios'

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const sendMessage = async () => {
    const isToxic = await moderateMessage(currentMessage)
    if (currentMessage !== "" && !isToxic) {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
        image: selectedImage ? selectedImage : null,
        video: selectedVideo ? selectedVideo : null,
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
    else {
      toast.error('Your message contains toxic content. Please revise.')
    }
  };

  const verifyImage = async (image) => {
    const formData = new FormData();
    formData.append("providers", "google");
    formData.append("file", image);

    try {
      const response = await axios.post("https://api.edenai.run/v2/image/explicit_content", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNzBlNTg1Y2ItMmVhMC00YzNhLWIyYjctOTdlNTcyNzFmOWVlIiwidHlwZSI6ImFwaV90b2tlbiJ9.O69hZ8NqtxclmsYj0vxzrD18gjc1jjxeT4rKxCjvSaU' // Add your API access token here
        }
      });
      // console.log(response.data);

      // Process the response and determine if the image should be blocked
      const blocked = response.data.google?.nsfw_likelihood >= 3 || response.data['eden-ai']?.nsfw_likelihood >= 3;
      return !blocked

    } catch (error) {
      console.error(error);
      // toast.error('Error processing image. Please try again.');
    }
  }

  const verifyVideo = async (video) => {
    const formData = new FormData();
    formData.append("providers", "google");
    formData.append("file", video);

    const options = {
      method: 'POST',
      url: 'https://api.edenai.run/v2/video/explicit_content_detection_async',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNzBlNTg1Y2ItMmVhMC00YzNhLWIyYjctOTdlNTcyNzFmOWVlIiwidHlwZSI6ImFwaV90b2tlbiJ9.O69hZ8NqtxclmsYj0vxzrD18gjc1jjxeT4rKxCjvSaU'
      },
      data: { show_original_response: false }
    };

    try {
      const response = await axios.request(options);
      console.log(response.data);
      // Process the response and determine if the video should be blocked
      const blocked = response.data.google?.nsfw_likelihood >= 3 || response.data['eden-ai']?.nsfw_likelihood >= 3;
      return !blocked

    } catch (error) {
      console.error(error);
      // toast.error('Error processing video. Please try again.');
    }
  }

  function handleFileUpload(event) {
    if (event.target.files?.length > 0) {
      console.log("event.target",event.target.files[0])
      const file = event.target.files[0];
      console.log("file",file)
      if (file.type.startsWith('image/')) {
        console.log("image")
        handleImageUpload(event);
      } else if (file.type.startsWith('video/')) {
        console.log("video")
        handleVideoUpload(event);
      }
    }
  }

  const handleImageUpload = async (event) => {
    console.log('1 - Image uploaded function');
    const file = event.target.files[0];
    console.log('aksdnfkjsnldkfnsf')
    if (file) {
      if (await verifyImage(file)) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          console.log('2 - Image emitted to upload_image', reader.result);
          await socket.emit("upload_image", { room: room, image: reader.result });
          const imageData = {
            room: room,
            author: username,
            message: "", // Set message to empty since it's an image
            time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
            image: reader.result, // Set the image data
          };
          console.log(imageData)
          setMessageList((list) => [...list, imageData]);
        }
        reader.readAsDataURL(file);
      } else {
        toast.error("Image blocked due to inappropriate content");
      }
    }
    setSelectedImage(null);
  };

  const handleVideoUpload = async (event) => {
    console.log('1 - Video uploaded function');
    const file = event.target.files[0];
    if (file) {
      if (await verifyVideo(file)) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          console.log('2 - Video emitted to upload_video', reader.result);
          await socket.emit("upload_video", { room: room, video: reader.result });
          const videoData = {
            room: room,
            author: username,
            message: "", // Set message to empty since it's an video
            time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
            video: reader.result, // Set the video data
          };
          console.log(videoData)
          setMessageList((list) => [...list, videoData]);
        }
        reader.readAsDataURL(file);
      } else {
        toast.error("Video blocked due to inappropriate content");
      }
    }
    setSelectedVideo(null);
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("receive_image", (data) => {
      const imageData = {
        room: data.room,
        author: data.username,
        message: "", // Set message to empty since it's an image
        time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
        image: data.image, // Set the image data
      };
      console.log('4 - Image received from server', data);
      setMessageList((list) => [...list, imageData]);
    });

    socket.on("receive_video", (data) => {
      const videoData = {
        room: data.room,
        author: data.username,
        message: "", // Set message to empty since it's an video
        time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
        video: data.video, // Set the video data
      };
      console.log('4 - Video received from server', data);
      setMessageList((list) => [...list, videoData]);
    });
  }, [socket]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <p align="center">CHAT ROOM <span style={{ color: "#FFE5B4", float: "right" }}>{room}</span>
          <span style={{ color: "#FFE5B4", float: "left" }}>Chatting as: {username}</span>
        </p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent, index) => {
            return (
              <div
                key={index}
                className="message"
                id={username === messageContent.author ? "you" : "other"}
              >
                <div>
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                    {messageContent.image && <img id="upload-image" src={messageContent.image} alt="" />}
                    {messageContent.video && <video id="upload-video" src={messageContent.video} controls />}
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Message here..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyPress={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <input
          type="file"
          id="fileInput"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button
          id="image-upload-button"
          onClick={() => document.getElementById('fileInput').click()}
        >&#128206;</button>
        <button onClick={sendMessage}>&#10148;</button>
      </div>
    </div>
  );
}

export default Chat;