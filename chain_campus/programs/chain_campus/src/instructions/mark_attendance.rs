use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct MarkAttendance<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + AttendanceRecord::MAX_SIZE,
        seeds = [ATTENDANCE_SEED, student.key().as_ref(), event.key().as_ref()],
        bump
    )]
    pub attendance: Account<'info, AttendanceRecord>,
    pub student: Account<'info, Student>,
    pub event: Account<'info, Event>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MarkAttendance>) -> Result<()> {
    let event = &ctx.accounts.event;
    let now = Clock::get()?.unix_timestamp;

    // Check time window
    if now < event.start_time || now > event.end_time {
        return err!(ChainCampusError::AttendanceWindowClosed);
    }

    let attendance = &mut ctx.accounts.attendance;
    attendance.student = ctx.accounts.student.key();
    attendance.event = ctx.accounts.event.key();
    attendance.verified = false;
    attendance.timestamp = now;
    attendance.bump = ctx.bumps.attendance;

    Ok(())
}
