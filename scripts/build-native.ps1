param(
  [Parameter(Mandatory=$true)][ValidateSet('windows','android')][string]$Platform,
  [Parameter(Mandatory=$true)][string]$Snapshot,
  [Parameter(Mandatory=$true)][string]$Output
)
$ErrorActionPreference='Stop'
if($env:SQUASH_BUILD_ALL_CONTEXT -ne '1'){throw 'Only build_all.sh may invoke this helper.'}
$toolchain=if($env:SQUASH_WINDOWS_ENV){$env:SQUASH_WINDOWS_ENV}else{'E:/DevTools/pearl-build-env.ps1'}
. $toolchain
Set-Location -LiteralPath $Snapshot
$version=(Get-Content -LiteralPath version.txt -Raw).Trim()
$env:CARGO_TARGET_DIR="E:/DevTools/caches/squash-arcade/$Platform"
$env:CI='true'
$env:CARGO_BUILD_JOBS=if($env:SQUASH_BUILD_JOBS){$env:SQUASH_BUILD_JOBS}else{'2'}
New-Item -ItemType Directory -Path $Output -Force | Out-Null
if($Platform -eq 'windows'){
  # Windows VERSIONINFO fields are 16-bit; canonical identity stays in the UI,
  # artifact filename and release manifest. Record the OS version projection.
  $parts=$version.Split('.')
  $nativeVersion=$parts[0]+'.'+$parts[1]+'.'+([int]$parts[2] % 65536)
  @{version=$nativeVersion}|ConvertTo-Json|Set-Content -LiteralPath windows-version.json
  cargo tauri build --bundles nsis,msi --ci --config windows-version.json
  $nativeExit=$LASTEXITCODE
  $binary=Join-Path $env:CARGO_TARGET_DIR 'release/squash-arcade.exe'
  if(Test-Path -LiteralPath $binary){Copy-Item -LiteralPath $binary -Destination (Join-Path $Output "squash-arcade-v$version-windows-x64.exe")}
  $installer=Get-ChildItem -LiteralPath "$env:CARGO_TARGET_DIR/release/bundle/nsis" -Filter '*.exe' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if($installer){Copy-Item -LiteralPath $installer.FullName -Destination (Join-Path $Output "squash-arcade-v$version-windows-x64-setup.exe")}
  $msi=Get-ChildItem -LiteralPath "$env:CARGO_TARGET_DIR/release/bundle/msi" -Filter '*.msi' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if($msi){Copy-Item -LiteralPath $msi.FullName -Destination (Join-Path $Output "squash-arcade-v$version-windows-x64.msi")}
  if($nativeExit -ne 0){exit $nativeExit}
  $msixStage=Join-Path $Snapshot '.package-msix'
  node scripts/package-msix.mjs $binary $msixStage $nativeVersion
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  $makeAppx=Get-ChildItem -LiteralPath 'C:/Program Files (x86)/Windows Kits/10/bin' -Recurse -Filter makeappx.exe | Where-Object {$_.FullName -match '\\x64\\makeappx.exe$'} | Sort-Object FullName -Descending | Select-Object -First 1
  if(-not $makeAppx){throw 'Windows SDK MakeAppx is required for MSIX.'}
  & $makeAppx.FullName pack /d $msixStage /p (Join-Path $Output "squash-arcade-v$version-windows-x64.msix") /o
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  @{canonicalVersion=$version;platformVersion=$nativeVersion;signing='unsigned';runtime='Microsoft Edge WebView2; standalone EXE is not an installer'}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $Output "squash-arcade-v$version-windows-metadata.json")
}else{
  . (Join-Path $Snapshot 'scripts/android-signing.ps1')
  Invoke-SquashAndroidSigning -ValidateOnly | Out-Null
  $env:CARGO_PROFILE_RELEASE_DEBUG='2'
  $parts=$version.Split('.')
  $versionCode=[int64]$parts[0]*100000000+[int64]$parts[1]*100000+[int64]$parts[2]
  if($versionCode -gt 2147483647){throw 'Android versionCode exceeds the platform limit.'}
  $config=Get-Content src-tauri/tauri.conf.json -Raw|ConvertFrom-Json
  $config.bundle.android|Add-Member -NotePropertyName versionCode -NotePropertyValue $versionCode -Force
  $config|ConvertTo-Json -Depth 20|Set-Content src-tauri/tauri.conf.json
  cargo tauri android init --ci
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  $iconSource=Join-Path $Snapshot 'src-tauri/icons/android'
  $resourceRoot=Join-Path $Snapshot 'src-tauri/gen/android/app/src/main/res'
  foreach($icon in Get-ChildItem -LiteralPath $iconSource -Recurse -File){
    $relativeIcon=[IO.Path]::GetRelativePath($iconSource,$icon.FullName)
    $destination=Join-Path $resourceRoot $relativeIcon
    New-Item -ItemType Directory -Path (Split-Path $destination) -Force|Out-Null
    Copy-Item -LiteralPath $icon.FullName -Destination $destination -Force
    if((Get-FileHash -LiteralPath $icon.FullName).Hash -ne (Get-FileHash -LiteralPath $destination).Hash){throw "Android icon resource mismatch: $relativeIcon"}
  }
  $gradlePath='src-tauri/gen/android/app/build.gradle.kts'
  $propertiesPath='src-tauri/gen/android/gradle.properties'
  $properties=Get-Content -LiteralPath $propertiesPath -Raw
  $properties=[regex]::Replace($properties,'(?m)^org\.gradle\.jvmargs=.*$','org.gradle.jvmargs=-Xmx1536m -XX:ActiveProcessorCount=2 -XX:CICompilerCount=2 -XX:MaxMetaspaceSize=512m -XX:ReservedCodeCacheSize=256m -Dfile.encoding=UTF-8')
  $properties+="`norg.gradle.daemon=false`norg.gradle.parallel=false`norg.gradle.workers.max=2`nkotlin.compiler.execution.strategy=in-process`n"
  Set-Content -LiteralPath $propertiesPath -Value $properties
  Add-Content -LiteralPath $gradlePath -Value ("`n" + 'base { archivesName.set("squash-arcade-v' + $version + '") }')
  $manifestPath=Join-Path $Snapshot 'src-tauri/gen/android/app/src/main/AndroidManifest.xml'
  [xml]$manifest=Get-Content -LiteralPath $manifestPath -Raw
  $androidNamespace='http://schemas.android.com/apk/res/android'
  foreach($permission in @('android.permission.INTERNET','android.permission.CAMERA')){
    $exists=@($manifest.manifest.'uses-permission'|Where-Object {$_.GetAttribute('name',$androidNamespace) -eq $permission})
    if(-not $exists){$node=$manifest.CreateElement('uses-permission');$node.SetAttribute('name',$androidNamespace,$permission);[void]$manifest.manifest.AppendChild($node)}
  }
  $feature=$manifest.CreateElement('uses-feature');$feature.SetAttribute('name',$androidNamespace,'android.hardware.camera.any');$feature.SetAttribute('required',$androidNamespace,'false');[void]$manifest.manifest.AppendChild($feature)
  $manifest.Save($manifestPath)
  # Tauri's build.rs generates Kotlin into the current snapshot but does not
  # track that output-directory environment variable. Invalidate that package's
  # cached Android build so fresh Gradle projects receive their TauriActivity.
  cargo clean --manifest-path src-tauri/Cargo.toml --package tauri --release --target aarch64-linux-android
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  cargo tauri android build --target aarch64 --apk --aab --ci
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  $apk=Get-ChildItem -LiteralPath src-tauri/gen/android/app/build/outputs -Recurse -Filter '*.apk' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  $aab=Get-ChildItem -LiteralPath src-tauri/gen/android/app/build/outputs -Recurse -Filter '*.aab' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if(-not $apk -or -not $aab){throw 'Android APK and AAB are both required.'}
  # Keep the full native symbols in their separate ZIP, not in the install APK.
  # Tauri's generated Gradle packaging can retain the original Rust ELF.
  $stripTool=Get-ChildItem -LiteralPath "$env:ANDROID_HOME/ndk" -Recurse -Filter llvm-strip.exe | Sort-Object FullName -Descending | Select-Object -First 1
  $zipAlign=Get-ChildItem -LiteralPath "$env:ANDROID_HOME/build-tools" -Recurse -Filter zipalign.exe | Sort-Object FullName -Descending | Select-Object -First 1
  if(-not $stripTool -or -not $zipAlign){throw 'Android llvm-strip and zipalign are required.'}
  $packedLibrary=Join-Path $Snapshot '.android-stripped-libapp_lib.so'
  Copy-Item -LiteralPath (Join-Path $env:CARGO_TARGET_DIR 'aarch64-linux-android/release/libapp_lib.so') -Destination $packedLibrary
  & $stripTool.FullName --strip-debug $packedLibrary
  if($LASTEXITCODE -ne 0){throw 'Android native debug stripping failed.'}
  $unalignedApk=Join-Path $Snapshot '.android-unaligned.apk'
  Copy-Item -LiteralPath $apk.FullName -Destination $unalignedApk
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $apkPackage=[IO.Compression.ZipFile]::Open($unalignedApk,[IO.Compression.ZipArchiveMode]::Update)
  try{
    $oldLibrary=$apkPackage.GetEntry('lib/arm64-v8a/libapp_lib.so')
    if(-not $oldLibrary){throw 'Android arm64 native library is missing from APK.'}
    $oldLibrary.Delete()
    [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($apkPackage,$packedLibrary,'lib/arm64-v8a/libapp_lib.so',[IO.Compression.CompressionLevel]::NoCompression)
  }finally{$apkPackage.Dispose()}
  $alignedApk=Join-Path $Snapshot '.android-aligned.apk'
  & $zipAlign.FullName -P 16 -f 4 $unalignedApk $alignedApk
  if($LASTEXITCODE -ne 0){throw 'Android APK alignment failed.'}
  & $zipAlign.FullName -c -P 16 4 $alignedApk
  if($LASTEXITCODE -ne 0){throw 'Android APK alignment verification failed.'}
  $signedApk=Join-Path $Snapshot '.android-production-signed.apk'
  $signedBundle=Join-Path $Snapshot '.android-production-signed.aab'
  $signing=Invoke-SquashAndroidSigning -AlignedApk $alignedApk -UnsignedBundle $aab.FullName -SignedApk $signedApk -SignedBundle $signedBundle
  & $zipAlign.FullName -c -P 16 4 $signedApk
  if($LASTEXITCODE -ne 0){throw 'Signed APK alignment verification failed.'}
  if((Get-Item -LiteralPath $signedApk).Length -ge 100MB){throw 'APK exceeds the tracked release-file limit.'}
  $finalApk=Join-Path $Output "squash-arcade-v$version-android-arm64-production-signed.apk"
  Copy-Item -LiteralPath $signedApk -Destination $finalApk -Force
  Copy-Item -LiteralPath $signedBundle -Destination (Join-Path $Output "squash-arcade-v$version-android-arm64-production-signed.aab") -Force
  $aapt=Get-ChildItem -LiteralPath "$env:ANDROID_HOME/build-tools" -Recurse -Filter aapt2.exe | Sort-Object FullName -Descending | Select-Object -First 1
  if(-not $aapt){throw 'Android SDK aapt2 is required for packaged icon verification.'}
  $resources=(& $aapt.FullName dump resources $apk.FullName) -join "`n"
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive=[IO.Compression.ZipFile]::OpenRead($apk.FullName)
  try{
    foreach($resourceName in @('ic_launcher','ic_launcher_foreground','ic_launcher_round')){
      $block=[regex]::Match($resources,"(?ms)resource [^`n]+ mipmap/$resourceName`n(.*?)(?=\s+resource |\s+type |\z)").Groups[1].Value
      $entryName=[regex]::Match($block,'\(xxxhdpi\) \(file\) ([^\s]+)').Groups[1].Value
      if(-not $entryName){throw "Packaged icon resource is missing: $resourceName"}
      $entry=$archive.GetEntry($entryName)
      if(-not $entry){throw "Packaged icon file is missing: $entryName"}
      $actualIcon=Join-Path $Output "squash-arcade-v$version-android-$resourceName.png"
      [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$actualIcon,$true)
      node scripts/verify-icon-pixels.mjs (Join-Path $iconSource "mipmap-xxxhdpi/$resourceName.png") $actualIcon (Join-Path $Output "squash-arcade-v$version-android-$resourceName-verification.json")
      if($LASTEXITCODE -ne 0){throw "Packaged red Mii verification failed: $resourceName"}
    }
  }finally{$archive.Dispose()}
  $symbols=Join-Path $Snapshot '.android-native-symbols'
  New-Item -ItemType Directory -Path (Join-Path $symbols 'arm64-v8a') -Force|Out-Null
  Copy-Item -LiteralPath (Join-Path $env:CARGO_TARGET_DIR 'aarch64-linux-android/release/libapp_lib.so') -Destination (Join-Path $symbols 'arm64-v8a/libapp_lib.so')
  Compress-Archive -Path (Join-Path $symbols '*') -DestinationPath (Join-Path $Output "squash-arcade-v$version-android-arm64-debug-symbols.zip") -CompressionLevel Optimal -Force
  @{canonicalVersion=$version;versionCode=$versionCode;signing=$signing.signing;certificateSha256=$signing.certificateSha256;apkSignatureVerified=$signing.apkSignatureVerified;aabSignatureVerified=$signing.aabSignatureVerified;abi='arm64-v8a';icon='red Mii; generated Android resources copied and hash-verified'}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $Output "squash-arcade-v$version-android-metadata.json")
}
