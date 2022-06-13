const vscode = require("vscode");
const path = require("path");
// @ts-ignore
var { types } = require("conventional-commit-types");
const { spawnSync } = require("child_process");

const confirmButton = {
  iconPath: new vscode.ThemeIcon("arrow-right"),
  tooltip: "confirm",
};

function createSimpleQuickPick({
  placeholder,
  items = [],
  activeItems = [],
  value = "",
  buttons = [],
}) {
  return new Promise(function (resolve, reject) {
    const picker = vscode.window.createQuickPick();
    picker.placeholder = placeholder;
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    picker.ignoreFocusOut = true;
    picker.items = items;
    picker.activeItems = activeItems.length === 0 ? [items[0]] : activeItems;
    picker.value = value;
    picker.show();
    picker.buttons = [...buttons, confirmButton];
    picker.onDidAccept(function () {
      if (picker.activeItems.length) {
        resolve({
          value: picker.value,
          activeItems: picker.activeItems,
        });
        picker.dispose();
      }
    });
    picker.onDidTriggerButton(function (e) {
      if (e === confirmButton) {
        if (picker.activeItems.length) {
          resolve({
            value: picker.value,
            activeItems: picker.activeItems,
          });
        } else {
          resolve({
            value: picker.value,
            activeItems: [picker.items[0]],
          });
        }
        picker.dispose();
      }

      if (e === vscode.QuickInputButtons.Back) {
        reject({
          button: e,
          value: picker.value,
          activeItems: picker.activeItems,
        });
      }
    });
  });
}

function hasChanges(repo) {
  return (
    repo.state.workingTreeChanges.length ||
    repo.state.mergeChanges.length ||
    repo.state.indexChanges.length
  );
}

async function getRepository({ git, arg, workspaceFolders }) {
  const _arg = arg?._rootUri.fsPath;

  if (_arg) {
    const repo = git.repositories.find(function (r) {
      return r.rootUri.fsPath === _arg;
    });
    if (repo) return repo;
    else {
      console.error("getRepository", true);
    }
  }

  if (git.repositories.length === 0) {
    console.error("getRepository", true);
  }

  if (git.repositories.length === 1) return git.repositories[0];

  const items = git.repositories.map(function (repo, index) {
    const folder = workspaceFolders?.find(function (f) {
      return f.uri.fsPath === repo.rootUri.fsPath;
    });
    return {
      index,
      label: folder?.name || path.basename(repo.rootUri.fsPath),
      description:
        (repo.state.HEAD?.name || repo.state.HEAD?.commit?.slice(0, 8) || "") +
        (hasChanges(repo) ? "*" : ""),
    };
  });

  const [{ index }] = (
    await createSimpleQuickPick({
      placeholder: "Choose a repository:",
      items,
    })
  ).activeItems;

  return git.repositories[index];
}

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

const throwIfEmptyElseReturn = (string) => {
  if (string === undefined) {
    throw "None of the options above were selected";
  }

  return string;
};

const showQuickPick = async (options) => {
  const option = await vscode.window.showQuickPick(options);

  return throwIfEmptyElseReturn(option);
};

const showInputBox = async (options) => {
  const option = await vscode.window.showInputBox(options);

  return throwIfEmptyElseReturn(option);
};

const commit = async (args) => {
  try {
    const api = await getBuiltInGitApi();

    const repository = await getRepository({
      arg: args,
      git: api,
      workspaceFolders: vscode.workspace.workspaceFolders,
    });
    console.log({ repository });

    const options = Object.entries(types).map(commitTypeToVsOption);
    options[0].picked = true;

    const { commitType } = await showQuickPick(options);

    const affected = await showInputBox({
      title: "Files or areas affected",
      value: "entire project",
      prompt: "e.g Main, Navbar",
    });

    const commitMessage = await showInputBox({
      title: "Commit description",
      prompt: "Write a short, imperative tense description of the change",
      validateInput(commitDescription) {
        return commitDescription.length === 0 && "subject is required";
      },
    });

    repository.inputBox.value = formatCommit(
      commitType,
      affected,
      commitMessage
    );
    await vscode.commands.executeCommand("git.commitAll", repository);

    vscode.window.showInformationMessage("Hello World from bsmch-commits!");
  } catch (error) {
    console.log(error);
  }
};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("registered");
  let disposable = vscode.commands.registerCommand(
    "bsmch-commits.add-commit",
    commit
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
