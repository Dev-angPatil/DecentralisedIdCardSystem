use anchor_lang::prelude::*;
use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
pub struct ApplyScholarship<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ScholarshipApplication::MAX_SIZE,
        seeds = [SCHOLARSHIP_APPLICATION_SEED, student.key().as_ref(), scholarship.key().as_ref()],
        bump
    )]
    pub application: Account<'info, ScholarshipApplication>,
    pub student: Account<'info, Student>,
    #[account(mut)]
    pub scholarship: Account<'info, Scholarship>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ApplyScholarship>, statement: String) -> Result<()> {
    let application = &mut ctx.accounts.application;
    application.scholarship = ctx.accounts.scholarship.key();
    application.student = ctx.accounts.student.key();
    application.applicant = ctx.accounts.authority.key();
    application.statement = statement;
    application.status = 0;
    application.applied_at = Clock::get()?.unix_timestamp;
    application.reviewed_at = 0;
    application.bump = ctx.bumps.application;

    let scholarship = &mut ctx.accounts.scholarship;
    scholarship.applications += 1;

    Ok(())
}
