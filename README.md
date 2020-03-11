# mail checker
[![npm version](https://badge.fury.io/js/imap-checker.svg)](https://badge.fury.io/js/imap-checker)

Check the IMAP server and return the matching emails.

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
  timeout: 300,
  subject: '<subject>',
  to: 'john@gmail.com',
  from: 'bob@gmail.com',
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
  timeout: 300,
  subject: '<subject>',
  to: 'john@gmail.com',
  from: 'bob@gmail.com',
});

console.log('>>>', email));
```
