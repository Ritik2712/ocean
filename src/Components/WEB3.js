import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: "418d1d91f132479ebcc600dab6dbbd3f",
      rpc: {
        137: "https://polygon-rpc.com",
        80001: "https://rpc-mumbai.matic.today",
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
