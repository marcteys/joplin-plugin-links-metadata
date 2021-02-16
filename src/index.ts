import joplin from 'api';
import { ToolbarButtonLocation } from 'api/types'
import { registerSettings, settingValue } from './settings';

var Meta = require('html-metadata-parser');

// From https://stackoverflow.com/a/6234804/561309
function escapeHtml(unsafe:string) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function noteHeaders(noteBody:string) {
    const headers = [];
    const lines = noteBody.split('\n');
    let flag_block = false;
    let flag_comment = false;
    for (let line of lines) {
        // check code block
        if (line.match(/^(?:```)/)) {
            flag_block = !flag_block;
            continue
        }
        // check comment block
        if (line.match(/^(?:<!--)/)) {
            flag_comment = !flag_comment
            continue
        }
        if (flag_comment && line.match(/(?:-->)/)) {
            flag_comment = !flag_comment
            continue
        }
        if (flag_block || flag_comment) continue;

        // check header
        line = line.replace(/(\s#+)?$/, '');
        const match = line.match(/^(#+)\s(?:\[(.*)\]|(.*))/);
        if (!match) continue;
        if (match[1].length > 6) continue;
        headers.push({
            level: match[1].length,
            text: typeof(match[2]) === "undefined" ? match[3] : match[2],
        });
    }
    return headers;
}




joplin.plugins.register({
    onStart: async function() {
        await registerSettings();

        const panels = joplin.views.panels;
        const view = await (panels as any).create('links.panel');

        await panels.setHtml(view, '<div class="links-metadata-content"><p class="header">Links</p></div>');
        await panels.addScript(view, './webview.js');
        await panels.addScript(view, './webview.css');

        async function updateTocView(forceUpdate) {

            var note = await joplin.workspace.selectedNote();

            if (note) {
            //console.log(note);

                if(note.application_data == "" || forceUpdate == true) {
                    // Fetch 
                    console.log("Fetching Note Metadata");

                    var links = [];
                    var linksMetadata = [];
                    const lines = note.body.split('\n');
                    let flag_block = false;
                    let flag_comment = false;


                    for (let line of lines) {
                        // check code block
                        if (line.match(/^(?:```)/)) {
                            flag_block = !flag_block;
                            continue
                        }
                        // check comment block
                        if (line.match(/^(?:<!--)/)) {
                            flag_comment = !flag_comment
                            continue
                        }
                        if (flag_comment && line.match(/(?:-->)/)) {
                            flag_comment = !flag_comment
                            continue
                        }
                        if (flag_block || flag_comment) continue;

                        // check Links
                        line = line.replace(/(\s#+)?$/, '');
                        var expression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
                        const match = line.match(expression);
                        if (!match) continue;
                        for(let mat of match) {
                            mat = mat.split("#")[0];
                            mat = mat.replace(/[()]/g,'');
                            mat = mat.replace(/\.$/, "");
                            mat = mat.replace(/\:$/, "");
                            mat = mat.replace(/\,$/, "");
                            mat = mat.replace(/\`$/, "");
                            links.indexOf(mat) === -1 ? links.push(mat) : "" ;
                        }

                    } // End foreach line 
                        var i =0;
                        for await (const result of links.map(link => Meta.parser(link))) {
                        var t = result.og.title ? result.og.title : result.meta.title;
                        var d = result.og.description ? result.og.description : result.meta.description;

                        linksMetadata.push({
                            link: links[i],
                            title: t,
                            description: d,
                            image: result.og.image
                        });
                        i++; // Increment link.. this is dirty dirty


                    } // End For

                    var LinkShare = JSON.stringify(linksMetadata);
                    //console.log(LinkShare)
                    await joplin.data.put(['notes', note.id], null, { application_data: JSON.stringify(LinkShare) });
                    console.log("Saving Metadata", note);



                }  else { // End Fetch Metadata
                 console.log("Reusing existing metadata");
                }

                if(note.application_data != "")  {
                    var allLinks = JSON.parse(JSON.parse(note.application_data));
                    console.log(allLinks);

                    const itemHtml = [];
                    for(let htmlLink of allLinks) {

                        var html = "";
                        html += `<div class="item-link-metadata">`;
                        if(htmlLink.image) {
                          html += `<a class="metadata-image" href="`+htmlLink.link+`" rel="noopener noreferrer" target="_blank">`;
                          html += `   <img src="`+htmlLink.image+`" rel="noopener noreferrer" style="" height="60" align="left">`;
                          html += `</a>`;
                        }

                        html += `<div style="color: #AAA;display: flex;white-space: nowrap;text-overflow: ellipsis;overflow: hidden;">`+htmlLink.link+`</div>`;
                        html += `<a href="`+htmlLink.link+`" rel="noopener noreferrer" target="_blank"><strong>`+htmlLink.title+`</strong></a>`;
                        htmlLink.description ? html += `<div style="overflow:hidden; white-space:nowrap; text-overflow:ellipsis">`+htmlLink.description+`</div>` : html += "";
                        html += `</div>`;
                        itemHtml.push(html);
                  }

                    await panels.setHtml(view, `
                        <div class="links-metadata-content">
                            <p class="header">Links</p>
                            <div class="container">
                                ${itemHtml.join('\n')}
                            </div>
    					</div>
    				`);
                    } // if there is no link

            } else {
                await panels.setHtml(view, 'Please select a note to view the links.');
            }
        }

        await joplin.workspace.onNoteSelectionChange(() => {
            updateTocView(false);
        });

        await joplin.workspace.onNoteContentChange(() => {
           updateTocView(true);
        });

        await updateTocView(false);

        await joplin.commands.register({
            name: 'toggleLinksMetadata',
            label: 'Toggle Links Metadata',
            iconName: 'fas fa-link',
            execute: async () => {
                const isVisible = await (panels as any).visible(view);
                (panels as any).show(view, !isVisible);
            },
        });
        await joplin.views.toolbarButtons.create('toggleLinksMetadata', 'toggleLinksMetadata', ToolbarButtonLocation.NoteToolbar);
    },
});