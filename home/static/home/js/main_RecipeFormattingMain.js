requirejs.config({
    urlArgs: "cachebust=018",
    bundles: {
        'static/home/js/script.js': ['RecipeFormattingMain']
    }
});

requirejs(["RecipeFormattingMain"], function (RecipeFormattingMain) {
    console.log('Running "RecipeFormattingMain.ts" by using requirejs');
});