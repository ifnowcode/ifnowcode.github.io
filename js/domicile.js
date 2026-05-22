const startTime = performance.now();
const tracedebug = false;
const tracewarn = true;
const traceerror = true;

window.addEventListener("load", () => {
  const loadTime = performance.now() - startTime;
  if (loadTime < 1000) {
    if (tracedebug) console.log("[perf] Page load time:", loadTime, "ms");
  } else if (loadTime < 3000) {
    if (tracewarn) console.warn("[perf] Page load time:", loadTime, "ms");
  } else {
    if (traceerror) console.error("[perf] Page load time:", loadTime, "ms");
  }
});
console.log("Initializing DOMicile ver 1.0.0 RC ...");
/////////////////////////////////////////////////////////////////////
//
// Local Helpers (more in utils.js)
//
//https://www.w3schools.com/howto/howto_js_media_queries.asp
/////////////////////////////////////////////////////////////////////
function random(min, max) {
  return min + Math.random() * (max + 1 - min);
}

function randomIndex(length) {
  return Math.floor(Math.random() * length)
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  if (tracedebug) console.log("Color:", color);
  return color;
}

function removeExtension(path) {
  return path.substring(0, path.lastIndexOf('.')) || path;
}

function getFile(path) {
  return path.replace(/^.*[\\\/]/, '');
}

function getFileName(path) {
  return removeExtension(getFile(path));
}

function getExtension(filename) {
  const sections = filename.split('/');
  if (tracedebug) console.log("Sections:", sections);
  const parts = sections[sections.length-1].split('.');
  if (tracedebug) console.log("Parts:", parts);
  return parts.length > 1 ? parts.pop() : '';
}

function prettifyHTML(html) {
  const tab = "  ";
  let result = "";
  let indent = 0;

  html.split(/>\s*</).forEach((element) => {
    if (element.match(/^\/\w/)) indent--;

    result += tab.repeat(indent) + "<" + element + ">\n";

    if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith("!")) {
      indent++;
    }
  });

  return result.trim();
}

function prettyDOMHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const serializer = new XMLSerializer();
  const xml = serializer.serializeToString(doc.body);

  return xml
    .replace(/></g, ">\n<")
    .replace(/^\s+$/gm, "");
}

function beautifyHTML(html) {
  const pretty = html_beautify(html, {
    indent_size: 2,
    wrap_line_length: 80,
    preserve_newlines: true
  });

  return pretty;
}
/////////////////////////////////////////////////////////////////////
//
// IndexedDB
//
// Example:
// await IndexedDBStorage.setItem("CMS", "pages", "home", { title: "Welcome" });
// const page = await IndexedDBStorage.getItem("CMS", "pages", "home");
// console.log(page.title);
//
/////////////////////////////////////////////////////////////////////
class IndexedDBStorage {
  static _openDB(dbName, storeName) {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open(dbName, 1);

      open.onupgradeneeded = () => {
        const db = open.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };

      open.onerror = () => reject(open.error);
      open.onsuccess = () => resolve(open.result);
    });
  }

  static async getItem(dbName, storeName, key) {
    const db = await this._openDB(dbName, storeName);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  static async setItem(dbName, storeName, key, value) {
    const db = await this._openDB(dbName, storeName);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }
}

class StorageLoader {
  constructor(dbName, storeName, key) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.key = key;

    this.value = null;
    this.loaded = false;
    this.onLoad = null;

    this.load();
  }

  async load() {
    try {
      this.value = await IndexedDBStorage.getItem(
        this.dbName,
        this.storeName,
        this.key
      );
    } catch (err) {
      if (traceerror) console.error("StorageLoader error:", err);
    }

    this.loaded = true;
    if (this.onLoad) this.onLoad(this.value);
  }

  async save(newValue) {
    await IndexedDBStorage.setItem(
      this.dbName,
      this.storeName,
      this.key,
      newValue
    );
    this.value = newValue;
  }
}
/////////////////////////////////////////////////////////////////////
//
// DOMicile fundamentals Router, Element and Box
//
// createElementFromHTML - creates raw elements from HTML
//
// app.js - examples: shows how to use DOMicile to build a website
// components.js - library: components derived from Element and Box
//
// ELements are Content and children and `Box`es are for wrapping components. Deriving from `Box` creates a simple `div` wrapper that is standardized and we can build up off of standardized `div` handling. I worried it would conflict with the core CSS Element class but so far no problems.
//
// Boxes are Containers and the base for widgets the fundamental object that builds a DOMicile website. That said many components derive from `Element` as they don't need a div and aren't full widgets (I think both terms are accurate).
//
// Widgets are UI components. Components are not necessarily Widgets. If a Widget needs to `refresh` itself. E.g. this.refresh() or remove itself E.g `parent.removeChild(this.dom)` then it needs to be in a `Box` E.g. here we put a predefined table as a child to a box `new Box({}, table)`, now we have a parent we can use without affecting siblings. TODO: make this transparent so the box functionality is inherent and there is no need for embedding in a parent `Box`. For now this is simple and strong.
//
// Components are all class objects from non UI like `Router` to UI like `NavBar`. A `Router` is a component, a `NavBar` is a `Widget` which is a UI component.
//
// Layouts are multi-child or region components that have set layout defaults between regions and allow adding children per region. This way a particular CSS layout page or partial can be set between child objects. This will encapsulate layout concepts like three or four column grid and side bar and main relationships. I can even have dynamic layouts that allow adding and removing regions.
//
// Layer Cake (CCL): Content (Element), Container (Box), Layout (Layout)
//
/////////////////////////////////////////////////////////////////////
class Router {
  constructor(metadata = {}) {
    this.metadata = {
      base: metadata.base || "",
      routes: metadata.routes || {}
    };

    this.currentPath = this.getLocalPath();
  }

  // Compute the local path relative to base
  getLocalPath() {
    const url = window.location.href;
    const baseURL = window.location.origin + this.metadata.base;
    return url.slice(baseURL.length) || "/";
  }

  // Return the widgets for the current route
  resolve() {
    const fn = this.metadata.routes[this.currentPath];
    if (!fn) {
      if (tracewarn) console.warn("No route found for:", this.currentPath);
      return [];
    }
    return fn();
  }

  // Programmatic navigation
  navigate(path) {
    const full = this.metadata.base + path;
    window.history.pushState({}, "", full);
    this.currentPath = path;
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  // Listen for browser navigation
  listen(callback) {
    window.addEventListener("popstate", () => {
      this.currentPath = this.getLocalPath();
      callback(this.resolve());
    });
  }
}

class RouterAsync {
  constructor(metadata = {}) {
    this.metadata = {
      base: metadata.base || "",
      firewall: metadata.firewall,
      template: metadata.template || ((c) => c),
      page404: metadata.page404 || ((c) => c),
      template404: metadata.template404 || ((c) => c),
      routes: metadata.routes || {},
      runAsync: metadata.runAsync || false
    };

    this.currentPath = this.getLocalPath();
    this.firewall = metadata.firewall;
    //if (tracedebug) console.log("THIS FIREWALL", this.currentPath, this.firewall);
  }

  // Compute the local path relative to base
  getLocalPath() {
    const url = window.location.href;
    const baseURL = window.location.origin + this.metadata.base;
    return url.slice(baseURL.length) || "/";
  }

  // Resolve route — async inside, sync outside
  resolve(callback) {
    const entry = this.metadata.routes[this.currentPath];
    //if (tracedebug) console.log("CALL FIREWALL", this.firewall);
    if (this.firewall) this.firewall(this.currentPath, this.metadata.routes);
    if (tracedebug) console.log("[router] Entry", entry);
    if (!entry) {
      if (tracewarn) console.warn("No route entry found for:", this.currentPath);
      callback({ contents: this.metadata.page404(), template: this.metadata.template404 });
      return;
    }

    const fn = entry.contents;
    if (!fn) {
      if (tracewarn) console.warn("No route handler found for:", this.currentPath);
      callback({ contents: [], template: page404 });
      return;
    }

    const template = entry.template ? entry?.template : this.metadata?.template ? this.metadata.template : (contents) => contents;
    if (tracedebug) console.log("Final Template Fn", fn, template);
    if (!this.metadata.runAsync) {
      const contents = fn();
      callback({ contents, template });
      return;
    }

    Promise.resolve(fn())
      .then(contents => callback({ contents, template }))
      .catch(err => {
        //if (traceerror) console.error(contents);
        if (traceerror) console.error(err);
        callback({ contents: [], template });
      });
  }

  // Programmatic navigation
  navigate(path) {
    const full = this.metadata.base + path;
    window.history.pushState({}, "", full);
    this.currentPath = path;
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  // Listen for browser navigation
  listen(callback) {
    window.addEventListener("popstate", () => {
      this.currentPath = this.getLocalPath();
      this.resolve(callback);
    });
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Element
class Element {
  static _nextord = 0;
  static defaults = {
    css: {},
    props: {}
  };

  constructor(localName, metadata = {}, ...children) {
    this.localName = localName;
    this.metadata = this.constructor.applyDefaults(metadata);
    if (tracedebug) console.log("[meta]", this.constructor.name, localName, metadata);
    this.children = children;
    this.dom = null;
    this.ordinal = Element._nextord++;
    //if (tracedebug) console.log("Element ordinal:", this.ordinal);
    this.mounted = false;
  }
  
  onMount() {
    // DOM is guaranteed to exist here
    if (tracedebug) console.log("[DOM] Mounted", this);
  }
  
  onUnmount() {
    // Call user-defined cleanup
    //if (typeof this.onUnmount === "function") {
    //  this.onUnmount();
    //}

    // Call unmount on children
    //for (const child of this.children) {
    //  if (child.unmount) child.unmount();
    //}
    if (tracedebug) console.log("[DOM] Dis-Mounted", this);
  }

  static applyDefaults(metadata) {
    //if (tracedebug) console.log("[meta] CSS:", defaults.css);
    //if (tracedebug) console.log("[meta] PROPS:", defaults.props);
    let merge = {
      ...this.defaults,
      ...metadata,
      css: { ...this.defaults.css, ...(metadata.css || {}) },
      props: { ...this.defaults.props, ...(metadata.props || {}) }
    };
    //if (tracedebug) console.log("[meta] MERGEPROPS:", merge.props);
    return merge;
  }

  addChild(...elems) {
    //this.children.push(elem);
    const flat = elems.flat();

    for (const elem of flat) {
      this.children.push(elem);
    }
    
    return flat[0];
  }

  removeChild(elem) {
    this.mounted = false;
    elem.onUnmount();
    this.children = this.children.filter(c => c !== elem);
  }

  refresh() {
    if (!this.dom) return; // not mounted yet
    if (tracedebug) console.log("[refresh] Refreshing", this.dom);
    // Clear existing DOM children
    while (this.dom.firstChild) {
      this.dom.removeChild(this.dom.firstChild);
    }

    // Render each metadata child into DOM
    for (const child of this.children) {
      const dom = child.render(this.dom);
      //this.dom.appendChild(dom);
    }
  }

  render(container) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
    if (tracedebug) console.log("[render]", this.localName, this.constructor.name, container);
    const el = document.createElement(this.localName);
    this.dom = el;
    el._widget = this;

    // Apply CSS
    //Object.assign(el.style, this.metadata.css);
    for (const key in this.metadata.css) {
      if (key.startsWith("--")) {
        el.style.setProperty(key, this.metadata.css[key]);
      } else {
        el.style[key] = this.metadata.css[key];
      }
    }

    // Apply props
    //Object.assign(el, this.metadata.props);
    this.applyProps(el, this.metadata.props);

    // Render children
    for (const child of this.children) {
      if (tracedebug) console.log("[render] child:", typeof child, child);
      if (child instanceof Element) {
        child.render(el);
      } else {
        if (traceerror) console.error("[render] Invalid instance", typeof child, child);
      }
    }

    container.appendChild(el);
    this.mounted = true;
    // After DOM insertion
    if (typeof this.onMount === "function") {
      // Defer to next microtask to ensure DOM is fully attached
      queueMicrotask(() => this.onMount());
    }
    
    return el;
  }

  applyProps(el, props) {
    const booleanProps = new Set([
      "controls",
      "muted",
      "autoplay",
      "loop",
      "playsInline",
      "checked",
      "disabled",
      "selected"
    ]);

    for (const [key, value] of Object.entries(props)) {
      // 1. EVENT HANDLERS
      if (key.startsWith("on")) {
        if (typeof value === "string") {
          // Serializable handler: string → function(event) { ... }
          const fn = new Function("event", value);
          el[key] = fn;
        } else if (typeof value === "function") {
          // Direct handler: keep working code paths
          el[key] = value;
        }
        // (Optional) If you want to see it in HTML for debugging:
        // el.setAttribute(key, "");
        continue;
      }
      
      //if (el instanceof SVGElement) {
      //    if (tracedebug) console.log("SVG Element property");
      //    el.setAttribute(propName, value);
      //    continue;
      //}

      // 2. BOOLEAN ATTRIBUTES
      if (booleanProps.has(key)) {
        if (value === "" || value === true) {
          el.setAttribute(key, "");
          el[key] = true;
        } else {
          el.removeAttribute(key);
          el[key] = false;
        }
        continue;
      }

      // 3. STYLE OBJECT (if you ever pass style as object)
      if (key === "style" && value && typeof value === "object") {
        Object.assign(el.style, value);
        continue;
      }

      // 4. NORMAL PROPS: prefer DOM property, fallback to attribute
      const hasDomProp = key in el && typeof el[key] !== "function";

      if (hasDomProp) {
        el[key] = value;
      } else {
        el.setAttribute(key, value);
      }
    }
  }

  toJSON() { // Serialize component
    let serialized = {
      type: this.constructor.name,
      localName: this.localName,
      metadata: this.metadata,
      children: this.children.map(child => child.toJSON())
    };
    //if (tracedebug) console.log("[serialize] JSON ${serialized}", serialized);
    return serialized;
  }

  static fromJSON(data) { // Deserialize component
    const cls = widgetRegistry[data.type];
    if (!cls) {
      throw new Error(`Unknown widget type: ${data.type}`);
    }
    //if (tracedebug) console.log("[serialize] ${data.metadata}", data.metadata);
    // Create instance with metadata
    const instance = new cls(data.metadata);

    // Recursively load children
    if (Array.isArray(data.children)) {
      for (const childData of data.children) {
        const child = Element.fromJSON(childData);
        instance.children.push(child);
      }
    }
    //if (tracedebug) console.log("[serialize] ${instance}", instance);
    return instance;
  }

  toHTML1() {
    const tag = this.localName;
    if (tracedebug) console.log("[tag] toHTML", tag);
    const attrs = [];

    // Props → HTML attributes
    for (const [key, value] of Object.entries(this.metadata.props || {})) {
      if (key.startsWith("on")) {
        // Event handler
        if (typeof value === "string") {
          // SSR-safe: string event handler
          const eventName = key.toLowerCase();
          attrs.push(`${eventName}="${value}(event)"`);
        }
        // If it's a function → skip (hydration will attach it later)
      } else {
        // Normal attribute
        attrs.push(`${key}="${String(value)}"`);
      }
    }

    // CSS → inline style
    if (this.metadata.css) {
      const style = Object.entries(this.metadata.css)
        .map(([k, v]) => `${k}:${v}`)
        .join(";");
      attrs.push(`style="${style}"`);
    }

    const open = `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}>`;

    const childrenHTML = (this.children || [])
      .map(child => child.toHTML())
      .join("");

    const close = `</${tag}>`;

    return open + childrenHTML + close;
  }

  toHTML(indent = 0) {
    const pad = "  ".repeat(indent);

    // Void elements (self-closing)
    const voidTags = new Set([
      "area","base","br","col","embed","hr","img",
      "input","link","meta","param","source","track","wbr"
    ]);

    // Tag name
    const tag = this.localName.toLowerCase();

    // Build attributes
    const attrs = [];

    for (const [key, value] of Object.entries(this.metadata.props || {})) {
      if (key === "textContent") continue;
      if (value === undefined || value === null || value === "") continue;

      const attrName = key === "className" ? "class" : key.toLowerCase();
      attrs.push(`${attrName}="${String(value)}"`);
    }

    // Style object → CSS string
    if (this.metadata.css && Object.keys(this.metadata.css).length > 0) {
      const css = Object.entries(this.metadata.css)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}:${v}`)
        .join(";");
      attrs.push(`style="${css}"`);
    }

    const attrString = attrs.length ? " " + attrs.join(" ") : "";

    // Handle void elements
    if (voidTags.has(tag)) {
      return `${pad}<${tag}${attrString} />\n`;
    }

    // Opening tag
    let html = `${pad}<${tag}${attrString}>`;

    // Text content
    if (this.metadata.props?.textContent) {
      html += this.metadata.props.textContent;
    }

    // Children
    if (this.children.length > 0) {
      html += "\n";
      for (const child of this.children) {
        html += child.toHTML(indent + 1);
      }
      html += `${pad}</${tag}>\n`;
    } else {
      // No children → inline close
      html += `</${tag}>\n`;
    }

    return html;
  }

}

class Box1 extends Element {
  static defaults = {
    css: {
      //display: "block"
    },
    props: { className: 'box1'},
  };

  constructor(metadata={}, ...children) {
    super('div', metadata, ...children);
  }
}

class BoxBox1 extends Element {
  static defaults = {
    css: {
      //display: "block",
      //boxSizing: "border-box"
    },
    props: { className: 'boxbox1'},
  };

  constructor(innermeta, metadata = {}, ...children) {
    // Merge metadata safely without stripping fields
    const merged = {
      ...metadata, // keep all user fields
      css: {
        ...Box.defaults.css,
        ...(metadata.css || {})
      },
      props: {
        ...Box.defaults.props,
        ...(metadata.props || {})
      }
    };
    // this is the outer container
    super('div', merged);
    // this._inner is the inner container we abstract as the container so the child doesn't know it's not in just a single walled container when its actually double walled
    this._inner = new Box(innermeta, ...children);
    super.addChild(this._inner);
  }

  addChild(elem) {
    this._inner.addChild(elem);
    return elem;
  }

  removeChild(elem) {
    this._inner.removeChild(elem);
  }

  refresh() {
    this._inner.refresh();
  }
}

class BoxBox2 extends Element {
  static defaults = {
    css: {},
    props: { className: 'boxbox2' },
    children: []
  };

  constructor(innermeta, metadata = {}, ...children) {
    // Merge metadata
    const merged = {
      ...metadata,
      css: {
        ...Box.defaults.css,
        ...(metadata.css || {})
      },
      props: {
        ...Box.defaults.props,
        ...(metadata.props || {})
      }
    };
    // Outer container
    super("div", merged);

    // Inner container
    this._inner = new Element("div", innermeta, ...children);
    super.addChild(this._inner);
  }

  applySplitCSS(css) {
    const outerCSS = {};
    const innerCSS = {};

    for (const [key, value] of Object.entries(css)) {
      if (this.isOuterCSS(key)) outerCSS[key] = value;
      else innerCSS[key] = value;
    }

    // Apply to outer
    Object.assign(this.metadata.css, outerCSS);

    // Apply to inner
    Object.assign(this._inner.metadata.css, innerCSS);
  }

  // Rules for splitting CSS
  isOuterCSS(key) {
    return [
      "width", "height",
      "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
      "border", "borderRadius",
      "background", "backgroundColor",
      "position", "top", "left", "right", "bottom",
      "flex", "flexGrow", "flexShrink", "flexBasis",
      "display"
    ].includes(key);
  }

  addChild(elem) {
    return this._inner.addChild(elem);
  }

  removeChild(elem) {
    return this._inner.removeChild(elem);
  }

  refresh() {
    //super.refresh();      // refresh outer
    this._inner.refresh(); // refresh inner
  }
}

const Box = Box1;
const BoxBox = BoxBox2;

class GridBox extends Box {
  static defaults = {
    css: {
      display: "grid"
    },
    props: { className: 'grid-box'},
  };
  constructor(metadata = {}, ...children) {
    super({
        css: {
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          alignItems: "start",
          gap: "20px",
          marginBottom: "20px",
          ...metadata.css
        },
        props: metadata.props || {className: 'grid-box'}
      },
      ...children
    );
  }
}

class FlexRowBox extends Box {
  constructor(metadata = {}, ...children) {
    super({
        css: {
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "20px",
          alignItems: "flex-start",
          ...metadata.css
        },
        props: metadata.props || {}
      },
      ...children
    );
  }
}

class ResponsiveColumnsBox extends Box {
  constructor(metadata = {}, ...children) {
    super({
        css: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0px",
          ...metadata.css
        },
        props: metadata.props || {}
      },
      ...children
    );

    // Mobile collapse
    this.metadata.css["@media (max-width: 620px)"] = {
      gridTemplateColumns: "1fr"
    };
  }
}

class HTMLBox extends Box {
  static defaults = {
    props: { className: 'html-box'},
  };
  constructor(metadata = {}) {
    super(metadata);
    this.setHTML(metadata.html || "");
    this.metadata.props['innerHTML'] = this.html;
  }

  directDOMinjection() {
    if (!this.dom) {
      if (tracedebug) console.log("HTMLBox renderHTML: No DOM, no direct DOM rendering!");
      return;
    }
    if (tracedebug) console.debug("HTMLBox DOM Injection");
    this.dom.innerHTML = this.html;
  }

  setHTML(html) {
    //if (tracedebug) console.log("HTML", html);
    this.html = html;
    this.metadata.props['innerHTML'] = this.html;
    this.directDOMinjection();
  }
}

class ContentLoader extends HTMLBox {
  constructor(metadata = {}) {
    super(metadata);
    this.base = metadata.base || '';
    this.src = metadata.src;
    this.isMarkdown = metadata.isMarkdown || false;
    this.load();
  }

  async load() {
    const res = await fetch(this.base + this.src);
    let text = await res.text();

    if (this.isMarkdown) {
      text = DOMPurify.sanitize(marked.parse(text));
    }

    this.setHTML(text);
  }
}

class Layout extends Element {
  constructor(tag = "div", metadata = {}) {
    super(tag, metadata);
    this._resizeObserver = null;
  }
}

class ResizeLayout extends Element {
  constructor(tag = "div", metadata = {}) {
    super(tag, metadata);
    this._resizeObserver = null;
  }

  onMount() {
    this._resizeObserver = new ResizeObserver(entries => {
      const rect = entries[0].contentRect;
      this.onResize(rect.width, rect.height);
    });
    this._resizeObserver.observe(this.dom);
  }

  onUnmount() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  onResize(width, height) {
    // default: do nothing
  }
}


class RegionalLayout extends Element {
  constructor(tag = "div", meta_regions = {}, metadata = {}) {
    super(tag, metadata);
    if (tracedebug) console.log("Layout:", tag); 
    // Create named region containers
    this.regions = {};
    if (tracedebug) console.log("meta_regions", meta_regions);
    for (const [regionName, regionMeta] of Object.entries(meta_regions)) {
      const regionBox = new Box(regionMeta);
      this.regions[regionName] = regionBox;
      this.addChild(regionBox);
      if (tracedebug) console.log("Add Region:", regionName, regionBox, "THIS", this); 
    }
  }

  addTo(region, ...widgets) {
    const target = this.regions[region];
    if (!target) {
      throw new Error(`Unknown region: ${region}`);
    }

    // Flatten: allow addTo("main", w1, w2, [w3, w4])
    const flat = widgets.flat();

    for (const widget of flat) {
      target.addChild(widget);
    }

    return this; // optional chaining convenience
  }

  removeFrom(region, ...widgets) {
    const target = this.regions[region];
    if (!target) {
      throw new Error(`Unknown region: ${region}`);
    }

    // Flatten: allow addTo("main", w1, w2, [w3, w4])
    const flat = widgets.flat();

    for (const widget of flat) {
      target.removeChild(widget);
    }

    return this; // optional chaining convenience
  }
  
  onMount() {
    // Observe the layout’s own DOM element
    this._observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.onResize(width, height);
      }
    });

    this._observer.observe(this.dom);
  }
  
  onUnmount() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  onResize(width, height) {
    // Default: do nothing
    // Layout subclasses override this
  }

}

class RegionalLayoutEx extends Element {
  constructor(tag = "div", meta_regions = {}, metadata = {}) {
    super(tag, metadata);
    if (tracedebug) console.log("Layout:", tag); 
    // Create named region containers
    this.regions = {};
    if (tracedebug) console.log("meta_regions", meta_regions);
    for (const [regionName, regionMeta] of Object.entries(meta_regions)) {
      const regionBox = new Element(regionMeta.tag || 'div', regionMeta);
      this.regions[regionName] = regionBox;
      this.addChild(regionBox);
      if (tracedebug) console.log("Add Region:", regionName, regionBox, "THIS", this); 
    }
  }

  addTo(region, ...widgets) {
    const target = this.regions[region];
    if (!target) {
      throw new Error(`Unknown region: ${region}`);
    }

    // Flatten: allow addTo("main", w1, w2, [w3, w4])
    const flat = widgets.flat();

    for (const widget of flat) {
      target.addChild(widget);
    }

    return this; // optional chaining convenience
  }

  removeFrom(region, ...widgets) {
    const target = this.regions[region];
    if (!target) {
      throw new Error(`Unknown region: ${region}`);
    }

    // Flatten: allow addTo("main", w1, w2, [w3, w4])
    const flat = widgets.flat();

    for (const widget of flat) {
      target.removeChild(widget);
    }

    return this; // optional chaining convenience
  }
  
  onMount() {
    // Observe the layout’s own DOM element
    this._observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.onResize(width, height);
      }
    });

    this._observer.observe(this.dom);
  }
  
  onUnmount() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  onResize(width, height) {
    // Default: do nothing
    // Layout subclasses override this
  }

}


// DirectoryLoader (I never got this to work)
class IndexLoader {
  constructor(basePath, load=false) {
    this.basePath = basePath;
    this.items = [];      // array of { file, loader }
    this.loaded = false;  // index.json loaded
    this.onLoad = null;
    //this.loadIndex();
  }

  async loadIndex() {
    const res = await fetch(`${this.basePath}/index.json`);
    const files = await res.json();

    for (const file of files) {
      const url = `${this.basePath}/${file}`;
      const box = new ContentLoader({ src: url});

      const match = file.match(/^(\d{14})-(.+)\.html$/);
      if (!match) continue;

      const timestamp = match[1];
      const rawTitle = match[2];
      const title = rawTitle.replace(/_/g, " ");

      this.items.push({
        timestamp,
        url,
        file,
        title,
        box
      });
    }

    this.items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    this.loaded = true;
    if (this.onLoad) this.onLoad(this);
    return this.items;
  }
}

class RESTLoader {
  constructor(url) {
    this.url = url;
    this.data = null;
    this.loaded = false;
    this.onLoad = null;

    this.load();
  }

  async load() {
    try {
      const res = await fetch(this.url);
      this.data = await res.json();
    } catch (err) {
      if (traceerror) console.error("RESTLoader error:", err);
    }

    this.loaded = true;
    if (this.onLoad) this.onLoad(this.data);
  }
}
console.log("DOMicile ver 1.0.0 RC initialized");