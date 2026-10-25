declare const __APP_VERSION__: string

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.0'

export const GITHUB_REPO_URL = 'https://github.com/nik2208/matrix-warp'
export const GITHUB_RELEASES_URL = 'https://github.com/nik2208/matrix-warp/releases'
export const GITHUB_CHANGELOG_URL = 'https://github.com/nik2208/matrix-warp/blob/main/CHANGELOG.md'
