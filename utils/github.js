const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';

/**
 * Lit un fichier JSON du dépôt et le parse.
 * Retourne { data, sha } — le sha est nécessaire pour pouvoir réécrire le fichier ensuite.
 */
async function readJsonFile(path) {
  const res = await octokit.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
    ref: BRANCH,
  });
  const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
  return { data: JSON.parse(content), sha: res.data.sha };
}

/**
 * Réécrit un fichier JSON du dépôt avec un nouveau contenu, en créant un commit.
 * Vercel redéploie automatiquement dès que ce commit arrive sur la branche configurée.
 */
async function writeJsonFile(path, jsonData, sha, commitMessage) {
  const content = Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8').toString('base64');
  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path,
    message: commitMessage,
    content,
    sha,
    branch: BRANCH,
  });
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
