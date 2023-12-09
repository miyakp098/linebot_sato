import express from 'express';
import { Client, middleware } from '@line/bot-sdk';

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const client = new Client(config);
const app = express();

const userStates = {};
const waitingMessages = {};
const ignoreMessages = {};

app.post('/', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;

      if (ignoreMessages[userId]) {
        return Promise.resolve(null);
      }

      if (userStates[userId] === 'waiting_for_reply') {
        userStates[userId] = 'normal';
        ignoreMessages[userId] = true;

        const delay = parseInt(userStates[userId + '_delay'], 10) || 10000; // デフォルトは 10 秒

        setTimeout(() => {
          if (waitingMessages[userId]) {
            client.replyMessage(event.replyToken, {
              type: 'text',
              text: waitingMessages[userId]
            });
            delete waitingMessages[userId];
          }
          delete ignoreMessages[userId];
        }, delay);

        waitingMessages[userId] = event.message.text;
        return Promise.resolve(null);
      }

      if (userStates[userId] === 'choosing_delay') {
        if (['10秒', '20秒', '30秒'].includes(event.message.text)) {
          userStates[userId] = 'waiting_for_reply';
          userStates[userId + '_delay'] = event.message.text.split('秒')[0] * 1000; // 秒数をミリ秒に変換
          return Promise.resolve(null);
        }
      }

      // 初期状態または状態リセット後の処理
      userStates[userId] = 'choosing_delay';
      return client.replyMessage(event.replyToken, {
        type: 'template',
        altText: '何秒後に返信しますか？',
        template: {
          type: 'buttons',
          text: '何秒後におうむ返ししますか？',
          actions: [
            { type: 'message', label: '10秒後', text: '10秒' },
            { type: 'message', label: '20秒後', text: '20秒' },
            { type: 'message', label: '30秒後', text: '30秒' }
          ]
        }
      });
    }
    return Promise.resolve(null);
  })).then(() => res.end())
  .catch(err => {
    console.error(err);
    res.status(500).end();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
