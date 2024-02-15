import { ethers } from "ethers";
import { useEffect, useState } from "react";

import close from "../assets/close.svg";

const Home = ({ home, provider, account, escrow, togglePop, accessToken }) => {
  const [buyer, setBuyer] = useState(null);
  const [lender, setLender] = useState(null);
  const [inspector, setInspector] = useState(null);
  const [seller, setSeller] = useState(null);
  const [owner, setOwner] = useState(null);

  const [buyerApproved, setBuyerApproved] = useState(false);
  const [lenderApproved, setLenderApproved] = useState(false);
  const [inspectorApproved, setInspectorApproved] = useState(false);
  const [sellerApproved, setSellerApproved] = useState(false);

  const fetchDetails = async () => {
    const buyer = await escrow.buyer(home.id);
    setBuyer(buyer);
    const buyerApproved = await escrow.approval(home.id, buyer);
    setBuyerApproved(buyerApproved);

    const seller = await escrow.seller();
    setSeller(seller);
    const sellerApproved = await escrow.approval(home.id, seller);
    setLenderApproved(sellerApproved);

    const lender = await escrow.lender();
    setLender(lender);
    const lenderApproved = await escrow.approval(home.id, lender);
    setLenderApproved(lenderApproved);

    const inspector = await escrow.inspector();
    setInspector(inspector);
    const inspectorApproved = await escrow.approval(home.id, inspector);
    setInspectorApproved(inspectorApproved);
  };

  const fetchOwner = async () => {
    if (await escrow.buyer(home.id)) return;

    const owner = await escrow.buyer(home.id);
    setOwner(owner);
  };

  const buyHandler = async () => {
    const escrowAmount = await escrow.escrowAmount(home.id);
    const signer = await provider.getSigner();

    try {
      let transaction = await escrow
        .connect(signer)
        .depositEarnest(home.id, { value: escrowAmount });
      await transaction.wait();

      transaction = await escrow.connect(signer).approveSale(home.id);
      await transaction.wait();

      setBuyerApproved(true);
    } catch (error) {
      console.log(error);
    }
  };

  const inspectHandler = async () => {
    const signer = await provider.getSigner();

    let transaction = await escrow
      .connect(signer)
      .updateInspectionStatus(home.id, true);
    await transaction.wait();

    setInspectorApproved(true);
  };

  const lendHandler = async () => {
    const signer = await provider.getSigner();

    let transaction = await escrow.connect(signer).approveSale(home.id);
    await transaction.wait();

    let lendAmount =
      (await escrow.purchasePrice(home.id)) -
      (await escrow.escrowAmount(home.id));
    await signer.sendTransaction({
      to: escrow.address,
      value: lendAmount.toString(),
      gasLimit: 60000,
    });

    setLenderApproved(true);
  };

  const sellHandler = async () => {
    const signer = await provider.getSigner();

    let transaction = await escrow.connect(signer).approveSale(home.id);
    await transaction.wait();

    transaction = await escrow.connect(signer).finalizeSale(home.id);
    await transaction.wait();

    setSellerApproved(true);
  };

  useEffect(() => {
    fetchDetails();
    fetchOwner();
  }, [sellerApproved]);

  return (
    <div className="home">
      <div className="home__details">
        <div className="home__image">
          <img
            src={home.image + "?pinataGatewayToken=" + accessToken}
            alt="home"
          />
        </div>

        <div className="home__overview">
          <h1>{home.name}</h1>
          <p>
            <strong>{home.attributes[2].value}</strong> beds |
            <strong>{home.attributes[3].value}</strong> bath |
            <strong>{home.attributes[4].value}</strong> sqft
          </p>
          <p>{home.address}</p>
          <h2>{home.attributes[0].value} ETH</h2>

          <div />

          {owner ? (
            <div className="home__owned">
              Owned by {owner.slice(0, 6) + "..." + owner.slice(38, 42)}
            </div>
          ) : (
            <div>
              {account === inspector ? (
                <button
                  className="home__buy"
                  onClick={inspectHandler}
                  disabled={inspectorApproved}
                >
                  Approve Inspection
                </button>
              ) : account === lender ? (
                <button
                  className="home__buy"
                  onClick={lendHandler}
                  disabled={lenderApproved}
                >
                  Approve & Lend
                </button>
              ) : account === seller ? (
                <button
                  className="home__buy"
                  onClick={sellHandler}
                  disabled={sellerApproved}
                >
                  Approve & Sell
                </button>
              ) : (
                <button
                  className="home__buy"
                  onClick={buyHandler}
                  disabled={buyerApproved}
                >
                  Buy
                </button>
              )}
              <button className="home__contact">Contact Agent</button>
            </div>
          )}

          <hr />

          <h2>Overview</h2>
          <p>{home.description}</p>

          <hr />

          <h2>Facts and features</h2>
          <ul>
            {home.attributes.map((attribute, index) => (
              <div>
                <li key={index}>
                  <strong>{attribute.trait_type}</strong> : {attribute.value}
                </li>
              </div>
            ))}
          </ul>

          <button onClick={togglePop} className="home__close">
            <img src={close} alt="Close" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
