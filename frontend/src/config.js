export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

export const SCROLL_SEPOLIA_CONFIG = {
  chainId: "0x8274F",
  chainName: "Scroll Sepolia Testnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia-rpc.scroll.io/"],
  blockExplorerUrls: ["https://sepolia.scrollscan.com/"],
};

export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function owner() view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];
