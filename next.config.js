const debug = process.env.NODE_ENV !== "production";

module.exports = {
  exportPathMap: function() {
    return {
      "/": { page: "/", query: ["team_one", "team_two"] }
    };
  },
  assetPrefix: !debug ? "" : "",
  webpack: (config, { dev }) => {
    // Perform customizations to webpack config
    console.log("webpack");
    config.module.rules = config.module.rules.map(rule => {
      if (rule.loader === "babel-loader") {
        rule.options.cacheDirectory = false;
      }
      return rule;
    });
    // Important: return the modified config
    return config;
  }
};
