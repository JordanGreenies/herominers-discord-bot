// utils.js

// Function to convert hashrate to human-readable format
function convertHashrate(hashrate) {
    const thresholds = [
        { value: 1e21, suffix: 'ZH' }, // Zettahash
        { value: 1e18, suffix: 'EH' }, // Exahash
        { value: 1e15, suffix: 'PH' }, // Petahash
        { value: 1e12, suffix: 'TH' }, // Terahash
        { value: 1e9, suffix: 'GH' },  // Gigahash
        { value: 1e6, suffix: 'MH' },  // Megahash
        { value: 1e3, suffix: 'KH' },  // Kilohash
        { value: 1, suffix: 'H' }      // Hash
    ];

    for (const threshold of thresholds) {
        if (hashrate >= threshold.value) {
            return {
		originalValue: hashrate,
                value: (hashrate / threshold.value).toFixed(2),
                suffix: threshold.suffix
            };
        }
    }
    
    return {
	originalValue: hashrate,
        value: hashrate.toFixed(2),
        suffix: 'H'
    };
}

// Export the function
module.exports = {
    convertHashrate
};
