module.exports = {
    outputDir: process.env.OUTPUT_DIR,
    devServer: {
        proxy: {
            "/api": {
                target: `http://localhost:5000`
            }
        },
    }
}