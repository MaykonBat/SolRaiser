import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import CampaignList from "./components/CampaignList";

import "@solana/wallet-adapter-react-ui/styles.css";

function App() {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const network = clusterApiUrl("devnet");

  return (
    <ConnectionProvider endpoint={network}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div style={{ textAlign: "center", padding: "20px" }}>
            {/* Header */}
            <header style={{ background: "#333", color: "#fff", padding: "35px", textAlign: "center" }}>
              <h1>SolRaiser - Crowdfunding on Solana</h1>
              <div style={{ position: "absolute", top: "25px", right: "40px" }}>
                <WalletMultiButton />
                <WalletDisconnectButton style={{ marginTop: "5px" }} />
              </div>
            </header>

            {/* Main */}
            <main style={{ flex: 1, maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
              {/* dApp Explanation */}
              <section style={{ textAlign: "center", marginBottom: "30px" }}>
                <h1 style={{ color: "#333" }}>Welcome to SolRaiser</h1>
                <p style={{ color: "#555", lineHeight: "1.6" }}>
                  SolRaiser is a decentralized crowdfunding platform built on the Solana blockchain.
                  Create campaigns with a funding goal and deadline, donate to support causes, finalize
                  successful campaigns to transfer funds to the creator, or refund donations if goals
                  aren't met. SolRaiser ensures secure and transparent crowdfunding.
                </p>
              </section>

              {/* Campaign list (buttons inside open modals for Donate, Refund, etc.) */}
              <CampaignList />
            </main>
          </div>

          {/* Footer */}
          <footer style={{ background: "#333", color: "#fff", padding: "10px", textAlign: "center" }}>
            <p>SolRaiser © 2025 - Built in Solana Devnet</p>
          </footer>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
