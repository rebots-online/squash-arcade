param(
  [Parameter(Mandatory=$true)][string]$RecoveryDocument,
  [Parameter(Mandatory=$true)][string]$KeystoreFile,
  [Parameter(Mandatory=$true)][string]$KStoreUrl,
  [Parameter(Mandatory=$true)][string]$ToolchainPath
)
$ErrorActionPreference='Stop'

# Configuration restoration only. This script never builds or signs artifacts.
# Read only the two explicitly authorized recovery inputs. After restoration,
# ordinary builds resolve their declared signing pointers exclusively from KStore.
$documentId='CREDENTIALS/prefetch-android-signing.md'
$namespace='admin-manual'
$recoveryPath=[IO.Path]::GetFullPath($RecoveryDocument)
$keystorePath=[IO.Path]::GetFullPath($KeystoreFile)
if(-not (Test-Path -LiteralPath $recoveryPath -PathType Leaf)){throw 'Authorized Android signing recovery document is missing.'}
if(-not (Test-Path -LiteralPath $keystorePath -PathType Leaf)){throw 'Existing organization Android keystore is missing.'}
$serviceUri=$null
if(-not [Uri]::TryCreate($KStoreUrl,[UriKind]::Absolute,[ref]$serviceUri) -or $serviceUri.Scheme -notin @('http','https') -or $serviceUri.UserInfo){throw 'KSTORE_URL must identify the configured service.'}
$serviceBase=$KStoreUrl.TrimEnd('/')
$readUri=$serviceBase+'/doc?id='+[Uri]::EscapeDataString($documentId)+'&source_type='+[Uri]::EscapeDataString($namespace)
$writeUri=$serviceBase+'/doc/write'

function Get-CanonicalSigningDocument {
  try {
    $record=Invoke-RestMethod -Uri $readUri -Method Get -TimeoutSec 30
    if($record.content -isnot [string] -or $record.exact -ne $true -or $record.source_type -cne $namespace -or $record.path -cne $documentId){throw 'Unexpected canonical document response.'}
    return $record
  } catch {
    if($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 404){return $null}
    # Do not forward HTTP error details: a service error could echo its body.
    throw 'Canonical Android signing read failed or returned an inexact document.'
  }
}

function Get-RecoveryField([string]$Text,[string]$Label) {
  $pattern='(?m)^\|\s*'+[regex]::Escape($Label)+'\s*\|\s*`([^`\r\n]+)`\s*\|'
  $found=[regex]::Matches($Text,$pattern)
  if($found.Count -ne 1){throw "Recovery field missing or ambiguous: $Label"}
  return $found[0].Groups[1].Value
}

function ConvertTo-QuotedBinding([string]$Name,[string]$Value) {
  # Single-quoted dotenv values preserve Windows/UNC backslashes literally.
  # Never JSON-escape a UNC path into dotenv, which would change its value.
  if([string]::IsNullOrWhiteSpace($Value) -or $Value.Contains("'") -or $Value.Contains("`r") -or $Value.Contains("`n")){
    throw "Binding cannot be represented losslessly as a single-line quoted dotenv value: $Name"
  }
  return $Name+"='"+$Value+"'"
}

function Assert-SameBindings([string]$Text,$Bindings) {
  foreach($name in $Bindings.Keys){
    $found=[regex]::Matches($Text,'(?m)^'+[regex]::Escape($name)+"='([^'\r\n]*)'\s*$")
    if($found.Count -ne 1 -or $found[0].Groups[1].Value -cne $Bindings[$name]){
      throw "Existing canonical document differs or lacks normalized binding; refusing overwrite: $name"
    }
  }
}

$originalStorePassword=[Environment]::GetEnvironmentVariable('SQUASH_ANDROID_RECOVERY_STORE_PASSWORD','Process')
$bindings=$null
$recoveryText=$null
$writeBody=$null
try {
  $recoveryText=[IO.File]::ReadAllText($recoveryPath)
  $storePassword=Get-RecoveryField $recoveryText 'Store password'
  $keyPassword=Get-RecoveryField $recoveryText 'Key password'
  $keyAlias=Get-RecoveryField $recoveryText 'Key alias'
  $expected=((Get-RecoveryField $recoveryText 'Cert SHA-256') -replace ':','').ToUpperInvariant()
  if($expected -notmatch '^[A-F0-9]{64}$'){throw 'Recovery document certificate fingerprint is invalid.'}

  # The explicitly supplied provisioning script selects the installed JDK.
  . $ToolchainPath
  if([string]::IsNullOrWhiteSpace($env:JAVA_HOME)){throw 'Configured toolchain did not provide JAVA_HOME.'}
  $keytool=Join-Path $env:JAVA_HOME 'bin/keytool.exe'
  if(-not (Test-Path -LiteralPath $keytool -PathType Leaf)){throw 'Configured JDK keytool is missing.'}
  $env:SQUASH_ANDROID_RECOVERY_STORE_PASSWORD=$storePassword
  $certificate=(& $keytool '-J-Duser.language=en' '-J-Duser.country=US' -list -v -keystore $keystorePath -alias $keyAlias '-storepass:env' SQUASH_ANDROID_RECOVERY_STORE_PASSWORD 2>&1) -join "`n"
  if($LASTEXITCODE -ne 0){throw 'Existing organization keystore certificate could not be verified.'}
  $certificates=[regex]::Matches($certificate,'SHA256:\s*([A-Fa-f0-9:]{95})')
  if($certificates.Count -ne 1 -or ($certificates[0].Groups[1].Value -replace ':','').ToUpperInvariant() -cne $expected){throw 'Existing keystore does not match the documented organization certificate.'}

  $bindings=[ordered]@{
    SQUASH_ANDROID_KEYSTORE_FILE=$keystorePath
    SQUASH_ANDROID_KEY_ALIAS=$keyAlias
    SQUASH_ANDROID_STORE_PASSWORD=$storePassword
    SQUASH_ANDROID_KEY_PASSWORD=$keyPassword
    SQUASH_ANDROID_CERT_SHA256=$expected
  }
  $assignments=@($bindings.Keys | ForEach-Object { ConvertTo-QuotedBinding $_ $bindings[$_] }) -join "`n"
  $content=$recoveryText+"`n`n## Canonical Squash Android build bindings`n`n"+
    "Recovered from the exact operator-authorized source: ``$recoveryPath``.`n"+
    "Existing organization keystore verified at: ``$keystorePath``.`n"+
    "Documented certificate verified with keytool before canonical restoration.`n"+
    "These private canonical values resolve into the build process only. Live project environment files retain explicit pointers.`n`n"+
    '```dotenv'+"`n"+$assignments+"`n"+'```'+"`n"
  $existing=Get-CanonicalSigningDocument
  if($null -ne $existing){
    Assert-SameBindings $existing.content $bindings
    $readback=Get-CanonicalSigningDocument
    if($null -eq $readback -or $readback.content -cne $existing.content -or $readback.revision -cne $existing.revision){throw 'Canonical signing record changed during idempotent readback.'}
    Write-Output 'Canonical Android signing bindings already match; certificate and exact readback verified. No write performed.'
    return
  }

  # KStore's verified API has no create-only/revision precondition. Recheck just
  # before the write and abort if a record appeared. This is not atomic against
  # another operator writing between the GET and POST; server revision history
  # remains intact. No other worker in this recovery writes this document.
  if($null -ne (Get-CanonicalSigningDocument)){throw 'Canonical Android signing record appeared; refusing overwrite.'}
  $writeBody=@{id=$documentId;source_type=$namespace;title='Organization Android production signing';mode='replace';content=$content}|ConvertTo-Json -Depth 5 -Compress
  try {$null=Invoke-RestMethod -Uri $writeUri -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($writeBody)) -TimeoutSec 30}
  catch {throw 'Canonical Android signing write did not complete; inspect exact canonical readback before retrying.'}
  $readback=Get-CanonicalSigningDocument
  if($null -eq $readback -or $readback.content -cne $content){throw 'Canonical Android signing exact content readback did not match.'}
  Assert-SameBindings $readback.content $bindings
  Write-Output 'Canonical Android signing record restored; organization certificate and all five bindings verified by exact readback.'
} finally {
  [Environment]::SetEnvironmentVariable('SQUASH_ANDROID_RECOVERY_STORE_PASSWORD',$originalStorePassword,'Process')
  $storePassword=$null; $keyPassword=$null; $recoveryText=$null; $content=$null; $assignments=$null; $writeBody=$null
  if($null -ne $bindings){$bindings.Clear()}
}
