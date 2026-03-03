use crate::config::Config;
use crate::wallet::load_keypair_from_file;
use anyhow::{Context, Result};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
};

pub struct SolanaOps {
    pub client: RpcClient,
    pub signer: Keypair,
    pub program_id: Pubkey,
    pub github: String,
}

// Core operational engine handling RPC interactions and transaction signing.
impl SolanaOps {
    pub fn new(config: &Config, keypair_path: &str) -> Result<Self> {
        //init a client, use 'confirmed' to ensure transactions are included in block
        let client = RpcClient::new_with_commitment(&config.rpc_url, CommitmentConfig::confirmed());

        //pass our keypair to signer
        let signer = load_keypair_from_file(keypair_path)?;

        Ok(Self {
            client,
            signer,
            program_id: config.program_id,
            github: config.github_handle.clone(),
        })
    }
}
