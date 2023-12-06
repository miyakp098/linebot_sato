import express from 'express';
import { Client, middleware } from '@line/bot-sdk';

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const client = new Client(config);
const app = express();

// ユーザーの状態を管理するオブジェクト
const userStates = {};

app.post('/', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;

      if (userStates[userId] === 'waiting_for_reply') {
        // 10秒後におうむ返し
        setTimeout(() => {
            userStates[userId] = 'waiting_for_reply';
          }, 10000);
      }

      if (userStates[userId] === 'waiting_for_yes') {
        // 「はい」と答えた場合の処理
        if (event.message.text === 'はい') {
          userStates[userId] = 'waiting_for_reply';
        }else if(event.message.text === 'いいえ') {
            userStates[userId] = 'normal';
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
            {
              type: 'message',
              label: 'はい',
              text: 'はい'
            },
            {
              type: 'message',
              label: 'いいえ',
              text: 'いいえ'
            }
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
