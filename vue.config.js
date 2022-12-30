const path = require('path');
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
