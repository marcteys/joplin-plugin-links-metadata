import joplin from 'api';
//https://github.com/ambrt/joplin-plugin-referencing-notes/blob/master/src/index.ts
import { ContentScriptType, SettingItem, SettingItemType } from 'api/types';


function escapeTitleText(text: string) {
	return text.replace(/(\[|\])/g, '\\$1');
}


function urlify(text) {
  var urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function(url) {
    return '<a href="' + url + '">' + url + '</a>';
  })
}




joplin.plugins.register({

	onStart: async function() {

	await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'linksMetadata',
			'./LinksMetadata.js'
		);

		await joplin.contentScripts.onMessage('linksMetadata', async (message: any) => {
			const selectedNoteIds = await joplin.workspace.selectedNoteIds();
			const noteId = selectedNoteIds[0];
			
			if (message.command === 'getNotes') {
				console.log("Get notes !!");
				/*
				const prefix = message.prefix;
				let notes = await getNotes(prefix);
				const res =  notes.filter(n => n.id !== noteId).map(n => {
					return {
						id: n.id,
						title: n.title,
						folder: folders[n.parent_id],
					};
				});
				return { notes: res, showFolders: showFolders };*/
			}
		});



		// Later, this is where you'll want to update the TOC
		async function updateTocView() {
			// Get the current note from the workspace.
			const data = await joplin.workspace.selectedNote();

			// Keep in mind that it can be `null` if nothing is currently selected!
			if (data) {

			  let body = data.body;
			  console.info('Note content has changed! New note body is:', data);
			} else {
				console.info('No note is selected');
			}
		}

		// This event will be triggered when the user selects a different note
		await joplin.workspace.onNoteSelectionChange(() => {
			updateTocView();
		});

		// This event will be triggered when the content of the note changes
		// as you also want to update the TOC in this case.
		await joplin.workspace.onNoteContentChange(() => {
			updateTocView();
		});

		// Also update the TOC when the plugin starts
		updateTocView();
	},

});