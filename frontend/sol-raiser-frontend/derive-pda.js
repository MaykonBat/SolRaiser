import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("B8WTgHsqUeUYzeaQ8VGaZciuhQbCQAHe97vP27p2ss4Z");
const creator = new PublicKey("241Z7NB7J5upjmBKw2QLGbR2wjrtw8fPeR2kfBXqSfjx");
const campaignId = "test1";

const [pda] = PublicKey.findProgramAddressSync(
  [Buffer.from("campaign"), creator.toBuffer(), Buffer.from(campaignId)],
  PROGRAM_ID
);
console.log("Campaign PDA:", pda.toString());