import express from 'express';
import { Client, middleware } from '@line/bot-sdk';

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const client = new Client(config);
const app = express();

app.post('/', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      if (event.message.text === 'あああ') {
        // 「あああ」というメッセージの場合、20秒後に「AAA」と返信
        setTimeout(() => {
          client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'AAA'
          });
        }, 20000); // 20秒
      } else {
        // それ以外のメッセージの場合、おうむ返し
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
