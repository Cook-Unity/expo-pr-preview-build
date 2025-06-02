import * as core from '@actions/core';
import * as exec from '@actions/exec';

export type Build = {
  id: string;
  status:
    | 'NEW'
    | 'IN_QUEUE'
    | 'IN_PROGRESS'
    | 'PENDING_CANCEL'
    | 'ERRORED'
    | 'CANCELED'
    | 'FINISHED';
  platform: 'IOS' | 'ANDROID' | string;
  artifacts: {
    buildUrl: string;
    applicationArchiveUrl: string;
  };
  initiatingActor: {
    id: string;
    displayName: string;
  };
  project: {
    id: string;
    name: string;
    slug: string;
    ownerAccount: {
      id: string;
      name: string;
    };
  };
  channel?: string;
  distribution: 'STORE' | 'INTERNAL' | string;
  buildProfile: string;
  sdkVersion: string;
  appVersion: string;
  appBuildVersion: string;
  runtimeVersion: string;
  gitCommitHash: string;
  gitCommitMessage: string;
  priority: 'HIGH' | string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  completedAt: string; // ISO date string
  expirationDate: string; // ISO date string
  isForIosSimulator: boolean;
  metrics: {
    buildWaitTime: number;
    buildQueueTime: number;
    buildDuration: number;
  };
};

export const VALID_BUILD_STATUSES: Build['status'][] = [
  'FINISHED',
  'IN_QUEUE',
  'IN_PROGRESS',
  'NEW',
];

export async function listBuildsForFingerprint(
  projectPath: string,
  fingerprintHash: string,
  isInternal: boolean,
) {
  const args = [
    '--non-interactive',
    '--json',
    '--fingerprint-hash',
    fingerprintHash,
  ];

  if (isInternal) {
    args.push('--distribution');
    args.push('internal');
  }

  const { stdout, stderr, exitCode } = await exec.getExecOutput(
    'eas build:list',
    args,
    {
      cwd: projectPath,
    },
  );

  if (exitCode !== 0) {
    const message = `Cannot list builds for fingerprint ${fingerprintHash}`;
    core.setFailed(message);
    core.error(stderr);
    throw new Error(message);
  }

  const builds = JSON.parse(stdout) as Build[];
  return builds;
}

type StartNewBuildArgs = {
  projectPath: string;
  buildCommand: string;
  platform: string;
  message: string;
};

export const startNewBuild = async ({
  projectPath,
  buildCommand,
  platform,
  message,
}: StartNewBuildArgs) => {
  core.info(`Starting new build for ${platform}...`);

  const { exitCode, stdout, stderr } = await exec.getExecOutput(
    buildCommand,
    [
      '--non-interactive',
      '--json',
      '--platform',
      platform,
      '--no-wait',
      '-m',
      message,
    ],
    {
      cwd: projectPath,
    },
  );

  if (exitCode !== 0) {
    const message = `Cannot start new build for ${platform}`;
    core.setFailed(message);
    core.error(stderr);
    throw new Error(message);
  }

  const [build] = JSON.parse(stdout) as Build[];
  return build;
};

export const getBuildLink = (build: Build) => {
  return `https://expo.dev/accounts/${build.project.ownerAccount.name}/projects/${build.project.slug}/builds/${build.id}`;
};
