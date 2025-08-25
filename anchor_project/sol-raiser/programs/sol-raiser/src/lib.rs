use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

use instructions::*;

declare_id!("Eu4kchg5AA7yEjAnSH3yTdShVM6jW1wpsSxgAPLDi6Uz");

#[program]
pub mod sol_raiser {
    use super::*;

    pub fn initialize_campaign(ctx: Context<InitializeCampaignAccounts>, data: InitializeCampaignData) -> Result<()> {
        instructions::initialize_campaign(ctx, data)
    }

    pub fn donate(ctx: Context<DonateAccounts>, data: DonateData) -> Result<()> {
        instructions::donate(ctx, data)
    }

    pub fn finalize_campaign(ctx: Context<FinalizeCampaignAccounts>, data: FinalizeCampaignData) -> Result<()> {
        instructions::finalize_campaign(ctx, data)
    }

    pub fn refund(ctx: Context<RefundAccounts>, data: RefundData) -> Result<()> {
        instructions::refund(ctx, data)
    }
}