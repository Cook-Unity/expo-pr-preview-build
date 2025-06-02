import * as core from '@actions/core';
import * as exec from '@actions/exec';
import type { Platform } from './types';

type Fingerprint = {
  [k: string]: unknown;
  hash: string;
};

type GetProjectFingerprintArgs = {
  projectPath: string;
  platform: Platform;
  profile: string;
};

export const getProjectFingerprint = async ({
  projectPath,
  platform,
  profile,
}: GetProjectFingerprintArgs): Promise<Fingerprint> => {
  const args = [
    '--non-interactive',
    '--json',
    '--platform',
    platform,
    '--build-profile',
    profile,
  ];

  const { stdout, stderr, exitCode } = await exec.getExecOutput(
    'eas fingerprint:generate',
    args,
    {
      cwd: projectPath,
      silent: true,
    },
  );

  if (exitCode !== 0) {
    core.setFailed(`Failed to get fingerprint for platform ${platform}`);
    core.error(stderr);
    throw new Error(`Failed to get fingerprint for platform ${platform}`);
  }

  const fingerprint = JSON.parse(stdout) as Fingerprint;
  return fingerprint;
};
