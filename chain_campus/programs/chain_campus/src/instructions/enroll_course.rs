use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct EnrollCourse<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + CourseEnrollment::MAX_SIZE,
        seeds = [COURSE_ENROLLMENT_SEED, authority.key().as_ref(), course_id.as_bytes()],
        bump
    )]
    pub enrollment: Account<'info, CourseEnrollment>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<EnrollCourse>, course_id: String) -> Result<()> {
    let enrollment = &mut ctx.accounts.enrollment;
    enrollment.authority = ctx.accounts.authority.key();
    enrollment.course_id = course_id;
    enrollment.bump = ctx.bumps.enrollment;
    Ok(())
}
