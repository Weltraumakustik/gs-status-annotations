![Status Annotations Promo Image](/promo/cover.png?raw=true "Status Annotations promo")

# Status annotations
A Figma plugin for adding a status annotations to your frames.

The plugin ships with 9 status annotations:
1. 🚧 Work in progress
2. 🏝 Exploration
3. 🔮 Research
4. ✋ Open for feedback
5. 👀 In Review
6. ✅ Approved
7. ⚙️ In development
8. 💯 Done
9. ☠️ Archived

## Forking your own version
The default status annotations may not apply to every team's workflow, so a secondary goal of this plugin was to make it easy to customize with your own annotations. Here is how to get setup.

### 1. Fork this repository 
Fork or clone this repository. You can also use the the following command:
```bash
gh repo clone Weltraumakustik/swag-status-annotations
```

### 2. Install
```bash
npm install
```

### 3. Develop
```bash
npm run dev
```

### 4. Customize
The plugin UI is built using Svelte for the UI, but if you aren't familiar with Svelte, there isn't much you have to know or do! To start configuring the annotations, open `PluginUI.svelte` in your code editor.


Now that you have everything ready, you need to edit the statuses array. You can add as many as you like, the plugin UI will resize to accommodate the number of statuses that you create. 
```Javascript
let statuses = [
  {
    'title': 'Status name A', //this is the name of the status
    'icon': iconStatusA, //this is the var which contains your emoji
    'color': '#E93940' //this is the unique color for your annotation
  },
  {
    'title': 'Status name B', //this is the name of the status
    'icon': iconStatusB, //this is the var which contains your emoji
    'color': '#E93940' //this is the unique color for your annotation
  }
];
```

### 5. Build
Next, you can build your plugin for use in production.
```bash
npm run build
```

### 6. Add to Figma
Lastly, you need to add your plugin to Figma. From your list of plugins, under the "In Development" header, choose "Create new Plugin" by clicking the + button. From here you want to point to the `public/manifest.json` file in your plugin directory. You can now run the plugin and test it out.

### 7. Publish privately (optional)
If you are part of a Figma Organization tier-plan, you can publish the plugin privately for use on your team. For more details on how to do this, visit the [Manage Plugins in an Organization](https://help.figma.com/hc/en-us/articles/360039958894-Manage-Plugins-in-an-Organization) page on Figma's help centre.
