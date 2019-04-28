"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lang_1 = require("../localization/Lang");
const BaseStrings_1 = require("../localization/BaseStrings");
/**
 * Class to be used by a command that should prevent others from using
 * it when in use by anyone else. CommandLocks can define sibling commands
 * by name that will also be locked when the command is locked.
 *
 * >To use this (or your own extension class) on a Command, create a new
 * instance and assign it to your Command's `lock` field in your Command
 * constructor.
 *
 * By default a command will be locked for a maximum of 30 seconds if
 * something goes wrong and a command fails to finish. This can be
 * changed by setting `lockTimeout` in your CommandInfo to a desired
 * time in ms, or `0` to disable the lock timeout entirely.
 *
 * **NOTE:** Command locks only apply within a guild context. You must
 * declare set `guildOnly` to `true` to be able to utilize a CommandLock
 * for that command.
 *
 * >By extending this class and overriding `lock()`, `isLocked()`, `free()`,
 * and `getError()` with your own definitions you can effectively define your own
 * lock behavior. These methods will be passed the same Message context and
 * arguments as your Command so you can define any behavior you desire, like
 * locking multiple commands that operate on a given user while one of the
 * commands is in use.
 * @param {...string} siblings Associated commands to lock
 */
class CommandLock {
    constructor(...siblings) {
        this.siblings = siblings;
        this._locks = {};
    }
    /**
     * Sets the lock
     * @param {Message} message Message that triggered the command
     * @param {any[]} args Arguments passed to the command
     * @returns {void}
     */
    // @ts-ignore - Args will be passed by the framework regardless
    lock(message, args) {
        this._locks[message.guild.id] = true;
    }
    /**
     * Returns whether or not this lock is active
     * @param {Message} message Message that triggered the command
     * @param {any[]} args Arguments passed to the command
     * @returns {boolean}
     */
    // @ts-ignore - Args will be passed by the framework regardless
    isLocked(message, args) {
        return this._locks[message.guild.id] || false;
    }
    /**
     * Frees this lock. Called automatically when the command finishes,
     * or when the lockTimeout fires
     * @param {Message} message Message that triggered the command
     * @param {any[]} args Arguments passed to the command
     * @returns {void}
     */
    // @ts-ignore - Args will be passed by the framework regardless
    free(message, args) {
        delete this._locks[message.guild.id];
    }
    /**
     * Get an error string describing the effects of this lock. Defaults
     * to `'This command is currently in use.` for en_us.
     *
     * >When defining your own lock behavior, consider using details
     * related to the conditions under which your commands are locked.
     * @param {string} lang The language to use for the error string
     * @param {Message} message Message that triggered the command
     * @param {any[]} args Arguments passed to the command
     * @returns {string}
     */
    // @ts-ignore - Message and args will be passed by the framework regardless
    getError(lang, message, args) {
        return Lang_1.Lang.res(lang, BaseStrings_1.BaseStrings.DISPATCHER_ERR_COMMAND_LOCKED);
    }
}
exports.CommandLock = CommandLock;

//# sourceMappingURL=CommandLock.js.map
