# Direct-dist build verification

The corrected npm run build returned exit 0 for 1.15.83658. All four workers
started within 26 ms and produced their packages directly into the durable
platform directories here. Every package SHA-256 was independently read back
and matched the generated build manifest. Five packages are present: Windows
NSIS installer, Linux AppImage, Android APK/AAB and PWA ZIP.

The earlier 13:06 attempt retained its available packages and failed inventory
under the same version directory. Its Android Gradle newline error was fixed
in the producer before this complete attempt. Root dist was not moved, emptied
or ignored. Working inputs and toolchain intermediates are disposable.

Source advanced automatically to 1.16.83680 after all workers succeeded. Built
packages retain 1.15.83658. The build lock was removed. Compilation does not
attest to production signing, installed native gameplay or device acceptance.
No automated tests were added or run under the operator override.

The available GitHub destination is used. No unavailable service is a build or
publication dependency. Packages are ordinary tracked Git files, not LFS.
