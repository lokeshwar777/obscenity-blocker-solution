import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import moderateMessage from "./validateText";
import { toast} from "react-toastify"

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

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
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
    else {
      toast.error('Your message contains toxic content. Please revise.')
    }
  };

  const handleImageUpload = async (event) => {
    console.log('1 - Image uploaded function');
    const file = event.target.files[0];
    if (file) {
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
    }
    setSelectedImage(null);
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
  }, [socket]);

  return (
    // <div className="white_box">
    <div className="chat-window">
      <div className="chat-header">
        {/*<p align="center">CHAT ROOM <span>{room}</span></p>*/}
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
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                    {/*<p id="room">{messageContent.room}</p>*/}
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
          onChange={handleImageUpload}
        />
        <button
          id="image-upload-button"
          onClick={() => document.getElementById('fileInput').click()}
        >&#128206;</button>
        <button onClick={sendMessage}>&#10148;</button>
      </div>
    </div>
    // </div>
  );
}

export default Chat;
