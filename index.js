import express from 'express';
import { Client, middleware } from '@line/bot-sdk';

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const client = new Client(config);
const app = express();

// ユーザーの状態を追跡するためのオブジェクト
let userStates = {};

app.post('/', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;

      if (event.message.text === 'あああ') {
        // ユーザーの状態を「待機中」に設定
        userStates[userId] = 'waiting';

        // 20秒後に「AAA」と返信
        setTimeout(() => {
          if (userStates[userId] === 'waiting') {
            client.replyMessage(event.replyToken, {
              type: 'text',
              text: 'AAA'
            });

            // ユーザーの状態をリセット
            userStates[userId] = 'normal';
          }
        }, 10000);
      } else if (!userStates[userId] || userStates[userId] === 'normal') {
        // 通常のおうむ返し
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: event.message.text
        });
      }
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
