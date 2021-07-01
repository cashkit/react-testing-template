import { BITBOX } from 'bitbox-sdk';

const bitbox = new BITBOX();

const rootSeed = bitbox.Mnemonic.toSeed('CashSciptTemplate');
const hdNode = bitbox.HDNode.fromSeed(rootSeed);

const arbiter = bitbox.HDNode.toKeyPair(bitbox.HDNode.derive(hdNode, 0));
const buyer = bitbox.HDNode.toKeyPair(bitbox.HDNode.derive(hdNode, 1));
const seller = bitbox.HDNode.toKeyPair(bitbox.HDNode.derive(hdNode, 2));

const arbiterPk = bitbox.ECPair.toPublicKey(arbiter);
const buyerPk = bitbox.ECPair.toPublicKey(buyer);
const sellerPk = bitbox.ECPair.toPublicKey(seller);


export const getArbiterWallet = () => {
  return [arbiter, arbiterPk]
}

export const getBuyerWallet = () => {
  return [buyer, buyerPk]
}

export const getSellerWallet = () => {
  return [seller, sellerPk]
}
