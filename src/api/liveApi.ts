// import { GoogleGenAI, Modality } from '@google/genai';

// const ai = new GoogleGenAI({});
// const model = 'gemini-live-2.5-flash-preview';
// const config = { responseModalities: [Modality.TEXT] };

// async function live() {
//   const responseQueue = [];

//   async function waitMessage() {
//     let done = false;
//     let message = undefined;
//     while (!done) {
//       message = responseQueue.shift();
//       if (message) {
//         done = true;
//       } else {
//         await new Promise((resolve) => setTimeout(resolve, 100));
//       }
//     }
//     return message;
//   }

//   async function handleTurn() {
//     const turns = [];
//     let done = false;
//     while (!done) {
//       const message = await waitMessage();
//       turns.push(message);
//       if (message.serverContent && message.serverContent.turnComplete) {
//         done = true;
//       }
//     }
//     return turns;
//   }

//   const session = await ai.live.connect({
//     model: model,
//     callbacks: {
//       onopen: function () {
//         console.debug('Opened');
//       },
//       onmessage: function (message) {
//         responseQueue.push(message);
//       },
//       onerror: function (e) {
//         console.debug('Error:', e.message);
//       },
//       onclose: function (e) {
//         console.debug('Close:', e.reason);
//       },
//     },
//     config: config,
//   });

//   const inputTurns = 'Hello how are you?';
//   session.sendClientContent({ turns: inputTurns });

//   const turns = await handleTurn();
//   for (const turn of turns) {
//     if (turn.text) {
//       console.debug('Received text: %s\n', turn.text);
//     }
//     else if (turn.data) {
//       console.debug('Received inline data: %s\n', turn.data);
//     }
//   }

//   session.close();
// }

// async function main() {
//   await live().catch((e) => console.error('got error', e));
// }

// main();
