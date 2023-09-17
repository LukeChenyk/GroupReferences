/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
export class ReferencesDocument
{
    private _uri: vscode.Uri
    private _locations: vscode.Location[]
    // The ReferencesDocument has access to the event emitter from
    // the containg provider. This allows it to signal changes
    private _emitter: vscode.EventEmitter<vscode.Uri>
    // Start with printing a header and start resolving
    private _lines
    private _links: any[]
    private _join

    constructor(uri: vscode.Uri, locations: vscode.Location[], emitter: vscode.EventEmitter<vscode.Uri>)
    {
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

    get value(): string
    {
        return this._lines.join('\n');
    }



    get links()
    {
        return this._links;
    }

    join()
    {
        return this._join;
    }
    _populate()
    {
        var _this = this;
        if (this._locations.length === 0)
        {
            return;
        }
        // fetch one by one, update doc asap
        return new Promise(function (resolve)
        {
            var index = 0;
            var next = function ()
            {
                // We have seen all groups
                if (index >= _this._locations.length)
                {
                    resolve(_this);
                    return;
                }
                // We know that this._locations is sorted by uri
                // such that we can now iterate and collect ranges
                // until the uri changes
                var loc = _this._locations[index];
                var uri = loc.uri;
                var ranges = [loc.range];
                while (++index < _this._locations.length)
                {
                    loc = _this._locations[index];
                    if (loc.uri.toString() !== uri.toString())
                    {
                        break;
                    }
                    else
                    {
                        ranges.push(loc.range);
                    }
                }
                // We have all ranges of a resource so that it be
                // now loaded and formatted
                _this._fetchAndFormatLocations(uri, ranges).then(function (lines)
                {
                    _this._emitter.fire(_this._uri);
                    next();
                });
            };
            next();
        });
    }
    _fetchAndFormatLocations(uri: any, ranges: any)
    {
        var _this = this;
        // Fetch the document denoted by the uri and format the matches
        // with leading and trailing content form the document. Make sure
        // to not duplicate lines
        return vscode.workspace.openTextDocument(uri).then(function (doc)
        {
            _this._lines.push('', uri.toString());
            for (var i = 0; i < ranges.length; i++)
            {
                var line = ranges[i].start.line;
                _this._appendLeading(doc, line, ranges[i - 1]);
                _this._appendMatch(doc, line, ranges[i], uri);
                _this._appendTrailing(doc, line, ranges[i + 1]);
            }
        }, function (err)
        {
            _this._lines.push('', "Failed to load '" + uri.toString() + "'\n\n" + String(err), '');
        });
    }
    _appendLeading(doc: any, line: any, previous: any)
    {
        var from = Math.max(0, line - 3, previous && previous.end.line || 0);
        while (++from < line)
        {
            var text = doc.lineAt(from).text;
            this._lines.push(("  " + (from + 1)) + (text && "  " + text));
        }
    }
    _appendMatch(doc: any, line: number, match: vscode.Range, target: vscode.Uri)
    {
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
    _appendTrailing(doc: any, line: any, next: any)
    {
        var to = Math.min(doc.lineCount, line + 3);
        if (next && next.start.line - to <= 2)
        {
            return; // next is too close, _appendLeading does the work
        }
        while (++line < to)
        {
            var text = doc.lineAt(line).text;
            this._lines.push(("  " + (line + 1)) + (text && "  " + text));
        }
        if (next)
        {
            this._lines.push("  ...");
        }
    }
}

//# sourceMappingURL=referencesDocument.js.map