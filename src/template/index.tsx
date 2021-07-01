import React, { useEffect, useState } from 'react';

import { BITBOX } from 'bitbox-sdk';
import { SignatureTemplate } from 'cashscript';
import { getArbiterWallet, getBuyerWallet, getSellerWallet } from '../wallet';
import { getTemplateContract } from '../contracts';
import { Signer } from '../utils';

const bitbox = new BITBOX();

const MessageTypes = {
  One: '1',
  Two: '2',
  Three: '3',
  Four: '4'
}

const useContract = (arbiterPkh, buyerPkh, sellerPkh) => {
  const [ contract, setContract ] = useState();
  const [ amount, setInputAmount ] = useState(0)
  useEffect( () => {
    const makeCall = async () => {
      getTemplateContract(arbiterPkh, buyerPkh, sellerPkh).then(async (res) => {
        setContract(res)
        let amount = 0
        const Utxos = await res.getUtxos()
        // @ts-ignore
        if (Utxos.length < 1){
          console.log("No utxo available for this address", res.address)
          //return
        } else {
          Utxos.sort((a, b) => b.satoshis - a.satoshis)
          // @ts-ignore
          Utxos.forEach((u, idx) => {
            console.log(u)
            amount += u.satoshis
          });
          setInputAmount(amount)
        }
        })
      
    }
    makeCall()
  //eslint-disable-next-line
  }, [])
  
  return [contract, amount]
}

const Contract = () => {
  const [ messageType, setMessageType ] = useState(MessageTypes.One)
  const [ typeInfo, setTypeInfo ] = useState("Trade Successful: Money being sent to seller, signed by buyer")
  const [ tx, setTx ] = useState("")
  const [ metaData, setMetaData ] = useState("Metadata:")
  const [ arbiter, arbiterPk ] = getArbiterWallet()
  const [ buyer, buyerPk ] = getBuyerWallet()
  const [ seller, sellerPk ] = getSellerWallet()

  const [ contract, amount ] = useContract(arbiterPk, buyerPk, sellerPk)

  const arbiterAddr = bitbox.ECPair.toCashAddress(arbiter);
  const buyerAddr = bitbox.ECPair.toCashAddress(buyer);
  const sellerAddr = bitbox.ECPair.toCashAddress(seller);

  const handleMessageChange = (event) => {
    const mt = event.target.value
    if(mt === MessageTypes.One) {
      setTypeInfo(`Trade Successful: Money being sent to seller, signed by buyer`)
    }
    if(mt === MessageTypes.Two){
      setTypeInfo(`Dispute: Money being sent to buyer, signed by arbiter`)
    }
    if(mt === MessageTypes.Three){
      setTypeInfo(`Trade Cancelled: Money being sent to buyer, signed by buyer`)
    } 
    if(mt === MessageTypes.Four){
      setTypeInfo(`Dispute: Money being sent to seller, signed by arbiter`)
    }

    setMessageType(mt)
  }

  const reclaim = async () => {
    const minerFee = 450 // Close to min relay fee of the network.
    const change = amount - minerFee

    setMetaData(`Values in sats: Input Amount: ${amount}, Miner Fee: ${minerFee} change: ${change}`)

    const tx = await contract.functions
    .reclaim(arbiterPk, new SignatureTemplate(arbiter))
    .to("bitcoincash:qz2g9hg86tpdk0rhk9qg45s6nj3xqqerkvcmz5rrq0", change)
    .send()

    console.log(tx)

    setTx("Tx status: ", JSON.stringify(tx))
  }

  const handleSubmit = async () => {
    const minerFee = 925 // Close to min relay fee of the network.
    const change = amount - minerFee
    setMetaData(`Values in sats: Input Amount: ${amount}, Miner Fee: ${minerFee} change: ${change}`)

    let signer;
    let toAddr;

    if (messageType === MessageTypes.One){
      signer = new Signer(buyer);
      toAddr = sellerAddr;
    } else if (messageType === MessageTypes.Two) {
      signer = new Signer(arbiter);
      toAddr = buyerAddr;
    } else if (messageType === MessageTypes.Three) {
      signer = new Signer(buyer);
      // Could be to seller as well. Not sure.
      toAddr = buyerAddr;
    } else {
      signer = new Signer(arbiter);
      toAddr = sellerAddr;
    }

    // Signed message and signature can be taken from somewhere else as well.
    const signerMessage = signer.createSingleMessage(parseInt(messageType));
    const signerSignature = signer.signMessage(signerMessage);

    console.log(signerMessage)

    const tx = await contract.functions
      .spend(
        arbiterPk,
        new SignatureTemplate(arbiter),
        signerMessage,
        signerSignature,
        //minerFee
      )
      .withFeePerByte(1)
      //.withHardcodedFee(minerFee)
      .to(toAddr, change)
      //.to(contract.address, change)
      //.build()
      .send();
    
    console.log(tx)

    setTx("Tx status: ", JSON.stringify(tx))
  }

  return (
    <div className="box column mr-2">
      <div className="title box">Template Contract</div>

      <div className="field">
        <label className="label">Contract Addr</label>
        <div className="control">
            {contract?.address}
        </div>
      </div>

      <div className="field">
        <label className="label">Arbiter Addr</label>
        <div className="control">
            {arbiterAddr}
        </div>
      </div>

      <div className="field">
        <label className="label">Buyer Addr</label>
        <div className="control">
            {buyerAddr}
        </div>
      </div>

      <div className="field">
        <label className="label">Seller Addr</label>
        <div className="control">
            {sellerAddr}
        </div>
      </div>

      <div className="field">
        <label className="label">Message Number</label>
        <div className="control">
          <div className="select" onChange={handleMessageChange}>
              <select>
                <option value={MessageTypes.One}>{MessageTypes.One}</option>
                <option value={MessageTypes.Two}>{MessageTypes.Two}</option>
                <option value={MessageTypes.Three}>{MessageTypes.Three}</option>
                <option value={MessageTypes.Four}>{MessageTypes.Four}</option>
              </select>
            </div>
            <p className="content has-text-danger	">{typeInfo}</p>
        </div>
      </div>
     
      <div className="field">
        <label className="label">Metadata</label>
        <div className="control">
          <p className="content">{metaData}</p>
        </div>
      </div>

      <div className="control">
        <button onClick={handleSubmit} className="button has-background-danger has-text-primary-light">Submit Transaction</button>
        <button onClick={reclaim} className="ml-6 button has-text-danger-dark	">Reclaim Transaction</button>
      </div>

      <div className="pt-4 field">
        <label className="label">Tx Info</label>
        <div className="control">
        <p className="content">{tx}</p>
        </div>
      </div>
    </div>
  )
}

export default Contract