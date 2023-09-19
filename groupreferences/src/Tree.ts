import * as vscode from 'vscode';

export interface NodeInfo
{
    uri: vscode.Uri
    name: string | vscode.TreeItemLabel,
    isFile: boolean
    line?: number
    range?: vscode.Range
}

export interface LocationSource
{
    loc: vscode.Location
    lineText: string
    isWrite?: boolean
}

// 树节点
export class NodeItem extends vscode.TreeItem
{
    info: NodeInfo

    constructor(info: NodeInfo)
    {
        super(info.name, info.isFile ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)
        this.info = info;

        if (info.isFile == false)
        {
            const showDocOptions = {
                preserveFocus: false,
                preview: false,
                // viewColumn: 1,

                selection: info.range
            };
            this.command = {
                command: "vscode.open", //命令id
                title: "标题",
                arguments: [info.uri, showDocOptions] //命令接收的参数
            };
        } else
        {
            this.iconPath = vscode.ThemeIcon.File;
            this.resourceUri = info.uri;
            this.description = info.uri.fsPath;
            this.tooltip = info.uri.fsPath;
        }
    }
}

//树的内容组织管理
export class TreeProvider implements vscode.TreeDataProvider<NodeInfo>
{


    private refreshEvent: vscode.EventEmitter<NodeInfo | null | undefined> = new vscode.EventEmitter<NodeInfo | null | undefined>();

    onDidChangeTreeData?: vscode.Event<void | NodeInfo | null | undefined> | undefined = this.refreshEvent.event;

    public dataSources: LocationSource[] = []

    private _isWriteTree: boolean = false;

    constructor(isWrite: boolean)
    {
        this._isWriteTree = isWrite;
    }

    refresh()
    {
        this.refreshEvent?.fire(null);
    }

    getTreeItem(element: NodeInfo): vscode.TreeItem | Thenable<vscode.TreeItem>
    {
        let item = new NodeItem(element);
        return item;
    }
    getChildren(nodeInfo?: NodeInfo): vscode.ProviderResult<NodeInfo[]>
    {

        if (this.dataSources.length == 0)
        {
            return null;
        }

        if (nodeInfo)
        {
            if (nodeInfo.isFile == false)
            {
                return null
            }
            let children = [];
            for (let index = 0; index < this.dataSources.length; index++)
            {
                let locSource = this.dataSources[index];
                let loc = locSource.loc;
                let uri = loc.uri;

                if (this._isWriteTree)
                {
                    if (!locSource.isWrite)
                    {
                        continue;
                    }
                } else
                {
                    if (locSource.isWrite == true)
                    {
                        continue;
                    }
                }

                if (uri.toString() != nodeInfo.uri.toString())
                {
                    continue;
                }

                //去掉前面的空格和tab
                let originText = locSource.lineText;
                locSource.lineText = locSource.lineText.trimStart();
                let subLen = originText.length - locSource.lineText.length;

                let treeItemLabel: vscode.TreeItemLabel = {
                    label: locSource.lineText,
                    highlights: [[loc.range.start.character - subLen, loc.range.end.character - subLen]]
                }

                let info: NodeInfo = {
                    uri: uri,
                    name: treeItemLabel,
                    isFile: false,
                    line: loc.range.start.line,
                    range: loc.range
                }
                children.push(info);
            }

            children.sort((a, b) =>
            {
                a.line = a.line ? a.line : 0;
                b.line = b.line ? b.line : 0;
                return a.line - b.line;
            })
            return children;
        } else
        {
            let children = [];
            var fileSet = new Set<string>();
            for (let index = 0; index < this.dataSources.length; index++)
            {
                let locSource = this.dataSources[index];
                let loc = locSource.loc;
                let uri = loc.uri;

                if (this._isWriteTree)
                {
                    if (!locSource.isWrite)
                    {
                        continue;
                    }
                } else
                {
                    if (locSource.isWrite == true)
                    {
                        continue;
                    }
                }

                if (fileSet.has(uri.toString()))
                {
                    continue;
                }
                let info: NodeInfo = {
                    uri: uri,
                    name: this.getFileNameByPath(uri.path),
                    isFile: true
                }

                fileSet.add(uri.toString());

                children.push(info);
            }
            return children;
        }
    }

    public setDataSources(dataSources: LocationSource[])
    {
        this.dataSources = dataSources;
        this.refresh();
    }


    getFileNameByPath(path: string)
    {
        let index = path.lastIndexOf("\\");
        if (index == -1)
        {
            index = path.lastIndexOf("/");
        }
        if (index != -1)
        {
            return path.substring(index + 1);
        }
        return path;
    }

}
