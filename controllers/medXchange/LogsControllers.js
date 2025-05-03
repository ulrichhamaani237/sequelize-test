require("dotenv").config();
const { query } = require("../../config/db");
 const logs = async (req, res) => {
    try {
      const logs = await  query("SELECT * FROM logs");
      res.json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ message: 'Error fetching logs' });
    }
  };

  module.exports = {logs};