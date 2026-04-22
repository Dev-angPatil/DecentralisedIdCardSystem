use anchor_lang::prelude::*;

#[account]
pub struct Student {
    pub authority: Pubkey, // 32
    pub student_id: String, // 4 + max 20
    pub name: String, // 4 + max 50
    pub department: String, // 4 + max 50
    pub semester: String, // 4 + max 20
    pub email: String, // 4 + max 50
    pub bump: u8, // 1
}

impl Student {
    // 32 + 24 + 54 + 54 + 24 + 54 + 1
    pub const MAX_SIZE: usize = 32 + (4 + 20) + (4 + 50) + (4 + 50) + (4 + 20) + (4 + 50) + 1;
}
