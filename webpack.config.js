const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './client/src/core/game.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'client'),
    clean: false
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
      filename: 'index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'client/assets', to: 'assets' }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'client')
    },
    compress: true,
    port: 8080,
    hot: true
  },
  resolve: {
    extensions: ['.js']
  },
  mode: 'development'
};