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

      // 10秒間、メッセージを無視する
      if (ignoreMessages[userId]) {
        return Promise.resolve(null);
      }

      if (userStates[userId] === 'waiting_for_reply') {
        userStates[userId] = 'normal';
        ignoreMessages[userId] = true;

        setTimeout(() => {
          if (waitingMessages[userId]) {
            client.replyMessage(event.replyToken, {
              type: 'text',
              text: waitingMessages[userId]
            });
            delete waitingMessages[userId];
          }
          delete ignoreMessages[userId];
        }, 10000); // 10秒後にオウム返し

        waitingMessages[userId] = event.message.text;
        return Promise.resolve(null);
      }

      if (userStates[userId] === 'waiting_for_yes') {
        if (event.message.text === 'はい') {
          userStates[userId] = 'waiting_for_reply';
          return Promise.resolve(null);
        } else if (event.message.text === 'いいえ') {
          userStates[userId] = 'normal';
          return Promise.resolve(null);
        }
      }

      // 初期状態または状態リセット後の処理
      userStates[userId] = 'waiting_for_yes';
      return client.replyMessage(event.replyToken, {
        type: 'template',
        altText: 'はい or いいえを選択してください',
        template: {
          type: 'confirm',
          text: '次のメッセージを10秒後におうむ返ししますか？',
          actions: [
            { type: 'message', label: 'はい', text: 'はい' },
            { type: 'message', label: 'いいえ', text: 'いいえ' }
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
