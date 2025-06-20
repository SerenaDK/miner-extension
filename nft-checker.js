// Network configuration - Ronin Mainnet
const network = {
    name: 'Ronin Mainnet',
    rpc: 'https://api.roninchain.com/rpc',
    chainId: 2020
};

// Your MiningNFTReward contract address on Ronin Mainnet
const CONTRACT_ADDRESS = '0xc0A07436d5bcf89590ec63Da35760b830B7d2b90';

// Function signatures - generated from your actual ABI
const FUNCTION_SIGNATURES = {
    // Basic contract info
    owner: '0x8da5cb5b',           // owner() - confirmed working
    
    // NFT-specific functions - from your actual MiningNFTReward.json ABI
    nftLevel: '0xbec98691',        // nftLevel(uint256) - returns uint256
    verifiedNFTs: '0xd7a3100e',    // verifiedNFTs(uint256) - returns bool
    
    // NOTE: bannedNFTs function does NOT exist in your ABI!
    // Your contract doesn't have a bannedNFTs function at all
};

// Helper function to pad hex string to 64 characters (32 bytes)
function padHex(hex, length = 64) {
    const cleanHex = hex.toString().replace('0x', '');
    return cleanHex.padStart(length, '0');
}

// Helper function to make RPC call
async function makeRPCCall(method, params) {
    const response = await fetch(network.rpc, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: 1
        })
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }
    return data.result;
}

// Function to call contract method with no parameters
async function callContractFunctionNoParams(functionSig) {
    console.log('Contract call (no params):', {
        functionSig,
        finalData: functionSig
    });
    
    const result = await makeRPCCall('eth_call', [{
        to: CONTRACT_ADDRESS,
        data: functionSig
    }, 'latest']);

    return result;
}

// Function to call contract method with uint256 parameter - matching React BigInt approach
async function callContractFunction(functionSig, tokenId) {
    // Convert tokenId to BigInt first (like React), then to hex and pad to 32 bytes
    const tokenIdBigInt = BigInt(tokenId);
    const tokenIdHex = tokenIdBigInt.toString(16);
    const paddedTokenId = padHex(tokenIdHex);
    const data = functionSig + paddedTokenId;
    
    console.log('Contract call details (matching React BigInt approach):', {
        functionSig,
        tokenId,
        tokenIdBigInt: tokenIdBigInt.toString(),
        tokenIdHex,
        paddedTokenId,
        finalData: data
    });
    
    const result = await makeRPCCall('eth_call', [{
        to: CONTRACT_ADDRESS,
        data: data
    }, 'latest']);

    return result;
}

// Test only the owner function to verify contract connection
async function testOwnerFunction() {
    console.log('🧪 Testing owner function...');
    
    try {
        console.log(`🔍 Testing owner (${FUNCTION_SIGNATURES.owner})...`);
        const result = await callContractFunctionNoParams(FUNCTION_SIGNATURES.owner);
        console.log(`✅ owner SUCCESS:`, result);
        
        // Display owner address in readable format
        const ownerAddress = '0x' + result.slice(-40); // Take last 40 characters (20 bytes)
        console.log(`👤 Contract Owner: ${ownerAddress}`);
        
        return { success: true, result, ownerAddress };
    } catch (error) {
        console.log(`❌ owner FAILED:`, error.message);
        return { success: false, error: error.message };
    }
}

// Test NFT-specific functions
async function testNFTFunctions(tokenId) {
    console.log(`🧪 Testing NFT functions for token ${tokenId}...`);
    
    const results = {};
    
    // Test verifiedNFTs
    try {
        console.log(`🔍 Testing verifiedNFTs for token ${tokenId}...`);
        const result = await callContractFunction(FUNCTION_SIGNATURES.verifiedNFTs, tokenId);
        console.log(`✅ verifiedNFTs SUCCESS:`, result);
        results.verifiedNFTs = { success: true, result };
    } catch (error) {
        console.log(`❌ verifiedNFTs FAILED:`, error.message);
        results.verifiedNFTs = { success: false, error: error.message };
    }
    
    // Test nftLevel
    try {
        console.log(`🔍 Testing nftLevel for token ${tokenId}...`);
        const result = await callContractFunction(FUNCTION_SIGNATURES.nftLevel, tokenId);
        console.log(`✅ nftLevel SUCCESS:`, result);
        results.nftLevel = { success: true, result };
    } catch (error) {
        console.log(`❌ nftLevel FAILED:`, error.message);
        results.nftLevel = { success: false, error: error.message };
    }
    
    // NOTE: bannedNFTs function does NOT exist in the contract ABI
    // The contract doesn't have this function, so we skip it entirely
    
    return results;
}

function showLoading() {
    document.getElementById('loading').classList.add('show');
    document.getElementById('results').classList.remove('show');
    document.getElementById('error').classList.remove('show');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    hideLoading();
}

function showResults(tokenId, level, isBanned, isVerified) {
    document.getElementById('tokenIdResult').textContent = tokenId;
    document.getElementById('levelResult').textContent = level;
    
    const banResult = document.getElementById('banResult');
    banResult.textContent = isBanned ? 'BANNED' : 'NOT BANNED';
    banResult.className = `result-value ${isBanned ? 'banned' : 'not-banned'}`;
    
    const verifiedResult = document.getElementById('verifiedResult');
    verifiedResult.textContent = isVerified ? 'VERIFIED' : 'NOT VERIFIED';
    verifiedResult.className = `result-value ${isVerified ? 'not-banned' : 'banned'}`;
    
    document.getElementById('results').classList.add('show');
    hideLoading();
}

async function checkNFT() {
    const tokenId = document.getElementById('tokenId').value.trim();

    // Validation
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x...') {
        showError('Contract address not configured. Please update the CONTRACT_ADDRESS in the code.');
        return;
    }

    // Validation matching React approach - check for valid numeric input
    if (!tokenId || tokenId.trim() === '' || isNaN(tokenId) || parseInt(tokenId) < 0) {
        showError('Please enter a valid numeric token ID');
        return;
    }
    
    // Additional validation - ensure we can convert to BigInt (like React does)
    try {
        BigInt(tokenId);
    } catch (error) {
        showError('Invalid token ID format - must be a valid number');
        return;
    }

    showLoading();

    try {
        // First, verify the contract exists
        const contractCode = await makeRPCCall('eth_getCode', [CONTRACT_ADDRESS, 'latest']);
        if (contractCode === '0x' || contractCode === '0x0') {
            throw new Error('Contract not found at the specified address');
        }
        
        console.log('✅ Contract exists, code length:', contractCode.length);
        
        // Test owner function to verify connection
        const ownerResult = await testOwnerFunction();
        if (!ownerResult.success) {
            throw new Error('Failed to connect to contract - owner function failed');
        }
        
        // Now test NFT-specific functions - matching React approach
        console.log('🔬 Testing NFT-specific functions for token:', tokenId);
        console.log('🔬 Converting to BigInt like React:', BigInt(tokenId).toString());
        const testResults = await testNFTFunctions(tokenId);
        
        // Try to find working signatures
        let verifiedResult = null;
        let levelResult = null;
        let bannedResult = null;
        
        // Check results
        if (testResults.verifiedNFTs?.success) {
            verifiedResult = testResults.verifiedNFTs.result;
            console.log('✅ Using verifiedNFTs function');
        }
        
        if (testResults.nftLevel?.success) {
            levelResult = testResults.nftLevel.result;
            console.log('✅ Using nftLevel function');
        }
        
        // bannedNFTs function does NOT exist in the contract ABI
        // So we don't check for it at all

        // If all NFT functions failed, provide helpful suggestions
        if (!verifiedResult && !levelResult) { // Only check the functions we're actually calling
            let errorMsg = `❌ All NFT functions failed for token ID ${tokenId}\n\n`;
            errorMsg += `This could mean:\n`;
            errorMsg += `• Token ID ${tokenId} doesn't exist in the contract\n`;
            errorMsg += `• Try a token ID that works in your React app\n`;
            errorMsg += `• The function signatures might be incorrect\n`;
            errorMsg += `• Contract might require different parameters\n`;
            
            throw new Error(errorMsg);
        }

        // Parse results - matching React approach with Number() conversion for level
        const isVerified = verifiedResult ? parseInt(verifiedResult, 16) === 1 : false;
        const level = levelResult ? Number(parseInt(levelResult, 16)) : 0; // Using Number() like React
        const isBanned = false; // Always false - bannedNFTs function doesn't exist in the contract

        console.log('📊 Final parsed results (matching React approach):', { 
            isVerified, 
            level, 
            isBanned,
            rawResults: { verifiedResult, levelResult }
        });

        showResults(tokenId, level, isBanned, isVerified);

    } catch (error) {
        console.error('❌ Error checking NFT:', error);
        let errorMessage = 'Failed to check NFT information.\n\n';
        
        if (error.message.includes('All NFT functions failed') || error.message.includes('Token ID')) {
            errorMessage = error.message; // Use our custom error message
        } else if (error.message.includes('revert') || error.message.includes('execution reverted')) {
            errorMessage += 'The contract call was reverted. This usually means:\n';
            errorMessage += '• The token ID does not exist\n';
            errorMessage += '• Try a different token ID (like 1)\n';
            errorMessage += '• Check your React app to see which token IDs work there';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage += 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.message.includes('address')) {
            errorMessage += 'Invalid contract address.';
        } else {
            errorMessage += error.message;
        }
        
        showError(errorMessage);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NFT Checker Extension Loaded!');
    console.log('📋 Configuration:', {
        network: network.name,
        rpc: network.rpc,
        contract: CONTRACT_ADDRESS
    });
    
    // Add click event listener to the button
    document.getElementById('checkBtn').addEventListener('click', checkNFT);
    
    // Allow Enter key to trigger search
    document.getElementById('tokenId').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkNFT();
        }
    });
    
    // Add helpful suggestion in the UI
    console.log('💡 Extension updated to match your actual ABI!');
    console.log('💡 Testing: owner, nftLevel, verifiedNFTs');
    console.log('💡 Note: bannedNFTs function does NOT exist in your contract ABI');
}); 