require("@nomicfoundation/hardhat-ethers"); // core Hardhat + ethers support
// require("@nomiclabs/hardhat-etherscan");    // if you plan to verify contractstoolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    scrollSepolia: {
      url: process.env.SCROLL_SEPOLIA_RPC || "https://sepolia-rpc.scroll.io/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 534351,
    },
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
