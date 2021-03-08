# Joplin Links Metadata Plugin

A Joplin plugins that displays the metadata from the links present on the note. 

Joplin is an open source note taking app. Learn more about [Joplin](http://joplinapp.org).

It has been tested on Windows, Joplin version 1.7.11 (prod).


## Screenshot
![screenshots/linksmeta01.PNG](/screenshots/linksmeta01.PNG)



## Installation

### Manual

- Download the latest released JPL package (`*.jpl`) from [here](https://github.com/marcteys/joplin-plugin-links-metadata/releases)
- Open Joplin and navigate to `Tools > Options > Plugins`
- Press `Install plugin` and select the previously downloaded `jpl` file
- Confirm selection
- Restart Joplin to enable the plugin

### Uninstall

- Open Joplin and navigate to `Tools > Options > Plugins`
- Search for the `Links Metadata ` plugin
- Press `Delete` to remove the plugin completely
  - Alternatively you can also disable the plugin by clicking on the toggle button
- Restart Joplin


## Features 
This plugins displays the website URL, the Title, the description and the oc:image.  You can toggle the pannel by cliking on the "link" icon on the WYSIWYG editor.
![screenshots/linksmeta02.PNG](/screenshots/linksmeta02.PNG)

Change the application layout `View > Change Applciation Layout` to display the links under the note (see after)

## Improvements 
I should create a way to store the Metadata in the note. Right now, it fetches the websites every time we click on a new not, which is not optimal. Moreover, I think a 404 breaks the plugin. 

Pull requests more than welcome !

## Building the plugin

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can use to distribute the plugin.

To build the plugin, simply run `npm run dist`.





![screenshots/linksmeta01.PNG](/screenshots/linksmeta03.PNG)

