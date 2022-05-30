const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "danbrima-bsmch-commits" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "danbrima-bsmch-commits.helloWorld",
    async () => {
      let selectedText = "";
      const searchQuery = await vscode.window.showInputBox({
        placeHolder: "Files or areas affected",
        prompt: "e.g Main, Navbar",
        value: selectedText,
      });

      console.log(searchQuery);
      vscode.window.showInformationMessage("Hello World from bsmch-commits!");
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
