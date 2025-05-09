const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require("@simplewebauthn/server");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

let users = {}; // Simule une "base de données" d'utilisateurs

app.post("/generate-registration-options", (req, res) => {
  const { username } = req.body;
  const userId = username;

  const options = generateRegistrationOptions({
    rpName: "Blockchain Médicale",
    rpID: "localhost",
    userID: userId,
    userName: username,
    timeout: 60000,
    attestationType: "none",
    authenticatorSelection: {
      userVerification: "preferred",
    },
  });

  users[userId] = {
    username,
    credentials: [],
    currentChallenge: options.challenge,
  };

  res.json(options);
});

app.post("/verify-registration", async (req, res) => {
  const { username, attestationResponse } = req.body;
  const user = users[username];

  const expectedChallenge = user.currentChallenge;

  try {
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge,
      expectedOrigin: "http://localhost:3000",
      expectedRPID: "localhost",
    });

    if (verification.verified) {
      user.credentials.push(verification.registrationInfo);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

app.listen(port, () => {
  console.log(`Serveur WebAuthn sur http://localhost:${port}`);
});
