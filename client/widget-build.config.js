const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    'widget-loader': './src/embed/widget-loader.js',
    'chat-widget': './src/components/widget/EmbeddableChatWidget.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist/widget'),
    filename: '[name].min.js',
    library: {
      name: 'NowgrayChatWidget',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions', 'ie >= 11']
                },
                modules: false
              }],
              ['@babel/preset-react', {
                runtime: 'automatic'
              }]
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-object-rest-spread'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/inline'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react': 'preact/compat',
      'react-dom': 'preact/compat'
    }
  },
  externals: {
    // Don't bundle React - expect it to be loaded externally
    'react': {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
      root: 'React'
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'react-dom',
      root: 'ReactDOM'
    }
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log']
          },
          mangle: {
            safari10: true
          },
          format: {
            comments: false
          }
        },
        extractComments: false
      })
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        }
      }
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.WIDGET_VERSION': JSON.stringify(require('./package.json').version)
    }),
    new webpack.BannerPlugin({
      banner: `
/*!
 * Nowgray Chat Widget v${require('./package.json').version}
 * (c) 2024 Nowgray Inc.
 * Released under the MIT License.
 * Built: ${new Date().toISOString()}
 */
      `.trim(),
      raw: false,
      entryOnly: true
    })
  ],
  performance: {
    hints: 'warning',
    maxEntrypointSize: 250000,
    maxAssetSize: 250000
  },
  devtool: 'source-map'
};

// Development configuration
if (process.env.NODE_ENV === 'development') {
  module.exports.mode = 'development';
  module.exports.devtool = 'eval-source-map';
  module.exports.optimization.minimize = false;
  module.exports.plugins = module.exports.plugins.filter(
    plugin => !(plugin instanceof TerserPlugin)
  );
}
