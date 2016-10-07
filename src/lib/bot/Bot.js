'use babel';
'use strict';

import { Client } from 'discord.js';
import LocalStorage from '../storage/LocalStorage';
import GuildStorageLoader from '../storage/GuildStorageLoader';
import GuildStorageRegistry from '../storage/GuildStorageRegistry';
import CommandLoader from '../command/CommandLoader';
import CommandRegistry from '../command/CommandRegistry';
import CommandDispatcher from '../command/CommandDispatcher';

export default class Bot extends Client
{
	/**
	 * The Discord.js Client instance. Contains its own storage as well as storage for
	 * guilds it is a member of
	 * @class Bot
	 * @constructor Bot
	 * @extends {Client}
	 * @param {Object} options - Options to pass to the bot
	 * @param {string} [options.name='botname'] - The name to give the bot
	 * @param {string} options.token - Discord login token for the bot
	 * @param {string} options.commandsDir - Directory to find command class files
	 * @param {string} [options.statusText='@mention help'] - Status text for the bot
	 * @param {string} [options.version='0.0.0'] - Bot version, best taken from package.json
	 * @param {Object} options.config - Object containing token and and owner ids
	 * @param {string} options.config.token - Discord login token for the bot
	 * @param {string[]} options.config.owner - Array of owner id strings
	 */
	constructor(options = null)
	{
		super();

		/** @type {string} */
		this.name = options.name || 'botname';

		/** @type {string} */
		this.token = options.token;

		/** @type {string} */
		this.commandsDir = options.commandsDir;

		/** @type {string} */
		this.statusText = options.statusText || '@mention help';

		/** @type {boolean} */
		this.selfbot = options.selfbot || false;

		/** @type {string} */
		this.version = options.version || '0.0.0';

		/** @type {Object} */
		this.config = options.config || null;

		// Make some asserts
		if (!this.token) throw new Error('You must provide a token for the bot.');
		if (!this.commandsDir) throw new Error('You must provide a directory to load commands from via commandDir');
		if (!this.config) throw new Error('You must provide a config containing token and owner ids.');

		/**
		 * Bot-specific storage available everywhere
		 * @memberof Bot
		 * @type {LocalStorage}
		 * @name storage
		 * @instance
		 */
		this.storage = new LocalStorage('bot-storage');
		if (!this.storage.exists('defaultGuildSettings')) // eslint-disable-line curly
			this.storage.setItem('defaultGuildSettings',
				require('../storage/defaultGuildSettings.json'));

		/**
		 * The storage that holds all persistent data for each guild-specific storage
		 * @memberof Bot
		 * @type {LocalStorage}
		 * @name guildSettingStorage
		 * @instance
		 * @see {@link Bot#guildStorages}
		 */
		this.guildSettingStorage = new LocalStorage('guild-storage');

		/**
		 * Loads all guild-specific storages from persistent storage into an
		 * accessible Collection of GuildStorage objects
		 * @memberof Bot
		 * @type {GuildStorageLoader}
		 * @name guildStorageLoader
		 * @instance
		 * @see {@link GuildStorageLoader}
		 */
		this.guildStorageLoader = new GuildStorageLoader(this);

		/**
		 * Collection containing all GuildStorage instances
		 * @memberof Bot
		 * @type {GuildStorageRegistry<string, GuildStorage>}
		 * @name guildStorages
		 * @instance
		 */
		this.guildStorages = new GuildStorageRegistry();

		/**
		 * Loads all base commands and commands from the user-specified
		 * commandsDir directory
		 * @memberof Bot
		 * @type {CommandLoader}
		 * @name commandLoader
		 * @instance
		 * @see {@link Command}
		 */
		this.commandLoader = new CommandLoader(this);

		/**
		 * Collection containing all loaded commands
		 * @memberof Bot
		 * @type {CommandRegistry<string, Command>}
		 * @name commands
		 * @instance
		 * @see {@link Command}
		 */
		this.commands = new CommandRegistry();

		/**
		 * Dispatcher that handles detection and execution of command actions
		 * @memberof Bot
		 * @type {CommandDispatcher}
		 * @name dispatcher
		 * @instance
		 */
		this.dispatcher = new CommandDispatcher(this);

		// Load commands
		this.commandLoader.loadCommands();
	}

	/**
	 * Logs the Bot in and registers some event handlers
	 * @memberof Bot
	 * @instance
	 * @method start
	 * @returns {Bot} this - This bot instance
	 */
	start()
	{
		this.login(this.token);

		this.on('ready', () =>
		{
			console.log('Ready'); // eslint-disable-line no-console
			this.user.setStatus(null, this.statusText);

			// Load all guild storages
			this.guildStorageLoader.loadStorages(this.guildSettingStorage);
		});

		this.on('guildCreate', () =>
		{
			this.guildStorageLoader.initNewGuilds(this.guildSettingStorage);
		});

		this.on('guildDelete', (guild) =>
		{
			this.guildStorages.delete(guild.id);
			this.guildSettingStorage.removeItem(guild.id);
		});

		return this;
	}

	/**
	 * Set the value of a default setting key and push it to all guild
	 * setting storages
	 * @memberof Bot
	 * @instance
	 * @param {string} key - The key to use in settings storage
	 * @param {string} value - The value to use in settings storage
	 */
	setDefaultSetting(key, value)
	{
		let defaults = this.storage.getItem('defaultGuildSettings');
		if (!defaults) return;
		defaults[key] = value;
		this.storage.setItem('defaultGuildSettings', defaults);
		this.guildStorages.forEach(guild =>
		{
			if (!guild.settingExists(key)) guild.setSetting(key, value);
		});
	}

	/**
	 * See if a guild default setting exists
	 * @memberof Bot
	 * @instance
	 * @param {string} key - The key in storage to check
	 * @returns {boolean} Whether or not the key has a value
	 */
	defaultSettingExists(key)
	{
		return !!this.storage.getItem('defaultGuildSettings')[key];
	}

	/**
	 * Shortcut to return the command prefix for the provided guild
	 * @memberof Bot
	 * @instance
	 * @param {(Guild|string)} guild - The guild or guild id to get the prefix of
	 * @returns {string} The command prefix for the provided guild
	 */
	getPrefix(guild)
	{
		return this.guildStorages.get(guild).getSetting('prefix') || null;
	}
}
