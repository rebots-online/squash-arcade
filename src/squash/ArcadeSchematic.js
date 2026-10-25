// Locally authored instruction artwork. These diagrams never imply device connection.
let schematicId = 0;

function definitions(id) {
    return `<defs>
      <linearGradient id="${id}-shirt" x2="0.7" y2="1"><stop stop-color="#ff786a"/><stop offset=".5" stop-color="#f52c4e"/><stop offset="1" stop-color="#b90b40"/></linearGradient>
      <linearGradient id="${id}-floor" x2="1" y2="1"><stop stop-color="#164365"/><stop offset="1" stop-color="#092336"/></linearGradient>
      <linearGradient id="${id}-screen" x2="0" y2="1"><stop stop-color="#143550"/><stop offset="1" stop-color="#071526"/></linearGradient>
      <linearGradient id="${id}-phone" x2="1" y2="1"><stop stop-color="#a8f5ff"/><stop offset=".5" stop-color="#3ebdff"/><stop offset="1" stop-color="#7b4cf4"/></linearGradient>
      <radialGradient id="${id}-skin" cx=".3" cy=".2" r=".9"><stop stop-color="#ffe8ca"/><stop offset="1" stop-color="#e7ad87"/></radialGradient>
      <marker id="${id}-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 6 3 0 6" fill="none" stroke="#fff073" stroke-width="1.5"/></marker>
    </defs>`;
}

function racket() {
    return `<g transform="translate(52 -35) rotate(25)">
      <path d="M0 3V-18" stroke="#f4f9ff" stroke-width="5" stroke-linecap="round"/>
      <ellipse cy="-32" rx="13" ry="18" fill="#68e9ff22" stroke="#70e6ff" stroke-width="3"/>
      <path d="M-8-43V-21M0-48V-16M8-43V-21M-11-38H11M-12-31H12M-10-24H10" stroke="#c6f8ff" stroke-width=".8"/>
    </g>`;
}

function foldable(id) {
    return `<g class="schematic-phone-flight">
      <g class="schematic-phone-device">
        <rect x="-17" y="-29" width="34" height="58" rx="5" fill="#12263f" stroke="#d5faff" stroke-width="2"/>
        <rect x="-13" y="-24" width="26" height="46" rx="2" fill="url(#${id}-phone)"/>
        <circle cy="25" r="1.5" fill="#96edff"/>
        <path d="M-7 8Q0-8 8-13M-5 9L0 8M6-13L8-9" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <g class="schematic-phone-hinge">
          <rect x="-51" y="-29" width="34" height="58" rx="5" fill="#18375c" stroke="#d5faff" stroke-width="2"/>
          <rect x="-47" y="-24" width="26" height="46" rx="2" fill="url(#${id}-phone)"/>
          <path d="M-43-15H-26M-43-9H-30" stroke="#fff" opacity=".7" stroke-width="2"/>
        </g>
        <path d="M-17-25V25" stroke="#09172b" stroke-width="3"/>
      </g>
    </g>`;
}

function character(id, { phone = false, tracked = false, screen = false } = {}) {
    return `<g class="schematic-character${screen ? ' schematic-tv-avatar' : ''}">
      <ellipse cy="67" rx="43" ry="9" fill="#000" opacity=".28"/>
      <path d="M-13 30-15 59M14 30 19 59" fill="none" stroke="#c6d8e9" stroke-width="16" stroke-linecap="round"/>
      <path d="M-18 61H-4M15 62H31" stroke="#f4fcff" stroke-width="13" stroke-linecap="round"/>
      <path d="M-21-17Q0-28 22-15L27 29Q0 43-25 28Z" fill="url(#${id}-shirt)" stroke="#ff9b9d" stroke-width="1.5"/>
      <path d="M-18-11-31 12-24 25" fill="none" stroke="#ffd7b1" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-20-13-25-4" stroke="#f4505c" stroke-width="16" stroke-linecap="round"/>
      <text x="1" y="13" text-anchor="middle" fill="white" font-size="12" font-weight="900">YOU</text>
      <path d="M0-27V-18" stroke="#ecc19b" stroke-width="13"/>
      <ellipse cx="3" cy="-56" rx="31" ry="35" fill="url(#${id}-skin)"/>
      <path d="M-27-53Q-38-91 0-94Q37-95 34-61L24-75Q6-65-11-76L-17-54Z" fill="#34243a"/>
      <path d="M-21-79Q-9-95 11-88" fill="none" stroke="#6a4b58" stroke-width="6" stroke-linecap="round"/>
      <path d="M-25-73Q3-80 31-73" fill="none" stroke="#fff8e8" stroke-width="7"/>
      <ellipse cx="10" cy="-57" rx="3.2" ry="5" fill="#233048"/>
      <ellipse cx="25" cy="-57" rx="2.5" ry="4.5" fill="#233048"/>
      <path d="M19-55 23-47H19M9-39Q18-34 25-41" fill="none" stroke="#a85f52" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="-21" cy="-53" rx="7" ry="9" fill="#efb58e"/>
      <g transform="translate(20 -12)">
        <g class="schematic-swing-arm">
          <path d="M0 0 27-8 51-34" fill="none" stroke="#ffd7b1" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M0 0 10-3" stroke="#ff626b" stroke-width="18" stroke-linecap="round"/>
          ${phone ? foldable(id) : screen ? racket() : ''}
          ${tracked ? '<path d="M0 0 27-8 51-34" class="schematic-pose-bone"/><circle cx="27" cy="-8" r="4" class="schematic-pose-joint"/><circle cx="51" cy="-34" r="4" class="schematic-pose-joint"/>' : ''}
        </g>
      </g>
      ${tracked ? `<g class="schematic-pose-map">
        <path d="M-18-13 20-12M0-12V30M-13 32H15M-18-13-30 12-24 25M-13 32-15 58M15 32 19 58" class="schematic-pose-bone"/>
        <circle cy="-56" r="34" fill="none" stroke="#8fffd5" stroke-width="1.5" stroke-dasharray="4 5"/>
        ${[[-18,-13],[20,-12],[0,30],[-15,58],[19,58],[-24,25]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="4" class="schematic-pose-joint"/>`).join('')}
      </g>` : ''}
    </g>`;
}

function television(id, camera) {
    return `<g transform="translate(440 79) skewY(-11)">
      <path d="M84 128V168M56 170H127" fill="none" stroke="#7e9cb6" stroke-width="10" stroke-linecap="round"/>
      <rect x="-7" y="-8" width="207" height="143" rx="13" fill="#091521" stroke="#95cbdf" stroke-width="3"/>
      <rect width="186" height="121" rx="7" fill="url(#${id}-screen)"/>
      <path d="M30 20H155V67L177 113H8L30 67Z" fill="#d4efff22" stroke="#8cd2e4" stroke-width="1.5"/>
      <path d="M31 29H155M31 59H155M12 104H173M93 84V114" fill="none" stroke="#fe7895" stroke-width="1.5"/>
      <g transform="translate(95 86) scale(.41)">${character(id, { screen: true })}</g>
      <circle cx="190" cy="127" r="2" fill="#89ffd5"/>
      ${camera ? '<rect x="74" y="-22" width="40" height="13" rx="6" fill="#213c55" stroke="#a1e5ee" stroke-width="2"/><circle cx="94" cy="-16" r="4" fill="#8fffd5" class="schematic-camera-light"/>' : ''}
    </g>`;
}

function room(id, mode) {
    const camera = mode === 'camera';
    return `<g class="schematic-room${camera ? '' : ' schematic-phone-camera'}">
      <path d="M65 248 397 142 674 239 342 347Z" fill="url(#${id}-floor)" stroke="#4ca5bc" stroke-width="1.5"/>
      <path d="M65 248V164L397 58 674 155V239M397 58V142" fill="none" stroke="#47819b" stroke-width="1" opacity=".45"/>
      <path d="M115 265 446 159M181 288 512 182M247 312 579 206M145 223 422 321M229 196 506 295M313 169 590 268" stroke="#6cc1d7" opacity=".12"/>
      ${camera ? '<path class="schematic-camera-cone" d="M535 46 142 291 308 321Z" fill="#59ffd11c" stroke="#8fffd5" stroke-dasharray="7 6" stroke-width="1.5"/>' : ''}
      <ellipse cx="219" cy="283" rx="78" ry="25" fill="#2fdcff10" stroke="#6de7ff" stroke-dasharray="5 5" opacity=".6"/>
      ${television(id, camera)}
      <path class="schematic-sync-link" d="M312 170Q362 130 422 151" fill="none" stroke="#fff073" stroke-width="3" stroke-dasharray="6 7" marker-end="url(#${id}-arrow)"/>
      <g transform="translate(212 215)">${character(id, { phone: !camera, tracked: camera })}</g>
      <g class="schematic-room-label">
        <rect x="435" y="268" width="200" height="27" rx="13" fill="#031d30" stroke="#78dcf7"/>
        <text x="535" y="286" text-anchor="middle">YOUR SWING → RED’S SWING</text>
      </g>
    </g>`;
}

function placement(id) {
    return `<g class="schematic-placement">
      <path d="M177 157 410 92 581 154 344 238Z" fill="url(#${id}-floor)"/>
      <path d="M177 157V65L410 10V92Z" fill="#164764" stroke="#82cde0" stroke-width="1.5"/>
      <path d="M410 10 581 68V154L410 92Z" fill="#10334e" stroke="#82cde0" stroke-width="1.5"/>
      <path d="M177 82 410 27 581 85M177 142 410 78 581 140" fill="none" stroke="#ff798b" stroke-width="2"/>
      <path d="M177 157 344 238 581 154M260 195 495 123M378 159 462 199" fill="none" stroke="#ff8192" stroke-width="2"/>
      <path d="M340 230 185 156 398 95" fill="none" stroke="#fff073" stroke-width="5" class="schematic-rail-path"/>
      <path d="M415 175Q337-55 244 104Q243 132 340 225" fill="none" stroke="#74f1ff" stroke-width="4" stroke-dasharray="8 6" class="schematic-length-path"/>
      <ellipse cx="340" cy="226" rx="21" ry="7" fill="#fff07333" stroke="#fff073" stroke-width="2" class="schematic-target"/>
      <g transform="translate(397 165) scale(.53)">${character(id, { screen: true })}</g>
      <circle cx="185" cy="155" r="5" fill="#fff8a1" class="schematic-rail-ball"/>
      <path d="M159 173 119 196H67" fill="none" stroke="#fff073" stroke-width="1.5"/>
      <text x="65" y="218" fill="#fff073">HUG THE WALL</text>
      <path d="M280 74 320 47H365" fill="none" stroke="#74f1ff" stroke-width="1.5"/>
      <text x="321" y="42" fill="#74f1ff">ARC DEEP</text>
      <path d="M341 244V267H458" fill="none" stroke="#fff073" stroke-width="1.5"/>
      <text x="369" y="290" fill="#fff073">MAKE THEM TRAVEL</text>
      <text x="360" y="329" text-anchor="middle" class="schematic-caption">SMART PLACEMENT. MORE TIME. BETTER SQUASH.</text>
    </g>`;
}

const DESCRIPTIONS = {
    placement: ['Play the space', 'An isometric squash court shows a tight rail along the side wall and a high arcing shot landing deep in a back corner, moving the opponent away from the centre.'],
    phone: ['Turn your phone into a racket', 'A foldable phone closes, floats into a red-shirt character’s hand, and the view pulls back to show their full body facing a television. Their arm swing and the red avatar’s racket swing move together. Folding is optional; an ordinary phone works too.'],
    camera: ['Your movement is the controller', 'A camera on the television frames a red-shirt character’s whole body. Visible pose joints follow the arm swing, which is mirrored by the red avatar’s racket swing on screen.'],
};

/** Return a standalone, accessible SVG; animation styling belongs to arcade-briefing.css. */
export function createArcadeSchematic(mode) {
    const selected = Object.hasOwn(DESCRIPTIONS, mode) ? mode : 'placement';
    const id = `arcade-schematic-${++schematicId}`;
    const [title, description] = DESCRIPTIONS[selected];
    return `<svg class="arcade-schematic schematic-${selected}" viewBox="0 0 720 360" role="img" aria-labelledby="${id}-title" aria-describedby="${id}-desc" xmlns="http://www.w3.org/2000/svg">
      <title id="${id}-title">${title}</title><desc id="${id}-desc">${description}</desc>
      ${definitions(id)}
      ${selected === 'placement' ? placement(id) : room(id, selected)}
      ${selected === 'phone' ? '<g class="schematic-phone-label"><rect x="92" y="18" width="262" height="32" rx="16" fill="#122b45" stroke="#fff073"/><text x="223" y="39" text-anchor="middle">FOLD IF YOU CAN. GRIP. SWING.</text></g>' : ''}
      ${selected === 'camera' ? '<text x="71" y="36" class="schematic-camera-label">STEP BACK · WHOLE BODY IN VIEW</text>' : ''}
    </svg>`;
}
