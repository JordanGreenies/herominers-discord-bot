const fs = require('fs');
const Discord = require('discord.js');
const {Worker} = require('worker_threads');
const path = require('path');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
const streamUrl = config.heroMiners.streamUrl;
const explorerUrl = config.heroMiners.coinExplorerUrl;

let paymentsArray = [];
let networkDifficulty = [];
let minigHashRate = [];
let discordReady = false;
let coinUnits = 0;
let coinSymbol = "";

const {convertHashrate} = require('./utils');

//Setup Discord client
const discordClient = new Discord.Client({
	intents: [
		Discord.GatewayIntentBits.Guilds,
		Discord.GatewayIntentBits.GuildMessages,
		Discord.GatewayIntentBits.GuildPresences,
		Discord.GatewayIntentBits.MessageContent,
	],
});

function sendDiscordMessage(text) {
	const channel = discordClient.channels.cache.get(config.discord.channelId);
	if (channel) {
		channel.send(text).catch(err => console.error("Error sending message: ", err));
	} else {
		console.error("Channel not found.");
	}
}

function combineStringsWithTimestamps(arr) {
    const combinedArray = []; 
    for (let i = 0; i < arr.length; i += 2) {
        const combinedString = `${arr[i]}:${arr[i+1]}`;
        combinedArray.push(combinedString);
    }
    return combinedArray;
}

const startWorker = (url) => {
    const worker = new Worker(path.resolve(__dirname, 'urlWorker.js'), {
        workerData: { statsUrl: url }
    });

    worker.on('message', (message) => {
		if (!discordReady) return;
		if (!message.data) return;	
		if(message.statsUrl == config.heroMiners.statsUrl)
		{		
			if(!message.data.config) return;

			coinUnits = message.data.config.coinUnits;
			coinSymbol = message.data.config.symbol;

			const lastDifficulty = networkDifficulty.originalValue || 0;
			const lastHashrate = minigHashRate.originalValue || 0;
			networkDifficulty = convertHashrate(message.data.network.difficulty)
			const mHr = message.data.miner.hashrate || 0;
			const sHr = message.data.solo_miner.hashrate || 0;
			minigHashRate = convertHashrate(mHr + sHr);
			const timeStamp = new Date().toLocaleTimeString();
			//console.log(`Network difficulty: ${networkDifficulty.value} ${networkDifficulty.suffix}`);
			//console.log(`Your hashrate: ${minigHashRate.value} ${minigHashRate.suffix}`);
			if (config.heroMiners.reportNetworkDifficulty && (lastDifficulty != networkDifficulty.originalValue))
				sendDiscordMessage("`" + `[${timeStamp}] ☁ Network difficulty: ${networkDifficulty.value} ${networkDifficulty.suffix}` + "`");
			if (config.heroMiners.reportHashrate && (lastHashrate != minigHashRate.originalValue)) {
				let hashEmoji = `⏫`;
				if (minigHashRate.originalValue < lastHashrate) hashEmoji = `⏬`;
				sendDiscordMessage("`" + `[${timeStamp}] ${hashEmoji} Hashrate: ${minigHashRate.value} ${minigHashRate.suffix}/s` + "`");
			}
			if (config.heroMiners.hashratePresence && (lastHashrate != minigHashRate.originalValue))
				discordClient.user.setPresence({
					activities: [{
						name: `Mining: ${minigHashRate.value} ${minigHashRate.suffix}/s`
					}]
				});			
		}
		else if(message.statsUrl == config.heroMiners.statsUrl2)
		{
			if(!message.data.payments || coinUnits == 0) return;
			
			let payments = combineStringsWithTimestamps(message.data.payments);
			if(payments.length == 0) return;
			
			const formatLog = (logString) => {
				const parts = logString.split(':');	
				const hash = parts[0];
				const url = `${explorerUrl}${hash}`;
				const value = (parts[1] / coinUnits).toFixed(4);
				const timeStamp = new Date().toLocaleTimeString();
				const formattedLog = `[${timeStamp}] 💵 Payment processed: ${value} ${coinSymbol}`;		
				return formattedLog;
			};
			if(config.heroMiners.reportPayments && paymentsArray.length > 0)
			{
				const newValues = payments.filter(item => !paymentsArray.includes(item));
				newValues.forEach((value) => {
					sendDiscordMessage("[`" + formatLog(value) + "`]("+url+")");
				});
			}	
			paymentsArray = payments;	
		}
    });
};

startWorker(config.heroMiners.statsUrl);
startWorker(config.heroMiners.statsUrl2);

const heroStream = new Worker(path.resolve(__dirname, 'streamHandler.js'), {
	workerData: {
		streamUrl
	}
});

// Handle messages from herominers
heroStream.on('message', (message) => {
	const formatMessage = (data) => {
		const timeStamp = new Date().toLocaleTimeString();
		const worker = data.worker;
		const shareType = data.shareType || 'N/A';
		const isSolo = data.solo || false;
		const suffix = config.heroMiners.hashSuffix;
		const workerStr = isSolo ? 'solo' : 'pool';

		let message = '';
		switch (data.type) {
			case 'share':
				const nonce = data.nonce || 'N/A';
				const shareDiff = convertHashrate(data.shareDiff) || 'N/A';
				const minerDiff = convertHashrate(data.minerDiff) || 'N/A';
				const blockFound = networkDifficulty.originalValue && data.shareDiff > networkDifficulty.originalValue;
				const shareStatus = shareType === 'good' ? `✅ Good share` : `❌ Stale share`;
				if (shareType === 'good' && blockFound && config.heroMiners.reportBlocks)
					message = `\`[${timeStamp}] 🔔 Block found! ${nonce} of ${shareDiff.value} ${shareDiff.suffix} / ${minerDiff.value} ${minerDiff.suffix} from ${workerStr} worker ${worker}\``;
				else if ((shareType === 'good' && config.heroMiners.reportGoodShares) || (shareType === 'stale' && config.heroMiners.reportStaleShares))
					message = `\`[${timeStamp}] ${shareStatus} ${nonce} of ${shareDiff.value} ${shareDiff.suffix} / ${minerDiff.value} ${minerDiff.suffix} from ${workerStr} worker ${worker}\``;
				break;
			case 'retarget':
				if (config.heroMiners.reportRetargetting === false) break;
				const oldDiff = convertHashrate(data.oldDiff) || 'N/A';
				const newDiff = convertHashrate(data.newDiff) || 'N/A';
				message = `\`[${timeStamp}] 🔀 Retargetting difficulty for worker ${worker} from ${oldDiff.value} ${oldDiff.suffix} to ${newDiff.value} ${newDiff.suffix}\``;
				break;
			case 'disconnect':
				message = `\`[${timeStamp}] 🔌 ${worker} disconnected from ${workerStr} working!\``;
				break;
			case 'connect':
				message = `\`[${timeStamp}] 🔗 ${worker} connected for ${workerStr} working!\``;
				break;			
			default:
				message = `\`[${timeStamp}] Unknown type: ${data.type}\``;
		}
		return message;
	};
	if (discordReady) {
		const msg = formatMessage(message);
		if (msg) sendDiscordMessage("`" + msg + "`");
	}
});

// Discord Bot Setup
discordClient.once('ready', () => {
	console.log('Discord bot is ready!');
	discordReady = true;
});
discordClient.login(config.discord.token);
