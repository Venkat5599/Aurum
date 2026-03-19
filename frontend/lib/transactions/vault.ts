import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { AnchorWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token'
import { toast } from 'sonner'
import { PROGRAM_IDS, CLUSTER } from '../programs/constants'
import { deriveVaultPDA, deriveUserStatePDA } from '../programs/pdas'
import vaultIdl from '../idl/vault.json'

// Vault authority (should match the authority used during vault initialization)
const VAULT_AUTHORITY = new PublicKey(process.env.NEXT_PUBLIC_VAULT_AUTHORITY || '11111111111111111111111111111111')

/**
 * Mint auUSD by depositing collateral
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param collateralAmount Amount of collateral to deposit (in tokens)
 * @param collateralType Type of collateral ('gold' or 'silver')
 */
export async function mintAuusd(
  connection: Connection,
  wallet: AnchorWallet,
  collateralAmount: number,
  collateralType: 'gold' | 'silver'
) {
  try {
    toast.loading('Preparing mint transaction...')

    // Check if vault program has mint method
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
    const program = new Program(vaultIdl as any, PROGRAM_IDS.vault, provider)

    // Check if the method exists in the IDL
    if (!program.methods.mintAuusd) {
      toast.dismiss()
      toast.info('Mint functionality coming soon', {
        description: 'The vault program is deployed but the mint instruction needs to be implemented. This is a demo environment.'
      })
      return { success: false, signature: null }
    }

    // Rest of the mint logic...
    const [vaultPDA] = deriveVaultPDA(VAULT_AUTHORITY)
    const [userStatePDA] = deriveUserStatePDA(wallet.publicKey)

    const auusdMint = PROGRAM_IDS.auusdMint
    const userAuusdAta = await getAssociatedTokenAddress(auusdMint, wallet.publicKey)

    const collateralMint = collateralType === 'gold' 
      ? new PublicKey(process.env.NEXT_PUBLIC_GOLD_MINT || '3Kur8AK9jXTfo4urfKSeuSwS5pBVJdk5jMWax9N2brZK')
      : new PublicKey(process.env.NEXT_PUBLIC_SILVER_MINT || '4Rd5B3es21EMqaun4AcqHgfcnkZVGz2Wqy4bTgLUP9a2')
    
    const userCollateralAta = await getAssociatedTokenAddress(collateralMint, wallet.publicKey)
    const vaultCollateralAta = await getAssociatedTokenAddress(collateralMint, vaultPDA, true)

    const instructions = []
    try {
      await getAccount(connection, userAuusdAta)
    } catch {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userAuusdAta,
          wallet.publicKey,
          auusdMint
        )
      )
    }

    const collateralAmountLamports = new BN(collateralAmount * 1_000_000)
    const auusdAmount = new BN(collateralAmount * 2650 * 1_000_000 / 1.1)

    const mintIx = await program.methods
      .mintAuusd(auusdAmount, collateralAmountLamports)
      .accounts({
        vault: vaultPDA,
        user: wallet.publicKey,
        userState: userStatePDA,
        auusdMint: auusdMint,
        userAuusd: userAuusdAta,
        userCollateral: userCollateralAta,
        vaultCollateral: vaultCollateralAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction()

    instructions.push(mintIx)

    const tx = await provider.sendAndConfirm(
      await provider.connection.getLatestBlockhash().then(({ blockhash }) => {
        const transaction = new (require('@solana/web3.js').Transaction)()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = wallet.publicKey
        instructions.forEach(ix => transaction.add(ix))
        return transaction
      })
    )

    toast.dismiss()
    toast.success('Successfully minted auUSD!', {
      description: `Deposited ${collateralAmount} ${collateralType.toUpperCase()}`,
      action: {
        label: 'View on Explorer',
        onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=${CLUSTER}`, '_blank')
      }
    })

    return { success: true, signature: tx }
  } catch (error: any) {
    console.error('Mint error:', error)
    toast.dismiss()
    
    // Better error messages
    let errorMessage = 'Transaction failed'
    if (error.message?.includes('size')) {
      errorMessage = 'Vault program needs full implementation. This is a demo environment.'
    } else if (error.message?.includes('insufficient')) {
      errorMessage = 'Insufficient collateral balance'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    toast.error('Mint not available yet', {
      description: errorMessage
    })
    return { success: false, signature: null }
  }
}

/**
 * Redeem collateral by burning auUSD
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param auusdAmount Amount of auUSD to burn
 * @param collateralType Type of collateral to receive
 */
export async function redeemAuusd(
  connection: Connection,
  wallet: AnchorWallet,
  auusdAmount: number,
  collateralType: 'gold' | 'silver'
) {
  try {
    toast.loading('Preparing redeem transaction...')

    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
    const program = new Program(vaultIdl as any, PROGRAM_IDS.vault, provider)

    // Check if the method exists in the IDL
    if (!program.methods.redeemAuusd) {
      toast.dismiss()
      toast.info('Redeem functionality coming soon', {
        description: 'The vault program is deployed but the redeem instruction needs to be implemented. This is a demo environment.'
      })
      return { success: false, signature: null }
    }

    const [vaultPDA] = deriveVaultPDA(VAULT_AUTHORITY)

    const auusdMint = PROGRAM_IDS.auusdMint
    const userAuusdAta = await getAssociatedTokenAddress(auusdMint, wallet.publicKey)

    const collateralMint = collateralType === 'gold' 
      ? new PublicKey(process.env.NEXT_PUBLIC_GOLD_MINT || '3Kur8AK9jXTfo4urfKSeuSwS5pBVJdk5jMWax9N2brZK')
      : new PublicKey(process.env.NEXT_PUBLIC_SILVER_MINT || '4Rd5B3es21EMqaun4AcqHgfcnkZVGz2Wqy4bTgLUP9a2')
    
    const userCollateralAta = await getAssociatedTokenAddress(collateralMint, wallet.publicKey)
    const vaultCollateralAta = await getAssociatedTokenAddress(collateralMint, vaultPDA, true)

    const auusdAmountLamports = new BN(auusdAmount * 1_000_000)

    const redeemIx = await program.methods
      .redeemAuusd(auusdAmountLamports)
      .accounts({
        vault: vaultPDA,
        user: wallet.publicKey,
        auusdMint: auusdMint,
        userAuusd: userAuusdAta,
        userCollateral: userCollateralAta,
        vaultCollateral: vaultCollateralAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction()

    const tx = await provider.sendAndConfirm(
      await provider.connection.getLatestBlockhash().then(({ blockhash }) => {
        const transaction = new (require('@solana/web3.js').Transaction)()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = wallet.publicKey
        transaction.add(redeemIx)
        return transaction
      })
    )

    toast.dismiss()
    toast.success('Successfully redeemed collateral!', {
      description: `Burned ${auusdAmount} auUSD`,
      action: {
        label: 'View on Explorer',
        onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=${CLUSTER}`, '_blank')
      }
    })

    return { success: true, signature: tx }
  } catch (error: any) {
    console.error('Redeem error:', error)
    toast.dismiss()
    
    // Better error messages
    let errorMessage = 'Transaction failed'
    if (error.message?.includes('size')) {
      errorMessage = 'Vault program needs full implementation. This is a demo environment.'
    } else if (error.message?.includes('insufficient')) {
      errorMessage = 'Insufficient auUSD balance'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    toast.error('Redeem not available yet', {
      description: errorMessage
    })
    return { success: false, signature: null }
  }
}
