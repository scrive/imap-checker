
const mailNotifier = require('mail-notifier');

const mailChecker = (imapConfig, { timeout, from, to, subject }) => {
  return new Promise((resolve, reject) => {
    const notifier = mailNotifier(imapConfig);

    const startTime = Date.now();
    let found = false;

    notifier.on('end', () => {
      var currentTime = Date.now()
      if (currentTime - startTime > timeout * 1000 ) {
        resolve(null);
      } else if (!found) {
        notifier.start();
      }
    })
    .on('mail', mail => {
      let matched = true;
      if (from && ! mail.from.find(element => element.address === from)) {
        matched = false;
      }
      if (to && ! mail.to.find(element => element.address === to)) {
        matched = false;
      }
      if (subject && ! mail.subject.match(new RegExp(subject))) {
        matched = false;
      }
      found = matched ? true : false;
      resolve(mail);
    })
    .on('connected', () => {
      setTimeout(() => {
        notifier.stop();
      }, 2000)
    })
    .on('error', err => console.log('>>>> error', error))
    .start();
  })
}

exports.checkMail = mailChecker;
