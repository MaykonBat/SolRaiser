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

export default function Donate({ campaign, onClose, onSuccess }: Props) {
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const donate = async () => {
    if (!publicKey || !wallet) {
      setError("Please connect your wallet.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than 0 SOL.");
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
      const [campaignPda] = getCampaignPda(
        campaign.account.creator,
        campaign.account.campaignId
      );

      await program.methods
        .donate({
          amount: new anchor.BN(Number(amount) * anchor.web3.LAMPORTS_PER_SOL),
          campaignId: campaign.account.campaignId,
        })
        .accounts({
          campaign: campaignPda,
          donor: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      alert("Donation successful!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error donating:", err);
      if (err.logs) {
        console.error("Program logs:", err.logs);
        if (err.logs.some((log: string) => log.includes("InvalidAmount"))) {
          setError("Amount must be greater than 0 SOL.");
        } else if (err.logs.some((log: string) => log.includes("CampaignNotActive"))) {
          setError("Campaign is not active.");
        } else if (err.logs.some((log: string) => log.includes("DeadlineExpired"))) {
          setError("Campaign deadline has expired.");
        } else {
          setError("Donation failed. Check console for details.");
        }
      } else {
        setError("Donation failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96">
        <h3 className="text-lg font-bold mb-3">
          Donate to Campaign {campaign.account.campaignId}
        </h3>
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <input
          type="number"
          step="0.01"
          placeholder="Amount in SOL"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border w-full p-2 rounded mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={donate}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {loading ? "Processing..." : "Donate"}
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
