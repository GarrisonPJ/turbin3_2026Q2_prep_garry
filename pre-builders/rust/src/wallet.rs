use anyhow::Result;
use solana_sdk::signature::{read_keypair_file, Keypair};
use std::path::Path;

// Simply reading the 64-byte json wallet file into Solana Keypairs
pub fn load_keypair_from_file<P: AsRef<Path>>(path: P) -> Result<Keypair> {
    // Wrap the Error to be captured
    read_keypair_file(path).map_err(|e| anyhow::anyhow!("Failed to read keypair file: {}", e))
}
