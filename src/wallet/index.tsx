import { BITBOX } from 'bitbox-sdk';

const bitbox = new BITBOX();

const rootSeed = bitbox.Mnemonic.toSeed('CashSciptTemplate');
const hdNode = bitbox.HDNode.fromSeed(rootSeed);

const owner = bitbox.HDNode.toKeyPair(bitbox.HDNode.derive(hdNode, 0));
const ownerPk = bitbox.ECPair.toPublicKey(owner);
const ownerPkh = bitbox.Crypto.hash160(ownerPk);
const ownerAddr = bitbox.ECPair.toCashAddress(owner);

export const getOwnerWallet = () => {
  return [owner, ownerPk, ownerPkh, ownerAddr]
}