use crate::config::Config;
use crate::types::CompleteArgs;
use crate::wallet::load_keypair_from_file;
use anyhow::{Context, Result};
use solana_client::rpc_client::RpcClient;
use solana_program::{
    instruction::{AccountMeta, Instruction},
    system_program,
};
use solana_sdk::{
    commitment_config::CommitmentConfig,
    message::{v0, VersionedMessage},
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::VersionedTransaction,
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

    pub fn enroll(&self) -> Result<String> {
        //Find PDA
        let bindings = &self.signer.pubkey();
        let seeds = &[b"prereq", bindings.as_ref()];
        let (prereq_pda, _bump) = Pubkey::find_program_address(seeds, &self.program_id);

        //construct instruction parameters
        let args = CompleteArgs {
            github: self.github.as_bytes().to_vec(),
        };
        let instruction_data = args.get_instruction_data();

        //constrcut AccountMeta
        let accounts = vec![
            AccountMeta::new(self.signer.pubkey(), true),
            AccountMeta::new(prereq_pda, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ];

        //construct instructions
        let instruction = Instruction {
            program_id: self.program_id,
            accounts,
            data: instruction_data,
        };

        let blockhash = self
            .client
            .get_latest_blockhash()
            .context("Failed to get blockhash")?;

        //construct V0Message
        let message =
            v0::Message::try_compile(&self.signer.pubkey(), &[instruction], &[], blockhash)
                .context("Failed to compile v0 message")?;

        let tx = VersionedTransaction::try_new(VersionedMessage::V0(message), &[&self.signer])
            .context("Failed to sign transaction")?;

        let signature = self
            .client
            .send_and_confirm_transaction(&tx)
            .context("Failed to send transaction")?;

        Ok(signature.to_string())
    }
}
