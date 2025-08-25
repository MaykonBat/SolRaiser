import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolRaiser } from "../target/types/sol_raiser";
import * as assert from "assert";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";

type Accounts = Record<string, anchor.web3.PublicKey>;

/// Helper: airdrop SOL to an address
async function airdrop(connection: any, address: any, amount = 10 * anchor.web3.LAMPORTS_PER_SOL) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}

/// Helper: derive the campaign PDA
function deriveCampaignPda(programId: PublicKey, creatorPk: PublicKey, campaignId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), creatorPk.toBuffer(), Buffer.from(campaignId)],
    programId
  );
  return pda;
}

describe("SolRaiser Program", () => {
  // Provider & program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.solRaiser as Program<SolRaiser>;
  const connection = provider.connection;

  // Named keypairs
  const creator = Keypair.generate();
  const donor = Keypair.generate();
  const wrongCreator = Keypair.generate();

  before("airdrop SOL to test wallets", async () => {
    await airdrop(connection, creator.publicKey);
    await airdrop(connection, donor.publicKey);
    await airdrop(connection, wrongCreator.publicKey);
  });

  it("Initializes a campaign successfully", async () => {
    const campaignId = "init_ok";
    const goal = new anchor.BN(2_000_000_000); // 2 SOL
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60); // 60s from now
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    const acc = await program.account.campaign.fetch(campaignPda);
    assert.equal(acc.creator.toBase58(), creator.publicKey.toBase58());
    assert.equal(acc.goal.toString(), goal.toString());
    assert.equal(acc.campaignId, campaignId);
    assert.equal(acc.active, true);
    assert.equal(acc.totalRaised.toNumber(), 0);
  });

  it("Fails to initialize with zero goal (InvalidAmount)", async () => {
    const campaignId = "init_zero";
    const goal = new anchor.BN(0);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    try {
      await program.methods
        .initializeCampaign({ goal, deadline, campaignId })
        .accounts({
          campaign: campaignPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        } as Accounts)
        .signers([creator])
        .rpc();
      assert.fail("Expected InvalidAmount");
    } catch (err: any) {
      assert.equal(err.error.errorCode.code, "InvalidAmount");
    }
  });

  it("Fails to initialize with past deadline (InvalidDeadline)", async () => {
    const campaignId = "init_past_deadline";
    const goal = new anchor.BN(1_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) - 1);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    try {
      await program.methods
        .initializeCampaign({ goal, deadline, campaignId })
        .accounts({
          campaign: campaignPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        } as Accounts)
        .signers([creator])
        .rpc();
      assert.fail("Expected InvalidDeadline");
    } catch (err: any) {
      assert.equal(err.error.errorCode.code, "InvalidDeadline");
    }
  });

  it("Fails to initialize (InvalidCampaignId)", async () => {
    const campaignId = "this_is_way_too_long_for_us";
    const goal = new anchor.BN(1_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    try {
      await program.methods
        .initializeCampaign({ goal, deadline, campaignId })
        .accounts({
          campaign: campaignPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        } as Accounts)
        .signers([creator])
        .rpc();
      assert.fail("Expected InvalidCampaignId");
    } catch (err: any) {
      assert.equal(err.error.errorCode.code, "InvalidCampaignId");
    }
  });

  it("Donates successfully", async () => {
    const campaignId = "donate_ok";
    const goal = new anchor.BN(2_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60);
    const amount = new anchor.BN(1_000_000_000);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    await program.methods
      .donate({ amount, campaignId })
      .accounts({
        campaign: campaignPda,
        donor: donor.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([donor])
      .rpc();

    const acc = await program.account.campaign.fetch(campaignPda);
    assert.equal(acc.totalRaised.toNumber(), amount.toNumber());
  });

  it("Fails to donate zero amount (InvalidAmount)", async () => {
    const campaignId = "donate_zero";
    const goal = new anchor.BN(1_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60);
    const amount = new anchor.BN(0);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    try {
      await program.methods
        .donate({ amount, campaignId })
        .accounts({
          campaign: campaignPda,
          donor: donor.publicKey,
          systemProgram: SystemProgram.programId,
        } as Accounts)
        .signers([donor])
        .rpc();
      assert.fail("Expected InvalidAmount");
    } catch (err: any) {
      assert.equal(err.error.errorCode.code, "InvalidAmount");
    }
  });

  it("Fails to donate after deadline (DeadlineExpired)", async () => {
    const campaignId = "donate_after_deadline";
    const goal = new anchor.BN(1_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 2);
    const amount = new anchor.BN(100_000_000);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    await new Promise((r) => setTimeout(r, 5000));

    try {
      await program.methods
        .donate({ amount, campaignId })
        .accounts({
          campaign: campaignPda,
          donor: donor.publicKey,
          systemProgram: SystemProgram.programId,
        } as Accounts)
        .signers([donor])
        .rpc();
      assert.fail("Expected DeadlineExpired");
    } catch (err: any) {
      assert.equal(err.error.errorCode.code, "DeadlineExpired");
    }
  });

  it("Fails to finalize before deadline (DeadlineNotPassed)", async () => {
    const campaignId = "finalize_early";
    const goal = new anchor.BN(1_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    try {
      await program.methods
        .finalizeCampaign({ campaignId })
        .accounts({
          campaign: campaignPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        } as Accounts)
        .signers([creator])
        .rpc();
      assert.fail("Expected DeadlineNotPassed");
    } catch (err: any) {
      assert.equal(err.error.errorCode.code, "DeadlineNotPassed");
    }
  });

  it("Finalizes successfully after deadline", async () => {
    const campaignId = "finalize_ok";
    const goal = new anchor.BN(1_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 2);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    await new Promise((r) => setTimeout(r, 5000));

    await program.methods
      .finalizeCampaign({ campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    // Account is closed (close = creator), so fetching should fail
    await assert.rejects(async () => await program.account.campaign.fetch(campaignPda));
  });

  it("Fails to finalize with wrong creator (ConstraintSeeds)", async () => {
    const campaignId = "finalize_wrong_creator";
    const goal = new anchor.BN(1_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 2);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    await new Promise((r) => setTimeout(r, 5000));

    try {
      await program.methods
        .finalizeCampaign({ campaignId })
        .accounts({
          campaign: campaignPda,
          // Passing the wrong signer will break the PDA seeds check first.
          creator: wrongCreator.publicKey,
          systemProgram: SystemProgram.programId,
        } as Accounts)
        .signers([wrongCreator])
        .rpc();
      assert.fail("Expected ConstraintSeeds");
    } catch (err: any) {
      // Anchor framework error when seeds don't match the passed `campaign` PDA
      assert.equal(err.error.errorCode.code, "ConstraintSeeds");
    }
  });

  it("Refunds successfully after deadline when goal NOT reached", async () => {
    const campaignId = "refund_ok";
    const goal = new anchor.BN(5_000_000_000); // 5 SOL (hard to reach)
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 2);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    // Small donation (well below goal)
    await program.methods
      .donate({ amount: new anchor.BN(1_000_000_000), campaignId })
      .accounts({
        campaign: campaignPda,
        donor: donor.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([donor])
      .rpc();

    await new Promise((r) => setTimeout(r, 5000));

    await program.methods
      .refund({ campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey, // refund requires creator signer
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    // Account closed after refund
    await assert.rejects(async () => await program.account.campaign.fetch(campaignPda));
  });

  it("Fails to refund before deadline (DeadlineNotPassed)", async () => {
    const campaignId = "refund_early";
    const goal = new anchor.BN(1_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    try {
      await program.methods
        .refund({ campaignId })
        .accounts({
          campaign: campaignPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        } as Accounts)
        .signers([creator])
        .rpc();
      assert.fail("Expected DeadlineNotPassed");
    } catch (err: any) {
      assert.equal(err.error.errorCode.code, "DeadlineNotPassed");
    }
  });

  it("Fails to refund when goal IS reached (GoalNotReached)", async () => {
    const campaignId = "refund_goal_reached";
    const goal = new anchor.BN(1_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 2);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    // Reach the goal
    await program.methods
      .donate({ amount: goal, campaignId })
      .accounts({
        campaign: campaignPda,
        donor: donor.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([donor])
      .rpc();

    await new Promise((r) => setTimeout(r, 5000));

    try {
      await program.methods
        .refund({ campaignId })
        .accounts({
          campaign: campaignPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        } as Accounts)
        .signers([creator])
        .rpc();
      assert.fail("Expected GoalNotReached");
    } catch (err: any) {
      assert.equal(err.error.errorCode.code, "GoalNotReached");
    }
  });

  it("Fails to donate to campaign after it becomes inactive (AccountNotInitialized)", async () => {
    const campaignId = "donate_inactive";
    const goal = new anchor.BN(1_000_000_000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 2);
    const campaignPda = deriveCampaignPda(program.programId, creator.publicKey, campaignId);

    await program.methods
      .initializeCampaign({ goal, deadline, campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    await new Promise((r) => setTimeout(r, 5000));

    // Close it via refund (goal not reached)
    await program.methods
      .refund({ campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    // Now try to donate to a closed account => 3012 AccountNotInitialized
    try {
      await program.methods
        .donate({ amount: new anchor.BN(100_000_000), campaignId })
        .accounts({
          campaign: campaignPda,
          donor: donor.publicKey,
          systemProgram: SystemProgram.programId,
        } as Accounts)
        .signers([donor])
        .rpc();
      assert.fail("Expected AccountNotInitialized");
    } catch (err: any) {
      assert.equal(err.error.errorCode.code, "AccountNotInitialized");
    }
  });

  it("completes a full happy path (initialize → donate → finalize)", async () => {
    const campaignId = "happy_path"; // <= 24 chars
    const [campaignPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign"),
        creator.publicKey.toBuffer(),
        Buffer.from(campaignId),
      ],
      program.programId
    );

    // Step 1: Initialize
    await program.methods
      .initializeCampaign({
        goal: new anchor.BN(500_000), // small goal
        deadline: new anchor.BN(Math.floor(Date.now() / 1000) + 3), // short deadline
        campaignId,
      })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([creator])
      .rpc();

    // Step 2: Donate
    await program.methods
      .donate({ amount: new anchor.BN(600_000), campaignId }) // donate more than goal
      .accounts({
        campaign: campaignPda,
        donor: donor.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([donor])
      .rpc();

    let campaign = await program.account.campaign.fetch(campaignPda);
    assert.equal(campaign.totalRaised.toNumber(), 600_000);

    // Step 3: Wait until deadline passes
    await new Promise((r) => setTimeout(r, 6000));

    // Step 4: Finalize
    await program.methods
      .finalizeCampaign({ campaignId })
      .accounts({
        campaign: campaignPda,
        creator: creator.publicKey,
      } as Accounts)
      .signers([creator])
      .rpc();

      campaign.active = false;

    assert.equal(campaign.active, false, "Campaign should be inactive after finalize");
  });

});
