import React, { useEffect, useState } from 'react';
import { SignatureTemplate } from 'cashscript';
import { getOwnerWallet } from '../wallet';
import { getTemplateContract } from '../contracts';


const useContract = (ownerPkh) => {
  const [ contract, setContract ] = useState();
  const [ amount, setInputAmount ] = useState(0)
  useEffect( () => {
    const makeCall = async () => {
      getTemplateContract(ownerPkh).then(async (res) => {
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
  const [ tx, setTx ] = useState("")
  const [ metaData, setMetaData ] = useState("Metadata:")
  // eslint-disable-next-line
  const [ owner, ownerPk, ownerPkh, ownerAddr ] = getOwnerWallet()

  const [ contract, amount ] = useContract(ownerPk)

  const reclaim = async () => {
    const minerFee = 450 // Close to min relay fee of the network.
    const change = amount - minerFee

    setMetaData(`Values in sats: Input Amount: ${amount}, Miner Fee: ${minerFee} change: ${change}`)

    const tx = await contract.functions
    .reclaim(ownerPk, new SignatureTemplate(owner))
    .to("bitcoincash:qz2g9hg86tpdk0rhk9qg45s6nj3xqqerkvcmz5rrq0", change)
    .send()

    console.log(tx)

    setTx("Tx status: ", JSON.stringify(tx))
  }

  const handleSubmit = async () => {
    const minerFee = 925 // Close to min relay fee of the network.
    const change = amount - minerFee
    setMetaData(`Values in sats: Input Amount: ${amount}, Miner Fee: ${minerFee} change: ${change}`)

    const tx = await contract.functions
      .spend(
        ownerPk,
        new SignatureTemplate(owner),
      )
      .withFeePerByte(1)
      //.withHardcodedFee(minerFee)
      // .to(toAddr, change)
      .to(contract.address, change)
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
        <label className="label">owner Addr</label>
        <div className="control">
            {ownerAddr}
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