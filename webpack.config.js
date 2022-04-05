module.exports = {
    mode: 'development', // development or production
    entry: './src/index.ts',
    output: {
        path: `${__dirname}/bin`,
        // 出力ファイル名
        filename: "pack.js"
      },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
        },
      ],
    },
    resolve: {
      extensions: [
        '.ts', '.js',
      ],
    },
  };