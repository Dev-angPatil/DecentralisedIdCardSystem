use anchor_lang::prelude::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct ReviewScholarshipApplication<'info> {
    #[account(mut)]
    pub application: Account<'info, ScholarshipApplication>,
    pub scholarship: Account<'info, Scholarship>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<ReviewScholarshipApplication>, approved: bool) -> Result<()> {
    let scholarship = &ctx.accounts.scholarship;

    if scholarship.authority != ctx.accounts.authority.key() {
        return err!(ChainCampusError::Unauthorised);
    }

    let application = &mut ctx.accounts.application;
    application.status = if approved { 1 } else { 2 };
    application.reviewed_at = Clock::get()?.unix_timestamp;

    Ok(())
}
