import express from 'express';
import { Client, middleware } from '@line/bot-sdk';

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const client = new Client(config);
const app = express();

// ユーザーの状態を追跡するオブジェクト
let userStates = {};

app.post('/', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(event => {
    const userId = event.source.userId;

    // postbackイベントの処理
    if (event.type === 'postback') {
      if (event.postback.data === 'yes') {
        // ユーザーが「はい」と回答した場合
        userStates[userId] = 'waiting_for_echo';
        return Promise.resolve(null);
      } else {
        // ユーザーが「いいえ」と回答した場合、またはその他のpostback
        userStates[userId] = 'normal';
        return Promise.resolve(null);
      }
    }

    // メッセージイベントの処理
    if (event.type === 'message' && event.message.type === 'text') {
      if (userStates[userId] === 'waiting_for_echo') {
        // おうむ返し待ちの場合
        setTimeout(() => {
          client.replyMessage(event.replyToken, {
            type: 'text',
            text: event.message.text // おうむ返し
          });
          userStates[userId] = 'normal'; // 状態をリセット
        }, 10000); // 10秒後
        return Promise.resolve(null);
      } else {
        // 通常の場合、はい/いいえのボタンを表示
        userStates[userId] = 'waiting_for_answer';
        return client.replyMessage(event.replyToken, {
          type: 'template',
          altText: 'はいまたはいいえを選択してください',
          template: {
            type: 'confirm',
            text: '続けますか？',
            actions: [
              {
                type: 'postback',
                label: 'はい',
                data: 'yes'
              },
              {
                type: 'postback',
                label: 'いいえ',
                data: 'no'
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
