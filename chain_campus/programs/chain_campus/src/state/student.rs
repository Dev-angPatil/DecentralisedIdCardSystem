use anchor_lang::prelude::*;

#[account]
pub struct Student {
    pub authority: Pubkey, // 32
    pub student_id: String, // 4 + len (assume max 20)
    pub name: String, // 4 + len (assume max 50)
    pub bump: u8, // 1
}

impl Student {
    pub const MAX_SIZE: usize = 32 + (4 + 20) + (4 + 50) + 1;
}
