import * as core from '@actions/core';
import * as gh from '@actions/github';
import {
  VALID_BUILD_STATUSES,
  getBuildLink,
  listBuildsForFingerprint,
  startNewBuild,
  type Build,
} from './build';
import { getProjectFingerprint } from './fingerprint';
import {
  createBuildComment,
  createOrUpdateBuildSummaryComment,
} from './pr-comments';
import type { Platform } from './types';

// Parameters
// path
// build-command
// profile
// is-internal

// Output variables
// ios-fingerprint
// ios-build-id
// ios-build-url
// ios-build-created-at
//
// android-fingerprint
// android-build-id
// android-build-url
// android-build-created-at

async function main() {
  const isPullRequestEvent = gh.context.eventName === 'pull_request';

  const { buildLink: iosBuildLink } = await executeAction('ios');
  const { buildLink: androidBuildLink } = await executeAction('android');

  if (isPullRequestEvent) {
    await createOrUpdateBuildSummaryComment({
      iosBuildLink,
      androidBuildLink,
    });
  }
}

async function executeAction(platform: Platform) {
  const path = core.getInput('path');
  const buildCommand = core.getInput('build-command', { required: true });
  const profile = core.getInput('profile');
  const isInternal = core.getBooleanInput('is-internal');

  const isPullRequestEvent = gh.context.eventName === 'pull_request';
  const buildMessage = isPullRequestEvent
    ? gh.context.payload.pull_request?.title
    : `Build on ${gh.context.ref}`;

  core.info(`Getting ${platform} fingerprints for Expo Project ${path}...`);
  const fingerprint = await getProjectFingerprint({
    projectPath: path,
    platform,
    profile,
  });
  core.info(`${platform} current fingerprint ${fingerprint.hash}.`);
  core.setOutput(`${platform}-fingerprint`, fingerprint.hash);

  core.info(
    `Getting builds for ${platform} fingerprint ${fingerprint.hash}...`,
  );
  const builds = await listBuildsForFingerprint(
    path,
    fingerprint.hash,
    isInternal,
  );

  let latestBuild: Build | undefined;

  if (builds.length === 0) {
    core.info(
      `No builds found for ${platform} fingerprint ${fingerprint.hash}.`,
    );
  } else {
    const compatibleBuilds = builds.filter((b) =>
      VALID_BUILD_STATUSES.includes(b.status),
    );

    if (compatibleBuilds.length === 0) {
      core.info(
        `No usable builds found for ${platform} fingerprint ${fingerprint.hash}.`,
      );
    } else {
      latestBuild = compatibleBuilds[0];
      core.info(
        `Found ${compatibleBuilds.length} builds for ${platform} fingerprint ${fingerprint.hash}.`,
      );
    }
  }

  let buildLink: string | undefined;

  if (!latestBuild) {
    const build = await startNewBuild({
      projectPath: path,
      buildCommand,
      platform,
      message: buildMessage,
    });

    buildLink = getBuildLink(build);

    if (isPullRequestEvent && gh.context.payload.pull_request?.number) {
      await createBuildComment({
        prId: gh.context.payload.pull_request.number,
        buildId: build.id,
        buildUrl: getBuildLink(build),
        startedAt: build.createdAt,
        platform,
      });
    }

    core.setOutput(`${platform}-build-id`, build.id);
    core.setOutput(`${platform}-build-url`, buildLink);
    core.setOutput(`${platform}-build-created-at`, build.createdAt);
  } else {
    buildLink = getBuildLink(latestBuild);

    core.setOutput(`${platform}-build-id`, latestBuild.id);
    core.setOutput(`${platform}-build-url`, buildLink);
    core.setOutput(`${platform}-build-created-at`, latestBuild.createdAt);
  }

  return { buildLink };
}

main();
