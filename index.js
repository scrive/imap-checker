const imaps = require('imap-simple');
const {simpleParser} = require('mailparser');
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
  timeout = 300000,
  interval = 2000,
  since = 3600 * 1000,
  debug = false,
} = {}) => {
  const logger = logging(debug);
  const config = {
    imap: imapConfig,
  };

  logger(`Connecting with parameters: ${JSON.stringify(config)} ...`);
  const connection = await imaps.connect(config);

  logger('Opening inbox ...');
  await connection.openBox('INBOX');

  const searchSince = new Date();
  searchSince.setTime(Date.now() - since);

  const searchCriteria = ['UNSEEN', ['SINCE', searchSince.toISOString()]];
  if (to) {
    searchCriteria.push(['TO', to]);
  }
  if (from) {
    searchCriteria.push(['FROM', from]);
  }
  if (subject) {
    searchCriteria.push(['SUBJECT', subject]);
  }
  const fetchOptions = {bodies: ['HEADER', 'TEXT', '']};

  const startTime = Date.now();
  while (true) {
    logger(`Searching criteria: ${JSON.stringify(searchCriteria)},`,
        `options: ${JSON.stringify(fetchOptions)} ...`);
    const messages = await connection.search(searchCriteria, fetchOptions);
    logger(`${messages.length} messages found.`);

    if (messages.length > 0) {
      const message = messages[0];
      const all = _.find(message.parts, {which: ''});
      const id = message.attributes.uid;
      const idHeader = `Imap-Id: ${id}\r\n`;

      const mail = await parse(idHeader + all.body);
      return mail;
    };

    const now = Date.now();
    if (now - startTime > timeout) {
      throw new Error(`TimeoutError: couln't find emails in ${timeout} ms.`);
    }

    await sleep(interval);
  }
};

exports.checkMail = imapChecker;
