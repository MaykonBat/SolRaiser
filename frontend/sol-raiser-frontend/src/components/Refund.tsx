import { useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { getProgram, getCampaignPda } from "../utils/anchor";
import { useWallet, useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
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

export default function Refund({ campaign, onClose, onSuccess }: Props) {
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refund = async () => {
    if (!publicKey || !wallet) {
      setError("Please connect your wallet.");
      return;
    }
    if (!campaign.account.active) {
      setError("Campaign is already closed.");
      return;
    }
    if (publicKey.toBase58() !== campaign.account.creator.toBase58()) {
      setError("Only the campaign creator can refund.");
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
        .refund({ campaignId: campaign.account.campaignId })
        .accounts({
          campaign: campaignPda,
          creator: campaign.account.creator,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      alert("Refund successful!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error refunding:", err);
      if (err.logs) {
        console.error("Program logs:", err.logs);
        if (err.logs.some((log: string) => log.includes("InvalidCreator"))) {
          setError("Only the campaign creator can refund.");
        } else if (err.logs.some((log: string) => log.includes("CampaignNotActive"))) {
          setError("Campaign is not active.");
        } else if (err.logs.some((log: string) => log.includes("DeadlineNotPassed"))) {
          setError("Campaign deadline has not passed.");
        } else if (err.logs.some((log: string) => log.includes("GoalNotReached"))) {
          setError("Cannot refund: campaign goal was reached.");
        } else {
          setError("Refund failed. Check console for details.");
        }
      } else {
        setError("Refund failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96">
        <h3 className="text-lg font-bold mb-3">
          Refund from Campaign {campaign.account.campaignId}
        </h3>
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={refund}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            {loading ? "Processing..." : "Refund"}
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
