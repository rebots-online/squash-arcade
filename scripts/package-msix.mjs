import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { requireBuildAll } from './build-context.mjs';
requireBuildAll();
const [binary,stage,nativeVersion]=process.argv.slice(2);
const config=JSON.parse(await readFile('src-tauri/tauri.conf.json','utf8'));
await mkdir(join(stage,'Assets'),{recursive:true});
await copyFile(binary,join(stage,'squash-arcade.exe'));
for(const size of [44,50,150])await sharp('public/icons/icon-512.png').resize(size,size).png().toFile(join(stage,`Assets/Logo${size}.png`));
const xml=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
await writeFile(join(stage,'AppxManifest.xml'),`<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10" xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10" xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities" IgnorableNamespaces="uap rescap">
 <Identity Name="mba.robin.squash" Publisher="CN=Robin L. M. Cheung" Version="${nativeVersion}.0" ProcessorArchitecture="x64"/>
 <Properties><DisplayName>${xml(config.productName)}</DisplayName><PublisherDisplayName>Robin L. M. Cheung</PublisherDisplayName><Logo>Assets/Logo50.png</Logo></Properties>
 <Dependencies><TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.26100.0"/></Dependencies>
 <Resources><Resource Language="en-US"/></Resources>
 <Applications><Application Id="Squash" Executable="squash-arcade.exe" EntryPoint="Windows.FullTrustApplication"><uap:VisualElements DisplayName="${xml(config.productName)}" Description="${xml(config.productName)}" BackgroundColor="#071321" Square150x150Logo="Assets/Logo150.png" Square44x44Logo="Assets/Logo44.png"/></Application></Applications>
 <Capabilities><rescap:Capability Name="runFullTrust"/><Capability Name="internetClient"/><DeviceCapability Name="webcam"/></Capabilities>
</Package>\n`);
