import axios from "axios";
import React, { useState } from "react";
import Web3 from "web3";
import Decimal from "decimal.js";
import {
  FixedRateExchange,
  Datatoken,
  approve,
  downloadFileBrowser,
  ConfigHelper,
  LoggerInstance,
  amountToUnits,
  ProviderInstance,
  ZERO_ADDRESS,
} from "@oceanprotocol/lib";
import { createClient, gql, dedupExchange, fetchExchange } from "urql";
import { refocusExchange } from "@urql/exchange-refocus";
import { getWeb3Modal } from "./WEB3";

export default function Download() {
  const tokenPriceQuery = gql`
    query TokenPriceQuery($datatokenId: ID!, $account: String) {
      token(id: $datatokenId) {
        id
        symbol
        name
        publishMarketFeeAddress
        publishMarketFeeToken
        publishMarketFeeAmount
        orders(
          where: { payer: $account }
          orderBy: createdTimestamp
          orderDirection: desc
        ) {
          tx
          serviceIndex
          createdTimestamp
          reuses(orderBy: createdTimestamp, orderDirection: desc) {
            id
            caller
            createdTimestamp
            tx
            block
          }
        }
        dispensers {
          id
          active
          isMinter
          maxBalance
          token {
            id
            name
            symbol
          }
        }
        fixedRateExchanges {
          id
          exchangeId
          price
          publishMarketSwapFee
          baseToken {
            symbol
            name
            address
            decimals
          }
          datatoken {
            symbol
            name
            address
          }
          active
        }
      }
    }
  `;
  const newCancelToken = axios.CancelToken.source();
  const token = newCancelToken.token;
  const did =
    "did:op:0166587981a1dd52ce29078b30e601e366877882ac72a397dd782145021fe6cd";
  var isOwned = false;
  const getAsset = async (token) => {
    console.log("getAsset");
    return await retrieveAsset(did, token);
  };
  const asset = getAsset(token);
  const [web3, setWeb3] = useState("");
  var validOrderTx = "";
  var accountId;
  async function retrieveAsset(did, cancelToken) {
    console.log("retrieveAsset");
    try {
      const response = await axios.get(
        `https://v4.aquarius.oceanprotocol.com/api/aquarius/assets/ddo/${did}`,
        { cancelToken }
      );
      if (!response || response.status !== 200 || !response.data) return;

      var data = { ...response.data };
      const accessDetails = await getAccessDetails(
        data.chainId,
        data.services[0].datatokenAddress,
        data.services[0].timeout,
        accountId
      );
      data = {
        ...data,
        accessDetails,
      };
      console.log("asset", data);
      return data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log(error.message);
      } else {
        console.error(error.message);
      }
    }
  }
  async function getAccessDetails(
    chainId,
    datatokenAddress,
    timeout,
    account = ""
  ) {
    console.log("getAccessDetails");
    try {
      const queryContext = getQueryContext(Number(chainId));
      const tokenQueryResult = await fetchData(
        tokenPriceQuery,
        {
          datatokenId: datatokenAddress.toLowerCase(),
          account: account?.toLowerCase(),
        },
        queryContext
      );

      const tokenPrice: TokenPrice = tokenQueryResult.data.token;
      const accessDetails = getAccessDetailsFromTokenPrice(tokenPrice, timeout);
      return accessDetails;
    } catch (error) {
      LoggerInstance.error("Error getting access details: ", error.message);
    }
  }
  const ConnectWallet = async () => {
    console.log("connectWallet");
    const web3Modal = await getWeb3Modal();
    console.log(web3Modal);
    try {
      const provider = await web3Modal.connect();
      const web = new Web3(provider);
      var account = await web.eth.getAccounts();
      accountId = account[0];
      setWeb3(web);
      handleOrderOrDownload();
      console.log(web);
    } catch (e) {
      console.log("Oh noooo", e);
    }
  };
  async function handleOrderOrDownload() {
    console.log("handleOrderordownload");
    const Asset = await asset;
    try {
      if (isOwned) {
        console.log(1);
        await downloadFile(web3, Asset, accountId, validOrderTx);
      } else {
        console.log(2, Asset);
        const orderprice = await getOrderPriceAndFees(Asset, ZERO_ADDRESS);
        console.log("Price", orderprice);
        const orderTx = await order(web3, Asset, orderprice, accountId);
        if (!orderTx) {
          throw new Error();
        }
        isOwned = true;
        validOrderTx = orderTx.transactionHash;
      }
    } catch (error) {
      LoggerInstance.error(error);
    }
  }
  async function downloadFile(web3, asset, accountId, validOrderTx) {
    console.log("downloadFile");
    console.log(3);
    const downloadUrl = await ProviderInstance.getDownloadUrl(
      asset.id,
      accountId,
      asset.services[0].id,
      0,
      validOrderTx || asset.accessDetails.validOrderTx,
      asset.services[0].serviceEndpoint,
      web3
    );
    console.log(downloadUrl);
    console.log(4);
    await downloadFileBrowser(downloadUrl);
  }
  function getQueryContext(chainId: number): OperationContext {
    console.log("getQueryContext");
    try {
      const queryContext: OperationContext = {
        url: `${getSubgraphUri(
          Number(chainId)
        )}/subgraphs/name/oceanprotocol/ocean-subgraph`,
        requestPolicy: "network-only",
      };
      return queryContext;
    } catch (error) {
      LoggerInstance.error("Get query context error: ", error.message);
    }
  }
  function getSubgraphUri(chainId: number): string {
    console.log("getSubgraphUri");
    const config = getOceanConfig(chainId);
    return config.subgraphUri;
  }
  function getOceanConfig(network) {
    console.log("getOceanConfig");
    const config = new ConfigHelper().getConfig(
      network,
      network === "polygon" ||
        network === "moonbeamalpha" ||
        network === 1287 ||
        network === "bsc" ||
        network === 56 ||
        network === "gaiaxtestnet" ||
        network === 2021000
        ? undefined
        : process.env.NEXT_PUBLIC_INFURA_PROJECT_ID
    );
    return config;
  }
  async function fetchData(
    query: TypedDocumentNode,
    variables: any,
    context: OperationContext
  ): Promise<any> {
    console.log("fetchData");
    try {
      const client = getUrqlClientInstance();
      console.log(6);
      const response = await client
        .query(query, variables, context)
        .toPromise();
      return response;
    } catch (error) {
      LoggerInstance.error("Error fetchData: ", error.message);
    }
    return null;
  }
  function getUrqlClientInstance() {
    console.log("getUrqlClientInstance");
    const oceanConfig = getOceanConfig(1);
    if (!oceanConfig?.subgraphUri) {
      console.error(
        "No subgraphUri defined, preventing UrqlProvider from initialization."
      );
      return;
    }

    return createUrqlClient(oceanConfig.subgraphUri);
  }
  async function order(
    web3,
    asset,
    orderPriceAndFees,
    accountId,
    providerFees,
    computeConsumerAddress
  ) {
    console.log("order", asset);
    const datatoken = new Datatoken(web3);
    const config = getOceanConfig(asset.chainId);
    console.log(7);
    const initializeData =
      !providerFees &&
      (await ProviderInstance.initialize(
        asset.id,
        asset.services[0].id,
        0,
        accountId,
        asset.services[0].serviceEndpoint
      ));

    const orderParams = {
      consumer: computeConsumerAddress || accountId,
      serviceIndex: 0,
      _providerFee: providerFees || initializeData.providerFee,
      _consumeMarketFee: {
        consumeMarketFeeAddress: "0x9984b2453eC7D99a73A5B3a46Da81f197B753C8d",
        consumeMarketFeeAmount: "0",
        consumeMarketFeeToken: asset?.accessDetails?.baseToken?.address,
      },
    };

    switch ("fixed") {
      case "fixed": {
        // this assumes all fees are in ocean
        console.log(8);
        let txApprove;
        console.log(orderPriceAndFees);
        let amountToUnit = await amountToUnits(
          web3,
          asset?.accessDetails?.baseToken?.address,
          orderPriceAndFees.price
        );
        console.log(amountToUnit);
        try {
          txApprove = await approve(
            web3,
            config,
            accountId,
            asset.accessDetails.baseToken.address,
            asset.accessDetails.datatoken.address,
            amountToUnit,
            false
          );
        } catch (e) {
          console.log(JSON.stringify(e));
        }

        console.log(8.1);
        // if (!txApprove) {
        //   return;
        // }

        const freParams = {
          exchangeContract: config.fixedRateExchangeAddress,
          exchangeId: asset.accessDetails.addressOrId,
          maxBaseTokenAmount: orderPriceAndFees.price,
          baseTokenAddress: asset.accessDetails.baseToken.address,
          baseTokenDecimals: asset.accessDetails.baseToken.decimals || 18,
          swapMarketFee: "0",
          marketFeeAddress: "0x9984b2453eC7D99a73A5B3a46Da81f197B753C8d",
        };
        console.log(9, accountId, orderParams, freParams);
        const tx = await datatoken.buyFromFreAndOrder(
          asset.accessDetails.datatoken.address,
          accountId,
          orderParams,
          freParams
        );

        return tx;
      }
      case "free": {
        console.log(10);
        const tx = await datatoken.buyFromDispenserAndOrder(
          asset.services[0].datatokenAddress,
          accountId,
          orderParams,
          config.dispenserAddress
        );
        return tx;
      }
      default:
        alert("wrong type");
    }
  }
  function getAccessDetailsFromTokenPrice(
    tokenPrice: TokenPrice | TokensPrice,
    timeout?: number
  ): AccessDetails {
    console.log("getAccessDetailsFormTokenPrice");
    const accessDetails = {};

    // Return early when no supported pricing schema found.
    if (
      tokenPrice?.dispensers?.length === 0 &&
      tokenPrice?.fixedRateExchanges?.length === 0
    ) {
      accessDetails.type = "NOT_SUPPORTED";
      return accessDetails;
    }

    if (tokenPrice?.orders?.length > 0) {
      const order = tokenPrice.orders[0];
      const reusedOrder = order?.reuses?.length > 0 ? order.reuses[0] : null;
      // asset is owned if there is an order and asset has timeout 0 (forever) or if the condition is valid
      accessDetails.isOwned =
        timeout === 0 || Date.now() / 1000 - order?.createdTimestamp < timeout;
      // the last valid order should be the last reuse order tx id if there is one
      accessDetails.validOrderTx = reusedOrder?.tx || order?.tx;
    }

    // TODO: fetch order fee from sub query
    accessDetails.publisherMarketOrderFee = tokenPrice?.publishMarketFeeAmount;

    // free is always the best price
    if (tokenPrice?.dispensers?.length > 0) {
      const dispenser = tokenPrice.dispensers[0];
      accessDetails.type = "free";
      accessDetails.addressOrId = dispenser.token.id;
      accessDetails.price = "0";
      accessDetails.isPurchasable = dispenser.active;
      accessDetails.datatoken = {
        address: dispenser.token.id,
        name: dispenser.token.name,
        symbol: dispenser.token.symbol,
      };
    }

    // checking for fixed price
    if (tokenPrice?.fixedRateExchanges?.length > 0) {
      const fixed = tokenPrice.fixedRateExchanges[0];
      accessDetails.type = "fixed";
      accessDetails.addressOrId = fixed.exchangeId;
      accessDetails.price = fixed.price;
      // in theory we should check dt balance here, we can skip this because in the market we always create fre with minting capabilities.
      accessDetails.isPurchasable = fixed.active;
      accessDetails.baseToken = {
        address: fixed.baseToken.address,
        name: fixed.baseToken.name,
        symbol: fixed.baseToken.symbol,
        decimals: fixed.baseToken.decimals,
      };
      accessDetails.datatoken = {
        address: fixed.datatoken.address,
        name: fixed.datatoken.name,
        symbol: fixed.datatoken.symbol,
      };
    }

    return accessDetails;
  }
  function createUrqlClient(subgraphUri: string) {
    const client = createClient({
      url: `${subgraphUri}/subgraphs/name/oceanprotocol/ocean-subgraph`,
      exchanges: [dedupExchange, refocusExchange(), fetchExchange],
    });
    return client;
  }
  async function getOrderPriceAndFees(asset, accountId, providerFees) {
    console.log("getOrderPriceAndFees");
    const orderPriceAndFee = {
      price: "0",
      publisherMarketOrderFee: "0",
      publisherMarketFixedSwapFee: "0",
      consumeMarketOrderFee: "0",
      consumeMarketFixedSwapFee: "0",
      providerFee: {
        providerFeeAmount: "0",
      },
      opcFee: "0",
    };

    // fetch provider fee
    console.log(11);
    const initializeData =
      !providerFees &&
      (await ProviderInstance.initialize(
        asset?.id,
        asset?.services[0].id,
        0,
        accountId,
        asset?.services[0].serviceEndpoint
      ));
    orderPriceAndFee.providerFee = providerFees || initializeData.providerFee;

    // fetch price and swap fees
    if (asset?.accessDetails?.type === "fixed") {
      console.log(12);
      const fixed = await getFixedBuyPrice(
        asset?.accessDetails,
        asset?.chainId
      );
      orderPriceAndFee.price = fixed.baseTokenAmount;
      orderPriceAndFee.opcFee = fixed.oceanFeeAmount;
      orderPriceAndFee.publisherMarketFixedSwapFee = fixed.marketFeeAmount;
      orderPriceAndFee.consumeMarketFixedSwapFee = fixed.consumeMarketFeeAmount;
    }

    // calculate full price, we assume that all the values are in ocean, otherwise this will be incorrect
    orderPriceAndFee.price = new Decimal(+orderPriceAndFee.price || 0)
      .add(new Decimal(+orderPriceAndFee?.consumeMarketOrderFee || 0))
      .add(new Decimal(+orderPriceAndFee?.publisherMarketOrderFee || 0))
      .toString();

    return orderPriceAndFee;
  }
  async function getFixedBuyPrice(accessDetails, chainId, web3) {
    console.log("getFixedBuyPrice");
    if (!web3 && !chainId)
      throw new Error("web3 and chainId can't be undefined at the same time!");

    if (!web3) {
      console.log(13);
      web3 = await getDummyWeb3(chainId);
    }

    const config = getOceanConfig(chainId);
    console.log("d'", config.fixedRateExchangeAddress);

    const fixed = new FixedRateExchange(config.fixedRateExchangeAddress, web3);
    console.log(14, fixed);

    const estimatedPrice = await fixed.calcBaseInGivenDatatokensOut(
      accessDetails.addressOrId,
      "1",
      "0"
    );
    return estimatedPrice;
  }
  async function getDummyWeb3(chainId: number): Promise<Web3> {
    console.log("getDummyWeb3");
    const config = getOceanConfig(chainId);
    return new Web3(config.nodeUri);
  }
  return <button onClick={ConnectWallet}>Download</button>;
}
