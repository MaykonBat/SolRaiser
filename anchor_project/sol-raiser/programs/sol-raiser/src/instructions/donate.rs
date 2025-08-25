use crate::{errors::SolRaiserError, states::*};
use anchor_lang::{prelude::*, system_program};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DonateData {
    pub amount: u64,
    pub campaign_id: String,
}

pub fn donate(ctx: Context<DonateAccounts>, data: DonateData) -> Result<()> {
    // Validate amount
    require!(data.amount > 0, SolRaiserError::InvalidAmount);

    // Validate campaign status
    let campaign = &ctx.accounts.campaign;
    require!(campaign.active, SolRaiserError::CampaignNotActive);

    let now = Clock::get()?.unix_timestamp;
    require!(now <= campaign.deadline, SolRaiserError::DeadlineExpired);

    // Transfer lamports from donor to campaign PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.donor.to_account_info(),
                to: ctx.accounts.campaign.to_account_info(),
            },
        ),
        data.amount,
    )?;

    // Update total raised
    let campaign = &mut ctx.accounts.campaign;
    campaign.total_raised = campaign
        .total_raised
        .checked_add(data.amount)
        .ok_or(SolRaiserError::InvalidAmount)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(data: DonateData)]
pub struct DonateAccounts<'info> {
    #[account(
        mut,
        seeds = [CAMPAIGN_SEED.as_bytes(), campaign.creator.as_ref(), data.campaign_id.as_bytes()],
        bump = campaign.bump
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub donor: Signer<'info>,
    pub system_program: Program<'info, System>,
}
