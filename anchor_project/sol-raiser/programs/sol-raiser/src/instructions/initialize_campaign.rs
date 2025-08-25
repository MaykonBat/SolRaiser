use anchor_lang::prelude::*;
use crate::{errors::SolRaiserError, states::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeCampaignData {
    pub goal: u64,
    pub deadline: i64,
    pub campaign_id: String,
}

pub fn initialize_campaign(
    ctx: Context<InitializeCampaignAccounts>,
    data: InitializeCampaignData,
) -> Result<()> {
    // Validate inputs
    require!(data.goal > 0, SolRaiserError::InvalidAmount);

    let now = Clock::get()?.unix_timestamp;
    require!(data.deadline > now, SolRaiserError::InvalidDeadline);

    let id_len = data.campaign_id.as_bytes().len();
    require!(
        id_len > 0 && id_len <= Campaign::MAX_CAMPAIGN_ID_LEN,
        SolRaiserError::InvalidCampaignId
    );

    // Initialize campaign account
    let campaign = &mut ctx.accounts.campaign;
    campaign.creator = ctx.accounts.creator.key();
    campaign.goal = data.goal;
    campaign.deadline = data.deadline;
    campaign.total_raised = 0;
    campaign.active = true;
    campaign.bump = ctx.bumps.campaign;
    campaign.campaign_id = data.campaign_id;

    Ok(())
}

#[derive(Accounts)]
#[instruction(data: InitializeCampaignData)]
pub struct InitializeCampaignAccounts<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Campaign::INIT_SPACE,
        seeds = [CAMPAIGN_SEED.as_bytes(), creator.key().as_ref(), data.campaign_id.as_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}
