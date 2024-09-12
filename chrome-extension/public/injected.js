(function () {
  const TAG = ' | InjectedScript | ';
  const VERSION = '1.0.10';
  console.log('**** KeepKey Injection script ****:', VERSION);

  // Prevent multiple injections
  if (window.keepkeyInjected) {
    console.log(TAG, 'KeepKey is already injected.');
    return;
  }
  window.keepkeyInjected = true;

  const SITE_URL = window.location.href;
  const SOURCE_INFO = {
    siteUrl: SITE_URL,
    scriptSource: 'KeepKey Extension',
    version: VERSION,
    injectedTime: new Date().toISOString(),
  };
  console.log('SOURCE_INFO:', SOURCE_INFO);

  let accountsUnlocked = false; // Track if accounts have been requested

  function mockWalletRequest(method, params, chain, callback) {
    console.log(TAG, `Mocking wallet request: ${method}`, params, `on chain: ${chain}`);
    let mockResult = {};
    // Add mock results for common methods
    switch (method) {
      case 'eth_requestAccounts':
        accountsUnlocked = true;
        mockResult = ['0x141D9959cAe3853b035000490C03991eB70Fc4aC']; // Mock address
        break;
      case 'eth_accounts':
        mockResult = accountsUnlocked ? ['0x141D9959cAe3853b035000490C03991eB70Fc4aC'] : [];
        break;
      case 'eth_chainId':
        mockResult = '0x1'; // Mainnet chain ID
        break;
      case 'eth_sendTransaction':
        mockResult = '0xmocktransactionhash'; // Mock transaction hash
        break;
      case 'eth_getBlockByNumber':
        mockResult = {
          number: '0x5f5e100', // Block number in hex
          hash: '0xmockblockhash',
          parentHash: '0xmockparenthash',
          transactions: [],
        }; // Mock block data
        break;
      case 'eth_blockNumber':
        mockResult = '0x5f5e100'; // Mock block number in hex
        break;
      case 'eth_getBalance':
        mockResult = '0xde0b6b3a7640000'; // Mock balance (1 ETH in wei)
        break;
      case 'eth_gasPrice':
        mockResult = '0x3b9aca00'; // Mock gas price (1 Gwei)
        break;
      case 'eth_estimateGas':
        mockResult = '0x5208'; // Mock gas estimate (21000)
        break;
      case 'eth_getTransactionByHash':
        mockResult = {
          hash: '0xmocktransactionhash',
          blockNumber: '0x5f5e100',
          from: '0x141D9959cAe3853b035000490C03991eB70Fc4aC',
          to: '0xanothermockaddress',
          value: '0xde0b6b3a7640000', // 1 ETH in wei
          gas: '0x5208', // 21000 gas
        }; // Mock transaction data
        break;
      case 'eth_getTransactionReceipt':
        mockResult = {
          transactionHash: '0xmocktransactionhash',
          blockNumber: '0x5f5e100',
          status: '0x1', // Success
          logs: [],
        }; // Mock transaction receipt
        break;
      case 'wallet_addEthereumChain':
        mockResult = true; // Assume chain is added
        break;
      case 'wallet_switchEthereumChain':
        mockResult = true; // Assume chain is switched
        break;
      case 'wallet_getPermissions':
      case 'wallet_requestPermissions':
        mockResult = [{ parentCapability: 'eth_accounts' }]; // Mock permissions
        break;
      case 'wallet_watchAsset':
        mockResult = true; // Mock asset addition
        break;
      default:
        mockResult = 'Mock result for ' + method;
    }

    setTimeout(() => {
      if (typeof callback === 'function') {
        callback(null, mockResult);
      }
    }, 100); // Simulate asynchronous behavior
  }

  function createWalletObject(chain) {
    console.log('Creating wallet object for chain:', chain);
    let wallet = {
      network: 'mainnet',
      isKeepKey: true,
      isMetaMask: true,
      isConnected: true,
      request: ({ method, params }) => {
        return new Promise((resolve, reject) => {
          mockWalletRequest(method, params, chain, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });
      },
      send: (payload, param1, callback) => {
        console.log('send:', { payload, param1, callback });
        if (!payload.chain) {
          payload.chain = chain;
        }
        return callback
          ? mockWalletRequest(payload.method, payload.params, chain, callback)
          : mockWalletRequest(payload.method, payload.params, chain, () => {});
      },
      sendAsync: (payload, param1, callback) => {
        console.log('sendAsync:', { payload, param1, callback });
        if (!payload.chain) {
          payload.chain = chain;
        }
        return mockWalletRequest(payload.method, payload.params, chain, callback);
      },
      on: (event, handler) => {
        console.log('Adding mock event listener for:', event);
        // Mock event listener
      },
      removeListener: (event, handler) => {
        console.log('Removing mock event listener for:', event);
        // Mock event removal
      },
    };

    if (chain === 'ethereum') {
      wallet.chainId = '0x1';
      wallet.networkVersion = '1';
    }

    return wallet;
  }

  function announceProvider(ethereumProvider) {
    const info = {
      uuid: '350670db-19fa-4704-a166-e52e178b59d4',
      name: 'KeepKey Client',
      icon: 'https://pioneers.dev/coins/keepkey.png',
      rdns: 'com.keepkey',
    };

    const announceEvent = new CustomEvent('eip6963:announceProvider', {
      detail: { info, provider: ethereumProvider },
    });

    console.log(TAG, 'Dispatching provider event with correct detail:', announceEvent);
    window.dispatchEvent(announceEvent);
  }

  function mountWallet() {
    const tag = TAG + ' | window.wallet | ';

    // Create wallet object for ethereum
    const ethereum = createWalletObject('ethereum');

    Object.defineProperty(window, 'ethereum', {
      value: ethereum,
      writable: false,
      configurable: true,
    });

    console.log(tag, 'window.ethereum has been mounted');
    announceProvider(ethereum);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    mountWallet();
  } else {
    document.addEventListener('DOMContentLoaded', mountWallet);
  }
})();
