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
        // 「あああ」というメッセージの場合、10秒後に「AAA」と返信
        setTimeout(() => {
          client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'AAA'
          });
        }, 10000); // 10秒
      } else {
        // それ以外のメッセージの場合、ボタンを表示
        return client.replyMessage(event.replyToken, {
          type: 'template',
          altText: 'ボタンを選択してください',
          template: {
            type: 'buttons',
            title: 'ボタンのタイトル',
            text: 'ボタンを選択してください',
            actions: [
              {
                type: 'postback',
                label: 'ボタン1',
                data: 'action=button1'
              },
              {
                type: 'postback',
                label: 'ボタン2',
                data: 'action=button2'
              }
            ]
          }
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
