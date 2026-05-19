use anchor_lang::prelude::*;
use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(scholarship_id: String)]
pub struct CreateScholarship<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Scholarship::MAX_SIZE,
        seeds = [SCHOLARSHIP_SEED, authority.key().as_ref(), scholarship_id.as_bytes()],
        bump
    )]
    pub scholarship: Account<'info, Scholarship>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateScholarship>,
    scholarship_id: String,
    title: String,
    description: String,
    eligibility: String,
    amount: u64,
    deadline: i64,
) -> Result<()> {
    let scholarship = &mut ctx.accounts.scholarship;
    scholarship.authority = ctx.accounts.authority.key();
    scholarship.scholarship_id = scholarship_id;
    scholarship.title = title;
    scholarship.description = description;
    scholarship.eligibility = eligibility;
    scholarship.amount = amount;
    scholarship.deadline = deadline;
    scholarship.applications = 0;
    scholarship.bump = ctx.bumps.scholarship;
    Ok(())
}
