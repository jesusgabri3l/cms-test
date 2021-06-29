var ghpages = require('gh-pages');

ghpages.publish(
    'public',
    {
        branch: 'gh-pages',
        repo: 'https://github.com/jesusgabri3l/cms-test.git',  
        user: {
            name: 'jesusgabri3l',
            email: 'jesus15202009@gmail.com'
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)