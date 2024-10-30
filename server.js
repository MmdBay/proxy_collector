const { default: axios } = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { execSync } = require("child_process");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const channels = [
    'https://t.me/s/NPROXY',
    'https://t.me/s/proxy_mti',
    'https://t.me/s/darkproxy'
];

const getProxiesFromChannel = async (channelUrl) => {
    try {
        const { data: requestTelegramChannel } = await axios(channelUrl);
        const $ = cheerio.load(requestTelegramChannel);
        const mainElement = $('body > main > div > section > div:last-child').html();
        const tempElement = $('<div>').html(mainElement);

        const proxyList = [];
        tempElement.find('a[rel="noopener"]').each((i, el) => {
            let href = $(el).attr('href');
            
            href = href.replace(/&amp;/g, '&');
            
            if (href.includes('https://t.me/proxy?server=')) {
                const regex = /server=([^&]+)&port=([^&]+)&secret=([^&]+)/;
                const match = href.match(regex);

                if (match) {
                    const server = match[1];
                    const port = match[2];
                    const secret = match[3];
                    proxyList.push({ server, port, secret });
                }
            }
        });

        return proxyList;
    } catch (error) {
        console.error(`Error fetching proxies from channel ${channelUrl}:`, error);
        return [];
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
    let allProxies = [];

    for (const channel of channels) {
        console.log(`Fetching proxies from ${channel}...`);
        const proxiesFromChannel = await getProxiesFromChannel(channel);
        allProxies = allProxies.concat(proxiesFromChannel);
    }

    if (allProxies.length > 0) {
        const enrichedProxies = [];
        const proxyTextList = [];

        for (const proxy of allProxies) {
            const location = await getProxyLocation(proxy.server);
            if (location) {
                enrichedProxies.push({
                    server: proxy.server,
                    port: proxy.port,
                    secret: proxy.secret,
                    location: location
                });
            }

            proxyTextList.push(`https://t.me/proxy?server=${proxy.server}&port=${proxy.port}&secret=${proxy.secret}`);
            console.log(`Fetching proxies location ${location}...`);
            await delay(1500);
        }

        const filePathJSON = './proxy-list.json';
        fs.writeFileSync(filePathJSON, JSON.stringify(enrichedProxies, null, 2), 'utf-8');

    	proxyTextList.push(`Auto update proxy list on ${new Date().toISOString()}\n`)
        const filePathText = './proxy-list.txt';
        fs.writeFileSync(filePathText, proxyTextList.join('\n'), 'utf-8');
	console.log(proxyTextList)
        execSync('git add .');
        execSync(`git commit -m "Auto update proxy list on ${new Date().toISOString()}"`);
        execSync('git push -f origin main');
    } else {
        console.log("No proxies found to update.");
    }
};

updateGitRepo();
