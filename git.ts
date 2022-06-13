import * as path from "path";
import * as vscode from "vscode";
import * as output from "./output";
import * as VSCodeGit from "./vendors/git";

function getGitAPI(): VSCodeGit.API {
  const vscodeGit = vscode.extensions.getExtension("vscode.git");
  if (!vscodeGit?.exports.getAPI(1)) {
    output.error("getGitAPI", getSourcesLocalize("vscodeGitNotFound"), true);
  }
  return vscodeGit!.exports.getAPI(1);
}

type Arg = {
  _rootUri: vscode.Uri;
};

function hasChanges(repo: VSCodeGit.Repository) {
  return (
    repo.state.workingTreeChanges.length ||
    repo.state.mergeChanges.length ||
    repo.state.indexChanges.length
  );
}

async function getRepository({
  git,
  arg,
  workspaceFolders,
}: {
  git: VSCodeGit.API;
  arg?: Arg;
  workspaceFolders?: readonly vscode.WorkspaceFolder[];
}) {
  const _arg = arg?._rootUri.fsPath;
  output.info(`arg: ${_arg}`);

  const repositories = git.repositories
    .map((repo) => repo.rootUri.fsPath)
    .join(", ");
  output.info(`git.repositories: ${repositories}`);

  const _workspaceFolders = workspaceFolders
    ?.map((folder) => folder.uri.fsPath)
    .join(", ");
  output.info(`workspaceFolders: ${_workspaceFolders}`);

  if (_arg) {
    const repo = git.repositories.find(function (r) {
      return r.rootUri.fsPath === _arg;
    });
    if (repo) return repo;
    else {
      output.error(
        "getRepository",
        getSourcesLocalize("repositoryNotFoundInPath") + _arg,
        true
      );
    }
  }

  if (git.repositories.length === 0) {
    output.error(
      "getRepository",
      getSourcesLocalize("repositoriesEmpty"),
      true
    );
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
      placeholder: getSourcesLocalize("promptRepositoryPlaceholder"),
      items,
    })
  ).activeItems;

  return git.repositories[index];
}
