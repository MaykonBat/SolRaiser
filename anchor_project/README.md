# SolRaiser Backend

**Deployed Program ID:** [Eu4kchg5AA7yEjAnSH3yTdShVM6jW1wpsSxgAPLDi6Uz]

## Project Overview

### Description
The SolRaiser Backend is a Solana program written in Rust using the Anchor framework. It implements the smart contract logic for a crowdfunding dApp, managing campaign creation, donations, finalization, and refunds on the Solana blockchain.

### Key Features
- **Feature 1: Campaign Initialization** - Allows creation of campaigns with a goal, deadline, and unique ID.
- **Feature 2: Donation Processing** - Handles SOL donations to active campaigns.
- **Feature 3: Campaign Finalization** - Enables closing campaigns when goals are met or deadlines pass.
- **Feature 4: Refund Mechanism** - Supports refunds to donors if campaigns fail.

### How to Use the Program
1. **Set Up Environment**
   - Install Rust, Anchor, and Solana CLI as per prerequisites.
   - Configure Solana to Devnet with `solana config set --url https://api.devnet.solana.com`.
2. **Build the Program**
   - Run `anchor build` to compile the program.
3. **Deploy to Devnet**
   - Execute `anchor deploy` and note the program ID.
4. **Interact via Frontend**
   - Use the SolRaiser frontend to trigger instructions (e.g., initialize, donate).

## Program Architecture

### PDA Usage
**PDAs Used:**
- **Campaign PDA**: Derived using seeds `[creator, campaign_id, bump]` to ensure unique addresses for each campaign, where `creator` is the public key, `campaign_id` is the identifier, and `bump` avoids collisions.

### Program Instructions
**Instructions Implemented:**
- **initializeCampaign**: Creates a new campaign with specified `goal`, `deadline`, and `campaign_id`.
- **donate**: Processes a donation, updating `total_raised` if the campaign is active.
- **finalizeCampaign**: Closes a campaign if the deadline has passed or the goal is met.
- **refund**: Refunds donors and closes the campaign if the deadline passes and the goal is not met.

### Account Structure
```rust
#[account]
pub struct Campaign {
    pub creator: Pubkey,        // Campaign creator's public key
    pub goal: u64,              // Goal in lamports
    pub deadline: i64,          // Deadline timestamp in seconds
    pub total_raised: u64,      // Total raised in lamports
    pub active: bool,           // Active status of the campaign
    pub bump: u8,               // Bump for PDA derivation
    pub campaign_id: String,    // Unique campaign identifier
}

#Test Coverage

### Happy Path Tests:

-Test 1: Campaign Creation - Verifies successful initialization with valid parameters.
-Test 2: Successful Donation - Confirms total_raised updates with a valid donation.
-Test 3: Finalization with Goal Met - Tests full happy path (initialize → donate → finalize).
-Test 4: Refund with Expired Deadline - Ensures refund works when the goal is not met.

### Unhappy Path Tests:

-Test 1: Creation with Zero Goal - Fails with InvalidAmount.
-Test 2: Creation with Past Deadline - Fails with InvalidDeadline.
-Test 3: Creation with Invalid Campaign ID - Fails with InvalidCampaignId.
-Test 4: Donation with Zero Amount - Fails with InvalidAmount.
-Test 5: Donation After Deadline - Fails with DeadlineExpired.
-Test 6: Finalization Before Deadline - Fails with DeadlineNotPassed.
-Test 7: Finalization with Wrong Creator - Fails with ConstraintSeeds.
-Test 8: Refund Before Deadline - Fails with DeadlineNotPassed.
-Test 9: Refund with Goal Reached - Fails with GoalNotReached.
-Test 10: Donation to Inactive Campaign - Fails with AccountNotInitialized.

### Running Tests
```bash
# Commands to run your tests
cd sol-raiser-backend
anchor test
```

### Additional Notes for Evaluators

- Tests require a local Solana validator and airdrops to test wallets.
- Time-based tests use setTimeout to simulate deadlines; adjust as needed.
