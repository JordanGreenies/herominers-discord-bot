const { parentPort, workerData } = require('worker_threads');

const fetchDataFunction = async (statsUrl, fetchInterval = 10000) => {
    // Dynamically import the fetch module
    const fetchModule = await import('node-fetch');
    const fetch = fetchModule.default;

    // Function to fetch and parse JSON data
    const fetchData = async (url) => {
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    };

    // Set up interval to fetch data
    const intervalId = setInterval(async () => {
        const data = await fetchData(statsUrl);
        if (data) {
            parentPort.postMessage({ statsUrl, data }); // Send data to parent
        }
    }, fetchInterval);

    parentPort.on('message', (message) => {
        if (message === 'stop') {
            clearInterval(intervalId); // Stop fetching when 'stop' message is received
        }
    });
};

// Call the function with the URL from workerData
fetchDataFunction(workerData.statsUrl);
