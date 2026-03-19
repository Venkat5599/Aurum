import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorWallet } from '@solana/wallet-adapter-react'
import { PROGRAM_IDS } from './constants'

// Import IDLs
import vaultIdl from '../idl/vault.json'
import complianceIdl from '../idl/compliance.json'
import oracleIdl from '../idl/oracle.json'
import yieldOptimizerIdl from '../idl/yield_optimizer.json'

export interface Programs {
  vault: Program
  compliance: Program
  oracle: Program
  yieldOptimizer: Program
}

/**
 * Create Anchor program instances for all 4 programs
 */
export function createPrograms(
  connection: Connection,
  wallet: AnchorWallet
): Programs {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  })

  const vault = new Program(vaultIdl as any, PROGRAM_IDS.vault, provider)
  const compliance = new Program(complianceIdl as any, PROGRAM_IDS.compliance, provider)
  const oracle = new Program(oracleIdl as any, PROGRAM_IDS.oracle, provider)
  const yieldOptimizer = new Program(yieldOptimizerIdl as any, PROGRAM_IDS.yieldOptimizer, provider)

  return {
    vault,
    compliance,
    oracle,
    yieldOptimizer,
  }
}
