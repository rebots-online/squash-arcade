# Squash Arcade — 3D Replay Film Timeline, Front-Wall Camera, Custom Mii Face Studio & Firebase Club Sync

This plan upgrades Squash Arcade with continuous metadata-only 3D rally telemetry recording, a multi-angle Film Timeline Editor with on-demand clip/screenshot rendering, a Front-Wall Reverse camera perspective, 3D + stylized Mii facial photo customization, and Firebase Club account synchronization supporting dual IRL and virtual squash rankings and coaching history.

## User Review & Critical Decisions

> [!IMPORTANT]
> Please review the confirmed architectural decisions below and click **Proceed** (or share any adjustments) to begin implementation and Firebase provisioning.

- **Confirmed Decision 1 — Metadata-Only Telemetry & Configurable AI Demo Retention**: All rallies record lightweight 3D state keyframes (player positions, articulated swing/racket kinematics, ball trajectory, and point/event markers) rather than heavy video buffers. Player-involved rallies are delta-compressed and synced to the user's account, while background AI demo matches are kept in a separate local store with a retention policy (`Hourly`, `Daily`, `Weekly`, or `Manual Purge`) configurable in the Live Tune Lab (`L`). Video rendering (`WebM`) and screenshot capture (`PNG`) happen strictly on demand inside the Film Timeline Editor from any chosen camera angle.
- **Confirmed Decision 2 — Hybrid 3D Face Mapping + Stylized Mii Trait Extraction**: Uploaded or webcam-snapped facial portraits are mapped onto the 3D Mii head mesh and 2D HUD badge while automatically extracting skin tone, hair color, eye color, and kit accents for stylized Mii customization.
- **Confirmed Decision 3 — Firebase Club Account with Dual IRL & Virtual Rankings + Coaching Logs**: Google Sign-In via Firebase Auth syncs member subscription status, custom Mii profiles, compressed match telemetry, coaching review notes anchored to replay timestamps, and dual leaderboards covering both **Virtual Squash Ratings** and **IRL Club/Tournament Rankings**.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Fixes Instant Replay & Adds a 3D Film Timeline Editor**: Replaces the static demo replay with a live 3D telemetry recorder that captures every serve, stroke, wall bounce, nick, and let appeal. Players and coaches can scrub through any point in the match on a visual timeline, switch between any camera angle (including the new **Front-Wall Reverse Cam** and interactive **Free-Orbit Director Cam**), adjust playback speed (`0.1x`–`2.0x` and frame-by-frame stepping), and export screenshots or rendered video clips on demand.
  2. **Front-Wall Reverse Camera View**: Adds a front-wall camera looking directly back at both players and the rear glass wall, automatically rendering the front wall transparent from behind so the camera view is completely unobstructed.
  3. **Custom Mii Face Studio**: Lets players snap a webcam selfie or upload a photo to wrap onto their 3D Mii head model and HUD avatar while sampling dominant facial/hair tones to style their Mii.
  4. **Firebase Club Sync, Coaching & Dual Rankings**: Connects player profiles to Firebase Auth and Firestore so custom Miis, compressed match replays, biomechanics/coaching logs, and both IRL and Virtual Squash rankings persist across sessions and devices.
- **Target Audience / Persona**: Squash players, coaches, and arcade sports fans who want to analyze court positioning ("T-zone dominance"), review stroke mechanics from any 3D angle, personalize their on-court avatar, and track both their physical club ladder and virtual rankings in one place.
- **Key Value**: Achieves full 3D multi-angle video review and cloud replay sharing at a fraction of video storage cost by recording deterministic 3D kinematic metadata and re-rendering scenes live on the GPU.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Camera Cycling & Front-Wall View (`C` Key / Camera Button)**:
     - Cycling cameras steps smoothly through: `Back Glass` → `Front Wall Reverse (Looking at Players)` → `High Gallery` → `Front Nick Close-Up` → `Overhead T` → `Side Gallery` → `Free-Orbit Director Cam`.
     - When `Front Wall Reverse` is active, the camera sits at the front wall looking toward `+Z` (`Back Glass`), dynamically hiding back-facing front-wall polygons so both players' stances, racket preparation, and facial expressions are clearly visible head-on.
  2. **Instant Replay & 3D Film Timeline Editor (`R` Key / Replay Button)**:
     - Pressing `R` or clicking **Replay** immediately loads the actual recorded telemetry of the most recent rally (never a canned demo shot) and reveals the **Film Timeline Dock** at the bottom of the viewport.
     - Users can drag the playhead across the timeline, jump between **Point Chips** (`Pt 1`, `Pt 2`, ...) and **Event Markers** (Serve, Drive, Boast, Nick, Let/Stroke), toggle **Playback Speed** (`0.1x`, `0.25x`, `0.5x`, `1x`, `2x`), drag camera orbit angles freely, and click **Snap Screenshot (PNG)** or **Render Clip (WebM)** to export the active segment from the current 3D perspective.
     - Inside the **Tune Lab (`L`)**, a dedicated **Telemetry & Archive Retention** control allows setting automatic cleanup of background AI demo matches (`Clear Every Hour`, `Clear Daily`, `Clear Weekly`, or `Clear Now`) while preserving human-involved matches.
  3. **Mii Face Studio & Club Hub Modal**:
     - Accessible from the top HUD bar and side menu (**Club & Mii Profile**), allowing users to sign in with Google, manage their Club Subscription tier, snap a webcam portrait or upload an image, preview their 3D Mii head with live face-texture mapping + extracted color traits, and save to Firebase.
     - Includes tabs for **Cloud Replays & Coaching Notes** (attach timestamped coaching feedback to any saved rally), **Virtual World Rankings**, and **IRL Match Logger & Rankings** (log real-world squash matches, court venue, game scores, and coaching takeaways).
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast broadcast sports telemetry paired with clean PSA glass show-court styling.
  - *Color Palette & Mood*: Deep sapphire-obsidian glass panels (`rgba(9, 16, 28, 0.88)`), crisp hairline borders (`rgba(148, 163, 184, 0.22)`), electric cyan active playhead and camera indicators (`#38bdf8`), tournament gold point/ranking highlights (`#facc15`), and crimson recording/clip indicators (`#ef4444`).
  - *Typography & Hierarchy*: Athletic condensed/geometric display headers paired with clean sans-serif body copy and `tabular-nums` monospace timecodes (`00:14.08 · Frame 845 · 0.25x Slo-Mo`) for zero-jitter timeline scrubbing and ranking tables.
  - *Interactive Feedback & Motion*: Smooth exponential camera damping (`THREE.MathUtils.damp`) when switching perspectives during live play or paused timeline scrubbing; instant visual flash frame on screenshot capture; real-time progress badge during on-demand WebM clip rendering.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Deterministic 3D Telemetry Stream Instead of Raw Video Buffers**
  - *Chosen Approach*: Sample compact kinematic frames at 30 Hz during rallies (storing quantized player/opponent `x, y, z, rotY`, swing type/timer, racket wrist/cut angles, ball `x, y, z, vx, vy, vz`, and discrete collision/callout events), delta-compressing completed rallies into lightweight JSON payloads (~8–20 KB per point).
  - *Why*: Allows re-rendering any historical point from **any 3D camera angle** (including angles not active when the point was played), keeps memory and Firestore document sizes well under limits, and only encodes video (`MediaRecorder` WebM) when the user explicitly exports a clip in the Film Timeline Editor.
  - *Alternatives Considered*: Continuous `MediaRecorder` video capture during gameplay was rejected because it locks the recording to a single camera angle and consumes hundreds of megabytes of RAM/storage.
- **Decision 2: Dual-Bucket Telemetry Storage with Tune Lab Retention Policy**
  - *Chosen Approach*: Tag every recorded point with `isHumanInvolved: boolean`. Human-involved points (including spontaneous "barge-in" shots) are retained and eligible for Firebase Club cloud sync; pure AI-vs-AI background demo points are stored in a volatile ring/IndexedDB bucket governed by the Tune Lab's retention policy (`1h`, `24h`, `7d`, or manual clear).
  - *Why*: Lets the continuous AI showcase remain fully scrubbable in the Timeline Editor without bloating storage over long idle sessions.
- **Decision 3: Hybrid 3D Face Texture + Stylized Mii Trait Extraction**
  - *Chosen Approach*: Use an offscreen canvas pipeline to crop and feather the user's uploaded or webcam-captured face onto the front facial UV region of the 3D Mii head mesh (and 2D HUD medallion), while automatically sampling forehead/cheek pixels for skin tone and upper/crown pixels for hair/kit palette.
  - *Why*: Delivers immediate personal recognition on the 3D court while preserving the expressive stylized Mii aesthetic and eye/mouth emote overlays.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SQUASH ARCADE 3D ENGINE & HUD                         │
├───────────────────────┬──────────────────────────┬───────────────────────────┤
│ 3D Telemetry Recorder │ Multi-Angle Camera Rig   │ Custom Mii Face Studio    │
│  • 30Hz Keyframe Ring │  • Back Glass Cam        │  • Webcam Snap / Upload   │
│  • Point & Shot Tags  │  • Front-Wall Reverse    │  • Soft-Feathered Face UV │
│  • Human vs AI Bucket │  • High / Side Gallery   │  • Auto Skin/Hair/Kit     │
│  • Tune Lab Retention │  • Front Nick / Overhead │    Color Trait Extractor  │
│    (1h / 24h / 7d)    │  • Free-Orbit Director   │  • 3D Head & 2D HUD Sync  │
└───────────┬───────────┴────────────┬─────────────┴─────────────┬─────────────┘
            │                        │                           │
            ▼                        ▼                           ▼
┌──────────────────────────────────────────────────┐ ┌─────────────────────────┐
│        3D FILM TIMELINE EDITOR & EXPORTER        │ │  FIREBASE CLUB PORTAL   │
│  • Scrub Playhead, Frame-Step & In/Out Loop      │ │  • Google Sign-In Auth  │
│  • Live 3D Re-Render from Any Camera / Orbit     │ │  • Club Subscription UI │
│  • Speed Control (0.1x, 0.25x, 0.5x, 1x, 2x)     │ │  • Mii & Replay Sync    │
│  • On-Demand Screenshot (PNG) & Clip (WebM)      │ │  • Coaching Timestamp   │
│  • Timestamped Coaching Note Pinning             │ │    Notes & Analytics    │
└───────────────────────────┬──────────────────────┘ │  • Dual Leaderboards:   │
                            │                        │    Virtual & IRL Squash │
                            └───────────────────────►└────────────┬────────────┘
                                                                  │
                                                                  ▼
                                                     ┌─────────────────────────┐
                                                     │   CLOUD FIRESTORE DB    │
                                                     │  • /users/{uid}         │
                                                     │  • /miiProfiles/{uid}   │
                                                     │  • /savedReplays/{id}   │
                                                     │  • /coachingNotes/{id}  │
                                                     │  • /rankings/{entryId}  │
                                                     │  • /irlMatches/{id}     │
                                                     └─────────────────────────┘
```

### Data Model & Firestore Collections

1. **`/users/{userId}` (Private User & Club Subscription Settings)**:
   - `uid`, `displayName`, `email`, `subscriptionTier` (`'club_pro'` | `'free_trial'`), `subscriptionStatus` (`'active'`), `aiDemoRetentionPolicy` (`'1h'` | `'24h'` | `'7d'`), `createdAt`, `updatedAt`.
2. **`/miiProfiles/{userId}` (Synced Mii Avatar & Facial Customization)**:
   - `ownerId`, `displayName`, `skinColor`, `hairColor`, `eyeColor`, `jerseyPrimary`, `jerseySecondary`, `facePhotoDataUrl` (compact cropped JPEG/WebP `< 64KB`), `use3DFaceTexture` (`boolean`), `handedness`, `updatedAt`.
3. **`/savedReplays/{replayId}` (Compressed Player Telemetry Rallies)**:
   - `ownerId`, `ownerName`, `title`, `matchType` (`'1p_vs_ai'` | `'1v1_multiplayer'` | `'barge_in_sample'`), `scoreSummary`, `durationSec`, `strokeCount`, `nickCount`, `tDominancePct`, `compressedFramesJson` (compact delta-encoded telemetry array), `events` (shot/collision/let markers), `isPublic`, `createdAt`.
4. **`/coachingNotes/{noteId}` (Timestamped Coaching & Biomechanics Feedback)**:
   - `ownerId`, `authorName`, `replayId`, `timestampSec`, `cameraPreset`, `category` (`'T-Positioning'` | `'Racket Prep'` | `'Shot Selection'` | `'Let Safety'`), `noteText`, `drillRecommendation`, `createdAt`.
5. **`/rankings/{userId}` (Dual Virtual & IRL World Rankings Leaderboard)**:
   - `ownerId`, `displayName`, `clubName`, `region`, `virtualRating` (Elo/PSA points), `virtualWins`, `virtualLosses`, `irlRating`, `irlWins`, `irlLosses`, `avatarSummary`, `updatedAt`.
6. **`/irlMatches/{matchId}` (Logged Real-World Squash Matches)**:
   - `ownerId`, `playerName`, `opponentName`, `venueName`, `matchDate`, `scoreString` (e.g., `11-8, 9-11, 11-7, 11-9`), `result` (`'win'` | `'loss'`), `coachTakeaway`, `createdAt`.

### Interactive Component & State Mapping

- **Continuous Telemetry Recorder**:
  - Hooks into the fixed physics step (`_stepPhysics`) to record a frame every 4 physics ticks (30 Hz) plus exact event frames on every racket strike, wall/floor/nick impact, and let appeal.
  - When the user presses `R` or clicks **Replay**, the engine pauses live physics, enters `TIMELINE_EDITOR` / `REPLAY` mode, loads the recorded rally buffer (defaulting to the just-completed or active rally, with a selector to pick any previous point in the match or saved cloud replay), and reconstructs exact 3D actor poses, racket kinematics, ball position, and ribbon trail at any scrubbed time `t`.
- **Front-Wall Camera & Free-Orbit Director Controls**:
  - Adds `FRONT_WALL_CAM` (`pos: (0, 1.95, -4.78)`, `lookAt: (ball.x * 0.25, 1.05, 1.85)`) to the camera cycle (`C` key and HUD camera button) and makes the front wall mesh transparent when the camera is positioned near `Z <= -4.4m`.
  - In `REPLAY` / `TIMELINE_EDITOR` mode, dragging on the 3D canvas orbits/pans the camera around any focal point (`Ball`, `Player 1`, `Player 2`, `Front Nick`, or `T-Zone`), and camera preset chips allow instant switching between all 7 views.
- **Tune Lab Retention & Storage Manager**:
  - Adds a **Replay Telemetry Retention** section to the Tune Lab (`L`) displaying current stored human points vs. AI demo points, a retention selector (`1 Hour`, `24 Hours`, `7 Days`), and a **Purge AI Demo History Now** action.
