Webpack plugin to keep extension's manifest file in sync with `package.json`.

## Installation

`npm install --save-dev chrome-manifest-sync-webpack-plugin`

## Available config options

* `source` - path to your `manifest.json`. 
   
   Default: `'./manifest.json'`
* `properties` - array of properties to copy.
  
  Default:
  ```javascript
  [
      'version',
      'description',
      'author',
      // Copies `homepage` from `package.json`
      // to `homepage_url` in `manifest.json`
      { homepage_url: 'homepage' },    
  ]
  ```
  
## Webpack configuration

```javascript
const ChromeManifestSyncWebpackPlugin = require('chrome-manifest-sync-webpack-plugin');

module.exports = {
    // ...
    plugins: [
        // ...
        new ChromeManifestSyncWebpackPlugin({
            source: './src/manifest.json',
            properties: [ 'version', 'description' ],
        }),
        // ...
    ],
    // ...
};
```

Now, every time you save changes to `package.json` or `src/manifest.json`, Webpack
will emit updated manifest to your output directory.
