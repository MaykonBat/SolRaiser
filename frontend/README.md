# SolRaiser Frontend

**Deployed Frontend URL:** https://sol-raiser-two.vercel.app/

## Project Overview

### Description
The SolRaiser Frontend is a React-based user interface built with TypeScript, designed to interact with the SolRaiser Solana program. It allows users to create, donate to, finalize, and refund crowdfunding campaigns, integrating seamlessly with the Phantom wallet on the Solana Devnet.

### Key Features
- **Campaign Creation** - Provides a modal for creating campaigns with a simple form.
- **Real-Time Listing** - Displays active campaigns with dynamic status updates.
- **Donation Interface** - Enables users to donate SOL to campaigns.
- **Finalization and Refund** - Offers buttons to finalize or refund campaigns based on conditions.

### How to Use the dApp
1. **Connect Wallet** - Open the app at ???.Connect your Phantom wallet via the wallet icon.
2. **Create a Campaign** - Click "Create Campaign", fill in the ID, goal, and deadline, and confirm the transaction.
3. **Donate to a Campaign** - Select a campaign, click "Donate", enter the amount, and confirm in Phantom.
4. **Finalize or Refund** - After the deadline or goal is met, click "Finalize" or "Refund" and confirm.

## Program Architecture

### PDA Usage
**PDAs Used:**
- **Campaign PDA**: Derived in the frontend using `[creator, campaign_id, bump]` to match the backend, ensuring correct account addressing.

### Program Instructions
**Instructions Implemented:**
- **initializeCampaign**: Triggered via the "Create Campaign" modal.
- **donate**: Called when users donate SOL.
- **finalizeCampaign**: Executed via the "Finalize" button.
- **refund**: Triggered by the "Refund" button.

### Account Structure
```typescript
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
