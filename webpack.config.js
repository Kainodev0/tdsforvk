const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Создаем .nojekyll файл если он еще не существует
const nojekyllPath = path.resolve(__dirname, '.nojekyll');
if (!fs.existsSync(nojekyllPath)) {
  fs.writeFileSync(nojekyllPath, '');
  console.log('.nojekyll file created');
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  // Используем относительные пути для GitHub Pages
  const publicPath = isProduction ? './' : '/';
  
  return {
    entry: './client/src/core/game.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      publicPath: publicPath
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './client/index.html',
        filename: 'index.html',
        inject: 'body'
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'client/assets', to: 'assets' },
          { from: 'client/styles.css', to: 'styles.css' },
          { from: '.nojekyll', to: '.nojekyll' }
        ]
      })
    ],
    resolve: {
      extensions: ['.js'],
      alias: {
        '@core': path.resolve(__dirname, 'client/src/core/'),
        '@entities': path.resolve(__dirname, 'client/src/entities/'),
        '@ui': path.resolve(__dirname, 'client/src/ui/'),
        '@physics': path.resolve(__dirname, 'client/src/physics/')
      },
      fallback: {
        "path": false,
        "fs": false
      }
    },
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'client')
      },
      compress: true,
      port: 8080,
      hot: true,
      open: true
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    mode: isProduction ? 'production' : 'development',
    ignoreWarnings: [/Failed to parse source map/],
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 1024000,
      maxEntrypointSize: 1024000
    }
  };
};