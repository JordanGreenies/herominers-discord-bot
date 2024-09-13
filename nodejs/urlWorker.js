const { parentPort, workerData } = require('worker_threads');

(async () => {
    // Dynamically import the fetch module
    const fetchModule = await import('node-fetch');
    const fetch = fetchModule.default;

    // Function to fetch and parse JSON data
    const fetchData = async (statsUrl) => {
        try {
            const response = await fetch(statsUrl);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    };

    // Set up interval to fetch data every 10 seconds
    const fetchInterval = 10000; // 10 seconds

    const statsUrl = workerData.statsUrl;

    const intervalId = setInterval(async () => {
        const data = await fetchData(statsUrl);
        if (data) {
            parentPort.postMessage(data); // Send data to parent
        }
    }, fetchInterval);

    parentPort.on('message', (message) => {
        if (message === 'stop') {
            clearInterval(intervalId); // Stop fetching when 'stop' message is received
        }
    });
})();