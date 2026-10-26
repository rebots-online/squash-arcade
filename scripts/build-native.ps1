param(
  [Parameter(Mandatory=$true)][ValidateSet('windows','android')][string]$Platform,
  [Parameter(Mandatory=$true)][string]$Snapshot,
  [Parameter(Mandatory=$true)][string]$Output
)
$ErrorActionPreference='Stop'
$toolchain=if($env:SQUASH_WINDOWS_ENV){$env:SQUASH_WINDOWS_ENV}else{'E:/DevTools/pearl-build-env.ps1'}
. $toolchain
Set-Location -LiteralPath $Snapshot
$version=(Get-Content -LiteralPath version.txt -Raw).Trim()
$env:CARGO_TARGET_DIR="E:/DevTools/caches/squash-arcade/$Platform"
$env:CI='true'
New-Item -ItemType Directory -Path $Output -Force | Out-Null
if($Platform -eq 'windows'){
  # Windows VERSIONINFO fields are 16-bit; canonical identity stays in the UI,
  # artifact filename and release manifest. Record the OS version projection.
  $parts=$version.Split('.')
  $nativeVersion=$parts[0]+'.'+$parts[1]+'.'+([int]$parts[2] % 65536)
  @{version=$nativeVersion}|ConvertTo-Json|Set-Content -LiteralPath windows-version.json
  cargo tauri build --bundles nsis --ci --config windows-version.json
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  $installer=Get-ChildItem -LiteralPath "$env:CARGO_TARGET_DIR/release/bundle/nsis" -Filter '*.exe' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if(-not $installer){throw 'Windows installer was not produced.'}
  Copy-Item -LiteralPath $installer.FullName -Destination (Join-Path $Output "SquashArcade-$version-windows-x64-setup.exe")
  @{canonicalVersion=$version;platformVersion=$nativeVersion;signing='unsigned'}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $Output 'platform.json')
}else{
  $parts=$version.Split('.')
  $versionCode=[int64]$parts[0]*100000000+[int64]$parts[1]*100000+[int64]$parts[2]
  if($versionCode -gt 2147483647){throw 'Android versionCode exceeds the platform limit.'}
  $config=Get-Content src-tauri/tauri.conf.json -Raw|ConvertFrom-Json
  $config.bundle.android|Add-Member -NotePropertyName versionCode -NotePropertyValue $versionCode -Force
  $config|ConvertTo-Json -Depth 20|Set-Content src-tauri/tauri.conf.json
  cargo tauri android init --ci
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
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
  Copy-Item -LiteralPath $apk.FullName -Destination (Join-Path $Output "SquashArcade-$version-android-arm64-unsigned.apk")
  Copy-Item -LiteralPath $aab.FullName -Destination (Join-Path $Output "SquashArcade-$version-android-arm64-unsigned.aab")
  @{canonicalVersion=$version;versionCode=$versionCode;signing='unsigned; production signing is a separate release step';abi='arm64-v8a'}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $Output 'platform.json')
}
