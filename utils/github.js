const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';

/**
 * Un 404 sur ces appels ne veut (presque) jamais dire "fichier introuvable" au sens
 * normal : GitHub renvoie aussi 404 quand GITHUB_OWNER/GITHUB_REPO/GITHUB_BRANCH sont
 * mal configurés ou que le token n'a pas accès au dépôt (au lieu d'un 403, pour ne pas
 * révéler l'existence d'un dépôt privé). On enrichit le message pour éviter d'avoir à
 * deviner à partir du lien vers la doc GitHub.
 */
function explainGithubError(err, path) {
  if (err.status === 404) {
    err.message = `Not Found (${OWNER}/${REPO}@${BRANCH}, "${path}") — vérifie que ` +
      'GITHUB_OWNER, GITHUB_REPO et GITHUB_BRANCH sont corrects dans les variables ' +
      "d'environnement du bot, et que GITHUB_TOKEN a bien accès en écriture (\"Contents: " +
      `Read and write\") à ce dépôt. Détail original : ${err.message}`;
  }
  return err;
}

/**
 * Lit un fichier JSON du dépôt et le parse.
 * Retourne { data, sha } — le sha est nécessaire pour pouvoir réécrire le fichier ensuite.
 */
async function readJsonFile(path) {
  try {
    const res = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
      ref: BRANCH,
    });
    const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
    return { data: JSON.parse(content), sha: res.data.sha };
  } catch (err) {
    throw explainGithubError(err, path);
  }
}

/**
 * Réécrit un fichier JSON du dépôt avec un nouveau contenu, en créant un commit.
 * Vercel redéploie automatiquement dès que ce commit arrive sur la branche configurée.
 */
async function writeJsonFile(path, jsonData, sha, commitMessage) {
  const content = Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8').toString('base64');
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path,
      message: commitMessage,
      content,
      sha,
      branch: BRANCH,
    });
  } catch (err) {
    throw explainGithubError(err, path);
  }
}

/**
 * Si le fichier n'existe pas encore dans le dépôt (ex. pokeshop.json la première fois),
 * le crée avec un tableau vide.
 */
async function readJsonFileOrCreate(path) {
  try {
    return await readJsonFile(path);
  } catch (err) {
    if (err.status === 404) {
      return { data: [], sha: undefined };
    }
    throw err;
  }
}

module.exports = { readJsonFile, writeJsonFile, readJsonFileOrCreate };
