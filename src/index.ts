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
        var iRunning = false;

        await panels.setHtml(view, 'Links');
        await panels.addScript(view, './webview.js');
        await panels.addScript(view, './webview.css');

        await panels.onMessage(view, async (message: any) => {
            console.log(message);
            if (message.name === 'scrollToHash') {
                await joplin.commands.execute('scrollToHash', message.hash)
            } else if (message.name === 'contextMenu') {
                const noteId = (await joplin.workspace.selectedNoteIds())[0]
                const noteTitle = (await joplin.data.get(['notes', noteId], { fields: ['title'] } )).title
                const innerLink = `[${noteTitle}#${message.content}](:/${noteId}#${message.hash})`

                let input = document.createElement("input");
                input.setAttribute("value", innerLink);
                document.body.appendChild(input);
                input.select();
                document.execCommand("copy");
                document.body.removeChild(input);
                alert(`The inner link has been copied to clipboard:\n${innerLink}`)
            }
        });

        async function updateTocView() {

            const note = await joplin.workspace.selectedNote();
            if (note) {

             iRunning = true;


                  console.log("start display");


                    var links = [];
                    const linksMetadata = [];
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

                console.log(linksMetadata);

                const itemHtml = [];

                for(let htmlLink of linksMetadata) {

                    var html = "";
                    html += `<div class="item-link-metadata">`;
                    if(htmlLink.image) {
                      html += `<a class="metadata-image" href="`+htmlLink.link+`" rel="noopener noreferrer" target="_blank">`;
                      html += `   <img src="`+htmlLink.image+`" rel="noopener noreferrer" style="" height="60" align="left">`;
                      html += `</a>`;
                    }

                    html += `<div style="color: #AAA;display: flex;">`+htmlLink.link+`</div>`;
                    html += `<a href="`+htmlLink.link+`" rel="noopener noreferrer" target="_blank"><strong>`+htmlLink.title+`</strong></a>`;
                    htmlLink.description ? html += `<div style="overflow:hidden; white-space:nowrap; text-overflow:ellipsis">`+htmlLink.description+`</div>` : html += "";
                    html += `</div>`;
                    itemHtml.push(html);
              }

                await panels.setHtml(view, `
                    <div class="links-metadata-content">
                     <i class="fas fa-link"></i>
                        <p class="header">Links</p>
                        <div class="container">
                            ${itemHtml.join('\n')}
                        </div>
					</div>
				`);

              iRunning = false;

            } else {
                await panels.setHtml(view, 'Please select a note to view the links.');
            }
        }

        await joplin.workspace.onNoteSelectionChange(() => {
            updateTocView();
        });
        await joplin.workspace.onNoteChange(() => {
            updateTocView();
        });
        await joplin.settings.onChange(() => {
            updateTocView();
        });

        await updateTocView();

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