async function BuildHomePage() {
    const repos = await GitHubService.getRepos("ifnowcode");
    repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    return [new HomePage("ifnowcode", "IfNowCode", repos)];
  }
  
function PageTemplate(contents = []) {
  // TODO: add navbar and footer
  return contents;
}

router = new RouterAsync({
  base: base,
  template: PageTemplate,
  routes: {
    "/":        { contents: BuildHomePage },
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
  console.log("Page:", page);
  page.forEach(widget => {
    widget.render(document.body);

    //console.log("HTML>", beautifyHTML(widget.toHTML()));
    //console.log("Serialize>", widget.toJSON());
  });
});

document.body.style.background = "#000";
document.body.style.color = "#fff"; 

const burning = new LavaGlow();
burning.render(document.body);
burning.dom.style.zIndex = -1;
burning.start();

