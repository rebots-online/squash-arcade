import packageInfo from '../package.json';

const buildVersion = document.getElementById('build-version');
if (buildVersion) {
  buildVersion.textContent = 'v' + packageInfo.version;
}
