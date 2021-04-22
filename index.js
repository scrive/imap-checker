import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import _ from 'lodash';

const sleep = ms => new Promise((resolve) => setTimeout(resolve, ms));

const parse = (source, options) => {
  return new Promise(resolve => {
    simpleParser(source, options, (err, parsed) => resolve(parsed));
  });
}

const imapChecker = async (imapConfig, {timeout, from, to, subject}) => {
    const config = {
      imap: imapConfig
    };

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT', ''] };

    const startTime = Date.now();

    while (true) {
      const messages = await connection.search(searchCriteria, fetchOptions);

      for (let index = 0; index < messages.length; index++) {
        const message = messages[index];
        const all = _.find(message.parts, { "which": "" })
        const id = message.attributes.uid;
        const idHeader = "Imap-Id: " + id + "\r\n";

        const mail = await parse(idHeader + all.body);

        let matched = true;
        if (from && from != mail.from.text) {
          matched = false;
        }

        if (to && to != mail.to.text) {
          matched = false;
        }

        if (subject && subject != mail.subject) {
          matched = false;
        }

        if (matched) {
          return mail;
        }
      }

      const now = Date.now();
      if (now - startTime > timeout) {
        throw new Error(`TimeoutError: couln't find emails in ${timeout}ms.`);
      }

      await sleep(1000);
    }
};

exports.checkMail = imapChecker;
