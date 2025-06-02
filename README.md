# Expo PR Preview Build Action (beta)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Warning**: This action is in beta and is subject to breaking changes until v1!

## Overview

This GitHub Action automates the process of creating preview builds for your React Native application using Expo. Its primary goal is to optimize build times by **only generating new builds when native shell code has changed**.

This action differs from [Expo Preview Build](https://github.com/expo/expo-github-action/tree/main/preview-build) in that it doesn't need a merge to main from an existing fingerprint to be checked against.


## How it Works

The action leverages **Expo Fingerprint** (`@expo/fingerprint`) to detect changes in your native project configuration and dependencies.

1.  On each Pull Request (or push, depending on your workflow configuration), the action calculates the current fingerprint of your native project.
2.  It fetches development builds on EAS that may have a matching fingerprint.
3.  If the fingerprints differs, it indicates a change in the native shell, and the action proceeds to build a new Expo preview.
4.  If the fingerprints are the same, the action skips the build step, saving valuable CI minutes, and let know the PR creator.

## Usage

Here's an example of how to use this action in your GitHub Actions workflow (e.g., `.github/workflows/preview_build.yml`):

```yaml
name: Expo PR Preview Build

on:
  pull_request:
    branches:
      - main # Or your default branch
      # You can also trigger on pushes to specific branches
      # push:
      #   branches:
      #     - develop

jobs:
  build_preview:
    permissions:
      contents: read
      pull-requests: write
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      # Add any steps needed to set up your environment, e.g., Node.js, Yarn/NPM install
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18' # Specify your Node.js version

      - name: Install dependencies
        run: yarn install # Or npm install

      - name: Setup EAS
        uses: expo/expo-github-action@main
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Generate Expo Preview Build (if native changed)
        uses: cook-unity/expo-pr-preview-build@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input           | Description                        | Required | Default                          |
|-----------------|------------------------------------|----------|----------------------------------|
| `path`          | Location of the `eas.json` file    | `false`  | `./`                             |
| `profile`       | Which profile to use for building  | `false`  | `development`                    |
| `is-internal`   | Whether the build should be internal or not | `false`  | `true`                           |
| `github-token`  | GitHub token                       | `true`   |                                  |
| `build-command` | EAS command to build the app       | `true`   | `eas build --profile development`|

## Outputs

| Output                   | Description                                                              |
|--------------------------|--------------------------------------------------------------------------|
| `ios-fingerprint`        | The fingerprint of the iOS project for the current configuration.        |
| `ios-build-id`           | The ID of the existing or newly created iOS build.                       |
| `ios-build-url`          | The URL of the existing or newly created iOS build.                      |
| `ios-build-created-at`   | The creation timestamp of the existing or newly created iOS build.       |
| `android-fingerprint`    | The fingerprint of the Android project for the current configuration.    |
| `android-build-id`       | The ID of the existing or newly created Android build.                   |
| `android-build-url`      | The URL of the existing or newly created Android build.                  |
| `android-build-created-at` | The creation timestamp of the existing or newly created Android build.   |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details (if you add one).