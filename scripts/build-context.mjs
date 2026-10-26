export function requireBuildAll() {
  if (process.env.SQUASH_BUILD_ALL_CONTEXT !== '1') {
    throw new Error('Only build_all.sh may start build or deployment helpers. Run the root shell entry.');
  }
}
