import * as express from 'express';
import * as puppeteer from 'puppeteer';

const app = express();

const PORT = process.env.PORT || 3001;

let browser: puppeteer.Browser;

interface TwitterConversation {
  globalObjects: {
    tweets: {
      [key: string]: {
        extended_entities: {
          media: {
            type: 'video' | 'animated_gif' | 'image';
            media_url_https: string;
            id_str: string;
            video_info?: {
              variants: {
                content_type: 'video/mp4' | 'application/x-mpegURL';
                url: string;
              }[];
            };
          }[];
        };
      };
    };
  };
}

interface VideoInfo {
  id: string;
  url: string;
  contentType: string;
  poster: string;
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

async function setInterceptRequest(page: puppeteer.Page, interceptURL: string): Promise<any> {
  await page.setRequestInterception(true);
  let resolved = false;
  let requesting = false;
  return new Promise((resolve, reject) => {
    page.on('request', (interceptedRequest) => {
      if (
        interceptedRequest.url().includes(interceptURL) &&
        interceptedRequest.method() !== 'OPTIONS'
      ) {
        if (!resolved && !requesting) {
          requesting = true;
          page
            .waitForResponse((resp) => resp.url().includes(interceptURL), { timeout: 60 * 1000 })
            .then((_resp) => _resp.json())
            .then((data) => {
              if (!resolved) {
                resolved = true;
                resolve(data);
              }
            })
            .catch(() => {});
          interceptedRequest.continue();
        } else {
          interceptedRequest.abort();
        }
      } else {
        interceptedRequest.continue();
      }
    });
  });
}

app.get('/api/extract/twitter', async (req, res) => {
  const twitterURL = decodeURIComponent((req.query.url as string) || '');
  const match = /https:\/\/twitter\.com\/[^/]+\/status\/(\d+)\/?/.exec(twitterURL);
  if (match) {
    const convId = match[1];
    const page = await browser.newPage();
    const respPromise = setInterceptRequest(
      page,
      `api.twitter.com/2/timeline/conversation/${convId}.json`
    );
    page.goto(twitterURL).catch(() => {});
    const content = (await respPromise) as TwitterConversation;
    await page.close();
    const tweet = content.globalObjects.tweets[convId];
    let extractedInfo = {} as VideoInfo;
    if (tweet) {
      if (!tweet.extended_entities) {
        return res.status(200).json({ failed: true });
      }

      const media = tweet.extended_entities.media.find(
        (m) => (m.type === 'video' || m.type === 'animated_gif') && m.video_info
      );
      if (media) {
        extractedInfo.id = media.id_str;
        extractedInfo.poster = media.media_url_https;
        const info = media.video_info?.variants.find((v) => v.content_type === 'video/mp4');
        if (info) {
          extractedInfo.url = info.url;
          extractedInfo.contentType = info.content_type;
        }
      }
    }
    console.log(`extracted from: ${twitterURL}\n${extractedInfo.url}\n`);
    res.status(200).json(extractedInfo);
  } else {
    return res.sendStatus(404);
  }
});

let args = ['--no-sandbox'];
if (process.env.NODE_ENV !== 'development') {
  args.push('--proxy-server=socks5://127.0.0.1:1086');
}

puppeteer
  .launch({
    headless: process.env.NODE_ENV !== 'development',
    args,
    ignoreDefaultArgs: ['--enable-automation'],
  })
  .then((_browser) => (browser = _browser))
  .then(() => {
    app.listen(PORT);
  });
