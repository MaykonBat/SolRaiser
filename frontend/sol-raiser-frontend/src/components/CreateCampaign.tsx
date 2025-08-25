import { useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { getProgram, getCampaignPda } from "../utils/anchor";
import { useWallet, useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";

type Props = {
    onClose: () => void;
    onSuccess: () => void;
};

export default function CreateCampaign({ onClose, onSuccess }: Props) {
    const { publicKey } = useWallet();
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const [campaignId, setCampaignId] = useState("");
    const [goal, setGoal] = useState("");
    const [deadline, setDeadline] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = async () => {
        if (!publicKey || !wallet) {
            setError("Please connect your wallet.");
            return;
        }
        if (!campaignId || !goal || !deadline) {
            setError("Please fill in all fields.");
            return;
        }
        if (campaignId.length > 24) {
            setError("Campaign ID must be 24 characters or less.");
            return;
        }

        // Convert goal → lamports (BN)
        const goalLamports = Number(goal) * anchor.web3.LAMPORTS_PER_SOL;
        if (goalLamports <= 0) {
            setError("Goal must be greater than 0 SOL.");
            return;
        }

        // Convert datetime-local → unix seconds
        const ms = Date.parse(deadline);
        if (Number.isNaN(ms)) {
            setError("Please select a valid deadline date & time.");
            return;
        }
        const deadlineSeconds = Math.floor(ms / 1000);
        const nowSeconds = Math.floor(Date.now() / 1000);
        if (deadlineSeconds <= nowSeconds) {
            setError("Deadline must be in the future.");
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
            const [campaignPda] = getCampaignPda(publicKey, campaignId);

            await program.methods
                .initializeCampaign({
                    goal: new anchor.BN(goalLamports),
                    deadline: new anchor.BN(deadlineSeconds),
                    campaignId,
                })
                .accounts({
                    campaign: campaignPda,
                    creator: publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .rpc();

            alert(`Campaign "${campaignId}" created successfully!`);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error creating campaign:", err);
            if (err.logs) {
                console.error("Program logs:", err.logs);
                if (err.logs.some((log: string) => log.includes("InvalidAmount"))) {
                    setError("Goal must be greater than 0 lamports.");
                } else if (err.logs.some((log: string) => log.includes("InvalidDeadline"))) {
                    setError("Deadline must be in the future.");
                } else if (err.logs.some((log: string) => log.includes("InvalidCampaignId"))) {
                    setError("Campaign ID is invalid (max 24 characters).");
                } else {
                    setError("Failed to create campaign. Check console for details.");
                }
            } else {
                setError("Failed to create campaign. Check console for details.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-96">
                <h3 className="text-lg font-bold mb-3">Create New Campaign</h3>
                {error && <p className="text-red-500 mb-3">{error}</p>}

                <div className="mb-3">
                    <label className="block text-sm font-medium">Campaign ID (max 24 chars)</label>
                    <input
                        type="text"
                        value={campaignId}
                        onChange={(e) => setCampaignId(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="my-campaign-01"
                        maxLength={24}
                    />
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium">Goal (in SOL)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="1.00"
                    />
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium">Deadline</label>
                    <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="1724567890"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={create}
                        disabled={loading}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        {loading ? "Processing..." : "Create"}
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
