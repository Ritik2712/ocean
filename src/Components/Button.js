import React, { useState } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";
import axios from "axios";
import slugify from "slugify";
import { Buffer } from "buffer";
const {
  ProviderInstance,
  Nft,
  generateDid,
  getHash,
  NftFactory,
  ConfigHelper,
  Config,
  ZERO_ADDRESS,
} = require("@oceanprotocol/lib");

const algorithmContainerPresets: MetadataAlgorithmContainer[] = [
  {
    image: "node",
    tag: "latest",
    entrypoint: "node $ALGO",
    checksum: "",
  },
  {
    image: "python",
    tag: "latest",
    entrypoint: "python $ALGO",
    checksum: "",
  },
];

export default function Button() {
  const [web3, setWeb3] = useState("");
  const chainId = 5;
  let accountId;
  var values = {
    user: {
      stepCurrent: 5,
      chainId: 5,
      accountId: "0x493789c3A5215672ecC6F7153f09a0ADC11A053e",
    },
    metadata: {
      nft: {
        name: "Ocean Data NFT",
        symbol: "OCEAN-NFT",
        description:
          "This NFT represents an asset in the Ocean Protocol v4 ecosystem.",
        external_url: "https://market.oceanprotocol.com",
        background_color: "141414",
        image_data:
          "data:image/svg+xml,%3Csvg viewBox='0 0 99 99' fill='undefined' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23ff409277' d='M0,99L0,27C8,24 16,22 25,21C33,19 42,17 50,20C57,22 64,29 72,31C79,32 89,27 99,23L99,99Z'/%3E%3Cpath fill='%23ff4092bb' d='M0,99L0,49C8,52 17,55 26,55C34,54 41,49 50,46C58,42 66,40 75,41C83,41 91,44 99,48L99,99Z'%3E%3C/path%3E%3Cpath fill='%23ff4092ff' d='M0,99L0,72C8,74 16,76 24,77C31,77 36,74 46,73C55,71 67,69 77,69C86,68 92,69 99,71L99,99Z'%3E%3C/path%3E%3C/svg%3E",
      },
      transferable: true,
      type: "dataset",
      name: "news2", //set by user
      author: "ICHIGO2", //set by user
      description: "new Descrtipn", //set by user
      tags: [
        //set by user
        "new",
      ],
      termsAndConditions: true,
      dockerImage: "",
      dockerImageCustom: "",
      dockerImageCustomTag: "",
      dockerImageCustomEntrypoint: "",
    },
    services: [
      {
        files: [
          {
            url: "https://opengraph.githubassets.com/22c20ea862d4ab46dbca607dcd3f1698cddc35fa9f0db3554a0d8b8fa5d620eb/oceanprotocol/ocean-faucet",
            contentLength: "48050",
            contentType: "image/png",
            index: 0,
            valid: true,
          },
        ],
        links: [
          {
            url: "",
            type: "",
          },
        ],
        dataTokenOptions: {
          name: "Propitious Fugu Token",
          symbol: "PROFUG-19",
        },
        timeout: "Forever",
        access: "access",
        providerUrl: {
          url: "https://v4.provider.goerli.oceanprotocol.com",
          valid: true,
          custom: false,
        },
        computeOptions: {
          allowRawAlgorithm: false,
          allowNetworkAccess: true,
          publisherTrustedAlgorithmPublishers: [],
          publisherTrustedAlgorithms: [],
        },
        algorithmPrivacy: false,
      },
    ],
    pricing: {
      baseToken: {
        address: "0xcfdda22c9837ae76e0faa845354f33c62e03653a", // keep same
        symbol: "OCEAN",
        name: "Ocean Token",
        decimals: 18,
      },
      price: 1,
      type: "free",
      freeAgreement: false,
      amountDataToken: 1000,
    },
  };

  // functions

  // getEncryptedFiles
  async function getEncryptedFiles(files, providerUrl) {
    try {
      // https://github.com/oceanprotocol/provider/blob/v4main/API.md#encrypt-endpoint
      console.log(107);
      const response = await ProviderInstance.encrypt(files, providerUrl);
      console.log(109);
      return response;
    } catch (error) {
      console.error(
        "Error in getEncryptedFiles parsing json: " + error.message
      );
    }
  }

  async function getFileUrlInfo(url, providerUrl) {
    console.log("getFileUrlInfo");
    try {
      console.log(121);
      const response = await ProviderInstance.checkFileUrl(url, providerUrl);
      console.log(123);
      return response;
    } catch (error) {
      console.error("fileinfo", error.message);
    }
  }

  function mapTimeoutStringToSeconds(timeout) {
    console.log("mapTimeoutStringToSeconds");
    switch (timeout) {
      case "Forever":
        return 0;
      case "1 day":
        return 86400;
      case "1 week":
        return 604800;
      case "1 month":
        return 2630000;
      case "1 year":
        return 31556952;
      default:
        return 0;
    }
  }

  // nftFactory; // reference @context/web3.ts
  function nftFactory() {
    var chainId = 5;
    console.log(web3);
    if (!web3 || !chainId) return;
    const config = getOceanConfig(chainId);
    console.log(146, config);
    const factory = new NftFactory(config?.nftFactoryAddress, web3);
    console.log("factory", factory);
    return factory;
  }

  // getOceanConfig
  // import contractAddresses from '@oceanprotocol/contracts/artifacts/address.json'

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

  // createTokensAndPricing
  async function createTokensAndPricing(
    values,
    accountId,
    config,
    nftFactory,
    web3
  ) {
    console.log(179);
    const nftCreateData = generateNftCreateData(
      values.metadata.nft,
      accountId,
      values.metadata.transferable
    );

    console.log(197);

    // TODO: cap is hardcoded for now to 1000, this needs to be discussed at some point
    const ercParams = {
      templateIndex: 2,
      minter: accountId,
      paymentCollector: accountId,
      mpFeeAddress: "0x9984b2453eC7D99a73A5B3a46Da81f197B753C8d", //marketFeeAddress, // 0x9984b2453eC7D99a73A5B3a46Da81f197B753C8d
      feeToken: values.pricing.baseToken.address,
      feeAmount: "0", //publisherMarketOrderFee,  //Discuss
      // max number
      cap: "115792089237316195423570985008687907853269984665640564039457",
      name: values.services[0].dataTokenOptions.name,
      symbol: values.services[0].dataTokenOptions.symbol,
    };
    console.log(212);

    let erc721Address, datatokenAddress, txHash;

    switch (values.pricing.type) {
      default:
        break;
      case "fixed": {
        const freParams = {
          fixedRateAddress: config.fixedRateExchangeAddress,
          baseTokenAddress: values.pricing.baseToken.address,
          owner: accountId,
          marketFeeCollector: "0x9984b2453eC7D99a73A5B3a46Da81f197B753C8d", // marketFeeAddress, //0x9984b2453eC7D99a73A5B3a46Da81f197B753C8d
          baseTokenDecimals: values.pricing.baseToken.decimals,
          datatokenDecimals: 18,
          fixedRate: values.pricing.price.toString(),
          marketFee: "0", // publisherMarketFixedSwapFee, // '0' //Discuss
          withMint: true,
        };
        console.log("231");
        const result = await nftFactory.createNftWithDatatokenWithFixedRate(
          accountId,
          nftCreateData,
          ercParams,
          freParams
        );
        console.log("238");
        erc721Address = result.events.NFTCreated.returnValues[0];
        datatokenAddress = result.events.TokenCreated.returnValues[0];
        txHash = result.transactionHash;

        console.log("[publish] createNftErcWithFixedRate tx", txHash);

        break;
      }
      case "free": {
        // maxTokens -  how many tokens cand be dispensed when someone requests . If maxTokens=2 then someone can't request 3 in one tx
        // maxBalance - how many dt the user has in it's wallet before the dispenser will not dispense dt
        // both will be just 1 for the market
        const dispenserParams = {
          dispenserAddress: config.dispenserAddress,
          maxTokens: web3.utils.toWei("1"),
          maxBalance: web3.utils.toWei("1"),
          withMint: true,
          allowedSwapper: ZERO_ADDRESS,
        };
        console.log(259);

        const result = await nftFactory.createNftWithDatatokenWithDispenser(
          accountId,
          nftCreateData,
          ercParams,
          dispenserParams
        );
        console.log(266);
        erc721Address = result.events.NFTCreated.returnValues[0];
        datatokenAddress = result.events.TokenCreated.returnValues[0];
        txHash = result.transactionHash;
        break;
      }
    }

    return { erc721Address, datatokenAddress, txHash };
  }

  // getAlgorithmContainerPreset
  async function getContainerChecksum(image, tag) {
    console.log("getContainerChecksum");
    const containerInfo = {
      exists: false,
      checksum: null,
    };
    try {
      console.log(285);
      const response = await axios.post(
        `https://dockerhub-proxy.oceanprotocol.com`,
        {
          image,
          tag,
        }
      );
      console.log(293);
      if (
        !response ||
        response.status !== 200 ||
        response.data.status !== "success"
      ) {
        console.error(
          "Could not fetch docker hub image informations. If you have it hosted in a 3rd party repository please fill in the container checksum manually."
        );
        return containerInfo;
      }
      containerInfo.exists = true;
      containerInfo.checksum = response.data.result.checksum;
      return containerInfo;
    } catch (error) {
      console.error(error.message);
      console.error(
        "Could not fetch docker hub image informations. If you have it hosted in a 3rd party repository please fill in the container checksum manually."
      );
      return containerInfo;
    }
  }
  async function getAlgorithmContainerPreset(dockerImage) {
    if (dockerImage === "") return;

    const preset = algorithmContainerPresets.find(
      (preset) => `${preset.image}:${preset.tag}` === dockerImage
    );
    console.log(321);
    preset.checksum = await (
      await getContainerChecksum(preset.image, preset.tag)
    ).checksum;
    console.log(325);
    return preset;
  }

  // transformPublishFormToDdo
  function dateToStringNoMS(date) {
    return date.toISOString().replace(/\.[0-9]{3}Z/, "Z");
  }
  function transformTags(originalTags) {
    const transformedTags = originalTags?.map((tag) =>
      slugify(tag).toLowerCase()
    );
    return transformedTags;
  }
  function getUrlFileExtension(fileUrl) {
    const splittedFileUrl = fileUrl.split(".");
    return splittedFileUrl[splittedFileUrl.length - 1];
  }
  async function transformPublishFormToDdo(
    values,
    // Those 2 are only passed during actual publishing process
    // so we can always assume if they are not passed, we are on preview.
    datatokenAddress,
    nftAddress
  ) {
    const { metadata, services, user } = values;
    const { chainId, accountId } = user;
    const {
      type,
      name,
      description,
      tags,
      author,
      termsAndConditions,
      dockerImage,
      dockerImageCustom,
      dockerImageCustomTag,
      dockerImageCustomEntrypoint,
      dockerImageCustomChecksum,
    } = metadata;
    const { access, files, links, providerUrl, timeout } = services[0];

    const did = nftAddress ? generateDid(nftAddress, chainId) : "0x...";
    const currentTime = dateToStringNoMS(new Date());
    const isPreview = !datatokenAddress && !nftAddress;
    console.log(370);
    const algorithmContainerPresets =
      type === "algorithm" && dockerImage !== "" && dockerImage !== "custom"
        ? await getAlgorithmContainerPreset(dockerImage)
        : null;
    console.log(375);
    // Transform from files[0].url to string[] assuming only 1 file
    const filesTransformed = files?.length &&
      files[0].valid && [sanitizeUrl(files[0].url)];
    const linksTransformed = links?.length &&
      links[0].valid && [sanitizeUrl(links[0].url)];

    const newMetadata = {
      created: currentTime,
      updated: currentTime,
      type,
      name,
      description,
      tags: transformTags(tags),
      author,
      license: "https://market.oceanprotocol.com/terms",
      links: linksTransformed,
      additionalInformation: {
        termsAndConditions,
      },
      ...(type === "algorithm" &&
        dockerImage !== "" && {
          algorithm: {
            language: filesTransformed?.length
              ? getUrlFileExtension(filesTransformed[0])
              : "",
            version: "0.1",
            container: {
              entrypoint:
                dockerImage === "custom"
                  ? dockerImageCustomEntrypoint
                  : algorithmContainerPresets.entrypoint,
              image:
                dockerImage === "custom"
                  ? dockerImageCustom
                  : algorithmContainerPresets.image,
              tag:
                dockerImage === "custom"
                  ? dockerImageCustomTag
                  : algorithmContainerPresets.tag,
              checksum:
                dockerImage === "custom"
                  ? dockerImageCustomChecksum
                  : algorithmContainerPresets.checksum,
            },
          },
        }),
    };

    // this is the default format hardcoded
    const file = {
      nftAddress,
      datatokenAddress,
      files: [
        {
          type: "url",
          index: 0,
          url: files[0].url,
          method: "GET",
        },
      ],
    };
    console.log(437);
    const filesEncrypted =
      !isPreview &&
      files?.length &&
      files[0].valid &&
      (await getEncryptedFiles(file, providerUrl.url));
    console.log(443);

    const newService = {
      id: getHash(datatokenAddress + filesEncrypted),
      type: access,
      files: filesEncrypted || "",
      datatokenAddress,
      serviceEndpoint: providerUrl.url,
      timeout: mapTimeoutStringToSeconds(timeout),
      ...(access === "compute" && {
        compute: values.services[0].computeOptions,
      }),
    };

    const newDdo = {
      "@context": ["https://w3id.org/did/v1"],
      id: did,
      nftAddress,
      version: "4.1.0",
      chainId,
      metadata: newMetadata,
      services: [newService],
      // Only added for DDO preview, reflecting Asset response,
      // again, we can assume if `datatokenAddress` is not passed,
      // we are on preview.
      ...(!datatokenAddress && {
        datatokens: [
          {
            name: values.services[0].dataTokenOptions.name,
            symbol: values.services[0].dataTokenOptions.symbol,
          },
        ],
        nft: {
          ...generateNftCreateData(values?.metadata.nft, accountId),
        },
      }),
    };

    return newDdo;
  }

  // generateNftCreateData
  function generateNftCreateData(nftMetadata, accountId, transferable = true) {
    console.log("generateNftCreateData");
    const nftCreateData = {
      name: nftMetadata.name,
      symbol: nftMetadata.symbol,
      templateIndex: 1,
      tokenURI: "",
      transferable,
      owner: accountId,
    };

    return nftCreateData;
  }

  // sanitizeUrl
  function sanitizeUrl(url) {
    console.log("sanitizeUrl");
    const u = decodeURI(url).trim().toLowerCase();
    const isAllowedUrlScheme =
      u.startsWith("http://") || u.startsWith("https://");
    return isAllowedUrlScheme ? url : "about:blank";
  }

  // abortController
  const abortController = () => {
    const axiosSource = undefined;
    console.log("ok");
    if (axiosSource.current) {
      console.log("I am null");
      axiosSource.current.abort();
      return;
    }
    console.log("I am not null");
    const newAbortController = () => {
      axiosSource.current = new AbortController();
      console.log(axiosSource);
      return axiosSource.current.signal;
    };
    return newAbortController;
  };

  // setNFTMetadataAndTokenURI
  async function setNFTMetadataAndTokenURI(
    asset,
    accountId,
    web,
    nftMetadata,
    signal
  ) {
    console.log(527);
    const encryptedDdo = await ProviderInstance.encrypt(
      asset,
      asset.services[0].serviceEndpoint,
      signal
    );
    console.log(533);

    const metadataHash = getHash(JSON.stringify(asset));

    // add final did to external_url and asset link to description in nftMetadata before encoding
    const externalUrl = `${nftMetadata.external_url}/asset/${asset.id}`;
    const encodedMetadata = Buffer.from(
      // Discuss Don't Know
      JSON.stringify({
        ...nftMetadata,
        description: `${nftMetadata.description}\n\nView on Ocean Market: ${externalUrl}`,
        external_url: externalUrl,
      })
    ).toString("base64");
    const nft = new Nft(web3);

    // theoretically used by aquarius or provider, not implemented yet, will remain hardcoded
    const flags = "0x02";

    const metadataAndTokenURI = {
      metaDataState: 0,
      metaDataDecryptorUrl: asset.services[0].serviceEndpoint,
      metaDataDecryptorAddress: "",
      flags,
      data: encryptedDdo,
      metaDataHash: "0x" + metadataHash,
      tokenId: 1,
      tokenURI: `data:application/json;base64,${encodedMetadata}`,
      metadataProofs: [],
    };
    console.log(563);
    const setMetadataAndTokenURITx = await nft.setMetadataAndTokenURI(
      asset.nftAddress,
      accountId,
      metadataAndTokenURI
    );
    console.log(569);

    return setMetadataAndTokenURITx;
  }

  async function create(values) {
    try {
      var chainId = 5;
      const config = getOceanConfig(chainId);
      console.log("[publish] using config: ", config);
      console.log(556);
      console.log(580);
      const { erc721Address, datatokenAddress, txHash } =
        await createTokensAndPricing(
          values,
          accountId,
          config,
          nftFactory(),
          web3
        );
      console.log(589);

      const isSuccess = Boolean(erc721Address && datatokenAddress && txHash);
      if (!isSuccess) throw new Error("No Token created. Please try again.");

      return { erc721Address, datatokenAddress };
    } catch (error) {
      console.error("[publish] createFun error", error.message);
      if (error.message.length > 65) {
        error.message = "No Token created. Please try again.";
      }
    }
  }

  async function publish(values, ddo, ddoEncrypted) {
    try {
      if (!ddo || !ddoEncrypted)
        throw new Error("No DDO received. Please try again.");
      console.log(607);
      const controller = new AbortController();
      const res = await setNFTMetadataAndTokenURI(
        ddo,
        accountId,
        web3,
        values.metadata.nft,
        controller.signal
        // abortController()
      );
      console.log(615);
      if (!res?.transactionHash)
        throw new Error(
          "Metadata could not be written into the NFT. Please try again."
        );

      console.log("[publish] setMetadata result", res);

      return { did: ddo.id };
    } catch (error) {
      console.error("[publish] publishfun error", error.message);
    }
  }

  async function encrypt(values, erc721Address, datatokenAddress) {
    try {
      if (!datatokenAddress || !erc721Address)
        throw new Error("No NFT or Datatoken received. Please try again.");
      console.log(633);
      const ddo = await transformPublishFormToDdo(
        values,
        datatokenAddress,
        erc721Address
      );
      console.log(639);
      if (!ddo) throw new Error("No DDO received. Please try again.");
      console.log(641);
      console.log(ddo);
      console.log(values.services[0].providerUrl.url);
      const Ddo = {
        "@context": ["https://w3id.org/did/v1"],
        id: "did:op:276f108ce823578478a1754867b72dcefd1518c110302b3c814bbffe49eddee5",
        nftAddress: "0x0CEfCA7dEae32AC9C5699be9Ceb3Cd9Fee0D7754",
        version: "4.1.0",
        chainId: 5,
        metadata: {
          created: "2022-10-29T11:17:31Z",
          updated: "2022-10-29T11:17:31Z",
          type: "dataset",
          name: "news",
          description: "new Descrtipn",
          tags: ["new"],
          author: "ICHIGO",
          license: "https://market.oceanprotocol.com/terms",
          additionalInformation: {
            termsAndConditions: true,
          },
        },
        services: [
          {
            id: "85429bf78510c6005dbdb91627b85dadd0ae4e539655b85bd4440a05c9e6ca5d",
            type: "access",
            files:
              "0x04fe6beffe72834c4f3158f6d3f31fdf9e7f89e22d3bbec18bc5b186a8610bbcb6f539aceeced83acf8d8cc8fff6317e449d4a567f3209a20f49dfcaadfe950c444f2a99cdc7b5f95fe5c36a76636417e0167d06eb2fa69544819a04231ccb5c2e9e40de27b1336bad1b4eb00c1aab9982e369fc716f02639ed08e9e2c726929a6d1d3987fe378e56dc1ab2a269c532d3e0d3aadc9bbfc29cc0bb20c4cd7c60cd3d1741801ac5b4135a14474ac709d9e1b29906c52346e4c849ef6936eeb34b9956becd98c7f637424709274f3635046835a67aba30e7aaf176c07df01b15bb2bbf0b5d24f95fed6f6b9abca2816b54bc9f4770e10c41f3ad4cabe27494c5a5723919d65c40bdb29c76c8efda9e63d11645b9e4734585c94fe451aebdee7cc0d6ba553a5ee0309f54ff15dfbaddd38e864c635d3729d1892a022455fcd2c5da8aa09de85c76bc5242ae0989ee43328570fa73c6149dc822aaf74063342fc60964796538967dfda1c474e8106e8bd1f2a0ac40d36f5cfc20070d577e96ec21d84f43ea6c660ad91ebc94ae73f595f49064e6a529168",
            datatokenAddress: "0x9712d2Acfc5A99a769a536981862054C7269A572",
            serviceEndpoint: "https://v4.provider.goerli.oceanprotocol.com",
            timeout: 0,
          },
        ],
      };
      const controller = new AbortController();
      const ddoEncrypted = await ProviderInstance.encrypt(
        Ddo,
        values.services[0].providerUrl.url,
        controller.signal
        // abortController()
      );
      console.log(647);

      if (!ddoEncrypted)
        throw new Error("No encrypted DDO received. Please try again.");
      console.log("[publish] Got encrypted DDO", ddoEncrypted);

      return { ddo, ddoEncrypted };
    } catch (error) {
      console.error("[publish] encrypyfun error", JSON.stringify(error));
    }
  }

  // Steps of publishing content 590
  // PARAMETERS: _erc721Address,_datatokenAddress,_ddo,_ddoEncrypted,_did
  async function PUBLISHVIDEOS() {
    const { erc721Address, datatokenAddress } = await create(values);

    const { ddo, ddoEncrypted } = await encrypt(
      values,
      erc721Address,
      datatokenAddress
    );

    await publish(values, ddo, ddoEncrypted);
  }
  const ConnectWallet = async () => {
    const web3Modal = new Web3Modal({
      network: "mainnet", // optional
      cacheProvider: true, // optional
      providerOptions: {}, // required
    });
    console.log(web3Modal);
    try {
      const provider = await web3Modal.connect();
      const web = new Web3(provider);
      var account = await web.eth.getAccounts();
      accountId = account[0];
      values.user.accountId = accountId;
      console.log("aid", accountId);
      setWeb3(web);
      console.log(web);
      PUBLISHVIDEOS();
    } catch (e) {
      console.log("Oh noooo", e);
    }
  };
  return (
    <div>
      <button onClick={ConnectWallet}>Collect wallet</button>
    </div>
  );
}
