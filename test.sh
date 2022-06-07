# example -> npm run teste:e2e --file=deploy
if [ $npm_config_file ]
then 
    nyc mocha --forbid-only --exit "test/end-to-end/$npm_config_file.test.js"
else
    nyc mocha --forbid-only --exit "test/end-to-end/**/*.test.js"
fi