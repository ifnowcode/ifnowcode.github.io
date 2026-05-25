const base = "/js/sites/ifnowcode.github.io";

async function HomePage() {
  const repos = await GitHubService.getRepos("ifnowcode");
  repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
  return [new RepoPage("ifnowcode", "IfNowCode", repos)];
}

async function BuildHomePage() {
  const repos = await GitHubService.getRepos("ifnowcode");
  repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
  let titleName = "IfNowCode";
  let username = "ifnowcode";
    
  let page = new Element("div", {
    props: { className: "home-page" },
    css: {
      maxWidth: "800px",
      margin: "0 auto",
      padding: "2rem",
      fontFamily: "system-ui, sans-serif"
    }
  });
  
  page.addChild(new Element("header", {
      css: { marginBottom: "2rem", textAlign: "center", /*background: "#111"*/ }
    }, 
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
    )
  );

  let repoList = new Element("div", {props: {className: "repo-list"}});

  // Build cards synchronously
  repos.forEach(repo => {
    const card = new RepoCard(repo);
    repoList.addChild(card);
  });
  
  page.addChild(repoList);
  
  return [page];
}

async function BuildHomePage2() {
  let titleName = "IfNowCode";
  let username = titleName.toLowerCase();
  
  const repos = await GitHubService.getRepos(username);
  repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    
  let page = new Element("div", {
    props: { className: "home-page" },
    css: {
      maxWidth: "800px",
      margin: "0 auto",
      padding: "2rem",
      fontFamily: "system-ui, sans-serif"
    }
  });
  
  let header = page.addChild(new Element("header", {
      css: { marginBottom: "2rem", textAlign: "center", /*background: "#111"*/ }
    })
  );
  
  /*
  header.addChild(new Element("h1", {
      props: { className: "neon", textContent: `${titleName}` },
      css: {
        //fontSize: "2.5rem",
        margin: "0",
        textAlign: "center"
      }
    })
  );
  */
  
  /*
  header.addChild(
    new NeonTitle3({
      text: titleName,
      color: "#ff0000",
      glow: "#ff00ff",
      intensity: 1.4,
      pulse: true,
      flicker: true,
      size: "3.2rem"
    }, { css: { marginTop: "0.25em"}})
  );
  */

  header.addChild(
    new NeonTubeSign({
      text: titleName,
      color: "#ee0000",
      glow: "#ff00ff",
      size: 62,
      pulse: true,
      flicker: true
    })
  );

  header.addChild(new Element("h2", {
        props: {
          innerHTML: `
            <a href="https://github.com/${username}" target="_blank">GitHub</a>
            <span> </span>
            <a href="https://github.com/${username}?tab=repositories" target="_blank">Repositories</a>
          `
        },
        css: {
          fontSize: "2rem",
          marginTop: "0",
          marginBottom: ".5rem",
          textAlign: "center"
        }
      })
    );

  let repoList = new Element("div", {props: {className: "repo-list"}});

  // Build cards synchronously
  repos.forEach(repo => {
    const card = new RepoCard(repo);
    repoList.addChild(card);
  });
  
  page.addChild(repoList);
  
  return [page, new Footer];
}
  
function PageTemplate(contents = []) {
  // TODO: add navbar and footer
  return contents;
}

router = new RouterAsync({
  base: base,
  template: PageTemplate,
  routes: {
    "/":        { contents: BuildHomePage2 },
  },
  runAsync: true,
});
    
router.resolve(function({ contents, template }) {
  //document.body.innerHTML = "";

  const components = template             // if local template
    ? template(contents)                  // use local template
    : this.metadata?.template             // if global template
      ? this.metadata.template(contents)  // use global template
      : contents;                         // no template just return contents

  //const page = applyLayout(components);
  const page = components;
  //console.log("Page:", page);
  page.forEach(widget => {
    widget.render(document.getElementById("root"));

    //console.log("HTML>", beautifyHTML(widget.toHTML()));
    //console.log("Serialize>", widget.toJSON());
  });
});

document.body.style.background = "#000";
document.body.style.color = "#fff"; 
document.body.style.minHeight = "100%";
document.body.style.margin = "0";

const lavaglow = new LavaGlow();
lavaglow.render(document.getElementById("root"));
lavaglow.dom.style.zIndex = -1;
lavaglow.start();

const emojis = new FloatingEmoji({
  emojis: ["🔥"],
  count: 10,
  sizeMin: 24,
  sizeMax: 48
});
emojis.render(document.getElementById("root"));
emojis.dom.style.zIndex = -1;
emojis.start();

/*
const neon = new FloatingNeonWord({
  words: ["Lava", "Glow"],
  color: "#ff0000",
  intensity: 1.4,
  count: 4,
  sizeMin: 32,
  sizeMax: 72
});
neon.render(document.getElementById("root"));
neon.dom.style.zIndex = -1;
neon.start();
*/