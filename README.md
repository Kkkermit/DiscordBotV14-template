<!--    ██████╗ ███████╗██╗   ██╗    ██████╗ ██╗   ██╗    ██╗  ██╗██╗  ██╗███████╗██████╗ ███╗   ███╗██╗████████╗
        ██╔══██╗██╔════╝██║   ██║    ██╔══██╗╚██╗ ██╔╝    ██║ ██╔╝██║ ██╔╝██╔════╝██╔══██╗████╗ ████║██║╚══██╔══╝
        ██║  ██║█████╗  ██║   ██║    ██████╔╝ ╚████╔╝     █████╔╝ █████╔╝ █████╗  ██████╔╝██╔████╔██║██║   ██║   
        ██║  ██║██╔══╝  ╚██╗ ██╔╝    ██╔══██╗  ╚██╔╝      ██╔═██╗ ██╔═██╗ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   
        ██████╔╝███████╗ ╚████╔╝     ██████╔╝   ██║       ██║  ██╗██║  ██╗███████╗██║  ██║██║ ╚═╝ ██║██║   ██║   
        ╚═════╝ ╚══════╝  ╚═══╝      ╚═════╝    ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝   ╚═╝    -->

<img align="center" alt="banner" src="https://i.postimg.cc/Vv28NDm9/banner.png">

<p align="center">
<img align="center" alt="GitHub issues" src="https://img.shields.io/github/issues/Kkkermit/DiscordBotV14-template?style=for-the-badge"> 
<img align="center" alt="GitHub license" src="https://img.shields.io/github/license/Kkkermit/DiscordBotV14-template?style=for-the-badge">
<img align="center" alt="GitHub license" src="https://img.shields.io/github/stars/Kkkermit/DiscordBotV14-template?style=for-the-badge">
<img align="center" alt="GitHub license" src="https://img.shields.io/github/forks/Kkkermit/DiscordBotV14-template?style=for-the-badge">
</p>

<p align="center"><strong>
Advanced v14 prefix and slash command discord bot
</strong></p>

<p align="center">
Easy to use and beginner friendly package that offers the use of both slash commands and prefix command as well as database connection using mongoDB. Easy to set up and get started in. Comes with a few basic starter commands and events such as command logging, guild create & delete events and more...
</p>

<hr>

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Support](#support)
- [License](#license)

<h1 align="center"><strong>
⭐ If your a fan of this repository or have used it or any of it's code, please consider leaving us a star. It would be greatly appreciated and allows us to see if users value the bot! ⭐
</strong></h1>

## Installation
- Download [Node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
- Download [Visual Studio Code](https://code.visualstudio.com/download).

## Usage
- **Project Setup**

    1. Fork the Github project :
       1. Sign up / Sign in to [GitHub](https://github.com/).
       2. Navigate to [Testify](https://github.com/Kkkermit/DiscordBotV14-template).
       3. Click `Star` to support development.
       4. Click `Fork` to copy all code to your own repository.
   
    2. Click the `Code` button. From the drop-down that appears, click `Download ZIP` to download the entire repository as a ZIP folder.

    3. Extract the files to a new folder and open it with [Visual Studio Code](https://code.visualstudio.com/download).


- **Obtain Discord Bot Token**

    1. Sign in to [Discord Developer Portal](https://discord.com/developers/applications).

    2. Create a bot :
        1. Enter the left side `Applications`.
        2. Click `New Application` in the upper right corner and enter the name of the bot. After confirmation, enter the new page.
        3. Click on the left side `Bot`.
        4. Enable all intents listed under `Privileged Gateway Intents` and click `Save Changes`.
        5. View and copy the token by clicking the `Reset Token` button.
   
    3. Set up OAuth2 :
        1. Click on `OAuth2` in the left column.
        2. Click on `URL Generator` in the left column.
        3. In the right column, select `bot` and `applications.commands` under `SCOPES`.
        4. Scroll down and select `Administrator` under `BOT PERMISSIONS`.
        5. Copy the URL at the bottom and paste it into your browser.
        6. Choose the server you want to add the bot to and click `Continue` > `Authorize`.


- **Obtain MongoDB Connection String**

    1. Sign up / Sign in to [MongoDB](https://www.mongodb.com).
    2. Choose your preferred cloud database plan.
    3. Customize the cluster settings to your preference and click `Create Cluster`.
    4. Navigate to the `Network Access` page, click `Add IP Address` and select `Allow access from anywhere`.
    5. Navigate back to the `Database` page and click `Connect`.
    6. Create a `database user`, click `Choose a connection method` and select `Connect your application`.
    7. Copy your connection string and replace `<password>` with the password for the database user that you created earlier.


- **Setting up the env file**

    *If you go along with this, you can ignore the parts in the `Project Execution` that explain how to generate and fill in the `.env`*

    1. For easy setup of the env file, ( `.env` ) you can run the command `npm run setup-env`
    2. Once you've ran the command, it generates a script in the console
    3. You need to then fill out the fields in the console. Fields marked with the text **"Required"** are you required fields and you need to fill those ones in. The script will not continue if you ignore to fill in those fields. 
    4. Once you've filled in the field, it will write those fields into and generate the `.env`.
    5. Alternatively, you can ignore this and fill in the fields yourself by viewing the `.example.env` file.
    6. You then should be good, and your `.env` should be setup.


- **Project Execution**

    1. Rename the filed named `example.env` to `.env`
    2. Navigate to the `Bot` page on the [Discord Developer Portal](https://discord.com/developers/applications) and click `Reset Token`. Afterwards, create a `.env` file within the root directory.
    3. Paste your bot token into the `token` variable inside the `.env` file.
    4. Paste your [MongoDB](https://www.mongodb.com) connection string into the `mongodb` variable inside the `.env` file.
    5. Navigate to the `OAuth2` page and copy the `CLIENT ID`. 
    6. Paste your client ID into the `clientid` variable inside the `.env` file.
    7. Navigate to your discord server, enable developer mode and right click the dropdown beside the server name. 
    8. Click `Copy Server ID` and paste it into the `guildid` variable inside the `.env` file.
    9. Navigate to the `package.json` file and pay attention to the runnable commands listed under `scripts`.
    10. Open the terminal in [Visual Studio Code](https://code.visualstudio.com/download) and install all necessary packages using `npm run setup`. This will install the dependencies and give you a brief install guide
    11. Open a new terminal and type `npm run start` to run the file without using **nodemon** or `npm run start:nodemon` to run the bot with nodemon.
    12. The bot should then turn online, you should be able to see this by the console logs that is setup upon start up

- **Runnable commands (scripts)**

   **npm run start** - <br>
   This starts up the bot with the contents from the `.env` file. Essentially the same as running `node .`

   **npm run setup-env** - <br>
   To run the setup of the `.env` file you can run the command `npm run setup-env`, this generates a script in the console that generates a `.env` file and where you fill out the fields with whats required for the `.env` file and it writes it in the file.


## Support
Connect with us on [Discord](https://discord.gg/xcMVwAVjSD) for support / any related inquiry.

## License
Released under the terms of [MIT License](https://github.com/Kkkermit/DiscordBotV14-template/blob/main/LICENSE) license.
