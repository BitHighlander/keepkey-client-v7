(function () {
  const TAG = ' | InjectedScript | ';
  const VERSION = '1.0.8';
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

  function mockWalletRequest(method, params, chain, callback) {
    console.log(TAG, `Mocking wallet request: ${method}`, params, `on chain: ${chain}`);
    let mockResult = {};
    // Add mock results for common methods
    switch (method) {
      case 'eth_accounts':
        mockResult = ['0x123456789abcdef']; // Mock address
        break;
      case 'eth_chainId':
        mockResult = '0x1'; // Mainnet chain ID
        break;
      case 'eth_sendTransaction':
        mockResult = '0xmocktransactionhash'; // Mock transaction hash
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
