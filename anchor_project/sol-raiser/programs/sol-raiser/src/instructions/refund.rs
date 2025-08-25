use anchor_lang::prelude::*;
use crate::{errors::SolRaiserError, states::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RefundData {
    pub campaign_id: String,
}

pub fn refund(ctx: Context<RefundAccounts>, _data: RefundData) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let creator = &ctx.accounts.creator;

    // Validate creator
    require_keys_eq!(campaign.creator, creator.key(), SolRaiserError::InvalidCreator);

    // Validate campaign status
    require!(campaign.active, SolRaiserError::CampaignNotActive);

    // Validate deadline
    let now = Clock::get()?.unix_timestamp;
    require!(now > campaign.deadline, SolRaiserError::DeadlineNotPassed);

    // Validate goal (must not have been reached)
    require!(campaign.total_raised < campaign.goal, SolRaiserError::GoalNotReached);

    // Mark campaign as inactive
    campaign.active = false;

    Ok(())
}

#[derive(Accounts)]
#[instruction(data: RefundData)]
pub struct RefundAccounts<'info> {
    #[account(
        mut,
        close = creator,
        seeds = [CAMPAIGN_SEED.as_bytes(), creator.key().as_ref(), data.campaign_id.as_bytes()],
        bump = campaign.bump
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}