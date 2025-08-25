import { useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { getProgram, getCampaignPda } from "../utils/anchor";
import { useWallet, useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

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

type Props = {
  campaign: Campaign;
  onClose: () => void;
  onSuccess: () => void;
};

export default function FinalizeCampaign({ campaign, onClose, onSuccess }: Props) {
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalize = async () => {
    if (!publicKey || !wallet) {
      setError("Please connect your wallet.");
      return;
    }
    if (!campaign.account.active) {
      setError("Campaign is already closed.");
      return;
    }

    setLoading(true);
    setError(null);

    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
    const program = getProgram(provider);

    try {
      const [campaignPda] = getCampaignPda(campaign.account.creator, campaign.account.campaignId);

      await program.methods
        .finalizeCampaign({ campaignId: campaign.account.campaignId })
        .accounts({
          campaign: campaignPda,
          creator: campaign.account.creator,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      alert("Campaign finalized successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error finalizing campaign:", err);
      if (err.logs) {
        console.error("Program logs:", err.logs);
        if (err.logs.some((log: string) => log.includes("InvalidCreator"))) {
          setError("Only the campaign creator can finalize.");
        } else if (err.logs.some((log: string) => log.includes("CampaignNotActive"))) {
          setError("Campaign is not active.");
        } else if (err.logs.some((log: string) => log.includes("DeadlineNotPassed"))) {
          setError("Campaign deadline has not passed and goal not reached.");
        } else {
          setError("Finalization failed. Check console for details.");
        }
      } else {
        setError("Finalization failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96">
        <h3 className="text-lg font-bold mb-3">
          Finalize Campaign {campaign.account.campaignId}
        </h3>
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={finalize}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            {loading ? "Processing..." : "Finalize"}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
