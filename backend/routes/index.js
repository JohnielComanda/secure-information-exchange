const express = require("express");
const router = express.Router();
const database = require("../secure_information_exchange_db");
const crypto = require("crypto");

router.get("/users", async (req, res) => {
  try {
    const [results, fields] = await database.query("SELECT * FROM user");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Endpoint for get computed_public_key - parameter: user_id
router.get("/user/publickey", async (req, res) => {
  try {
    const userId = req.query.user_id;
    console.log("USER ID: ", userId);
    const public_key = await calculatePublicKey(userId);
    res.json(public_key);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// // Endpoint to get user_id by user's name
// router.get("/user/:username", async (req, res) => {
//   try {
//     const username = req.params.username;
//     // Query the database to get the user_id based on the username
//     const sql = "SELECT user_id FROM user WHERE name = ?";
//     const [results] = await database.query(sql, [username]);

//     if (results.length > 0) {
//       // If user with the provided username exists, return the user_id
//       const userId = results[0].user_id;
//       res.json({ user_id: userId });
//     } else {
//       // If user with the provided username doesn't exist, return an error
//       res.status(404).json({ error: "User not found" });
//     }
//   } catch (err) {
//     // Handle any database errors
//     console.error("Database error:", err);
//     res.status(500).json({ error: "Database error" });
//   }
// });

// // Endpoint for get sharedkey - parameter: current user's public key, reciever's user_id
// router.get("/sharedkey", async (req, res) => {
//   try {
//     const publicKeyA = req.query.public_key;
//     const userBId = req.query.user_id;
//     console.log("PUBLIC KEY: ", publicKeyA, "USER ID: ", userBId);
//     const sharedKey = await calculateSharedKey(publicKeyA, userBId);
//     console.log("SHARED KEY: ", sharedKey);

//     res.json(sharedKey);
//   } catch (error) {
//     res.status(500).json({ error: "Database error" });
//   }
// });

// Endpoint for post message - parameter: message, current user's shared key, reciever's user_ix
router.post("/api/sendMessage", async (req, res) => {
  try {
    const message = req.body.message;
    console.log("Message: ", message);
    // const query = "";
    // const senderId = req.query.sender_id;
    // const recieverId = req.query.reciever_id;
    // const sharedKey = req.query.shared_key;
    const publicKeyB = await calculatePublicKey(2);
    const sharedKey = await calculateSharedKey(publicKeyB, 1);

    const encryptedMessage = encryptMessage(message, sharedKey);
    res.json({ encryptedMessage });
  } catch (err) {
    res.status(500).json({ error: "Encryption error" });
  }
});

// End point for getting decrypted message - parameter: encrypted_message, current user's shared key, reciever's id, sender's id
router.post("/getMessage", async (req, res) => {
  try {
    const encryptedMessage = req.query.message;
    // const secretKey = req.query.secretKey;
    const publicKeyA = calculatePublicKey(1);
    const sharedKey = calculateSharedKey(publicKeyA, 2);

    const decryptedMessage = await decryptMessage(encryptedMessage, sharedKey);
    return res.json(decryptedMessage);
  } catch (error) {
    res.status(500).json({ error: "Encryption error" });
  }
});

// helper methods (to refactor -> utils.js)
const asciiToDecimal = (asciiStr) => {
  return asciiStr.split("").map((char) => char.charCodeAt(0));
};

const hexToAscii = (hexString) => {
  const hexArray = hexString.split(" ");
  let asciiString = "";

  hexArray.forEach((hex) => {
    const asciiChar = String.fromCharCode(parseInt(hex, 16));
    asciiString += asciiChar;
  });

  return asciiString;
};

const getPrivateKeyInDecimal = async (userId) => {
  const sql = "SELECT private_key FROM user WHERE user_id = ?";
  try {
    const [results] = await database.query(sql, [userId]);
    if (results.length > 0) {
      const privateKey = results[0].private_key;
      const decimalPrivateKey = asciiToDecimal(privateKey);
      return decimalPrivateKey;
    } else {
      throw new Error("User not found");
    }
  } catch (err) {
    throw err;
  }
};

const calculatePublicKey = async (userId) => {
  try {
    const privateKey = BigInt(await getPrivateKeyInDecimal(userId));

    const generator = BigInt(process.env.GENERATOR);
    const prime = BigInt(process.env.PRIME);

    console.log(
      "GENERATOR: ",
      generator,
      "PRIME: ",
      prime,
      "PRIVATE KEY: ",
      privateKey
    );

    const publicKey = generator ** privateKey % prime;

    return publicKey.toString();
  } catch (err) {
    throw err;
  }
};

const calculateSharedKey = async (publicKeyA, userBId) => {
  try {
    const privateKeyB = await getPrivateKeyInDecimal(userBId);

    const sharedKey =
      BigInt(publicKeyA) ** BigInt(privateKeyB) % BigInt(process.env.PRIME);

    return convertToHex(sharedKey);
  } catch (err) {
    throw err;
  }
};

function convertToHex(number) {
  const numberString = number.toString();
  let hexString = "";

  for (let char of numberString) {
    hexString += char.charCodeAt(0).toString(16) + " ";
  }

  return hexString.trim();
}

function convertHexToInt(hexAsciiString) {
  const hexValues = hexAsciiString.split(" ");
  let originalString = "";

  for (let hex of hexValues) {
    originalString += String.fromCharCode(parseInt(hex, 16));
  }

  return parseInt(originalString, 10);
}

function convertTo128BitKey(sharedKey) {
  sharedKey = convertHexToInt(sharedKey).toString();

  let generatedKey = "";

  const keyLength = sharedKey.length;
  if (keyLength === 0) {
    return generatedKey;
  }

  for (let i = 0; i < keyLength; i++) {
    generatedKey += sharedKey[i];

    if (keyLength === 1) {
      generatedKey += "C";
    } else if (keyLength === 2) {
      generatedKey += "DD";
    } else if (keyLength === 3) {
      if (i < keyLength - 1) {
        generatedKey += sharedKey[i] + "F";
      } else {
        generatedKey += sharedKey[i];
      }
    }
  }

  while (generatedKey.length < 128) {
    generatedKey += generatedKey;
  }

  generatedKey = generatedKey.substring(0, 128);

  return generatedKey;
}

const splitMessage = (message) => {
  const blockSize = 16;
  const subMessages = [];

  for (let i = 0; i < message.length; i += blockSize) {
    let subMessage = message.substring(i, i + blockSize);
    if (subMessage.length < blockSize) {
      subMessage = subMessage.padEnd(blockSize, "@");
    }
    subMessages.push(subMessage);
  }

  return subMessages;
};

const encryptMessage = (message, secretKey) => {
  const key = crypto
    .createHash("sha256")
    .update(secretKey)
    .digest()
    .slice(0, 16);

  const subMessages = splitMessage(message);
  console.log("Sub Messages: ", subMessages);
  const encryptedMessages = subMessages.map((subMessage) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);

    let encrypted = cipher.update(subMessage, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      iv: iv.toString("hex"),
      encryptedData: encrypted,
    };
  });

  console.log("EncryptedMessage1: ", encryptedMessages);
  return encryptedMessages;
};

const decryptMessage = (encryptedMessages, secretKey) => {
  const key = crypto
    .createHash("sha256")
    .update(secretKey)
    .digest()
    .slice(0, 16);

  const decryptedMessages = encryptedMessages.map(({ encryptedData, iv }) => {
    const decipher = crypto.createDecipheriv(
      "aes-128-cbc",
      key,
      Buffer.from(iv, "hex")
    );

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  });

  const decryptedResult = decryptedMessages.join("");
  return decryptedResult.replace(/@+$/, "");
};

module.exports = router;
