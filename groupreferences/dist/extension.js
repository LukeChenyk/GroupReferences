/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EntryList = exports.EntryItem = void 0;
const vscode = __webpack_require__(1);
// 树节点
class EntryItem extends vscode.TreeItem {
}
exports.EntryItem = EntryItem;
//树的内容组织管理
class EntryList {
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) { //子节点
            var childs = [];
            for (let index = 0; index < 3; index++) {
                let str = index.toString();
                var item = new EntryItem(str, vscode.TreeItemCollapsibleState.None);
                item.command = {
                    command: "sidebar_test_id1.openChild",
                    title: "标题",
                    arguments: [str] //命令接收的参数
                };
                childs[index] = item;
            }
            return childs;
        }
        else { //根节点
            return [new EntryItem("root", vscode.TreeItemCollapsibleState.Collapsed)];
        }
    }
}
exports.EntryList = EntryList;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(1);
const sidebar = __webpack_require__(2);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "groupreferences" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('groupreferences.helloWorld', () => {
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
    vscode.commands.registerCommand("sidebar_test_id1.openChild", args => {
        vscode.window.showInformationMessage(args);
    });
}
exports.activate = activate;
function toLowerCase() {
    toLowerCaseOrUpperCase('toLowerCase');
}
function toUpperCase() {
    toLowerCaseOrUpperCase('toUpperCase');
}
//转小写
function toLowerCaseOrUpperCase(command) {
    //获取activeTextEditor
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        const selection = editor.selection;
        //获取选中单词文本
        const word = document.getText(selection);
        //文本转大小写
        const newWord = command === 'toLowerCase' ? word.toLowerCase() : word.toUpperCase();
        //替换原来文本
        editor.edit((editBuilder) => {
            editBuilder.replace(selection, newWord);
        });
    }
}
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map