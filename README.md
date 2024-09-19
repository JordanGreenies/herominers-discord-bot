# HeroMiners discord bot for miners https://herominers.com
![Discord_OYinKLsBCg](https://github.com/user-attachments/assets/aea3addd-6b77-4cd9-a894-713625e72a65)
![Discord_AlVp7xWJ0X](https://github.com/user-attachments/assets/2afc3697-45d6-4078-90c8-ef8d439d6b9d)
![Discord_iWGuvixjpH](https://github.com/user-attachments/assets/685d9669-789f-40a5-9fd6-bc10a4bc7a8a)
![image](https://github.com/user-attachments/assets/bd6017f4-f46c-4e0f-aa17-24a29410498d)


## Installation (docker)
 1. Create a discord bot and add it to a server (https://discord.com/developers/applications)
 2. Clone this repo (git clone https://github.com/JordanGreenies/herominers-discord-bot)
 3. Edit the config file: ./nodejs/config.json (heroMiners.streamUrl, heroMiners.statsUrl, discord.token, discord.channelId)
 4. Edit the timezone inside docker-compose.yml
 5. Start the bot with docker (docker-compose up)

## Limitations
* Currently can only handle one mining address
