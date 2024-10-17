const { default: axios } = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { execSync } = require("child_process");

const getProxies = async () => {
    try {
        var { data: requestTelegramChannle } = await axios('https://t.me/s/NPROXY');
        var $ = cheerio.load(requestTelegramChannle);
        var mainElement = $('body > main > div > section > div:last-child').html();
        var tempElement = $('<div>').html(mainElement);

        var proxyList = [];
        tempElement.find('a[rel="noopener"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href.includes('https://t.me/proxy?server=')) {
                const url = new URL(href);
                const server = url.searchParams.get('server');
                const port = url.searchParams.get('port');
                const secret = url.searchParams.get('secret');
                proxyList.push({ server, port, secret });
            }
        });

        return proxyList;
    } catch (error) {
        console.error(error);
    }
};

const getProxyLocation = async (ip) => {
    try {
        const { data } = await axios.get(`http://ip-api.com/json/${ip}`);
        return {
            country: data.country,
            region: data.regionName,
            city: data.city,
            isp: data.isp,
            lat: data.lat,
            lon: data.lon
        };
    } catch (error) {
        console.error(`Error fetching location for IP ${ip}:`, error.message);
        return null;
    }
};

const updateGitRepo = async () => {
    const proxies = await getProxies();

    if (proxies && proxies.length > 0) {
        const enrichedProxies = [];
        const proxyTextList = [];

        for (const proxy of proxies) {
            const location = await getProxyLocation(proxy.server);
            enrichedProxies.push({
                server: proxy.server,
                port: proxy.port,
                secret: proxy.secret,
                location: location || "Location not found"
            });

            proxyTextList.push(`server: ${proxy.server}\nport: ${proxy.port}\nsecret: ${proxy.secret}\n`);
        }

        const filePathJSON = './proxy-list.json';
        fs.writeFileSync(filePathJSON, JSON.stringify(enrichedProxies, null, 2), 'utf-8');

        const filePathText = './proxy-list.txt';
        fs.writeFileSync(filePathText, proxyTextList.join('\n'), 'utf-8');

        execSync('git add .');
        execSync(`git commit -m "Auto update proxy list on ${new Date().toISOString()}"`);
        execSync('git push origin main');
    } else {
        console.log("No proxies found to update.");
    }
};

updateGitRepo();
