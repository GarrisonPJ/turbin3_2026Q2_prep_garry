use anyhow::{Context, Result};
use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CompleteArgs {
    pub github: Vec<u8>,
}

impl CompleteArgs {
    // pre-calculated Anchor Discriminator: sha256("global:complete")[0..8]
    pub const DISCRIMINATOR: [u8; 8] = [0, 77, 224, 147, 136, 25, 88, 76];

    pub fn get_instruction_data(&self) -> Result<Vec<u8>> {
        let mut data = Self::DISCRIMINATOR.to_vec();

        let mut serialized_args = borsh::to_vec(self).context("Failed to serialize args")?;

        // Manually construct the instruction data payload required by the Anchor program router
        // It expects the exact 8-byte discriminator followed by the Borsh-serialized arguments
        data.append(&mut serialized_args);

        Ok(data)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_instruction_data_encoding() {
        let args = CompleteArgs {
            github: b"Turbin3".to_vec(),
        };

        let data = args.get_instruction_data().expect("Should serialize");
        //Check if first 8bytes is the right Anchor Discriminator
        assert_eq!(&data[0..8], &CompleteArgs::DISCRIMINATOR);
        //Check if length is right
        assert_eq!(data.len(), 19, "Payload size mismatch");
        //Check if last part is our input string
        assert_eq!(&data[12..], b"Turbin3");
    }
}
