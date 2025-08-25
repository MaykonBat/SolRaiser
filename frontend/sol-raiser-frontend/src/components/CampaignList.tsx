import { useEffect, useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { getProgram } from "../utils/anchor";
import { PublicKey } from "@solana/web3.js";
import CreateCampaign from "./CreateCampaign";
import Donate from "./Donate";
import FinalizeCampaign from "./FinalizeCampaign";
import Refund from "./Refund";

interface Campaign {
  publicKey: PublicKey;
  account: {
    creator: PublicKey;
    goal: anchor.BN;
    deadline: anchor.BN;
    totalRaised: anchor.BN;
    active: boolean;
    campaignId: string;
  };
}

export default function CampaignList() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<"donate" | "finalize" | "refund" | "create" | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);;

  const fetchCampaigns = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const provider = new anchor.AnchorProvider(connection, wallet, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      });
      const program = getProgram(provider);

      console.log("Fetching campaigns...");
      const accounts = await (program.account as any).campaign.all();
      console.log("Raw campaign data:", accounts);
      const mappedCampaigns = accounts.map((acc: any) => {
        console.log(`Campaign ${acc.account.campaignId} active:`, acc.account.active);
        return {
          publicKey: acc.publicKey,
          account: {
            creator: acc.account.creator,
            goal: acc.account.goal,
            deadline: acc.account.deadline,
            totalRaised: acc.account.totalRaised,
            active: Boolean(acc.account.active),
            campaignId: acc.account.campaignId,
          },
        };
      });
      setCampaigns(mappedCampaigns);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const getInferredStatus = (campaign: Campaign): string => {
    const now = Math.floor(Date.now() / 1000); // Timestamp atual em segundos
    const deadlinePassed = campaign.account.deadline.toNumber() < now;
    const goalReached = campaign.account.totalRaised.gte(campaign.account.goal);

    if (!campaign.account.active) return "Closed";
    if (deadlinePassed || goalReached) return "Closed (Pending Update)";
    return "Active";
  };

  useEffect(() => {
    fetchCampaigns();
  }, [wallet, connection]);

  return (
    <div style={{ marginTop: "40px" }}>
      <h2 style={{ marginBottom: "20px" }}>Active Campaigns</h2>
      <button
        onClick={() => setModalType("create")}
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          borderRadius: "8px",
          background: "#4CAF50",
          color: "#fff",
          border: "none",
          cursor: "pointer"
        }}
      >
        ➕ Create Campaign
      </button>

      {loading && <p>Loading campaigns...</p>}
      {!loading && campaigns.length === 0 && <p>No campaigns found.</p>}

      {campaigns.map((c) => (
        <div
          key={c.publicKey.toBase58()}
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "15px",
            textAlign: "left"
          }}
        >
          <p><strong>Campaign ID:</strong> {c.account.campaignId}</p>
          <p><strong>Creator:</strong> {c.account.creator.toBase58()}</p>
          <p><strong>Goal:</strong> {c.account.goal.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL</p>
          <p><strong>Total Raised:</strong> {c.account.totalRaised.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL</p>
          <p><strong>Deadline:</strong> {new Date(c.account.deadline.toNumber() * 1000).toLocaleString()}</p>
          <p><strong>Status:</strong> {getInferredStatus(c)}</p>

          <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                setSelectedCampaign(c);
                setModalType("donate");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "5px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                cursor: "pointer",
                opacity: !c.account.active ? 0.6 : 1,
              }}
              disabled={!c.account.active}
            >
              Donate
            </button>
            <button
              onClick={() => {
                setSelectedCampaign(c);
                setModalType("finalize");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "5px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                cursor: "pointer",
                opacity: !c.account.active ? 0.6 : 1,
              }}
              disabled={!c.account.active}
            >
              Finalize
            </button>
            <button
              onClick={() => {
                setSelectedCampaign(c);
                setModalType("refund");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "5px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                cursor: "pointer",
                opacity: !c.account.active ? 0.6 : 1,
              }}
              disabled={!c.account.active}
            >
              Refund
            </button>
          </div>
        </div>
      ))}

      {/* MODALS */}
      {modalType === "create" && <CreateCampaign onClose={() => setModalType(null)} onSuccess={fetchCampaigns} />}
      {modalType === "donate" && selectedCampaign && (
        <Donate
          campaign={selectedCampaign}
          onClose={() => {
            setSelectedCampaign(null);
            setModalType(null);
          }}
          onSuccess={fetchCampaigns}
        />
      )}
      {modalType === "finalize" && selectedCampaign && (
        <FinalizeCampaign
          campaign={selectedCampaign}
          onClose={() => {
            setSelectedCampaign(null);
            setModalType(null);
          }}
          onSuccess={fetchCampaigns}
        />
      )}
      {modalType === "refund" && selectedCampaign && (
        <Refund
          campaign={selectedCampaign}
          onClose={() => {
            setSelectedCampaign(null);
            setModalType(null);
          }}
          onSuccess={fetchCampaigns}
        />
      )}
    </div>
  );
}
