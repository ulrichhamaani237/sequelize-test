const express = require('express');
const bodyParser = require('body-parser');
const { Blockchain, MedicalRecord } = require('./blockchain');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;
const nodeAddress = `http://localhost:${port}`;

const medicalChain = new Blockchain();

// Endpoints
app.post('/record', (req, res) => {
  const { record, signature, publicKey } = req.body;

  try {
    medicalChain.addNewRecord(record, signature, publicKey);
    res.json({ success: true, message: 'Record added to pending' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/mine', (req, res) => {
  medicalChain.minePendingRecords();
  res.json({
    success: true,
    message: 'New block mined',
    block: medicalChain.getLatestBlock()
  });
});

app.get('/chain', (req, res) => {
  res.json({
    chain: medicalChain.chain,
    length: medicalChain.chain.length
  });
});

app.get('/validate', (req, res) => {
  const isValid = medicalChain.isChainValid();
  res.json({ isValid });
});

app.post('/node', (req, res) => {
  const { nodeUrl } = req.body;
  if (!medicalChain.networkNodes.includes(nodeUrl)) {
    medicalChain.networkNodes.push(nodeUrl);
  }
  res.json({ nodes: medicalChain.networkNodes });
});

app.listen(port, () => {
  console.log(`Medical Blockchain running on ${nodeAddress}`);
});