const mailNotifier = require('mail-notifier');

const imapChecker = (imapConfig, {timeout, from, to, subject}) => {
  return new Promise((resolve, reject) => {
    const notifier = mailNotifier(imapConfig);
    let timeoutFunc;

    notifier
      .on('mail', (mail) => {
        let matched = true;
        if (from && !mail.from.some((element) => element.address === from)) {
          matched = false;
        }
        if (to && !mail.to.some((element) => element.address === to)) {
          matched = false;
        }
        if (subject && !mail.subject.match(new RegExp(subject))) {
          matched = false;
        }
        if (matched) {
          clearTimeout(timeoutFunc);
          notifier.stop();
          resolve(mail);
        }
      })
      .on('connected', () => {
        timeoutFunc = setTimeout(() => {
          notifier.stop();
          console.log(`Timeout when checking for email from: '${from}' to: '${to}' with subject: '${subject}'`);
          resolve(null);
        }, timeout);
      })
      .on('error', (err) => {
        console.log(`Error when checking for email: ${err.message} \n\n ${err.stack}`);
        reject(err);
      })
      .start();
  });
};

exports.checkMail = imapChecker;
