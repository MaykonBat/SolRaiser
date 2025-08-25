# Project Description

**Deployed Frontend URL:** https://sol-raiser-two.vercel.app/

**Solana Program ID:** [Eu4kchg5AA7yEjAnSH3yTdShVM6jW1wpsSxgAPLDi6Uz]

## Project Overview

### Description
SolRaiser is a decentralized application (dApp) built on the Solana blockchain designed for managing crowdfunding campaigns. Users can create campaigns with a SOL-based goal, a deadline, and a unique ID, accept donations from other users, finalize campaigns successfully, or refund donors if the goal is not met by the deadline. The backend is a Solana program written in Rust using the Anchor framework, while the frontend is a React-based interface with TypeScript that interacts with the blockchain via the Phantom wallet. The dApp leverages Solana's high speed and low-cost transactions to provide a seamless crowdfunding experience.

### Key Features
- **Campaign Creation** - Users can create campaigns by specifying an ID, a SOL goal, and a deadline, with real-time data validation.
- **Donations** - Any user with a Solana wallet can donate SOL to an active campaign, updating the total raised amount.
- **Campaign Finalization** - The campaign creator can finalize a campaign if the goal is met or the deadline passes, distributing the funds.
- **Refunds** - The creator can refund donors if the goal is not reached and the deadline has expired.
- **Dynamic Listing** - Active campaigns are listed with updated statuses based on deadlines and goals, including frontend-inferred statuses.
  
### How to Use the dApp
[TODO: Provide step-by-step instructions for users to interact with your dApp]

1. **Connect Wallet** - Connect your Phantom wallet by clicking the wallet icon in the top right corner and authorizing the connection.
2. **Create Campaign** - Click "Create Campaign". Enter the campaign ID (max 24 characters), goal in SOL, and deadline (a future date and time). Then, confirm the transaction in Phantom and wait for the campaign to be created.
3. **Donate to a Campaign** - In the campaign list, click "Donate" on an active campaign. Enter the SOL amount, confirm in Phantom, and check if "Total Raised" updates.
4. **Finalize or Refund** - After the deadline or goal is met, click "Finalize" or if not click "Refund". Confirm the transaction in Phantom, the campaign will close and be removed from the list.

## Program Architecture
The SolRaiser program is a Solana smart contract that manages crowdfunding campaigns. It utilizes the Anchor framework to define instructions, accounts, and Program Derived Addresses (PDAs). The architecture separates the logic for campaign creation, donations, finalization, and refunds, with validations for deadlines and goals. Data flow begins with the creation of a Campaign account, followed by updates via donations, and closure via finalization or refund.

### PDA Usage
Program Derived Addresses (PDAs) are used to generate unique addresses for each campaign, ensuring only the program can manage them. The primary seed is the creator's public key combined with the campaign_id.

**PDAs Used:**
- Campaign PDA: Generates a unique address using seeds [creator, campaign_id, bump]. The creator is the public key of the campaign creator, campaign_id is the campaign's unique identifier, and bump is a byte to avoid collisions. This ensures each campaign has a program-derived address unique to its context.

### Program Instructions


**Instructions Implemented:**
- initializeCampaign: Creates a new campaign with goal, deadline, and campaign_id, initializing the Campaign account with active: true.
- donate: Allows donations, updating total_raised and validating that the campaign is active.
- finalizeCampaign: Closes the campaign by setting active: false, if the deadline has passed or the goal is met, distributing funds to the creator.
- refund: Refunds donors and closes the campaign by setting active: false, if the deadline has passed and the goal is NOT met.

### Account Structure

- creator: Identifies the campaign owner.
- goal: Target amount in SOL, converted to lamports.
- deadline: Expiration date for donations.
- total_raised: Accumulated donation total.
- active: Campaign status (true until closed).
- bump: Used in PDA derivation.
- campaign_id: Unique key for the campaign.

```rust
#[account]
pub struct Campaign {
    pub creator: Pubkey,        // The public key of the campaign creator
    pub goal: u64,              // Goal amount in lamports
    pub deadline: i64,          // Deadline timestamp in seconds
    pub total_raised: u64,      // Total raised amount in lamports
    pub active: bool,           // Indicates if the campaign is active
    pub bump: u8,               // Bump seed for PDA
    pub campaign_id: String,    // Unique campaign identifier
}
```

## Testing

### Test Coverage


**Happy Path Tests:**
- Test 1: Campaign Creation - Verifies that a campaign is successfully initialized with valid parameters (e.g., `goal`, `deadline`, `campaignId`), checking that the `creator`, `goal`, `campaignId`, `active` status, and `totalRaised` are correctly set.
- Test 2: Successful Donation - Confirms that a donation increases the `totalRaised` field in an active campaign by the donated amount.
- Test 3: Finalization with Goal Met - Tests the full happy path (initialize → donate → finalize) where a campaign is created, donated to exceed the goal, and finalized after the deadline, ensuring `active` is set to `false`.
- Test 4: Refund with Expired Deadline - Verifies that a refund is successful when the deadline passes and the goal is not reached, closing the campaign account.

**Unhappy Path Tests:**
- Test 1: Creation with Zero Goal - Ensures initialization fails with `InvalidAmount` when the `goal` is set to zero.
- Test 2: Creation with Past Deadline - Confirms initialization fails with `InvalidDeadline` when the `deadline` is in the past.
- Test 3: Creation with Invalid Campaign ID - Verifies that initialization fails with `InvalidCampaignId` when the `campaignId` exceeds 24 characters.
- Test 4: Donation with Zero Amount - Tests that donating zero SOL fails with `InvalidAmount`.
- Test 5: Donation After Deadline - Ensures donation fails with `DeadlineExpired` after the campaign deadline passes.
- Test 6: Finalization Before Deadline - Confirms finalization fails with `DeadlineNotPassed` when attempted before the deadline.
- Test 7: Finalization with Wrong Creator - Verifies finalization fails with `ConstraintSeeds` when signed by an unauthorized creator.
- Test 8: Refund Before Deadline - Ensures refund fails with `DeadlineNotPassed` when attempted before the deadline.
- Test 9: Refund with Goal Reached - Confirms refund fails with `GoalNotReached` when the goal is met.
- Test 10: Donation to Inactive Campaign - Verifies that donating to a closed campaign fails with `AccountNotInitialized`.

### Running Tests
```bash
# Run tests in the backend
cd sol-raiser
anchor test
```

### Additional Notes for Evaluators

- The project was tested on Devnet using the Phantom wallet. Ensure the network is set to Devnet and you have sufficient SOL for transaction fees.
- The frontend uses inferred status (Closed (Pending Update)) for campaigns with expired deadlines until a transaction updates the blockchain state.
