import Web3Modal from "web3modal";

const providerOptions = {
  walletconnect: {
    options: {
      infuraId: "418d1d91f132479ebcc600dab6dbbd3f",
      rpc: {
        137: "https://polygon-rpc.com",
        80001: "https://rpc-mumbai.matic.today",
        5: "https://rpc.ankr.com/eth_goerli",
      },
    },
  },
};

export const getWeb3Modal = async () => {
  const web3ModalInstance = await new Web3Modal({
    network: "mainnet", // optional
    cacheProvider: true, // optional
    providerOptions, // required
  });
  return web3ModalInstance;
};
