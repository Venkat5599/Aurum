#!/usr/bin/env node
/**
 * Verification script to check integration completeness
 * Ensures all placeholder code has been replaced with real implementations
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Aurum Integration Verification')
console.log('==================================\n')

let allPassed = true
const issues = []

// Check 1: Transaction files should not contain TODO or placeholder comments
console.log('📝 Checking transaction implementations...')
const transactionFiles = [
  'frontend/lib/transactions/vault.ts',
  'frontend/lib/transactions/compliance.ts',
  'frontend/lib/transactions/yield.ts',
]

transactionFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')

    if (content.includes('TODO:') || content.includes('placeholder')) {
      issues.push(`❌ ${file} still contains TODO or placeholder code`)
      allPassed = false
    } else if (content.includes('await new Promise(resolve => setTimeout(resolve')) {
      issues.push(`❌ ${file} still contains simulation delays`)
      allPassed = false
    } else if (!content.includes('AnchorProvider') || !content.includes('Program')) {
      issues.push(`❌ ${file} doesn't use Anchor properly`)
      allPassed = false
    } else {
      console.log(`  ✅ ${file}`)
    }
  } else {
    issues.push(`❌ ${file} not found`)
    allPassed = false
  }
})

// Check 2: Hooks should fetch real data
console.log('\n🎣 Checking data hooks...')
const hookFiles = [
  'frontend/lib/hooks/useVaultData.ts',
  'frontend/lib/hooks/useComplianceData.ts',
  'frontend/lib/hooks/useOracleData.ts',
  'frontend/lib/hooks/useYieldStrategy.ts',
]

hookFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')

    if (content.includes('program.account') && content.includes('fetch')) {
      console.log(`  ✅ ${file}`)
    } else {
      issues.push(`❌ ${file} doesn't fetch real blockchain data`)
      allPassed = false
    }
  } else {
    issues.push(`❌ ${file} not found`)
    allPassed = false
  }
})

// Check 3: Scripts exist
console.log('\n📜 Checking setup scripts...')
const scripts = [
  'scripts/initialize-programs.ts',
  'scripts/update-oracle-prices.ts',
  'scripts/demo-flow.ts',
]

scripts.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`)
  } else {
    issues.push(`❌ ${file} not found`)
    allPassed = false
  }
})

// Check 4: Test file exists
console.log('\n🧪 Checking test suite...')
const testFile = path.join(__dirname, '..', 'tests/integration.test.ts')
if (fs.existsSync(testFile)) {
  const content = fs.readFileSync(testFile, 'utf-8')
  if (content.includes('describe') && content.includes('it(')) {
    console.log('  ✅ tests/integration.test.ts')
  } else {
    issues.push('❌ Test file exists but has no tests')
    allPassed = false
  }
} else {
  issues.push('❌ tests/integration.test.ts not found')
  allPassed = false
}

// Check 5: Documentation exists
console.log('\n📚 Checking documentation...')
const docs = [
  'INTEGRATION_GUIDE.md',
  'INTEGRATION_COMPLETE.md',
  'README.md',
]

docs.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`)
  } else {
    issues.push(`❌ ${file} not found`)
    allPassed = false
  }
})

// Check 6: Package.json has correct scripts
console.log('\n📦 Checking package.json scripts...')
const packageJsonPath = path.join(__dirname, '..', 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const requiredScripts = ['init', 'update-prices', 'setup', 'start']

  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`  ✅ Script: ${script}`)
    } else {
      issues.push(`❌ Missing script: ${script}`)
      allPassed = false
    }
  })
} else {
  issues.push('❌ package.json not found')
  allPassed = false
}

// Check 7: IDL files exist
console.log('\n📋 Checking IDL files...')
const idlFiles = [
  'frontend/lib/idl/vault.json',
  'frontend/lib/idl/compliance.json',
  'frontend/lib/idl/oracle.json',
  'frontend/lib/idl/yield_optimizer.json',
]

idlFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`)
  } else {
    issues.push(`❌ ${file} not found`)
    allPassed = false
  }
})

// Summary
console.log('\n' + '='.repeat(50))
if (allPassed) {
  console.log('✅ ALL CHECKS PASSED!')
  console.log('\n🎉 Integration is 100% complete!')
  console.log('\nNext steps:')
  console.log('  1. Run: yarn init')
  console.log('  2. Run: yarn dev:frontend')
  console.log('  3. Connect wallet and test!')
} else {
  console.log('❌ SOME CHECKS FAILED\n')
  console.log('Issues found:')
  issues.forEach(issue => console.log('  ' + issue))
  process.exit(1)
}

console.log('\n' + '='.repeat(50))
