# SlashCommand & Prefix Handler

<!--    ██████╗ ███████╗██╗   ██╗    ██████╗ ██╗   ██╗    ██╗  ██╗██╗  ██╗███████╗██████╗ ███╗   ███╗██╗████████╗
        ██╔══██╗██╔════╝██║   ██║    ██╔══██╗╚██╗ ██╔╝    ██║ ██╔╝██║ ██╔╝██╔════╝██╔══██╗████╗ ████║██║╚══██╔══╝
        ██║  ██║█████╗  ██║   ██║    ██████╔╝ ╚████╔╝     █████╔╝ █████╔╝ █████╗  ██████╔╝██╔████╔██║██║   ██║   
        ██║  ██║██╔══╝  ╚██╗ ██╔╝    ██╔══██╗  ╚██╔╝      ██╔═██╗ ██╔═██╗ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   
        ██████╔╝███████╗ ╚████╔╝     ██████╔╝   ██║       ██║  ██╗██║  ██╗███████╗██║  ██║██║ ╚═╝ ██║██║   ██║   
        ╚═════╝ ╚══════╝  ╚═══╝      ╚═════╝    ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝   ╚═╝    -->

## This package handler uses both  **slash commands** and **prefix command** 

- It's a rework on [**Jackson's**](https://www.youtube.com/@MrJAwesomeYT) slash command handler and follows the same base structure as it and is based on it. All I have done is made improvements to it!

### Node version -

- Built using both node version `18.13.0`. Some package may struggle to install on newer node versions. If so, you will need to install node version manager to switch between node versions. Guide found [here](https://www.freecodecamp.org/news/node-version-manager-nvm-install-guide/).

### Setting up -

- Setting up is **very** easy to do, all you need to do is edit `2` files!

1. Firstly run the command in your terminal `npm i` to install the necessary packages from the ``package.json`` file.

2. Go into the ``.example.env`` file and remove the ``.example`` part so it just reads **``.env``**

3. Fill out **all** sections in the *new* ``.env`` file.

4. Head over to the **``config.js``** file found in the `src` folder.

5. Edit the ``config.js`` file to your liking but make sure to keep the same naming conventions. Only change the parts in `" "`

- Once you've done this, you should be ready to go, the bot *should be* fully functioning!

- **NOTE**: *For this, you will need to install an older version of mongoDB, 6.0.12. To install this run `npm i mongoose@6.0.12`*

### Using commands -

- Once you've set the bot up, there a few commands I've already added for you. You can see these commands by browsing through both the ``prefix`` and ``commands`` folders.

- The **default prefix** for the bot is a `?` unless you've changed it in the ``config.js`` file.


### Whats the trigger folder? -

- The trigger folder is a new thing I've added. This is built for handling ```js message.content.includes``` aspects.

- For this, if you **@** the bot, it will return a message with the current **slash commands** in the ``commands`` folder.

### I'm getting errors - 

- If you are getting persistent errors in your code, try your best to work them out yourself, but if you get stuck, you can open a JavaScript help post [here](https://discord.gg/codinglounge)

- *Alternatively* you can add me on discord [here](https://discord.com/users/526853643962679323) and DM me your issue and I can try my best to help, **however**, I'm very tight on time at the moment. You'd be best opening a help post!

# If you like this repo, please be sure to give it a star ⭐

# My GitHub - [**Kkkermit**](https://github.com/Kkkermit)
