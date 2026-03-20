import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js'
import { AnchorWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import { toast } from 'sonner'
import { PROGRAM_IDS, CLUSTER } from '../programs/constants'
import { deriveVaultPDA, deriveVaultUserStatePDA } from '../programs/pdas'
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
    toast.loading('Preparing transaction...')

    const [vaultPDA] = deriveVaultPDA(VAULT_AUTHORITY)
    const [userStatePDA] = deriveVaultUserStatePDA(wallet.publicKey)

    const auusdMint = PROGRAM_IDS.auusdMint
    const userAuusdAta = await getAssociatedTokenAddress(auusdMint, wallet.publicKey)

    const collateralMint = collateralType === 'gold' 
      ? new PublicKey(process.env.NEXT_PUBLIC_GOLD_MINT || '3Kur8AK9jXTfo4urfKSeuSwS5pBVJdk5jMWax9N2brZK')
      : new PublicKey(process.env.NEXT_PUBLIC_SILVER_MINT || '4Rd5B3es21EMqaun4AcqHgfcnkZVGz2Wqy4bTgLUP9a2')
    
    const userCollateralAta = await getAssociatedTokenAddress(collateralMint, wallet.publicKey)
    const vaultCollateralAta = await getAssociatedTokenAddress(collateralMint, vaultPDA, true)

    const instructions = []
    
    // Check accounts in parallel for speed
    const [userStateInfo, vaultCollateralInfo, userAuusdInfo] = await Promise.all([
      connection.getAccountInfo(userStatePDA),
      connection.getAccountInfo(vaultCollateralAta),
      connection.getAccountInfo(userAuusdAta)
    ])
    
    // Add initialize user instruction if needed
    if (!userStateInfo) {
      const initUserDiscriminator = Buffer.from([111, 17, 185, 250, 60, 122, 38, 254])
      const initUserIx = new (require('@solana/web3.js').TransactionInstruction)({
        keys: [
          { pubkey: userStatePDA, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.vault,
        data: initUserDiscriminator,
      })
      instructions.push(initUserIx)
    }
    
    // Create vault collateral ATA if needed
    if (!vaultCollateralInfo) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          vaultCollateralAta,
          vaultPDA,
          collateralMint
        )
      )
    }
    
    // Create user auUSD ATA if needed
    if (!userAuusdInfo) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userAuusdAta,
          wallet.publicKey,
          auusdMint
        )
      )
    }

    // Build mint instruction
    const collateralAmountLamports = new BN(collateralAmount * 1_000_000)
    const auusdAmount = new BN(Math.floor(collateralAmount * 2650 * 1_000_000 / 1.1))

    const discriminator = Buffer.from([66, 132, 7, 211, 94, 36, 181, 99])
    const amountBuffer = Buffer.alloc(8)
    amountBuffer.writeBigUInt64LE(BigInt(auusdAmount.toString()))
    const collateralBuffer = Buffer.alloc(8)
    collateralBuffer.writeBigUInt64LE(BigInt(collateralAmountLamports.toString()))
    const data = Buffer.concat([discriminator, amountBuffer, collateralBuffer])

    const mintIx = new (require('@solana/web3.js').TransactionInstruction)({
      keys: [
        { pubkey: vaultPDA, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: userStatePDA, isSigner: false, isWritable: true },
        { pubkey: auusdMint, isSigner: false, isWritable: true },
        { pubkey: userAuusdAta, isSigner: false, isWritable: true },
        { pubkey: userCollateralAta, isSigner: false, isWritable: true },
        { pubkey: vaultCollateralAta, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.vault,
      data,
    })
    instructions.push(mintIx)

    // Build and send transaction
    const { blockhash } = await connection.getLatestBlockhash('confirmed')
    const transaction = new Transaction()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = wallet.publicKey
    instructions.forEach(ix => transaction.add(ix))

    toast.dismiss()
    toast.loading('Awaiting signature...')
    
    const signed = await wallet.signTransaction(transaction)
    
    toast.dismiss()
    toast.loading('Sending transaction...')
    
    const signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    })
    
    toast.dismiss()
    toast.loading('Confirming...')
    
    await connection.confirmTransaction(signature, 'confirmed')

    toast.dismiss()
    toast.success('Successfully minted auUSD!', {
      description: `Deposited ${collateralAmount} ${collateralType.toUpperCase()}`,
      action: {
        label: 'View',
        onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`, '_blank')
      }
    })

    return { success: true, signature }
  } catch (error: any) {
    console.error('Mint error:', error)
    toast.dismiss()
    
    let errorMessage = error.message || 'Transaction failed'
    if (error.message?.includes('insufficient')) {
      errorMessage = 'Insufficient collateral balance'
    } else if (error.message?.includes('0x1')) {
      errorMessage = 'Insufficient funds for transaction'
    } else if (error.message?.includes('User rejected')) {
      errorMessage = 'Transaction cancelled'
    }
    
    toast.error('Mint failed', {
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
    toast.loading('Preparing transaction...')

    const [vaultPDA] = deriveVaultPDA(VAULT_AUTHORITY)

    const auusdMint = PROGRAM_IDS.auusdMint
    const userAuusdAta = await getAssociatedTokenAddress(auusdMint, wallet.publicKey)

    const collateralMint = collateralType === 'gold' 
      ? new PublicKey(process.env.NEXT_PUBLIC_GOLD_MINT || '3Kur8AK9jXTfo4urfKSeuSwS5pBVJdk5jMWax9N2brZK')
      : new PublicKey(process.env.NEXT_PUBLIC_SILVER_MINT || '4Rd5B3es21EMqaun4AcqHgfcnkZVGz2Wqy4bTgLUP9a2')
    
    const userCollateralAta = await getAssociatedTokenAddress(collateralMint, wallet.publicKey)
    const vaultCollateralAta = await getAssociatedTokenAddress(collateralMint, vaultPDA, true)

    const auusdAmountLamports = new BN(auusdAmount * 1_000_000)

    const discriminator = Buffer.from([67, 0, 245, 36, 192, 7, 199, 168])
    const amountBuffer = Buffer.alloc(8)
    amountBuffer.writeBigUInt64LE(BigInt(auusdAmountLamports.toString()))
    const data = Buffer.concat([discriminator, amountBuffer])

    const redeemIx = new (require('@solana/web3.js').TransactionInstruction)({
      keys: [
        { pubkey: vaultPDA, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: auusdMint, isSigner: false, isWritable: true },
        { pubkey: userAuusdAta, isSigner: false, isWritable: true },
        { pubkey: userCollateralAta, isSigner: false, isWritable: true },
        { pubkey: vaultCollateralAta, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.vault,
      data,
    })

    const { blockhash } = await connection.getLatestBlockhash('confirmed')
    const transaction = new Transaction()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = wallet.publicKey
    transaction.add(redeemIx)

    toast.dismiss()
    toast.loading('Awaiting signature...')
    
    const signed = await wallet.signTransaction(transaction)
    
    toast.dismiss()
    toast.loading('Sending transaction...')
    
    const signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    })
    
    toast.dismiss()
    toast.loading('Confirming...')
    
    await connection.confirmTransaction(signature, 'confirmed')

    toast.dismiss()
    toast.success('Successfully redeemed collateral!', {
      description: `Burned ${auusdAmount} auUSD`,
      action: {
        label: 'View',
        onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`, '_blank')
      }
    })

    return { success: true, signature }
  } catch (error: any) {
    console.error('Redeem error:', error)
    toast.dismiss()
    
    let errorMessage = error.message || 'Transaction failed'
    if (error.message?.includes('insufficient')) {
      errorMessage = 'Insufficient auUSD balance'
    } else if (error.message?.includes('0x1')) {
      errorMessage = 'Insufficient funds for transaction'
    } else if (error.message?.includes('User rejected')) {
      errorMessage = 'Transaction cancelled'
    }
    
    toast.error('Redeem failed', {
      description: errorMessage
    })
    return { success: false, signature: null }
  }
}
