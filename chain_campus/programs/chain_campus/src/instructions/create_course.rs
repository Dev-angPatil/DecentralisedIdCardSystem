use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct CreateCourse<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Course::MAX_SIZE,
        seeds = [COURSE_SEED, authority.key().as_ref(), course_id.as_bytes()],
        bump
    )]
    pub course: Account<'info, Course>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateCourse>,
    course_id: String,
    name: String,
    credits: u8,
    instructor: String,
) -> Result<()> {
    let course = &mut ctx.accounts.course;
    course.authority = ctx.accounts.authority.key();
    course.course_id = course_id;
    course.name = name;
    course.credits = credits;
    course.instructor = instructor;
    course.bump = ctx.bumps.course;
    Ok(())
}
