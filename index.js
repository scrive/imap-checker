const imaps = require('imap-simple');
const {simpleParser} = require('mailparser');
const addrs = require('email-addresses');
const _ = require('lodash');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parse = (source, options) => new Promise((resolve, reject) => {
  simpleParser(source, options, (err, parsed) => {
    if (err) {
      reject(err);
    } else {
      resolve(parsed);
    }
  });
});

const logging = (enabled) => {
  if (enabled) {
    return console.log;
  };

  return () => {};
};

const imapChecker = async (imapConfig, {
  from,
  to,
  subject,
  since = 3600 * 1000,
  timeout = 300000,
  interval = 2000,
  debug = false,
} = {}) => {
  const logger = logging(debug);

  const config = {
    imap: imapConfig,
  };

  logger(`Connecting with parameters: ${JSON.stringify(config)}`);

  const connection = await imaps.connect(config).catch();
  await connection.openBox('INBOX');

  const startTime = new Date();

  const hourAgo = new Date();
  hourAgo.setTime(Date.now() - since);

  const searchCriteria = ['UNSEEN', ['SINCE', hourAgo.toISOString()]];
  const fetchOptions = {bodies: ['HEADER.FIELDS (FROM TO SUBJECT)']};

  logger(`Criteria: ${JSON.stringify(searchCriteria)}`);
  logger(`Options: ${JSON.stringify(fetchOptions)}`);

  let messageId = null;

  outerLoop:
  while (true) {
    logger(`Searching ...`);
    const messages = await connection.search(searchCriteria, fetchOptions);
    const numberOfMessages = messages.length;
    logger(`${numberOfMessages} emails found.`);

    innerLoop:
    for (let index = 0; index < numberOfMessages; index++) {
      const message = messages[index];
      const msgInfo = _.find(message.parts,
          {which: 'HEADER.FIELDS (FROM TO SUBJECT)'});
      logger(`Found ${index}/${numberOfMessages}: ${JSON.stringify(msgInfo)}`);

      const messageSender = msgInfo.body.from[0];
      const messageReceiver = msgInfo.body.to[0];
      const messageSubject = msgInfo.body.subject;

      let matched = true;
      const senderAddress =
        addrs.parseOneAddress(messageSender).parts.address.semantic;

      if (from && from !== senderAddress) {
        matched = false;
      }

      const receiverAddress =
        addrs.parseOneAddress(messageReceiver).parts.address.semantic;

      if (to && to !== receiverAddress) {
        matched = false;
      }

      if (subject && subject !== messageSubject) {
        matched = false;
      }

      if (matched) {
        messageId = message.attributes.uid;
        break outerLoop;
      }
    }

    const now = Date.now();
    if (now - startTime > timeout) {
      throw new Error(`TimeoutError: couln't find emails in ${timeout} ms.`);
    }

    logger(`Retry in ${interval} ms`);
    await sleep(interval);
  }

  if (messageId) {
    const searchCriteria = [['UID', messageId]];
    const messages = await connection.search(searchCriteria,
        {bodies: ['HEADER', 'TEXT', '']});
    logger(`${messages.length} emails found.`);

    const message = messages[0];
    const all = _.find(message.parts, {which: ''});
    const idHeader = `Imap-Id: ${messageId}\r\n`;
    const mail = await parse(idHeader + all.body);

    logger('Found mail:', JSON.stringify(mail));
    return mail;
  }
};

exports.checkMail = imapChecker;
