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

const imapChecker = async (imapConfig, {
  timeout = 300000,
  from,
  to,
  subject,
  interval = 2000,
} = {}) => {
  const config = {
    imap: imapConfig,
  };

  const connection = await imaps.connect(config);
  await connection.openBox('INBOX');

  const searchCriteria = ['UNSEEN'];
  const fetchOptions = {bodies: ['HEADER', 'TEXT', '']};

  const startTime = Date.now();

  while (true) {
    const messages = await connection.search(searchCriteria, fetchOptions);

    for (let index = 0; index < messages.length; index++) {
      const message = messages[index];
      const all = _.find(message.parts, {which: ''});
      const id = message.attributes.uid;
      const idHeader = `Imap-Id: ${id}\r\n`;

      const mail = await parse(idHeader + all.body);

      let matched = true;
      const senderAddress =
        addrs.parseOneAddress(mail.from.text).parts.address.semantic;
      if (from && from !== senderAddress) {
        matched = false;
      }

      const receiverAddress =
        addrs.parseOneAddress(mail.to.text).parts.address.semantic;
      if (to && to !== receiverAddress) {
        matched = false;
      }

      if (subject && subject !== mail.subject) {
        matched = false;
      }

      if (matched) {
        return mail;
      }
    }

    const now = Date.now();
    if (now - startTime > timeout) {
      throw new Error(`TimeoutError: couln't find emails in ${timeout} ms.`);
    }

    await sleep(interval);
  }
};

exports.checkMail = imapChecker;
