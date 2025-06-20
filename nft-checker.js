// Network configuration - Saigon Testnet only
const network = {
    name: 'Saigon Testnet',
    rpc: 'https://saigon-testnet.roninchain.com/rpc',
    chainId: 2021
};

// NFT Collections Configuration
const NFT_COLLECTIONS = {
    'mining-nft': {
        name: 'Mining NFT Reward',
        contractAddress: '0x6f738Cc2996877D6907c22Bdda38b90b37Ba21C6',
        description: 'Original Mining NFT Collection - Confirmed Working'
    },
    'gaming-nft': {
        name: 'Gaming NFT Collection',
        contractAddress: '0x0000000000000000000000000000000000000000', // Placeholder - update with actual address
        description: 'Gaming NFT Collection for Rewards (Update contract address)'
    },
    'special-nft': {
        name: 'Special Edition NFTs',
        contractAddress: '0x0000000000000000000000000000000000000000', // Placeholder - update with actual address
        description: 'Limited Special Edition NFTs (Update contract address)'
    }
};

// Get currently selected collection
function getSelectedCollection() {
    const selectedKey = document.getElementById('collectionSelect')?.value || 'mining-nft';
    return NFT_COLLECTIONS[selectedKey];
}

// Get current contract address based on selected collection
function getCurrentContractAddress() {
    return getSelectedCollection().contractAddress;
}

// Populate collection dropdown
function populateCollectionDropdown() {
    const select = document.getElementById('collectionSelect');
    if (!select) return;
    
    // Clear existing options
    select.innerHTML = '';
    
    // Define emojis for each collection
    const collectionEmojis = {
        'mining-nft': '🔥',
        'gaming-nft': '🎮',
        'special-nft': '⭐'
    };
    
    // Add options for each collection
    Object.entries(NFT_COLLECTIONS).forEach(([key, collection]) => {
        const option = document.createElement('option');
        option.value = key;
        const emoji = collectionEmojis[key] || '📦';
        option.textContent = `${emoji} ${collection.name}`;
        select.appendChild(option);
    });
}

// Handle collection change
function onCollectionChange() {
    const selectedCollection = getSelectedCollection();
    console.log('🔄 Collection changed to:', selectedCollection.name);
    console.log('📍 New contract address:', selectedCollection.contractAddress);
    
    // Clear any existing results
    document.getElementById('results').classList.remove('show');
    document.getElementById('error').classList.remove('show');
    
    // You could add more UI updates here, like showing collection info
}

// Function signatures - generated from your actual ABI
const FUNCTION_SIGNATURES = {
    // Basic contract info
    owner: '0x8da5cb5b',           // owner() - confirmed working
    
    // NFT-specific functions - from your actual MiningNFTReward.json ABI
    nftLevel: '0xbec98691',        // nftLevel(uint256) - returns uint256
    verifiedNFTs: '0xd7a3100e',    // verifiedNFTs(uint256) - returns bool
    bannedNFTs: '0xd6912d26',      // bannedNFTs(uint256) - returns bool
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
        to: getCurrentContractAddress(),
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
        to: getCurrentContractAddress(),
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
    
    // Test bannedNFTs
    try {
        console.log(`🔍 Testing bannedNFTs for token ${tokenId}...`);
        const result = await callContractFunction(FUNCTION_SIGNATURES.bannedNFTs, tokenId);
        console.log(`✅ bannedNFTs SUCCESS:`, result);
        results.bannedNFTs = { success: true, result };
    } catch (error) {
        console.log(`❌ bannedNFTs FAILED:`, error.message);
        results.bannedNFTs = { success: false, error: error.message };
    }
    
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
    const selectedCollection = getSelectedCollection();
    
    document.getElementById('tokenIdResult').textContent = tokenId;
    document.getElementById('levelResult').textContent = level;
    
    // Update collection info if element exists
    const collectionResult = document.getElementById('collectionResult');
    if (collectionResult) {
        collectionResult.textContent = selectedCollection.name;
    }
    
    // Show/hide ban status row based on whether NFT is banned
    const banStatusRow = document.getElementById('banStatusRow');
    const banResult = document.getElementById('banResult');
    
    if (isBanned) {
        banStatusRow.style.display = 'flex';
        banResult.textContent = 'BANNED';
        banResult.className = 'result-value banned';
    } else {
        banStatusRow.style.display = 'none';
    }
    
    const verifiedResult = document.getElementById('verifiedResult');
    verifiedResult.textContent = isVerified ? 'VERIFIED' : 'NOT VERIFIED';
    verifiedResult.className = `result-value ${isVerified ? 'not-banned' : 'banned'}`;
    
    document.getElementById('results').classList.add('show');
    hideLoading();
}

async function checkNFT() {
    const tokenId = document.getElementById('tokenId').value.trim();

    // Validation
    const selectedCollection = getSelectedCollection();
    if (!getCurrentContractAddress() || 
        getCurrentContractAddress() === '0x...' || 
        getCurrentContractAddress() === '0x0000000000000000000000000000000000000000') {
        showError(`⚠️ ${selectedCollection.name} is not configured yet.\n\nPlease update the contract address in the code for this collection, or select a different collection that has been configured.`);
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
        // Log which collection we're checking
        console.log(`🎯 Checking NFT in collection: ${selectedCollection.name}`);
        console.log(`📍 Contract address: ${selectedCollection.contractAddress}`);
        
        // First, verify the contract exists
        const contractCode = await makeRPCCall('eth_getCode', [getCurrentContractAddress(), 'latest']);
        if (contractCode === '0x' || contractCode === '0x0') {
            throw new Error(`Contract not found at the specified address for ${selectedCollection.name}`);
        }
        
        console.log(`✅ Contract exists for ${selectedCollection.name}, code length:`, contractCode.length);
        
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
        
        if (testResults.bannedNFTs?.success) {
            bannedResult = testResults.bannedNFTs.result;
            console.log('✅ Using bannedNFTs function');
        }

        // If all NFT functions failed, provide helpful suggestions
        if (!verifiedResult && !levelResult && !bannedResult) {
            let errorMsg = `❌ All NFT functions failed for token ID ${tokenId} in ${selectedCollection.name}\n\n`;
            errorMsg += `This could mean:\n`;
            errorMsg += `• Token ID ${tokenId} doesn't exist in the ${selectedCollection.name} contract\n`;
            errorMsg += `• Try a different token ID or a different collection\n`;
            errorMsg += `• The function signatures might be incorrect for this collection\n`;
            errorMsg += `• Contract might require different parameters\n`;
            
            throw new Error(errorMsg);
        }

        // Parse results - matching React approach with Number() conversion for level
        const isVerified = verifiedResult ? parseInt(verifiedResult, 16) === 1 : false;
        const level = levelResult ? Number(parseInt(levelResult, 16)) : 0; // Using Number() like React
        const isBanned = bannedResult ? parseInt(bannedResult, 16) === 1 : false; // Parse banned status

        console.log('📊 Final parsed results (matching React approach):', { 
            isVerified, 
            level, 
            isBanned,
            rawResults: { verifiedResult, levelResult, bannedResult }
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
        availableCollections: Object.keys(NFT_COLLECTIONS).length
    });
    
    // Populate collection dropdown
    populateCollectionDropdown();
    
    // Add collection change event listener
    const collectionSelect = document.getElementById('collectionSelect');
    if (collectionSelect) {
        collectionSelect.addEventListener('change', onCollectionChange);
    }
    
    // Add click event listener to the button
    document.getElementById('checkBtn').addEventListener('click', checkNFT);
    
    // Allow Enter key to trigger search
    document.getElementById('tokenId').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkNFT();
        }
    });
    
    // Log initial collection info
    const initialCollection = getSelectedCollection();
    console.log('🎯 Initial collection:', initialCollection.name);
    console.log('📍 Initial contract:', initialCollection.contractAddress);
    
    // Add helpful suggestion in the UI
    console.log('💡 Extension updated with multiple NFT collections support!');
    console.log('💡 Available collections:', Object.keys(NFT_COLLECTIONS).join(', '));
    console.log('💡 Testing: owner, nftLevel, verifiedNFTs, bannedNFTs');
}); 