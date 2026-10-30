# Build configuration resolution

The existing root `build_all.sh` coordinator invokes `scripts/build-all.mjs`. Before account configuration validation or any build command, that coordinator resolves explicitly configured KStore pointers with `scripts/resolve-build-env.mjs`. This does not create an alternate build entry point or alter the version authority.

## Pointer and canonical API contract

Pointer syntax is `kstore://admin-manual/<document-path>#VARIABLE`. The document path may contain normal path separators or percent-encoded separators. Decode it once; the fragment identifies the exact assignment to read for the configured binding. Paths cannot be empty or contain traversal segments. No username, password, query string or alternate namespace is accepted.

Quote the entire pointer value in dotenv files: an unquoted `#` starts a dotenv comment and loses the variable fragment. Shell environment values likewise must preserve the complete pointer including its fragment.

The operator's live KStore OpenAPI discovery established `GET /doc?id=<document-path>&source_type=admin-manual`. Configure its service origin in `KSTORE_URL`; there is no built-in service address. Expected response fields are `path`, `doc_uuid`, `source_type`, `revision`, `head_revision`, `content`, `exact`, and `sha256`. The resolver requires `exact: true`, matching path and source_type, and reads only dotenv/env fenced assignments in the canonical Markdown `content`. A search response, excerpt or approximate match cannot resolve a binding.

Declared Firebase source: `PROJECTS/SquashArcade/CONFIG/firebase-web.md`, exact-readback verified by the supervising operator. Its four public Firebase assignments may be referenced by the corresponding four bindings below. This document contains no credential values.

## Precedence and scope

Parse the annotated `.env` and `.env.local` files with dotenv, preserving multiline/quoted assignment semantics. `.env.local` overrides `.env`; existing process environment overrides both, including explicitly empty values. Read files without changing their text or comments. Resolve only values beginning with the exact KStore pointer scheme. Existing ordinary process values remain unchanged. Ordinary nonsecret signing file, alias and certificate fingerprint assignments from the files are copied unchanged into process environment when the process has not supplied them. Missing/empty required allowlisted bindings and unresolved secret:/pointer: schemes fail before compile. No shell history, global credential enumeration, fallback source or generated credential is used.

The resolver's closed allowlist is:

- SQUASH_ANDROID_KEYSTORE_FILE
- SQUASH_ANDROID_KEY_ALIAS
- SQUASH_ANDROID_STORE_PASSWORD
- SQUASH_ANDROID_KEY_PASSWORD
- SQUASH_ANDROID_CERT_SHA256
- The six exported `accountPublicBindings` in `scripts/account-config.mjs`: four Firebase web bindings, VITE_SQUASH_API_BASE_URL and VITE_ACCOUNT_AUTH_URL.

KSTORE_URL itself follows the same file/process precedence and is not a credential pointer. Each requested document is fetched contemporaneously once per coordinator invocation; only the explicitly requested assignment is extracted. Duplicate assignments for that name are rejected. Missing, empty, malformed, unresolved or recursive pointer values fail with the binding name alone. Resolved values are placed only in the coordinator process environment and inherited by its child processes. Values are never logged or written to environment files, manifests or other artifacts. Only the six explicitly approved public bindings may subsequently be projected into the frontend by the account build configuration.

Signing passwords in dotenv files must be canonical pointers. Already-resolved signing passwords supplied directly by the authorized parent process remain supported. Literal passwords from dotenv files are rejected by binding name; they are never silently skipped or forwarded.

Preflight evaluates the entire allowlist, including valid configured pointers when other required names are missing. It reports all failed binding names in one error, without values. No resolved value or plain signing assignment is published to process environment unless the entire allowlist succeeds.

## Limits and verification

### Backend activation resolver

`resolveAccountEnvironment(root)` is the backend coordinator interface. It returns a plain in-memory object and never mutates process environment. Required runtime names come from the complete checked-in `functions/.env.example` schema, plus `FIREBASE_PROJECT_ID`, `FIREBASE_CLI_PATH` and internal `KSTORE_URL`. `PLAY_LISTING_URL` is the only optional runtime name: omit it from the result when absent/empty, and resolve/validate its pointer normally when configured. The deployment CLI binding identifies the installed `firebase-tools/lib/bin/firebase.js`; the coordinator runs it using its current Node process.

Backend precedence, lowest to highest: root `.env`, `functions/.env`, root `.env.local`, `functions/.env.local`, process environment. Existing files and comments are never rewritten. Only schema/deployment names are resolved or returned. Stripe secret and webhook credentials in files must be explicit canonical pointers; already-resolved parent-process values remain supported. All failures are collected as names only and no partial configuration is returned.

Both exported resolvers share the same exact canonical document engine. The existing build resolver retains its original allowlist, precedence and atomic process publication. Backend deployment must filter the returned configuration to runtime-schema names before uploading the intended runtime secret; CLI/project/service configuration is not part of that secret. `VITE_SQUASH_API_BASE_URL` is deliberately not required here: the deployment coordinator discovers the real service URL, reads only its explicitly declared original pointer and writes the verified value back through the canonical document service.

Public environment examples contain only portable application/deployment bindings with installation values blank. Internal service-address and pointer instructions remain in this configuration contract and live internal files, not public examples. The internal live files are unchanged by this source work.

This resolver implements the discovered Admin-Manual document endpoint, not a general secrets backend. It does not guess a KStore address or auth protocol, provision Firebase/Stripe/Play resources, resolve undeclared variables, or make an unavailable binding usable. Paths within a keystore-file assignment remain paths for the existing Android signing process; file existence and certificate identity remain that process's responsibility.

This coder change receives syntax checks and source review only, without network tests or mocked documents. Builds are authorized through the existing root `build_all.sh` coordinator. Its actual invocation verifies exact live resolution contemporaneously with the build using the declared bindings; no additional approval is required by this document.
