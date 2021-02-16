interface Hint {
	text: string;
	hint: Function;
	displayText?: string;
	render?: Function;
}

module.exports = {
	default: function(context: any) {


		const plugin = function(CodeMirror) {
			CodeMirror.defineOption('linksMetadata', false, function(cm, value, prev) {
				if (!value) {
							console.log("return");

					return;
				}

				cm.on('inputRead', async function (cm1, change) {
					                    	console.log("read");

                    if (!cm1.state.completionActive && cm.getTokenAt(cm.getCursor()).string === '@@') {
                    	console.log("completion active");
                        const start = {line: change.from.line, ch: change.from.ch + 1};

						const hint = function(cm, callback) {
							const cursor = cm.getCursor();
							let prefix = cm.getRange(start, cursor) || '';
						};

						setTimeout(function () {
							CodeMirror.showHint(cm, hint, {
								completeSingle: false,
								closeOnUnfocus: true,
								async: true,
								closeCharacters: /[()\[\]{};:>,]/
							});
						}, 10);
					}
				});
			});
		};

		return {
			plugin: plugin,
			codeMirrorResources: [
			    'addon/hint/show-hint',
			    ],
			codeMirrorOptions: {
    			'linksMetadata': true,
			},
			assets: function() {
			    return [
			        { name: './show-hint.css'},
			    ]
			}
        }
    }
}