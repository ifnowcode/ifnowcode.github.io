class Component extends Element {
  constructor(tag, internal = {}, metadata = {}) {
    // Merge props
    const mergedProps = {
      ...(internal.props || {}),
      ...(metadata.props || {})
    };

    // Merge css
    const mergedCSS = {
      ...(metadata.css || {}),     // external first
      ...(internal.css || {})      // internal overrides
    };

    // Merge everything else (attrs, events, dataset, etc.)
    const merged = {
      ...metadata,                 // metadata first
      ...internal,                 // internal overrides
      props: mergedProps,
      css: mergedCSS
    };

    super(tag, merged);
  }
}

class GitHubService {
  static async getRepos(username) {
    const res = await fetch(`https://api.github.com/users/${username}/repos`);
    if (!res.ok) return [];
    return await res.json();
  }
}

class RepoCard extends Element {
  constructor(repo) {
    super("div", {
      props: { className: "repo-card" },
      css: {
        padding: "1rem",
        margin: "1rem 0",
        borderRadius: "8px",
        backgroundColor: "rgba(17, 17, 17, 0.9)", //#111
        border: "3px solid #333",
        color: "#eee",
      }
    });

    this.addChild(new Element("a", {
        props: {
          href: repo.html_url,
          //textContent: "GitHub Repo",
          target: "_blank"
        },
        css: {
          color: "#58a6ff",
          textDecoration: "none",
          fontWeight: "bold"
        }
      }, new Element("h2", {
        props: { textContent: repo.name },
        css: { margin: "0 0 .5rem 0", fontSize: "1.4rem" }
      }))
    );

    if (repo.description) {
      this.addChild(
        new Element("p", {
          props: { textContent: repo.description },
          css: { margin: "0 0 .5rem 0", opacity: 0.8 }
        })
      );
    }
    
    if (tracedebug) console.log(repo.owner.login, this, repo);
    let label = "";
    if (repo.topics.includes("gitweb")) {
      if (repo.topics.includes("game")) {
        label = "Play Game";
      } else {
        label = "Goto Web";
      }
    } 
    
    this.addChild(
      new Element("a", {
        props: {
        href: `https://${repo.owner.login}.github.io/${repo.name}`,
          textContent: label,
          target: "_blank"
        },
        css: {
          color: "#58a6ff",
          textDecoration: "none",
          fontWeight: "bold"
        }
      })
    );
  }
}

class HomePage_dep extends Element {
  constructor(username, logoString) {
    super("div", {
      props: { className: "home-page" },
      css: {
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif"
      }
    });
    
    this.username = username;
    this.logString = logoString;

    this.header = new Element("header", {
      css: { marginBottom: "2rem", textAlign: "center" }
    });

    this.header.addChild(
      new Element("h1", {
        props: { textContent: `${logoString}'s GitHub Repositories` },
        css: { fontSize: "2.5rem", marginBottom: ".5rem" }
      })
    );

    this.header.addChild(
      new Element("a", {
        props: {
          href: `https://github.com/${username}`,
          textContent: `github.com/${username}`,
          target: "_blank"
        },
        css: { color: "#58a6ff", textDecoration: "none" }
      })
    );

    this.addChild(this.header);

    this.repoList = new Element("div", {props: {className: "repo-list"}});
    this.addChild(this.repoList);
    
    this.loadRepos_dep(this.username);
  }
  
  onMount() {
    //this.loadRepos(this.username);
  }

  async loadRepos_dep(username) {
    const repos = await GitHubService.getRepos(username);
    
    if (tracedebug) console.log(repos);

    repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .forEach(repo => this.repoList.addChild(new RepoCard(repo)));
  }
  
  async loadRepos(username) {
    const repos = await GitHubService.getRepos(username);

    // Sort by stars (optional)
    repos.sort((a, b) => b.stargazers_count - a.stargazers_count);

    // Append each RepoCard directly to the DOM
    for (const repo of repos) {
      const card = new RepoCard(repo);
      this.repoList.addChild(card);          // DOMicile tree
      //console.log("Card DOM", card.dom);
      //this.repoList.dom.appendChild(card.dom); // actual DOM
    }
  }
}

class RepoPage extends Element {
  constructor(username, titleName, repos) {
    super("div", {
      props: { className: "home-page" },
      css: {
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif"
      }
    });
    
    this.header = new Element("header", {
      css: { marginBottom: "2rem", textAlign: "center", background: "#111" }
    });
    
    /*
    this.header.addChild(
      new Element("h1", {
        props: { textContent: `${titleName}` },
        css: { fontSize: "2.5rem", marginBottom: ".5rem" }
      })
    );
    */

    this.header.addChild(
      new Element("h1", {
        props: {
          innerHTML: `
            ${titleName}
            <a href="https://github.com/${username}" target="_blank">GitHub</a>
            <span> </span>
            <a href="https://github.com/${username}?tab=repositories" target="_blank">Repositories</a>
          `
        },
        css: {
          fontSize: "2.5rem",
          marginBottom: ".5rem",
          textAlign: "center"
        }
      })
    );

    this.addChild(this.header);

    this.repoList = new Element("div", {props: {className: "repo-list"}});
    this.addChild(this.repoList);

    // Build cards synchronously
    repos.forEach(repo => {
      const card = new RepoCard(repo);
      this.repoList.addChild(card);
    });
  }
}

class Footer extends Box {
  constructor(metadata = {}) {
    super({
      css: {
        width: "100%",
        padding: "20px 0",
        marginTop: "40px",
        //borderTop: "1px solid #ddd",
        textAlign: "center",
        fontSize: "14px",
        color: "#666",
        //background: '#090909',
        ...(metadata.css || {})
      },
      props: {
        ...(metadata.props || {className: `footer-bar`})
      }
    });
    //let companyname = 'IfNowCode';
    this.addChild(
      new Element('button', {
        css: { background: '#111', color: 'lavender' },
        props: { textContent: "Scroll to Top", onclick: () => {
            //console.log("Scroll to top");
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
          }
        }
      })
    );
    this.addChild(new Element('br'));
    this.addChild(new Element('br'));
    this.addChild(
      new Element("div", {
        props: { innerHTML: `© ${new Date().getFullYear()} Peter Anderson. All rights reserved.<br>[Powered by DOMicile]`}
      })
    );
  }
}

class NeonTitle extends Element {
  constructor(
  {
    text = "NEON",
    color = "#ff00ff",
    glow = color,
    intensity = 1.2,
    pulse = false,
    flicker = false,
    size = "3rem",
    ...options
  } = {},
    metadata = {}
  ) {
    console.log("CSS", metadata.css);
    super("div", {
      ...metadata,
      props: {
        className: "neon-title",
        textContent: text,
        "data-text": text,   // ⭐ REQUIRED for ::after content
        ...(metadata.props || {})
      },
      css: {
        fontSize: size,
        fontWeight: "800",
        textAlign: "center",
        color,
        "--neon-color": color,
        "--neon-glow": glow,
        "--neon-intensity": intensity,
        "--neon-pulse-enabled": pulse ? "running" : "paused",
        "--neon-flicker-enabled": flicker ? "running" : "paused",
        ...(metadata.css || {})
      },
    });

    NeonTitle.injectCSS();
  }

  static injectCSS() {
    if (NeonTitle._cssInjected) return;
    NeonTitle._cssInjected = true;

    const style = document.createElement("style");
    style.textContent = `
      .neon-title {
        display: inline-block;
        position: relative;
        line-height: 1; /* ⭐ prevents baseline collapse */
        padding-bottom: 0.45em; /* ⭐ restores space that ::after used to create */

        color: var(--neon-color);
        text-shadow:
          0 0 calc(4px * var(--neon-intensity)) var(--neon-glow),
          0 0 calc(8px * var(--neon-intensity)) var(--neon-glow),
          0 0 calc(16px * var(--neon-intensity)) var(--neon-glow),
          0 0 calc(32px * var(--neon-intensity)) var(--neon-glow);

        /* ⭐ Glow contributes to layout height */
        filter: drop-shadow(0 0 calc(8px * var(--neon-intensity)) var(--neon-glow));

        animation: neonPulse 4s ease-in-out infinite;
        animation-play-state: var(--neon-pulse-enabled);
      }

      /* ⭐ Flicker applied to entire element */
      .neon-title.neon-flicker {
        animation:
          neonPulse 4s ease-in-out infinite,
          neonFlicker 3s infinite steps(1);
        animation-play-state: var(--neon-pulse-enabled), var(--neon-flicker-enabled);
      }

      /* Realistic flicker using opacity + shadow jitter */
      .neon-title {
        content: attr(data-text);
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        opacity: 1;
        animation: neonFlicker 3s infinite steps(1);
        animation-play-state: var(--neon-flicker-enabled);
      }

      @keyframes neonPulse {
        0%, 100% {
          text-shadow:
            0 0 calc(4px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(8px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(16px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(32px * var(--neon-intensity)) var(--neon-glow);
        }
        50% {
          text-shadow:
            0 0 calc(2px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(4px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(8px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(16px * var(--neon-intensity)) var(--neon-glow);
        }
      }

      @keyframes neonFlicker {
        0%, 5%, 7%, 10%, 12%, 20%, 22%, 30%, 100% {
          opacity: 1;
          filter: none;
        }
        6%, 11%, 21% {
          opacity: 0.4;
          filter: blur(1px);
        }
        31% {
          opacity: 0.2;
          filter: blur(2px);*/
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/* Example:
header.addChild(
  new NeonTitle({
    text: titleName,
    color: "#39ff14",
    glow: "#39ff14",
    intensity: 1.4,
    pulse: true,
    flicker: true,
    size: "3.2rem"
  })
);
*/

class NeonTitle2 extends Element {
  constructor(
  {
    text = "NEON",
    color = "#ff00ff",
    glow = color,
    intensity = 1.2,
    pulse = false,
    flicker = false,
    size = "3rem",
    ...options
  } = {},
    metadata = {}
  ) {
    const classes = ["neon-title"];
    if (pulse) classes.push("neon-pulse");
    if (flicker) classes.push("neon-flicker");

    super("div", {
      ...metadata,                        // keep other metadata keys (events, attrs, etc.)
      props: {
        ...(metadata.props || {}),        // ⭐ merge external props
        className: classes.join(" "),
        textContent: text,
      },
      css: {
        ...(metadata.css || {}),          // ⭐ merge external CSS (overrides internal)
        fontSize: size,
        fontWeight: "800",
        textAlign: "center",
        color,
        "--neon-color": color,
        "--neon-glow": glow,
        "--neon-intensity": intensity,
        "--neon-pulse-enabled": pulse ? "running" : "paused",
      },
    });
    
    console.log("CSS", metadata.css);

    NeonTitle2.injectCSS();
  }

  static injectCSS() {
    if (NeonTitle2._cssInjected) return;
    NeonTitle2._cssInjected = true;

    const style = document.createElement("style");
    style.textContent = `
      .neon-title {
        display: inline-block;
        position: relative;
        line-height: 1; /* ⭐ prevents baseline collapse */
        padding-bottom: 0.45em; /* ⭐ restores space that ::after used to create */

        color: var(--neon-color);
        text-shadow:
          0 0 calc(4px * var(--neon-intensity)) var(--neon-glow),
          0 0 calc(8px * var(--neon-intensity)) var(--neon-glow),
          0 0 calc(16px * var(--neon-intensity)) var(--neon-glow),
          0 0 calc(32px * var(--neon-intensity)) var(--neon-glow);

        /* ⭐ Glow contributes to layout height */
        filter: drop-shadow(0 0 calc(8px * var(--neon-intensity)) var(--neon-glow));

        animation: neonPulse 4s ease-in-out infinite;
        animation-play-state: var(--neon-pulse-enabled);
      }

      /* When flicker is enabled, layer flicker on top of pulse */
      .neon-title.neon-flicker {
        animation:
          neonPulse 4s ease-in-out infinite,
          neonFlicker 3s infinite steps(1);
        animation-play-state: var(--neon-pulse-enabled), running;
      }

      @keyframes neonPulse {
        0%, 100% {
          text-shadow:
            0 0 calc(4px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(8px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(16px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(32px * var(--neon-intensity)) var(--neon-glow);
        }
        50% {
          text-shadow:
            0 0 calc(2px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(4px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(8px * var(--neon-intensity)) var(--neon-glow),
            0 0 calc(16px * var(--neon-intensity)) var(--neon-glow);
        }
      }

      @keyframes neonFlicker {
        0%, 5%, 7%, 10%, 12%, 20%, 22%, 30%, 100% {
          opacity: 1;
          filter: none;
        }
        6%, 11%, 21% {
          opacity: 0.4;
          filter: blur(1px);
        }
        31% {
          opacity: 0.2;
          filter: blur(2px);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Test base class component
class NeonTitle3 extends Component {
  constructor(options = {}, metadata = {}) {
    const {
      text = "NEON",
      color = "#ff00ff",
      glow = color,
      intensity = 1.2,
      pulse = false,
      flicker = false,
      size = "3rem",
      ...rest
    } = options;

    const classes = ["neon-title"];
    if (pulse) classes.push("neon-pulse");
    if (flicker) classes.push("neon-flicker");

    super("div",
      {
        props: {
          className: classes.join(" "),
          textContent: text
        },
        css: {
          fontSize: size,
          fontWeight: "800",
          textAlign: "center",
          color,
          "--neon-color": color,
          "--neon-glow": glow,
          "--neon-intensity": intensity,
          "--neon-pulse-enabled": pulse ? "running" : "paused"
        },
        ...rest
      },
      metadata
    );

    NeonTitle2.injectCSS();
  }
}

class NeonTubeSign extends Element {
  constructor({
    text = "OPEN",
    color = "#39ff14",
    glow = color,
    size = 96,
    pulse = true,
    flicker = true,
    ...metadata
  } = {}) {

    const id = NeonTubeSign.nextId();
    const glowId = `neonGlow-${id}`;

    const glowClasses = ["neon-glow"];
    if (pulse) glowClasses.push("pulse");
    if (flicker) glowClasses.push("flicker");

    const svg = `
    <svg class="neon-tube-sign-svg"
         viewBox="0 0 100 100"
         width="100"
         height="100"
         xmlns="http://www.w3.org/2000/svg">

      <defs>
        <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b2"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b3"/>
          <feMerge>
            <feMergeNode in="b1"/>
            <feMergeNode in="b2"/>
            <feMergeNode in="b3"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Glow layer (animated) -->
      <text class="${glowClasses.join(" ")}"
            x="50%" y="50%"
            dominant-baseline="middle"
            text-anchor="middle"
            font-family="Segoe UI, system-ui, sans-serif"
            font-size="${size}"
            font-weight="800"
            fill="${glow}"
            filter="url(#${glowId})">
        ${text}
      </text>

      <!-- Tube stroke (static) -->
      <text class="neon-tube"
            x="50%" y="50%"
            dominant-baseline="middle"
            text-anchor="middle"
            font-family="Segoe UI, system-ui, sans-serif"
            font-size="${size}"
            font-weight="800"
            fill="none"
            stroke="${color}"
            stroke-width="6"
            stroke-linejoin="round"
            stroke-linecap="round">
        ${text}
      </text>

    </svg>`;

    NeonTubeSign.injectCSS();

    super("div", {
      props: {
        className: "neon-tube-sign",
        innerHTML: svg
      },
      css: {
        display: "inline-block"
      },
      ...metadata
    });
  }

  static _cssInjected = false;
  static _idCounter = 0;
  static nextId() {
    return ++NeonTubeSign._idCounter;
  }

  static injectCSS() {
    if (NeonTubeSign._cssInjected) return;
    NeonTubeSign._cssInjected = true;

    const style = document.createElement("style");
    style.textContent = `
      .neon-tube-sign-svg {
        overflow: visible;
      }

      .neon-glow {
        transform-origin: center;
      }

      /* ⭐ Pulse only */
      .neon-glow.pulse {
        animation: neonTubePulse 2.4s ease-in-out infinite;
      }

      /* ⭐ Flicker only */
      .neon-glow.flicker {
        animation: neonTubeFlicker 4s infinite steps(1);
      }

      /* ⭐ Pulse + Flicker combined */
      .neon-glow.pulse.flicker {
        animation:
          neonTubePulse 2.4s ease-in-out infinite,
          neonTubeFlicker 4s infinite steps(1);
      }

      @keyframes neonTubePulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.03);
        }
      }

      @keyframes neonTubeFlicker {
        0%, 5%, 7%, 10%, 12%, 20%, 22%, 30%, 100% {
          opacity: 1;
        }
        6%, 11%, 21% {
          opacity: 0.45;
        }
        31% {
          opacity: 0.2;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
