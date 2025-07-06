require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545", 
      accounts: ["0x1727d40e71229d432e9bb0fd843026b9a9a521fc6edc79916477d87bfb86c971"]
    }
  }
};
