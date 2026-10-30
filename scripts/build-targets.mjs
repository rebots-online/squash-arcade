export const targets={
  windows:['windows-x64.exe','windows-x64-setup.exe','windows-x64.msi','windows-x64.msix'],
  linux:['linux-x86_64.AppImage','linux-amd64.deb','linux-x86_64.rpm'],
  android:['android-arm64-production-signed.apk','android-arm64-production-signed.aab','android-arm64-debug-symbols.zip'],
  web:['web.zip'],
  pwa:['pwa.zip']
};
export const artifactNames=(version,platform)=>targets[platform].map(qualifier=>`squash-arcade-v${version}-${qualifier}`);
