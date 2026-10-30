# Loaded only by the Android worker reached through build_all.sh. The launcher
# resolves declared canonical KStore bindings into process environment only.
# This helper never reads credential mirrors, env files, or shell histories.
function Invoke-SquashAndroidSigning {
  param(
    [string]$AlignedApk,
    [string]$UnsignedBundle,
    [string]$SignedApk,
    [string]$SignedBundle,
    [switch]$ValidateOnly
  )
  if($env:SQUASH_BUILD_ALL_CONTEXT -ne '1'){throw 'Only build_all.sh may invoke Android signing.'}
  foreach($name in @('SQUASH_ANDROID_KEYSTORE_FILE','SQUASH_ANDROID_KEY_ALIAS','SQUASH_ANDROID_STORE_PASSWORD','SQUASH_ANDROID_KEY_PASSWORD','SQUASH_ANDROID_CERT_SHA256')){
    $value=[Environment]::GetEnvironmentVariable($name,'Process')
    if([string]::IsNullOrWhiteSpace($value) -or $value -match '^(kstore|pointer|secret):'){throw "Unresolved Android signing binding: $name"}
  }
  $keystore=[IO.Path]::GetFullPath($env:SQUASH_ANDROID_KEYSTORE_FILE)
  if(-not (Test-Path -LiteralPath $keystore -PathType Leaf)){throw 'SQUASH_ANDROID_KEYSTORE_FILE does not resolve to the existing organization key.'}
  $expected=($env:SQUASH_ANDROID_CERT_SHA256 -replace ':','').ToUpperInvariant()
  if($expected -notmatch '^[A-F0-9]{64}$'){throw 'SQUASH_ANDROID_CERT_SHA256 must be the organization production certificate fingerprint.'}
  $apksigner=Get-ChildItem -LiteralPath "$env:ANDROID_HOME/build-tools" -Recurse -Filter apksigner.bat | Sort-Object FullName -Descending | Select-Object -First 1
  $keytool=Join-Path $env:JAVA_HOME 'bin/keytool.exe'
  $jarsigner=Join-Path $env:JAVA_HOME 'bin/jarsigner.exe'
  if(-not $apksigner -or -not (Test-Path -LiteralPath $keytool) -or -not (Test-Path -LiteralPath $jarsigner)){throw 'Android apksigner and JDK keytool/jarsigner are required for production signing.'}
  $priorStore=[Environment]::GetEnvironmentVariable('SQUASH_ANDROID_RESOLVED_STORE_PASSWORD','Process')
  $priorKey=[Environment]::GetEnvironmentVariable('SQUASH_ANDROID_RESOLVED_KEY_PASSWORD','Process')
  try {
    $env:SQUASH_ANDROID_RESOLVED_STORE_PASSWORD=$env:SQUASH_ANDROID_STORE_PASSWORD
    $env:SQUASH_ANDROID_RESOLVED_KEY_PASSWORD=$env:SQUASH_ANDROID_KEY_PASSWORD
    $keyAlias=$env:SQUASH_ANDROID_KEY_ALIAS
    $certificate=(& $keytool '-J-Duser.language=en' '-J-Duser.country=US' -list -v -keystore $keystore -alias $keyAlias '-storepass:env' SQUASH_ANDROID_RESOLVED_STORE_PASSWORD 2>&1) -join "`n"
    if($LASTEXITCODE -ne 0){throw 'Organization Android keystore certificate could not be read.'}
    $digest=[regex]::Match($certificate,'SHA256:\s*([A-Fa-f0-9:]{95})').Groups[1].Value -replace ':',''
    if($digest.ToUpperInvariant() -ne $expected){throw 'Android keystore certificate does not match the required organization production fingerprint.'}
    if($ValidateOnly){return @{certificateSha256=$expected}}
    foreach($path in @($AlignedApk,$UnsignedBundle,$SignedApk,$SignedBundle)){
      if([string]::IsNullOrWhiteSpace($path)){throw 'Android signing artifact paths are required.'}
    }

    # zipalign has already run. Never mutate the APK after apksigner.
    $signOutput=(& $apksigner.FullName sign --ks $keystore --ks-key-alias $keyAlias --ks-pass env:SQUASH_ANDROID_RESOLVED_STORE_PASSWORD --key-pass env:SQUASH_ANDROID_RESOLVED_KEY_PASSWORD --out $SignedApk $AlignedApk 2>&1) -join "`n"
    if($LASTEXITCODE -ne 0){throw 'Production APK signing failed.'}
    $apkVerification=(& $apksigner.FullName verify --verbose --print-certs $SignedApk 2>&1) -join "`n"
    if($LASTEXITCODE -ne 0){throw 'Production APK signature verification failed.'}
    $apkDigests=[regex]::Matches($apkVerification,'Signer #\d+ certificate SHA-256 digest:\s*([a-fA-F0-9]{64})')
    if($apkDigests.Count -ne 1 -or $apkDigests[0].Groups[1].Value.ToUpperInvariant() -ne $expected){throw 'APK signer does not match the single required organization production certificate.'}

    Copy-Item -LiteralPath $UnsignedBundle -Destination $SignedBundle -Force
    $bundleSignOutput=(& $jarsigner '-J-Duser.language=en' '-J-Duser.country=US' -keystore $keystore '-storepass:env' SQUASH_ANDROID_RESOLVED_STORE_PASSWORD '-keypass:env' SQUASH_ANDROID_RESOLVED_KEY_PASSWORD -sigalg SHA256withRSA -digestalg SHA-256 $SignedBundle $keyAlias 2>&1) -join "`n"
    if($LASTEXITCODE -ne 0){throw 'Production Android App Bundle signing failed.'}
    $bundleVerification=(& $jarsigner '-J-Duser.language=en' '-J-Duser.country=US' -verify $SignedBundle 2>&1) -join "`n"
    if($LASTEXITCODE -ne 0 -or $bundleVerification -notmatch '(?m)^jar verified\.') {throw 'Production Android App Bundle signature verification failed.'}
    # "jar verified" can coexist with unsigned payload entries. Reject that
    # condition independently; the organization key may legitimately be
    # self-signed, so absence of a public PKI trust chain is not a failure here.
    if($bundleVerification -match '(?i)unsigned entr|not integrity.checked|jar is unsigned|treated as unsigned'){
      throw 'Android App Bundle contains entries not covered by its signature.'
    }
    $bundleCertificate=(& $keytool '-J-Duser.language=en' '-J-Duser.country=US' -printcert -jarfile $SignedBundle 2>&1) -join "`n"
    if($LASTEXITCODE -ne 0){throw 'Signed App Bundle certificate could not be read.'}
    $bundleDigests=[regex]::Matches($bundleCertificate,'SHA256:\s*([A-Fa-f0-9:]{95})')
    if($bundleDigests.Count -ne 1 -or ($bundleDigests[0].Groups[1].Value -replace ':','').ToUpperInvariant() -ne $expected){throw 'App Bundle signer does not match the single required organization production certificate.'}
    return @{signing='organization production upload key';certificateSha256=$expected;apkSignatureVerified=$true;aabSignatureVerified=$true}
  } finally {
    [Environment]::SetEnvironmentVariable('SQUASH_ANDROID_RESOLVED_STORE_PASSWORD',$priorStore,'Process')
    [Environment]::SetEnvironmentVariable('SQUASH_ANDROID_RESOLVED_KEY_PASSWORD',$priorKey,'Process')
  }
}
