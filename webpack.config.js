const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const publicPath = isProduction ? '/tdsforvk/' : '/';
  
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
              presets: ['@babel/preset-env'],
              plugins: [
                ["@babel/plugin-transform-modules-commonjs", { 
                  "allowTopLevelThis": true 
                }]
              ]
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
        inject: 'body' // Важно: скрипт должен быть в body
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'client/assets', to: 'assets' },
          { from: 'client/styles.css', to: 'styles.css' }
        ]
      })
    ],
    resolve: {
      extensions: ['.js'],
      // Указываем псевдонимы для импортов
      alias: {
        '@core': path.resolve(__dirname, 'client/src/core/'),
        '@entities': path.resolve(__dirname, 'client/src/entities/'),
        '@ui': path.resolve(__dirname, 'client/src/ui/'),
        '@physics': path.resolve(__dirname, 'client/src/physics/')
      }
    },
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'client')
      },
      compress: true,
      port: 8080,
      hot: true
    },
    // Добавляем source maps для отладки
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    mode: isProduction ? 'production' : 'development'
  };
};