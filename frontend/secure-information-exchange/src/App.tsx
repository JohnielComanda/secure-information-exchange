import React, { useState, ChangeEvent } from "react";
import "./App.css";
import TextField from "@mui/material/TextField";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");

  interface EncryptedMessage {
    encryptedData: string;
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
    console.log("Message: ", message);
  };

  const onClickSendMessage = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/sendMessage",
        {
          message: message,
        }
      );

      const temp = response.data.encryptedMessage;

      let formattedString = ""; // Initialize an empty string

      temp.forEach((message: EncryptedMessage, key: number) => {
        formattedString += `Sub Message ${key}: ${message.encryptedData}\n\n`;
      });

      setEncryptedMessage(formattedString);
      setDecryptedMessage(message);
      console.log("Encrypted Message: ", encryptedMessage);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      <div>
        <Box
          sx={{
            display: "flex",
            height: "10vh",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(70deg, #4a91d9, #60a2e6, #72bad6)",
          }}
        >
          <>
            <Typography variant="h4">Secure Information Exchange</Typography>
            <Typography sx={{ marginLeft: "65vw" }}>Logout</Typography>
          </>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <Typography variant="h6">Me to Bob</Typography>
          <Box
            sx={{
              width: "50vw",
              height: "60vh",
              marginBottom: "1rem",
              position: "relative",
            }}
            bgcolor={"#f0f0f0"}
            borderRadius={"5px"}
          >
            {decryptedMessage ? (
              <Tooltip title={encryptedMessage}>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: "5%",
                    right: "3%",
                    backgroundColor: "#649ad9",
                    padding: "2rem",
                    borderRadius: "10px",
                  }}
                >
                  {decryptedMessage}
                </Box>
              </Tooltip>
            ) : (
              ""
            )}
          </Box>
          <Box sx={{ width: "50vw", height: "7vh" }}>
            <TextField
              id="filled-multiline-static"
              sx={{
                width: "87.5%",
                height: "100%",
                "& .MuiInputBase-root": {
                  height: "100%",
                  "& .MuiInputBase-input": {
                    height: "100%",
                    padding: "10px 12px",
                  },
                },
              }}
              label="Message"
              multiline
              variant="filled"
              onChange={handleInputChange}
              value={message}
            />
            <Button
              variant="contained"
              onClick={onClickSendMessage}
              sx={{
                width: "10%",
                height: "100%",
                marginLeft: "2.5%",
              }}
            >
              Send
            </Button>
          </Box>
        </Box>
      </div>
    </>
  );
}

export default App;
