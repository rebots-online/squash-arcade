# Production build preflight — 2026-10-30

Entry executed: `C:\Program Files\Git\bin\bash.exe ./build_all.sh`, at source commit `fb8768cccde64b62f63d99da4bfa02a385ac8739`. Exit code: 1 before compilation/version stamping.

Live KStore exact-document resolution succeeded for the four public Firebase bindings from `PROJECTS/SquashArcade/CONFIG/firebase-web.md` in namespace `admin-manual`. The document was written from Firebase's actual registered Virtual Squash SDK configuration and exact-readback verified. Internal annotated configuration contains quoted pointers; resolved values were not written to environment files.

The coordinator reported these unresolved required bindings, with values suppressed:

- SQUASH_ANDROID_KEYSTORE_FILE
- SQUASH_ANDROID_KEY_ALIAS
- SQUASH_ANDROID_STORE_PASSWORD
- SQUASH_ANDROID_KEY_PASSWORD
- SQUASH_ANDROID_CERT_SHA256
- VITE_SQUASH_API_BASE_URL
- VITE_ACCOUNT_AUTH_URL

Live canonical CC11 confirms organization production-key reuse. Its referenced `CREDENTIALS/prefetch-android-signing.md` returns HTTP404 from `/doc` in the `admin-manual` namespace. No replacement key was generated, credential mirror used as authority, or production signature claimed.

The source signing chain aligns then signs APK, signs AAB, verifies exact configured certificate identity and rejects unsigned AAB entries. Syntax and supervising semantic reviews passed; actual signer execution remains unobserved. Windows standalone EXE, NSIS EXE, MSI and MSIX; Linux AppImage, DEB and RPM; Android signed APK/AAB/symbols; web/PWA remain the coordinator's required artifact matrix.

This invocation created no release artifacts and demonstrated no running purchase flow. Production provider activation and continuous real application evidence remain outstanding. Build authorization is present; unresolved configuration, not an operator build stop, prevents compilation.