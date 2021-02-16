import {SettingItemType} from 'api/types'
import joplin from "../api";

export async function registerSettings() {
    await joplin.settings.registerSection('outline.settings', {
        label: 'Links Metadata',
        iconName: 'fas fa-bars'
    });
}

export async function settingValue(key: string) {
    return await joplin.settings.value(key)
}