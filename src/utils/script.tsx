import {
    AddressType,
    addressContentsToLockingBytecode,
    lockingBytecodeToCashAddress,
  } from '@bitauth/libauth';
  import { Network } from 'cashscript'; 
  import {
    hash160,
    Script,
    scriptToBytecode,
  } from '@cashscript/utils';
  
  export function getNetworkPrefix(network: string): 'bitcoincash' | 'bchtest' | 'bchreg' {
    switch (network) {
      case Network.MAINNET:
        return 'bitcoincash';
      case Network.TESTNET:
        return 'bchtest';
      case Network.REGTEST:
        return 'bchreg';
      default:
        return 'bitcoincash';
    }
  }
  
  export function scriptToLockingBytecode(script: Script): Uint8Array {
    const scriptHash = hash160(scriptToBytecode(script));
    const addressContents = { payload: scriptHash, type: AddressType.p2sh };
    const lockingBytecode = addressContentsToLockingBytecode(addressContents);
    return lockingBytecode;
  }
  
  export function scriptToAddress(script: Script, network: string): string {
    const lockingBytecode = scriptToLockingBytecode(script);
    const prefix = getNetworkPrefix(network);
    const address = lockingBytecodeToCashAddress(lockingBytecode, prefix) as string;
    return address;
  }
  
  
  