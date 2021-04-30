# mail checker
[![npm version](https://badge.fury.io/js/imap-checker.svg)](https://badge.fury.io/js/imap-checker)

Check the IMAP server and return the first matching email.

## How to use

```javascript
var imapChecker = require('imap-checker');

const imapConfig = {
  user: "user@gmail.com",
  password: "password",
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

imapChecker.checkMail(imapConfig, {
  timeout: 30000,
  subject: '<subject>',
  to: 'john@gmail.com',
  from: 'bob@gmail.com',
  interval: 2000
})
.then(email => console.log('>>>', email));
```

Or in ES6:
```javascript
import imapChecker from 'imap-checker';

const imapConfig = {
  user: "user@gmail.com",
  password: "password",
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

const email = await imapChecker.checkMail(imapConfig, {
  timeout: 30000,
  subject: '<subject>',
  to: 'john@gmail.com',
  from: 'bob@gmail.com',
  interval: 2000,
  since: 24 * 3600 * 1000,
  debug: true
});

console.log('>>>', email);
```

Different formats of email addresses are supported. For example, if you are looking for emails with sender's address as `Joe Doe <joe@example.com>`, just search it as `joe@example.com`.
