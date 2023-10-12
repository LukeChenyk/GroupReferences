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
exports.TreeProvider = exports.NodeItem = void 0;
const vscode = __webpack_require__(1);
// 树节点
class NodeItem extends vscode.TreeItem {
    constructor(info) {
        super(info.name, info.isFile ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
        this.info = info;
        if (info.isFile == false) {
            const showDocOptions = {
                preserveFocus: false,
                preview: false,
                // viewColumn: 1,
                selection: info.range
            };
            this.command = {
                command: "vscode.open",
                title: "标题",
                arguments: [info.uri, showDocOptions] //命令接收的参数
            };
        }
        else {
            this.iconPath = vscode.ThemeIcon.File;
            this.resourceUri = info.uri;
            this.description = info.uri.fsPath;
            this.tooltip = info.uri.fsPath;
        }
    }
}
exports.NodeItem = NodeItem;
//树的内容组织管理
class TreeProvider {
    constructor(isWrite) {
        this.refreshEvent = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.refreshEvent.event;
        this.dataSources = [];
        this._isWriteTree = false;
        this._isWriteTree = isWrite;
    }
    refresh() {
        this.refreshEvent?.fire(null);
    }
    getTreeItem(element) {
        let item = new NodeItem(element);
        return item;
    }
    getChildren(nodeInfo) {
        if (this.dataSources.length == 0) {
            return null;
        }
        if (nodeInfo) {
            if (nodeInfo.isFile == false) {
                return null;
            }
            let children = [];
            for (let index = 0; index < this.dataSources.length; index++) {
                let locSource = this.dataSources[index];
                let loc = locSource.loc;
                let uri = loc.uri;
                if (this._isWriteTree) {
                    if (!locSource.isWrite) {
                        continue;
                    }
                }
                else {
                    if (locSource.isWrite == true) {
                        continue;
                    }
                }
                if (uri.toString() != nodeInfo.uri.toString()) {
                    continue;
                }
                //去掉前面的空格和tab
                let originText = locSource.lineText;
                locSource.lineText = locSource.lineText.trimStart();
                let subLen = originText.length - locSource.lineText.length;
                let treeItemLabel = {
                    label: locSource.lineText,
                    highlights: [[loc.range.start.character - subLen, loc.range.end.character - subLen]]
                };
                let info = {
                    uri: uri,
                    name: treeItemLabel,
                    isFile: false,
                    line: loc.range.start.line,
                    range: loc.range
                };
                children.push(info);
            }
            children.sort((a, b) => {
                a.line = a.line ? a.line : 0;
                b.line = b.line ? b.line : 0;
                return a.line - b.line;
            });
            return children;
        }
        else {
            let children = [];
            var fileSet = new Set();
            for (let index = 0; index < this.dataSources.length; index++) {
                let locSource = this.dataSources[index];
                let loc = locSource.loc;
                let uri = loc.uri;
                if (this._isWriteTree) {
                    if (!locSource.isWrite) {
                        continue;
                    }
                }
                else {
                    if (locSource.isWrite == true) {
                        continue;
                    }
                }
                if (fileSet.has(uri.toString())) {
                    continue;
                }
                let info = {
                    uri: uri,
                    name: this.getFileNameByPath(uri.path),
                    isFile: true
                };
                fileSet.add(uri.toString());
                children.push(info);
            }
            return children;
        }
    }
    setDataSources(dataSources) {
        this.dataSources = dataSources;
        this.refresh();
    }
    getFileNameByPath(path) {
        let index = path.lastIndexOf("\\");
        if (index == -1) {
            index = path.lastIndexOf("/");
        }
        if (index != -1) {
            return path.substring(index + 1);
        }
        return path;
    }
}
exports.TreeProvider = TreeProvider;


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.decodeLocation = exports.encodeLocation = exports.Provider = void 0;
// var vscode = require('vscode');
// var referencesDocument_1 = require('./referencesDocument');
const vscode = __webpack_require__(1);
const referencesDocument_1 = __webpack_require__(4);
class Provider {
    constructor() {
        var _this = this;
        this._onDidChange = new vscode.EventEmitter();
        this._documents = new Map();
        this._editorDecoration = vscode.window.createTextEditorDecorationType({ textDecoration: 'underline' });
        // Listen to the following events:
        // * closeTextDocument - which means we must clear the corresponding model object - `ReferencesDocument`
        this._subscriptions = vscode.workspace.onDidCloseTextDocument(function (doc) { return _this._documents.delete(doc.uri.toString()); });
    }
    dispose() {
        this._subscriptions.dispose();
        this._documents.clear();
        this._editorDecoration.dispose();
        this._onDidChange.dispose();
    }
    /**
         * Expose an event to signal changes of _virtual_ documents
         * to the editor
         */
    get onDidChange() {
        return this._onDidChange.event;
    }
    /**
     * Provider method that takes an uri of the `references`-scheme and
     * resolves its content by (1) running the reference search command
     * and (2) formatting the results
     */
    provideTextDocumentContent(uri) {
        var _this = this;
        // already loaded?
        var document = this._documents.get(uri.toString());
        if (document) {
            return document.value;
        }
        // Decode target-uri and target-position from the provided uri and execute the
        // `reference provider` command (http://code.visualstudio.com/docs/extensionAPI/vscode-api-commands).
        // From the result create a references document which is in charge of loading,
        // printing, and formatting references
        var _a = decodeLocation(uri), target = _a[0], pos = _a[1];
        return vscode.commands.executeCommand('vscode.executeReferenceProvider', target, pos).then((locationList) => {
            // sort by locations and shuffle to begin from target resource
            var locations = locationList;
            var idx = 0;
            locations.sort(Provider._compareLocations).find(function (loc, i) { return loc.uri.toString() === target.toString() && (idx = i) && true; });
            locations.push.apply(locations, locations.splice(0, idx));
            // create document and return its early state
            var document = new referencesDocument_1.ReferencesDocument(uri, locations, _this._onDidChange);
            _this._documents.set(uri.toString(), document);
            return document.value;
        });
    }
    static _compareLocations(a, b) {
        if (a.uri.toString() < b.uri.toString()) {
            return -1;
        }
        else if (a.uri.toString() > b.uri.toString()) {
            return 1;
        }
        else {
            return a.range.start.compareTo(b.range.start);
        }
    }
    provideDocumentLinks(document, token) {
        // While building the virtual document we have already created the links.
        // Those are composed from the range inside the document and a target uri
        // to which they point
        var doc = this._documents.get(document.uri.toString());
        if (doc) {
            return doc.links;
        }
    }
}
exports.Provider = Provider;
Provider.scheme = 'references';
// var Provider = (function ()
// {
//     return Provider;
// }());
// exports.default = Provider;
var seq = 0;
function encodeLocation(uri, pos) {
    var query = JSON.stringify([uri.toString(), pos.line, pos.character]);
    return vscode.Uri.parse(Provider.scheme + ":References.locations?" + query + "#" + seq++);
}
exports.encodeLocation = encodeLocation;
function decodeLocation(uri) {
    var _a = JSON.parse(uri.query), target = _a[0], line = _a[1], character = _a[2];
    return [vscode.Uri.parse(target), new vscode.Position(line, character)];
}
exports.decodeLocation = decodeLocation;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReferencesDocument = void 0;
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
const vscode = __webpack_require__(1);
class ReferencesDocument {
    constructor(uri, locations, emitter) {
        this._uri = uri;
        this._locations = locations;
        // The ReferencesDocument has access to the event emitter from
        // the containg provider. This allows it to signal changes
        this._emitter = emitter;
        // Start with printing a header and start resolving
        this._lines = [("Found " + this._locations.length + " references")];
        this._links = [];
        this._join = this._populate();
    }
    get value() {
        return this._lines.join('\n');
    }
    get links() {
        return this._links;
    }
    join() {
        return this._join;
    }
    _populate() {
        var _this = this;
        if (this._locations.length === 0) {
            return;
        }
        // fetch one by one, update doc asap
        return new Promise(function (resolve) {
            var index = 0;
            var next = function () {
                // We have seen all groups
                if (index >= _this._locations.length) {
                    resolve(_this);
                    return;
                }
                // We know that this._locations is sorted by uri
                // such that we can now iterate and collect ranges
                // until the uri changes
                var loc = _this._locations[index];
                var uri = loc.uri;
                var ranges = [loc.range];
                while (++index < _this._locations.length) {
                    loc = _this._locations[index];
                    if (loc.uri.toString() !== uri.toString()) {
                        break;
                    }
                    else {
                        ranges.push(loc.range);
                    }
                }
                // We have all ranges of a resource so that it be
                // now loaded and formatted
                _this._fetchAndFormatLocations(uri, ranges).then(function (lines) {
                    _this._emitter.fire(_this._uri);
                    next();
                });
            };
            next();
        });
    }
    _fetchAndFormatLocations(uri, ranges) {
        var _this = this;
        // Fetch the document denoted by the uri and format the matches
        // with leading and trailing content form the document. Make sure
        // to not duplicate lines
        return vscode.workspace.openTextDocument(uri).then(function (doc) {
            _this._lines.push('', uri.toString());
            for (var i = 0; i < ranges.length; i++) {
                var line = ranges[i].start.line;
                _this._appendLeading(doc, line, ranges[i - 1]);
                _this._appendMatch(doc, line, ranges[i], uri);
                _this._appendTrailing(doc, line, ranges[i + 1]);
            }
        }, function (err) {
            _this._lines.push('', "Failed to load '" + uri.toString() + "'\n\n" + String(err), '');
        });
    }
    _appendLeading(doc, line, previous) {
        var from = Math.max(0, line - 3, previous && previous.end.line || 0);
        while (++from < line) {
            var text = doc.lineAt(from).text;
            this._lines.push(("  " + (from + 1)) + (text && "  " + text));
        }
    }
    _appendMatch(doc, line, match, target) {
        var text = doc.lineAt(line).text;
        var preamble = "  " + (line + 1) + ": ";
        // Append line, use new length of lines-array as line number
        // for a link that point to the reference
        var len = this._lines.push(preamble + text);
        // Create a document link that will reveal the reference
        var linkRange = new vscode.Range(len - 1, preamble.length + match.start.character, len - 1, preamble.length + match.end.character);
        var linkTarget = target.with({ fragment: String(1 + match.start.line) });
        this._links.push(new vscode.DocumentLink(linkRange, linkTarget));
    }
    _appendTrailing(doc, line, next) {
        var to = Math.min(doc.lineCount, line + 3);
        if (next && next.start.line - to <= 2) {
            return; // next is too close, _appendLeading does the work
        }
        while (++line < to) {
            var text = doc.lineAt(line).text;
            this._lines.push(("  " + (line + 1)) + (text && "  " + text));
        }
        if (next) {
            this._lines.push("  ...");
        }
    }
}
exports.ReferencesDocument = ReferencesDocument;



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
const provider_1 = __webpack_require__(3);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    console.log('Congratulations, your extension "groupreferences" is now active!');
    //注册侧边栏面板的实现
    const readDataProvider = new sidebar.TreeProvider(false);
    vscode.window.registerTreeDataProvider("sidebar_groupreferences_id1", readDataProvider);
    const writeDataProvider = new sidebar.TreeProvider(true);
    vscode.window.registerTreeDataProvider("sidebar_groupreferences_id2", writeDataProvider);
    // //注册命令 
    var commandRegistration = vscode.commands.registerTextEditorCommand('groupreferences.findAllReferences', function (editor) {
        var uri = (0, provider_1.encodeLocation)(editor.document.uri, editor.selection.active);
        var _a = (0, provider_1.decodeLocation)(uri), target = _a[0], pos = _a[1];
        vscode.commands.executeCommand('workbench.view.extension.sidebar_groupreferences');
        return vscode.commands.executeCommand('vscode.executeReferenceProvider', target, pos).then((locationList) => {
            // sort by locations and shuffle to begin from target resource
            var locations = locationList;
            // var idx = 0;
            // locations.sort(Provider._compareLocations).find(function (loc, i) { return loc.uri.toString() === target.toString() && (idx = i) && true; });
            // locations.push.apply(locations, locations.splice(0, idx));
            let dataSources = genDataSource(locations);
            processDataSources(dataSources).then(() => {
                readDataProvider.setDataSources(dataSources);
                writeDataProvider.setDataSources(dataSources);
            });
        });
    });
    context.subscriptions.push(commandRegistration);
}
exports.activate = activate;
function genDataSource(locations) {
    let dataSources = [];
    for (let index = 0; index < locations.length; index++) {
        const loc = locations[index];
        const locSource = {
            loc: loc,
            lineText: ""
        };
        dataSources.push(locSource);
    }
    return dataSources;
}
function processDataSources(dataSources) {
    return new Promise((resolve, reject) => {
        let processCount = 0;
        for (let index = 0; index < dataSources.length; index++) {
            let locSource = dataSources[index];
            let loc = locSource.loc;
            let uri = loc.uri;
            locSource.isWrite = false;
            vscode.workspace.openTextDocument(uri).then((doc) => {
                locSource.lineText = doc.lineAt(loc.range.start.line).text;
                //判断是不是import
                if (locSource.lineText.startsWith("import ")) {
                    locSource.isWrite = false;
                    processCount++;
                    if (processCount >= dataSources.length) {
                        resolve && resolve(null);
                    }
                    return;
                }
                vscode.commands.executeCommand('vscode.executeDocumentHighlights', uri, loc.range.start).then((args) => {
                    let documentHighlight = args;
                    for (let I = 0; I < documentHighlight.length; I++) {
                        const element = documentHighlight[I];
                        if (loc.range.isEqual(element.range)) {
                            if (element.kind === vscode.DocumentHighlightKind.Write) {
                                locSource.isWrite = true;
                            }
                            else if (element.kind === vscode.DocumentHighlightKind.Read) {
                                locSource.isWrite = false;
                            }
                        }
                    }
                    processCount++;
                    if (processCount >= dataSources.length) {
                        resolve && resolve(null);
                    }
                });
            });
        }
    });
}
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map