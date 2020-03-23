const debug = process.env.NODE_ENV !== "production";

module.exports = {
  exportPathMap: function () {
    return {
      "/": { page: "/" },
    }
  },
  assetPrefix: !debug ? '/aoe2-de-elo-histogram' : '',
  webpack: (config, { dev }) => {
    // Perform customizations to webpack config
    console.log('webpack');
    config.module.rules = config.module.rules.map(rule => {
      if(rule.loader === 'babel-loader') {
        rule.options.cacheDirectory = false
      }
      return rule
    })
    // Important: return the modified config
    return config
  }
}