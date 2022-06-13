const vscode = require("vscode");
// @ts-ignore
var { types } = require("conventional-commit-types");
const { spawnSync } = require("child_process");

const commitTypeToVsOption = ([commitType, { title, description }]) => ({
  commitType,
  label: title,
  description: title,
  detail: description,
});

const getBuiltInGitApi = async () => {
  try {
    const extension = vscode.extensions.getExtension("vscode.git");

    if (extension !== undefined) {
      const gitExtension = extension.isActive
        ? extension.exports
        : await extension.activate();

      return gitExtension.getAPI(1);
    }
  } catch {}

  return undefined;
};

const formatCommit = (commitType, affected, commitMessage) =>
  `${commitType}(${affected}): ${commitMessage}`;

const commit = async () => {
  const api = await getBuiltInGitApi();
  const rootPath = vscode.workspace.workspaceFolders;
  console.log({ rootPath, a: api.repositories });
  // const repository = api.repositories.filter(r => isDescendant(r.rootUri.fsPath, rootPath))[0];

  const options = Object.entries(types).map(commitTypeToVsOption);
  options[0].picked = true;
  const { commitType } = await vscode.window.showQuickPick(options);

  const affected = await vscode.window.showInputBox({
    title: "Files or areas affected",
    value: "entire project",
    prompt: "e.g Main, Navbar",
  });

  const commitMessage = await vscode.window.showInputBox({
    title: "Commit description",
    prompt: "Write a short, imperative tense description of the change",
    validateInput(commitDescription) {
      return commitDescription.length === 0 && "subject is required";
    },
  });

  await vscode.commands.executeCommand("git.commit");

  vscode.window.showInformationMessage("Hello World from bsmch-commits!");
};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "danbrima-bsmch-commits.add-commit",
    commit
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
