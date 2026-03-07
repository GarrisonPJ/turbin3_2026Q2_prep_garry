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
    pub wallet_path: String,
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

        let wallet_path =
            env::var("WALLET_PATH").unwrap_or_else(|_| "../dev-wallet.json".to_string());

        Ok(Self {
            rpc_url,
            program_id,
            github_handle,
            wallet_path,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_load_or_fail() {
        //Check if dotenv load will NOT panic and capture Pubkey conversion
        let config_result = Config::load();
        match config_result {
            Ok(config) => {
                //if .env exist, make sure Program ID is NOT all 0
                assert_ne!(config.program_id.to_string(), Pubkey::default().to_string());
            }
            Err(e) => {
                let err_msg = e.to_string();
                assert!(
                    err_msg.contains("Program id is missing")
                        || err_msg.contains("Github account is missing"),
                    "Error downcast failed to capture env context"
                );
            }
        }
    }
}
