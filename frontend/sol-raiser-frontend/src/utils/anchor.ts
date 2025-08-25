import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import idl from "../anchor/sol_raiser.json"; 
import { PublicKey } from "@solana/web3.js";

// Program ID (deployed on devnet)
export const PROGRAM_ID = new PublicKey("Eu4kchg5AA7yEjAnSH3yTdShVM6jW1wpsSxgAPLDi6Uz");

export type SolRaiserProgram = Program<anchor.Idl>

/**
 * Returns the Anchor program instance with the provided provider.
 */
export function getProgram(provider: AnchorProvider): SolRaiserProgram {
  return new Program(idl as anchor.Idl, provider);
}

/**
 * Derives the PDA for a campaign account.
 * @param creator - The creator's public key
 * @param campaignId - Unique campaign identifier
 * @returns [PublicKey, bump]
 */
export function getCampaignPda(
  creator: PublicKey,
  campaignId: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("campaign"),
      creator.toBuffer(),
      Buffer.from(campaignId),
    ],
    PROGRAM_ID
  );
}