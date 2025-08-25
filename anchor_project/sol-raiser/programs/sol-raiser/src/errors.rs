use anchor_lang::prelude::*;

#[error_code]
pub enum SolRaiserError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("The Campaign is not active")]
    CampaignNotActive,
    #[msg("The Campaign deadline has expired")]
    DeadlineExpired,
    #[msg("Invalid campaign creator")]
    InvalidCreator,
    #[msg("Deadline has not passed")]
    DeadlineNotPassed,
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    #[msg("Goal not reached")]
    GoalNotReached,
    #[msg("The campaign ID is invalid")]
    InvalidCampaignId,
}