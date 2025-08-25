use anchor_lang::prelude::*;

pub const CAMPAIGN_SEED: &str = "campaign";

#[account]
#[derive(InitSpace)]
pub struct Campaign {
    pub creator: Pubkey,
    pub goal: u64,
    pub deadline: i64,
    pub total_raised: u64,
    pub active: bool,
    pub bump: u8,

    #[max_len(24)]
    pub campaign_id: String,
}

impl Campaign {
    pub const MAX_CAMPAIGN_ID_LEN: usize = 24;
}