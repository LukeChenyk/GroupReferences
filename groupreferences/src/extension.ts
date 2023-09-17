// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as sidebar from './Tree';
import { decodeLocation, encodeLocation } from './provider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "groupreferences" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('groupreferences.helloWorld', () =>
	{
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from GroupReferences!I am a new extension of Yuk!');
	});

	context.subscriptions.push(disposable);


	let lowerCase = vscode.commands.registerCommand('extension.toLowerCase', toLowerCase);
	let upperCase = vscode.commands.registerCommand('extension.toUpperCase', toUpperCase);
	context.subscriptions.push(lowerCase);
	context.subscriptions.push(upperCase);

	// let referenceItemClkCmd = vscode.commands.registerCommand('groupreferences.referenceItemClk', OnReferenceItemClkCmd);
	// context.subscriptions.push(referenceItemClkCmd);


	//注册侧边栏面板的实现
	const readDataProvider = new sidebar.TreeProvider(false);
	vscode.window.registerTreeDataProvider("sidebar_groupreferences_id1", readDataProvider);

	const writeDataProvider = new sidebar.TreeProvider(true);
	vscode.window.registerTreeDataProvider("sidebar_groupreferences_id2", writeDataProvider);


	// //注册命令 
	// vscode.commands.registerCommand("sidebar_test_id1.openChild", args =>
	// {
	// 	vscode.window.showInformationMessage(args);
	// });

	// var provider = new Provider()

	// var providerRegistrations = vscode.Disposable.from(
	// 	vscode.workspace.registerTextDocumentContentProvider(Provider.scheme, provider),
	// 	vscode.languages.registerDocumentLinkProvider({ scheme: Provider.scheme }, provider));

	var commandRegistration = vscode.commands.registerTextEditorCommand('groupreferences.findAllReferences', function (editor: vscode.TextEditor)
	{
		var uri = encodeLocation(editor.document.uri, editor.selection.active);
		var _a = decodeLocation(uri), target = _a[0], pos = _a[1];

		return vscode.commands.executeCommand('vscode.executeReferenceProvider', target, pos).then((locationList) =>
		{
			//todo: 激活activity bar panel
			// vscode.commands.executeCommand('workbench.view.extension.groupreferences-sidebar-view');


			// sort by locations and shuffle to begin from target resource
			var locations = locationList as vscode.Location[]
			// var idx = 0;
			// locations.sort(Provider._compareLocations).find(function (loc, i) { return loc.uri.toString() === target.toString() && (idx = i) && true; });
			// locations.push.apply(locations, locations.splice(0, idx));

			readDataProvider.SetDataSources(locations)
			writeDataProvider.SetDataSources(locations)
		});


		// var viewColumn = editor.viewColumn ? editor.viewColumn + 1 : undefined;
		// return vscode.workspace.openTextDocument(uri).then((doc: vscode.TextDocument) =>
		// {
		// 	return vscode.window.showTextDocument(doc, viewColumn);
		// });
	});
	// context.subscriptions.push(provider, commandRegistration, providerRegistrations);

	context.subscriptions.push(commandRegistration)

}

function toLowerCase()
{
	toLowerCaseOrUpperCase('toLowerCase');
}

function toUpperCase()
{
	toLowerCaseOrUpperCase('toUpperCase');
}

//转小写
function toLowerCaseOrUpperCase(command: string)
{
	//获取activeTextEditor
	const editor = vscode.window.activeTextEditor;
	if (editor)
	{
		const document = editor.document;
		const selection = editor.selection;
		//获取选中单词文本
		const word = document.getText(selection);
		//文本转大小写
		const newWord = command === 'toLowerCase' ? word.toLowerCase() : word.toUpperCase();
		//替换原来文本
		editor.edit((editBuilder) =>
		{
			editBuilder.replace(selection, newWord);
		});
	}
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
