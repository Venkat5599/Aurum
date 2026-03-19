'use client'

import { useQuery } from '@tanstack/react-query'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Program } from '@coral-xyz/anchor'
import { getAccount } from '@solana/spl-token'
import { VaultData, Vault } from '../types/programs'
import { deriveVaultPDA } from '../programs/pdas'
import { PROGRAM_IDS, MIN_COLLATERAL_RATIO } from '../programs/constants'
import vaultIdl from '../idl/vault.json'

const VAULT_AUTHORITY = new PublicKey(process.env.NEXT_PUBLIC_VAULT_AUTHORITY || '11111111111111111111111111111111')

export function useVaultData() {
  const { connection } = useConnection()
  const { publicKey, wallet } = useWallet()

  return useQuery({
    queryKey: ['vault', publicKey?.toString()],
    queryFn: async (): Promise<VaultData | null> => {
      if (!publicKey || !wallet) return null

      try {
        const program = new Program(vaultIdl as any, PROGRAM_IDS.vault)
        const [vaultPDA] = deriveVaultPDA(VAULT_AUTHORITY)

        const accountInfo = await connection.getAccountInfo(vaultPDA)
        if (!accountInfo) {
          // Vault not initialized
          return {
            totalAuusdMinted: 0,
            totalCollateralValue: 0,
            overCollateralRatio: 110,
            currentCollateralRatio: 0,
            isHealthy: true,
            userAuusdBalance: 0,
          }
        }

        const vault = await program.account.vault.fetch(vaultPDA) as unknown as Vault

        const totalAuusdMinted = vault.totalAuusdMinted.toNumber() / 1_000_000 // Convert from lamports
        const totalCollateralValue = vault.totalCollateralValue.toNumber() / 1_000_000
        const overCollateralRatio = vault.overCollateralRatio

        // Calculate current collateral ratio
        const currentCollateralRatio = totalAuusdMinted > 0 
          ? (totalCollateralValue / totalAuusdMinted) * 100 
          : 0

        const isHealthy = currentCollateralRatio >= MIN_COLLATERAL_RATIO

        // Fetch user's auUSD token balance
        let userAuusdBalance = 0
        try {
          const auusdMint = PROGRAM_IDS.auusdMint
          // Derive user's ATA for auUSD
          const [userAta] = PublicKey.findProgramAddressSync(
            [
              publicKey.toBuffer(),
              new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
              auusdMint.toBuffer(),
            ],
            new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
          )

          const tokenAccount = await getAccount(connection, userAta)
          userAuusdBalance = Number(tokenAccount.amount) / 1_000_000
        } catch (error) {
          // Token account doesn't exist yet, balance is 0
          userAuusdBalance = 0
        }

        return {
          totalAuusdMinted,
          totalCollateralValue,
          overCollateralRatio,
          currentCollateralRatio,
          isHealthy,
          userAuusdBalance,
        }
      } catch (error) {
        console.error('Error fetching vault data:', error)
        return null
      }
    },
    enabled: !!publicKey && !!wallet,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 8000,
  })
}
