"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Temporary kill switch for all automated asset-watch behaviors.
const ENABLE_ASSETS_AUTOMATION = false;
let assetsWatchProcess = null;
let outputChannel;
let newAssetFileWatcher = null;
let rdmReadyPath = null;
let manualBuildStatusBarItem = null;
function activate(context) {
    outputChannel = vscode.window.createOutputChannel("RDM Assets and Overrides Watch");
    context.subscriptions.push(outputChannel);
    const restartCommand = vscode.commands.registerCommand('rdm-assets.restartRdmAssetsWatch', () => {
        restartAssetsWatch();
    });
    context.subscriptions.push(restartCommand);
    const manualBuildCommand = vscode.commands.registerCommand('rdm-assets.runAssetsBuild', () => {
        triggerAssetsBuild('manual build command');
    });
    context.subscriptions.push(manualBuildCommand);
    manualBuildStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    manualBuildStatusBarItem.text = '$(tools) RDM Assets Build';
    manualBuildStatusBarItem.tooltip = 'Run invenio-cli assets build once';
    manualBuildStatusBarItem.command = 'rdm-assets.runAssetsBuild';
    manualBuildStatusBarItem.show();
    context.subscriptions.push(manualBuildStatusBarItem);
    const toggleWatcherCommand = vscode.commands.registerCommand('rdm-assets.toggleNewAssetWatcher', async () => {
        const config = vscode.workspace.getConfiguration('rdm-assets');
        const enabled = config.get('enableNewAssetWatcher', true);
        const target = vscode.workspace.workspaceFolders?.length
            ? vscode.ConfigurationTarget.Workspace
            : vscode.ConfigurationTarget.Global;
        if (!ENABLE_ASSETS_AUTOMATION) {
            outputChannel.appendLine('Toggle ignored: asset automation globally disabled.');
            vscode.window.showWarningMessage('RDM asset automation is temporarily disabled; toggle has no effect.');
            return;
        }
        const newState = !enabled;
        await config.update('enableNewAssetWatcher', newState, target);
        syncNewAssetFileWatcher(context);
        outputChannel.appendLine(`New asset automation ${newState ? 'enabled' : 'disabled'} via manual toggle.`);
        vscode.window.showInformationMessage(`New asset file watcher ${newState ? 'enabled' : 'disabled'}.`);
    });
    context.subscriptions.push(toggleWatcherCommand);
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        if (!ENABLE_ASSETS_AUTOMATION) {
            return;
        }
        if (event.affectsConfiguration('rdm-assets.enableNewAssetWatcher')) {
            syncNewAssetFileWatcher(context);
        }
    }));
    // get the workspace folder that has the file path of /workspaces/rdm-instance/rdm-app
    const workspaceFolder = vscode.workspace.workspaceFolders?.find(folder => {
        outputChannel.appendLine(`Checking workspace folder: ${folder.uri.fsPath}`);
        return folder.uri.fsPath.endsWith("rdm-app");
    });
    outputChannel.appendLine(`found workspace folder: ${workspaceFolder}`);
    rdmReadyPath = workspaceFolder ? path.join(workspaceFolder.uri.fsPath, ".rdm-ready") : null;
    if (ENABLE_ASSETS_AUTOMATION) {
        // Only start if .rdm-ready exists
        if (isRdmReady()) {
            startAssetsWatch();
        }
        else {
            outputChannel.appendLine(`Not starting: invenio-cli assets watch, container still building (no invenio-cli installed yet).`);
        }
        // Watch for file creation to trigger manual build
        syncNewAssetFileWatcher(context);
        // Watch for signal file from setup-services.sh to restart the watch process
        if (workspaceFolder) {
            const signalWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolder, ".rdm-ready"), false, false, false);
            signalWatcher.onDidCreate(() => vscode.commands.executeCommand('rdm-assets.restartRdmAssetsWatch'));
            signalWatcher.onDidChange(() => vscode.commands.executeCommand('rdm-assets.restartRdmAssetsWatch'));
            context.subscriptions.push(signalWatcher);
            outputChannel.appendLine('watching for .rdm-ready...');
        }
        else {
            outputChannel.appendLine('no workspace folder, not watching for .rdm-ready');
        }
    }
    else {
        outputChannel.appendLine('RDM asset automation disabled; use the status bar button to run builds manually.');
    }
    // get the workspace folder that has the file path of /workspaces/rdm-instance/rdm-app
    const overridesWorkspaceFolder = vscode.workspace.workspaceFolders?.find(folder => folder.uri.fsPath.endsWith("overrides"));
    // add another watcher to our overrides folder that simply runs the link-overrides.py script only when files are created or deleted:
    if (overridesWorkspaceFolder) {
        const overridesWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(overridesWorkspaceFolder, "code/**"), false, true, false);
        // call in overrides/link-overrides.py on create or delete
        overridesWatcher.onDidCreate(() => {
            outputChannel.appendLine('File created in overrides/, running link-overrides.py...');
            const linkProcess = (0, child_process_1.spawn)("python3", ["link-overrides.py"], {
                cwd: "/workspaces/rdm-instance/overrides",
                shell: true
            });
            linkProcess.stdout.on("data", data => {
                outputChannel.append(data.toString());
            });
            linkProcess.stderr.on("data", data => {
                outputChannel.append(data.toString());
            });
            linkProcess.on("close", code => {
                outputChannel.appendLine(`*** link-overrides.py complete (exit code ${code}) ***`);
            });
        });
        overridesWatcher.onDidDelete(() => {
            outputChannel.appendLine('File deleted in overrides/, running link-overrides.py...');
            const linkProcess = (0, child_process_1.spawn)("python3", ["link-overrides.py"], {
                cwd: "/workspaces/rdm-instance/overrides",
                shell: true
            });
            linkProcess.stdout.on("data", data => {
                outputChannel.append(data.toString());
            });
            linkProcess.stderr.on("data", data => {
                outputChannel.append(data.toString());
            });
            linkProcess.on("close", code => {
                outputChannel.appendLine(`*** link-overrides.py complete (exit code ${code}) ***`);
            });
        });
        context.subscriptions.push(overridesWatcher);
    }
}
function startAssetsWatch() {
    if (assetsWatchProcess) {
        return;
    }
    if (!isRdmReady()) {
        outputChannel.appendLine('Cannot start: invenio-cli assets watch (missing .rdm-ready marker).');
        return;
    }
    // first check if '/root/.local/share/virtualenvs/rdm-venv/var/instance/assets' exists
    // if it doesn't the container was just rebuilt and we need to run invenio-cli assets build before the watch
    const packageJsonPath = "/root/.local/share/virtualenvs/rdm-venv/var/instance/assets";
    if (!fs.existsSync(packageJsonPath)) {
        outputChannel.appendLine(`package.json not found, running: invenio-cli assets build first...`);
        const buildProcess = (0, child_process_1.spawn)("invenio-cli", ["assets", "build"], {
            cwd: "/workspaces/rdm-instance/rdm-app",
            shell: true
        });
        buildProcess.stdout.on("data", data => {
            outputChannel.append(data.toString());
        });
        buildProcess.stderr.on("data", data => {
            outputChannel.append(data.toString());
        });
        buildProcess.on("close", code => {
            outputChannel.appendLine(`*** Initial asset build complete (exit code ${code}) ***`);
            startAssetsWatch(); // start the watch after build is complete
        });
    }
    else {
        outputChannel.appendLine(`Starting: invenio-cli assets watch...`);
        assetsWatchProcess = (0, child_process_1.spawn)("invenio-cli", ["assets", "watch"], {
            cwd: "/workspaces/rdm-instance/rdm-app",
            shell: true
        });
        if (assetsWatchProcess.stdout) {
            assetsWatchProcess.stdout.on("data", data => {
                outputChannel.append(data.toString());
            });
        }
        if (assetsWatchProcess.stderr) {
            assetsWatchProcess.stderr.on("data", data => {
                outputChannel.append(data.toString());
            });
        }
        assetsWatchProcess.on("close", code => {
            outputChannel.appendLine(`*** invenio-cli assets watch exited with code ${code} ***`);
            assetsWatchProcess = null;
        });
        assetsWatchProcess.on("error", error => {
            outputChannel.appendLine(`*** Error spawning process: ${error.message} ***`);
            assetsWatchProcess = null;
        });
    }
}
function stopAssetsWatch() {
    if (assetsWatchProcess) {
        outputChannel.appendLine(`Stopping: invenio-cli assets watch...`);
        assetsWatchProcess.kill();
        assetsWatchProcess = null;
    }
}
function restartAssetsWatch() {
    stopAssetsWatch();
    if (!ENABLE_ASSETS_AUTOMATION) {
        outputChannel.appendLine('Skipping assets watch restart: automation globally disabled.');
        return;
    }
    if (!isNewAssetWatcherEnabled()) {
        outputChannel.appendLine('Skipping assets watch restart: automation currently disabled.');
        return;
    }
    startAssetsWatch();
    if (assetsWatchProcess) {
        vscode.window.showInformationMessage("RDM Assets Watch restarted.");
    }
}
function syncNewAssetFileWatcher(context) {
    if (!ENABLE_ASSETS_AUTOMATION) {
        outputChannel.appendLine('Asset automation disabled; watcher sync skipped.');
        return;
    }
    if (isNewAssetWatcherEnabled()) {
        startAssetsWatch();
        registerNewAssetWatcher(context);
    }
    else {
        disposeNewAssetFileWatcher();
        stopAssetsWatch();
    }
}
function isNewAssetWatcherEnabled() {
    return vscode.workspace.getConfiguration('rdm-assets').get('enableNewAssetWatcher', true);
}
function isRdmReady() {
    return !!(rdmReadyPath && fs.existsSync(rdmReadyPath));
}
function triggerAssetsBuild(reason, filePath) {
    const detail = filePath ? `${reason}: ${filePath}` : reason;
    const startMessage = `Running invenio-cli assets build (${detail})...`;
    vscode.window.showInformationMessage(startMessage);
    outputChannel.appendLine(`*** ${startMessage} ***`);
    const buildProcess = (0, child_process_1.spawn)("invenio-cli", ["assets", "build"], {
        cwd: "/workspaces/rdm-instance/rdm-app",
        shell: true
    });
    buildProcess.stdout.on("data", data => outputChannel.append(data.toString()));
    buildProcess.stderr.on("data", data => outputChannel.append(data.toString()));
    buildProcess.on("close", code => {
        const completionMessage = `Asset build complete (${detail}) (exit code ${code}).`;
        outputChannel.appendLine(`*** ${completionMessage} ***`);
        vscode.window.showInformationMessage(completionMessage);
    });
}
function registerNewAssetWatcher(context) {
    if (newAssetFileWatcher) {
        return;
    }
    const watcher = vscode.workspace.createFileSystemWatcher("**/assets/**", false, true, false);
    watcher.onDidCreate(uri => {
        const filePath = uri.fsPath;
        if (filePath.includes("/root/.local/share/virtualenvs/rdm-venv/lib/python3.12/site-packages/")) {
            return;
        }
        // TODO before running assets build, run " rm -rf /root/.local/share/virtualenvs/rdm-venv/var/instance/assets/node_modules"
        outputChannel.appendLine(`*** New file detected: ${filePath} ***`);
        triggerAssetsBuild('new file detected', filePath);
    });
    context.subscriptions.push(watcher);
    newAssetFileWatcher = watcher;
}
function disposeNewAssetFileWatcher() {
    if (!newAssetFileWatcher) {
        return;
    }
    newAssetFileWatcher.dispose();
    newAssetFileWatcher = null;
    outputChannel.appendLine('New asset watcher disabled.');
}
function deactivate() {
    stopAssetsWatch();
    disposeNewAssetFileWatcher();
}
//# sourceMappingURL=extension.js.map