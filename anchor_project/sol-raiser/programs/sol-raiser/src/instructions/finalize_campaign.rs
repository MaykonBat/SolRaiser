use anchor_lang::prelude::*;
use crate::{errors::SolRaiserError, states::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct FinalizeCampaignData {
    pub campaign_id: String,
}

pub fn finalize_campaign(ctx: Context<FinalizeCampaignAccounts>, _data: FinalizeCampaignData) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let creator = &ctx.accounts.creator;

    // Validate creator
    require_keys_eq!(campaign.creator, creator.key(), SolRaiserError::InvalidCreator);

    // Validate campaign status
    require!(campaign.active, SolRaiserError::CampaignNotActive);

    // Validate goal reached or deadline passed
    let now = Clock::get()?.unix_timestamp;
    let can_finalize = campaign.total_raised >= campaign.goal || now > campaign.deadline;
    require!(can_finalize, SolRaiserError::DeadlineNotPassed);

    // Mark campaign as inactive
    campaign.active = false;

    Ok(())
}

#[derive(Accounts)]
#[instruction(data: FinalizeCampaignData)]
pub struct FinalizeCampaignAccounts<'info> {
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