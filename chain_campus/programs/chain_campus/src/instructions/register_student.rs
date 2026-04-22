use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(student_id: String)]
pub struct RegisterStudent<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Student::MAX_SIZE,
        seeds = [STUDENT_SEED, authority.key().as_ref(), student_id.as_bytes()],
        bump
    )]
    pub student: Account<'info, Student>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RegisterStudent>, student_id: String, name: String, department: String, semester: String, email: String) -> Result<()> {
    let student = &mut ctx.accounts.student;
    student.authority = ctx.accounts.authority.key();
    student.student_id = student_id;
    student.name = name;
    student.department = department;
    student.semester = semester;
    student.email = email;
    student.bump = ctx.bumps.student;
    Ok(())
}
