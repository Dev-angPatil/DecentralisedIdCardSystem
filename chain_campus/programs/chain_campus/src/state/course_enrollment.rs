use anchor_lang::prelude::*;

#[account]
pub struct CourseEnrollment {
    pub authority: Pubkey,
    pub course_id: String,
    pub bump: u8,
}

impl CourseEnrollment {
    pub const MAX_SIZE: usize = 32 + 4 + 32 + 1; // pubkey + string (max 32 chars) + bump
}
