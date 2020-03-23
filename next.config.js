const isProd = (process.env.NODE_ENV || 'production') === 'production'
//process.env.DEPLOY_ENV === 'GH_PAGES'

module.exports = {
    exportTrailingSlash: true,
    exportPathMap: function() {
        return {
            '/': { page: '/' }
        };
    },
    assetPrefix: isProd ? '/aoe2-de-elo-histogram' : '',
};