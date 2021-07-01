import { BITBOX } from 'bitbox-sdk';
import { Contract, BitboxNetworkProvider } from 'cashscript';
import { compileString } from 'cashc';


export const getTemplateContract = async (arbiterPk, buyerPk, sellerPk) => {
    //eslint-disable-next-line
    const artifact_ = compileString(`
    pragma cashscript ^0.6.1;

    contract Escrow(pubkey arbiterPk, pubkey buyerPk, pubkey sellerPk) {
        // Require pk to match stored owner and signature to match
        // Warning: Only to be used in testing.
        function reclaim(pubkey pk, sig s) {
            require(checkSig(s, pk));
        }
    
        // Can be called by anyone.
        function spend(
            pubkey pk,
            sig spenderSig,
            bytes message,
            datasig signature,
            //int minerFee,
        ) {  
            // Verify the signature of the sender.
            require(checkSig(spenderSig, pk));
            int changeAmount = int(bytes(tx.value)); //  - minerFee;
            int msg = int(message);
            require(within(msg, 1, 5)); // x >= lower && x < upper
    
            if (msg % 2 == 0){
                require(checkDataSig(signature, message, arbiterPk));
            } else {
                require(checkDataSig(signature, message, buyerPk));
            }
    
            if (msg == 1 || msg == 4){
                bytes34 payTo = new OutputP2PKH(bytes8(changeAmount), hash160(sellerPk));
                require(hash256(payTo) == tx.hashOutputs);
            } else {
                bytes34 payTo = new OutputP2PKH(bytes8(changeAmount), hash160(buyerPk));
                require(hash256(payTo) == tx.hashOutputs);
            }
        }
    }
  `)

  const contractFetch = await fetch('Template.cash') // Inside public folder.
  const source = await contractFetch.text();
  const artifact = compileString(source)


  const bitbox = new BITBOX();

  // Initialise a network provider for network operations on MAINNET
  // @ts-ignore
  const provider = new BitboxNetworkProvider('mainnet', bitbox);
  //const provider = new ElectrumNetworkProvider('mainnet');

  // Instantiate a new contract using the compiled artifact and network provider
  // AND providing the constructor parameters (pkh: alicePkh)
  const contract = new Contract(artifact, [arbiterPk, buyerPk, sellerPk], provider);
  // Get contract balance & output address + balance
  console.log('contract address:', contract.address);
  console.log('contract balance:', await contract.getBalance());
  console.log('contract opcount:', contract.opcount);
  console.log('contract bytesize:', contract.bytesize);
  return contract
}
