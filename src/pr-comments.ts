import * as core from '@actions/core';
import * as gh from '@actions/github';
import type { Platform } from './types';

const octokit = gh.getOctokit(core.getInput('github-token'));
const owner = gh.context.repo.owner;
const repo = gh.context.repo.repo;

export const generateCommentId = (prId: string) => `
<!-- @cookunity-expo-pr-preview-build: ${prId} -->
`;

async function findCommentWithId(id: string) {
  if (!gh.context.payload.pull_request?.number) return;
  const prNumber = gh.context.payload.pull_request.number;

  const iterator = octokit.paginate.iterator(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: prNumber,
  });

  for await (const { data: batch } of iterator) {
    for (const item of batch) {
      if ((item.body || '').includes(id)) {
        return item;
      }
    }
  }
}

type CreateOrUpdateBuildCommentArgs = {
  androidBuildLink: string;
  iosBuildLink: string;
};

export async function createOrUpdateBuildSummaryComment({
  androidBuildLink,
  iosBuildLink,
}: CreateOrUpdateBuildCommentArgs) {
  if (!gh.context.payload.pull_request?.number) return;
  const prNumber = gh.context.payload.pull_request?.number;

  core.info(`Creating or updating build summary comment for PR ${prNumber}`);

  const commentId = generateCommentId(prNumber.toString());
  const comment = await findCommentWithId(commentId);

  if (!comment) {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `
${generateCommentId(prNumber.toString())}
# Expo EAS Preview Summary

| Name | Build |
| :-- | :-- |
| 🤖 Android build | [View build page](${androidBuildLink}) |
| 🍎 iOS build | [View build page](${iosBuildLink}) |
    `,
    });
  } else {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: comment.id,
      body: `
${generateCommentId(prNumber.toString())}
# Expo EAS Preview Summary

| Name | Build |
| :-- | :-- |
| 🤖 Android build | [View build page](${androidBuildLink}) |
| 🍎 iOS build | [View build page](${iosBuildLink}) |
    `,
    });
  }
}

type CreateBuildCommentArgs = {
  prId: number;
  buildId: string;
  buildUrl: string;
  startedAt: string;
  platform: Platform;
};

export async function createBuildComment({
  prId,
  buildId,
  buildUrl,
  startedAt,
  platform,
}: CreateBuildCommentArgs) {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: Number(prId),
    body: `
# Build notification

The fingerprint of this PR has changed, it triggered a new build for **${platform}**.

* Started at: **${startedAt}**
* Platform: **${platform}**
* Build ID: **${buildId}**
* Link: [Build Link](${buildUrl})
    `,
  });
}
