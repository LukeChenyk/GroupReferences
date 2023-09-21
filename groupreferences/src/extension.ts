// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as sidebar from './Tree';
import { decodeLocation, encodeLocation } from './provider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{

	console.log('Congratulations, your extension "groupreferences" is now active!');

	//注册侧边栏面板的实现
	const readDataProvider = new sidebar.TreeProvider(false);
	vscode.window.registerTreeDataProvider("sidebar_groupreferences_id1", readDataProvider);

	const writeDataProvider = new sidebar.TreeProvider(true);
	vscode.window.registerTreeDataProvider("sidebar_groupreferences_id2", writeDataProvider);

	var commandRegistration = vscode.commands.registerTextEditorCommand('groupreferences.findAllReferences', function (editor: vscode.TextEditor)
	{
		var uri = encodeLocation(editor.document.uri, editor.selection.active);
		var _a = decodeLocation(uri), target = _a[0], pos = _a[1];

		vscode.commands.executeCommand('workbench.view.extension.sidebar_groupreferences');

		return vscode.commands.executeCommand('vscode.executeReferenceProvider', target, pos).then((locationList) =>
		{
			// sort by locations and shuffle to begin from target resource
			var locations = locationList as vscode.Location[];
			// var idx = 0;
			// locations.sort(Provider._compareLocations).find(function (loc, i) { return loc.uri.toString() === target.toString() && (idx = i) && true; });
			// locations.push.apply(locations, locations.splice(0, idx));


			let dataSources = genDataSource(locations);
			processDataSources(dataSources).then(() =>
			{
				readDataProvider.setDataSources(dataSources);
				writeDataProvider.setDataSources(dataSources);
			})
		});
	});

	context.subscriptions.push(commandRegistration);

}

function genDataSource(locations: vscode.Location[]): sidebar.LocationSource[]
{
	let dataSources: sidebar.LocationSource[] = [];
	for (let index = 0; index < locations.length; index++)
	{
		const loc = locations[index];
		const locSource: sidebar.LocationSource = {
			loc: loc,
			lineText: ""
		};
		dataSources.push(locSource);
	}
	return dataSources;
}

function processDataSources(dataSources: sidebar.LocationSource[])
{
	return new Promise((resolve, reject) =>
	{
		let processCount = 0;
		for (let index = 0; index < dataSources.length; index++)
		{
			let locSource = dataSources[index];
			let loc = locSource.loc;
			let uri = loc.uri;
			locSource.isWrite = false;

			vscode.workspace.openTextDocument(uri).then((doc: vscode.TextDocument) =>
			{
				locSource.lineText = doc.lineAt(loc.range.start.line).text;

				//判断是不是import
				if (locSource.lineText.startsWith("import "))
				{
					locSource.isWrite = false;

					processCount++;

					if (processCount >= dataSources.length)
					{
						resolve && resolve(null);
					}
					return;
				}

				vscode.commands.executeCommand('vscode.executeDocumentHighlights', uri, loc.range.start).then((args: any) =>
				{

					let documentHighlight: vscode.DocumentHighlight[] = args;

					for (let I = 0; I < documentHighlight.length; I++)
					{
						const element = documentHighlight[I];
						if (loc.range.isEqual(element.range))
						{
							if (element.kind === vscode.DocumentHighlightKind.Write)
							{
								locSource.isWrite = true;
							} else if (element.kind === vscode.DocumentHighlightKind.Read)
							{
								locSource.isWrite = false;
							}
						}
					}
					processCount++;

					if (processCount >= dataSources.length)
					{
						resolve && resolve(null);
					}
				});
			});
		}
	});
}


function OnReferenceItemClkCmd(uri: vscode.Uri)
{
	// const showDocOptions = {
	// 	preserveFocus: false,
	// 	preview: false,
	// 	viewColumn: 1,

	// 	// replace with your line_number's
	// 	selection: new vscode.Range(314, 0, 314, 0)
	// };

	// let doc = await vscode.window.showTextDocument(setting, showDocOptions);
}

// This method is called when your extension is deactivated
export function deactivate() { }
