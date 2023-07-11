const path = require('path');
const crypto = require('crypto');

/**
 * The MD4 algorithm is not available anymore in Node.js 17+ (because of library SSL 3).
 * In that case, silently replace MD4 by the MD5 algorithm.
 * 
 * 备注：webpack5.61.0+以上修复了此问题，如升级webpack，则可移除此段代码
 */
try {
  crypto.createHash('md4');
} catch (e) {
  console.warn('Crypto "MD4" is not supported anymore by this Node.js version');
  const origCreateHash = crypto.createHash;
  crypto.createHash = (alg, opts) => {
    return origCreateHash(alg === 'md4' ? 'md5' : alg, opts);
  };
}

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  lintOnSave: true,
  chainWebpack: (config) => {
    config.resolve.alias.set('@$', resolve('src'));

    const svgRule = config.module.rule('svg'); // 找到svg-loader
    svgRule.uses.clear(); // 清除已有的loader, 如果不这样做会添加在此loader之后

    svgRule.include
      .add(resolve('src/assets/img/svg'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .tap((options) =>
        Object.assign(options || {}, {
          symbolId: 'icon-[name]',
        })
      );

    // 修改images loader 添加svg处理
    const imagesRule = config.module.rule('images');
    imagesRule.exclude.add(resolve('src/assets/img/svg'));
    config.module.rule('images').test(/\.(png|jpe?g|gif|svg)(\?.*)?$/);
  },
};
