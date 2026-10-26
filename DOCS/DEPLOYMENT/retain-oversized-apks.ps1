# Retain oversized historical APK bytes in ordinary Git without altering releases.
$ErrorActionPreference='Stop'
$root=Split-Path (Split-Path $PSScriptRoot)
$receipt=@()
foreach($version in @('1.16.83680','1.16.84066')){
  $file=Join-Path $root "dist/squash-arcade-v$version-android-arm64-unsigned.apk"
  if(-not (Test-Path -LiteralPath $file)){continue}
  $archive=Join-Path $root "dist/squash-arcade-v$version-historical-unstripped-apk.zip"
  if(-not(Test-Path -LiteralPath $archive)) { Compress-Archive -LiteralPath $file -DestinationPath $archive -CompressionLevel Optimal }
  $receipt+=@{original=[IO.Path]::GetRelativePath($root,$file);bytes=(Get-Item -LiteralPath $file).Length;sha256=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLower();archive=[IO.Path]::GetRelativePath($root,$archive);archiveSha256=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLower();status='Historical unstripped APK preserved unchanged locally and losslessly archived for Git file-size compatibility; superseded by the scripted stripped install APK.'}
}
$receipt|ConvertTo-Json -Depth 5|Set-Content -LiteralPath (Join-Path $root 'dist/historical-unstripped-apk-archives.json')