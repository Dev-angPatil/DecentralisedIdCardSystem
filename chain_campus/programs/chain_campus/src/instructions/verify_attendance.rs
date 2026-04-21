use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct VerifyAttendance<'info> {
    #[account(mut)]
    pub attendance: Account<'info, AttendanceRecord>,
    pub event: Account<'info, Event>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<VerifyAttendance>) -> Result<()> {
    let event = &ctx.accounts.event;
    
    // Check authority
    if event.authority != ctx.accounts.authority.key() {
        return err!(ChainCampusError::Unauthorised);
    }

    let attendance = &mut ctx.accounts.attendance;
    attendance.verified = true;

    Ok(())
}
