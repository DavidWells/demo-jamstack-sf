# NPM Stats Page Plugin

Add a page on your site with current NPM modules & their download stats


## Install

```
npm install netlify-plugin-npm-stats-page
```

## Usage

In your Netlify config file, add the plugin & your `npmUserName`

```yml
# Build plugins
plugins:
  - package: netlify-plugin-npm-stats-page
    config:
      npmUserName: davidwells
      # optionally exclude pakages from list
      excludePackages:
        - xyz
        - abc
```

That's it. After that your NPM stats will be fetched and cached (for 1 hour) between builds
