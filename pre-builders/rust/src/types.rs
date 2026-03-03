use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CompleteArgs {
    pub github: Vec<u8>,
}

impl CompleteArgs {
    // pre-calculated Anchor Discriminator: sha256("global:complete")[0..8]
    pub const DISCRIMINATOR: [u8; 8] = [0, 77, 224, 147, 136, 25, 88, 76];

    pub fn get_instruction_data(&self) -> Vec<u8> {
        let mut data = Self::DISCRIMINATOR.to_vec();

        let mut serialized_args = borsh::to_vec(self).expect("Failed to serialize args");

        // Manually construct the instruction data payload required by the Anchor program router
        // It expects the exact 8-byte discriminator followed by the Borsh-serialized arguments
        data.append(&mut serialized_args);

        data
    }
}
