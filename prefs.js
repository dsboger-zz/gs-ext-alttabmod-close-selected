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
// Credit: based on window-buttons extension prefs.js
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Params = imports.misc.params;

const Self = ExtensionUtils.getCurrentExtension();
const Convenience = Self.imports.convenience;

const AppCloseType = {
    CLOSE_ALL_WINDOWS: 0,
    CLOSE_ALL_WINDOWS_IN_CURRENT_WORKSPACE: 1,
    CLOSE_MOST_RECENTLY_USED_WINDOW: 2
};

/* **** prefs.js *** */

function init() {
}

const AlttabmodCloseSelectedPrefsWidget = new GObject.Class({
    Name: 'AlttabmodCloseSelectedPrefsWidget',
    GTypeName: 'AlttabmodCloseSelectedPrefsWidget',
    Extends: Gtk.Grid,

    _init: function (params) {
        this.parent(params);
        this.margin = this.row_spacing = this.column_spacing = 10;
        this._rownum = 0;
        this._settings = Convenience.getSettings();

        Gtk.Settings.get_default().gtk_button_images = true;
        
        let combo = new Gtk.ComboBoxText();
        for (let type in AppCloseType) {
            if (!AppCloseType.hasOwnProperty(type)) {
                continue;
            }
            let label = type.toLowerCase().replace(/_/g, ' ');
            combo.append(AppCloseType[type].toString(), label);
        }        
        combo.set_active_id(this._settings.get_enum('app-close-type').toString());
        combo.connect('changed', Lang.bind(this, function (combo) {
            let value = parseInt(combo.get_active_id(), 10);
            if (value !== undefined &&
                this._settings.get_enum('app-close-type') !== value) {
                this._settings.set_enum('app-close-type', value);
            }
        }));
        this.addRow("What to do when an app is closed?", combo);
    },
    
    addEntry: function (text, key) {
        let item = new Gtk.Entry({ hexpand: true });
        item.text = this._settings.get_string(key);
        this._settings.bind(key, item, 'text', Gio.SettingsBindFlags.DEFAULT);
        return this.addRow(text, item);
    },

    addBoolean: function (text, key) {
        let item = new Gtk.Switch({active: this._settings.get_boolean(key)});
        this._settings.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        return this.addRow(text, item);
    },

    addSpin: function (label, key, adjustmentProperties, spinProperties) {
        adjustmentProperties = Params.parse(adjustmentProperties,
            { lower: 0, upper: 100, step_increment: 100 });
        let adjustment = new Gtk.Adjustment(adjustmentProperties);
        spinProperties = Params.parse(spinProperties,
            { adjustment: adjustment, numeric: true, snap_to_ticks: true },
            true
        );
        let spinButton = new Gtk.SpinButton(spinProperties);

        spinButton.set_value(this._settings.get_int(key));
        spinButton.connect('value-changed', Lang.bind(this, function (spin) {
            let value = spin.get_value_as_int();
            if (this._settings.get_int(key) !== value) {
                this._settings.set_int(key, value);
            }
        }));
        return this.addRow(label, spinButton, true);
    },

    addRow: function (text, widget, wrap) {
        let label = new Gtk.Label({
            label: text,
            hexpand: true,
            halign: Gtk.Align.START
        });
        label.set_line_wrap(wrap || false);
        this.attach(label, 0, this._rownum, 1, 1); // col, row, colspan, rowspan
        this.attach(widget, 1, this._rownum, 1, 1);
        this._rownum++;
        return widget;
    },

    addItem: function (widget, col, colspan, rowspan) {
        this.attach(widget, col || 0, this._rownum, colspan || 2, rowspan || 1);
        this._rownum++;
        return widget;
    }
});

function buildPrefsWidget() {
    let widget = new AlttabmodCloseSelectedPrefsWidget();
    widget.show_all();

    return widget;
}
