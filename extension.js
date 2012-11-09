/*
 * Alt Tab Mod: Close Selected Window or App - GNOME Shell extension
 * Copyright (C) 2012  Davi da Silva Böger  (dsboger@gmail.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const Self = ExtensionUtils.getCurrentExtension();
const Convenience = Self.imports.convenience;
const Main = imports.ui.main;
const AltTab = imports.ui.altTab;
const Clutter = imports.gi.Clutter;
 
const AppCloseType = {
    CLOSE_ALL_WINDOWS: 0,
    CLOSE_ALL_WINDOWS_IN_CURRENT_WORKSPACE: 1,
    CLOSE_MOST_RECENTLY_USED_WINDOW: 2
};

let _settings;

let _originalInit;


function _closeSelected() {
    let app = this._appIcons[this._currentApp];
    if (this._currentWindow >= 0) {
        let window = app.cachedWindows[this._currentWindow];
        Main.activateWindow(window);
        window.delete(global.get_current_time());
    } else {
        let appCloseType = _settings.get_enum('app-close-type');
        switch (appCloseType) {
        
        case AppCloseType.CLOSE_ALL_WINDOWS: {
            let windows = app.cachedWindows; 
            for each (let window in windows) {
                Main.activateWindow(window);
                window.delete(global.get_current_time());
            }
            break;
        }
            
        case AppCloseType.CLOSE_ALL_WINDOWS_IN_CURRENT_WORKSPACE: {
            let activeWorkspace = global.screen.get_active_workspace();
            let windows = app.cachedWindows;
            for each (let window in windows) {
                if (window.get_workspace() == activeWorkspace) {
                    Main.activateWindow(window);
                    window.delete(global.get_current_time());
                }
            }
            break;
        }
            
        case AppCloseType.CLOSE_MOST_RECENTLY_USED_WINDOW: {
            let window = app.cachedWindows[0];
            Main.activateWindow(window);
            window.delete(global.get_current_time());
            break;
        }
        
        }
    }
}

function _modifiedInit() {
    let init = _originalInit;
    return function () {
        init.apply(this);
        this.actor.connect('key-press-event', Lang.bind(this, 
            function (actor, event) {
                let keysym = event.get_key_symbol();
                if (keysym == Clutter.F4) {
                    _closeSelected.apply(this);
                    this.destroy();
                }
            }
        ));
    }
}

function init(metadata) {
}

function enable() {
    _settings = Convenience.getSettings();
    _originalInit = AltTab.AltTabPopup.prototype._init;
    AltTab.AltTabPopup.prototype._init = _modifiedInit();
}

function disable() {
    AltTab.AltTabPopup.prototype._init = _originalInit;
    _originalInit = null;
    _settings.run_dispose();
    _settings = null;
}

