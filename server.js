const { default: axios } = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { execSync } = require("child_process");

const getProxies = async () => {
    try {
        var {data: requestTelegramChannle} = await axios('https://t.me/s/NPROXY');

        var $ = cheerio.load(requestTelegramChannle);

        var mainElement = $('body > main > div > section > div:last-child').html();
        var tempElement = $('<div>').html(mainElement);

        var proxyList = [];
        tempElement.find('a[rel="noopener"]').each((i, el) => {
            if ($(el).attr('href').includes('https://t.me/proxy?server=')) {
                proxyList.push($(el).attr('href'));
            }
        });

        return proxyList;
    } catch (error) {
        console.error(error);
    }
};

const updateGitRepo = async () => {
    const proxies = await getProxies();

    if (proxies && proxies.length > 0) {
        const filePath = './proxy-list.txt';
        fs.writeFileSync(filePath, proxies.join('\n'), 'utf-8');

        execSync('git add .');
        execSync(`git commit -m "Auto update proxy list on-${new Date().toISOString()}"`);
        execSync('git push origin main');
    } else {
        console.log("No proxies found to update.");
    }
};


updateGitRepo();
