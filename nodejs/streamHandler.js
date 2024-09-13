const { parentPort, workerData } = require('worker_threads');
const https = require('https');

function openHttpStream(streamUrl) {
    const request = () => {
        https.get(streamUrl, (res) => {
			
            console.log(`Stream status Code: ${res.statusCode}`);
			
            if (res.statusCode !== 200) {
                reconnect();
                return;
            }

            res.setEncoding('utf8');

            let buffer = '';

            res.on('data', (chunk) => {
                buffer += chunk;

                let events = buffer.split('\n\n');

                for (let i = 0; i < events.length - 1; i++) {
                    parseStreamData(events[i]);
                }

                buffer = events[events.length - 1];
            });

            res.on('end', () => {
                console.log('Stream ended.');
                reconnect(); // Reconnect if the stream ends
            });

            res.on('error', (err) => {
                console.error('Stream error:', err);
                reconnect(); // Reconnect on error
            });
        }).on('error', (err) => {
            console.error('Request error:', err);
            reconnect(); // Reconnect on request error
        });
    };

    const reconnect = () => {
        console.log('Attempting to reconnect to stream...');
        setTimeout(request, 5000); // Reconnect after 5 seconds
    };

    request();
}

function parseStreamData(event) {
    if (event.startsWith('data: ')) {
        try {
            let jsonString = event.replace('data: ', '').trim();
            let parsedData = JSON.parse(jsonString);
			parentPort.postMessage(parsedData);
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    } else {
        //console.log('Non-data event:', event.trim());
    }
}

openHttpStream(workerData.streamUrl);