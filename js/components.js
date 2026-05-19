
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
        background: "#111",
        border: "3px solid #333",
        color: "#eee"
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
      css: { marginBottom: "2rem", textAlign: "center" }
    });

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
