var imapChecker = require('./index')
const imapConfig = require('./credentials.json')

imapChecker.checkMail(imapConfig, {
  timeout: 300,
  subject: 'test123',
  to: 'systest.qa+test123@gmail.com',
  from: 'daniel.han@scrive.com',
})
.then(email => console.log('>>>', email))
.catch(err => console.error('++++', err))
