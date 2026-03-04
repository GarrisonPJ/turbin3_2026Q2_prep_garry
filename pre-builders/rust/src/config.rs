use anyhow::{Context, Result};
use solana_program::pubkey::Pubkey;
use std::env;
use std::str::FromStr;

// Centralize environment configuration loader
// Avoid hardcoded variable
pub struct Config {
    pub rpc_url: String,
    pub program_id: Pubkey,
    pub github_handle: String,
}

impl Config {
    pub fn load() -> Result<Self> {
        dotenvy::dotenv().ok();

        let rpc_url = env::var("SOLANA_RPC_URL")
            .unwrap_or_else(|_| "https://api.devnet.solana.com".to_string());

        let program_id_str =
            env::var("TURBIN3_PROGRAM_ID").context("Program id is missing in env file")?;
        let program_id = Pubkey::from_str(&program_id_str).context("Invalid program id")?;

        let github_handle =
            std::env::var("GITHUB_HANDLE").context("Github account is missing in env file")?;

        Ok(Self {
            rpc_url,
            program_id,
            github_handle,
        })
    }
}
