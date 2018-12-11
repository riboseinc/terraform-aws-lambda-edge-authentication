const path = require('path');

const commonConfig = {
    externals: {
        "aws-sdk": "aws-sdk",
    },
    output: {
        path: path.resolve(__dirname),
        filename: './src/[name].js',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: ['ts-loader']
            }
        ]
    },
    node: {
        __dirname: false
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
};

module.exports = [
    Object.assign({
            target: 'node',
            entry: {
                main: './src/main.ts'
            },
        },
        commonConfig
    )
];
