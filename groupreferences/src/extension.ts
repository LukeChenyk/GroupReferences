// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as sidebar from './Tree';

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


	//注册侧边栏面板的实现
	const sidebar_test = new sidebar.EntryList();
	vscode.window.registerTreeDataProvider("sidebar_test_id1", sidebar_test);
	//注册命令 
	vscode.commands.registerCommand("sidebar_test_id1.openChild", args =>
	{
		vscode.window.showInformationMessage(args);
	});


	var providerRegistrations = vscode.Disposable.from(vscode.workspace.registerTextDocumentContentProvider(provider_1.default.scheme, provider), vscode.languages.registerDocumentLinkProvider({ scheme: provider_1.default.scheme }, provider));
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

// This method is called when your extension is deactivated
export function deactivate() { }
