use anchor_lang::prelude::*;

#[account]
pub struct Course {
    pub authority: Pubkey,
    pub course_id: String,
    pub name: String,
    pub credits: u8,
    pub instructor: String,
    pub bump: u8,
}

impl Course {
    // 32 (pubkey) + 4+32 (id) + 4+64 (name) + 1 (credits) + 4+64 (instructor) + 1 (bump)
    pub const MAX_SIZE: usize = 32 + 36 + 68 + 1 + 68 + 1;
}
