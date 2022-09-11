'use strict';
const config = require('./config.json');
const path = require('path');
const file = require('./file');
file.accesssyncdir(path.resolve(__dirname, config.logs_dir));
const bunyan = require('bunyan');
const RotatingFileStream = require('bunyan-rotating-file-stream');
const log = bunyan.createLogger({
  name: 'server',
  streams: [
    {
      level: 'info',
      type: 'raw',
      stream: new RotatingFileStream({
        path: config.logs_dir.concat('/server.log'),
        period: '1d', // daily rotation
        totalFiles: 10, // keep 10 back copies
        rotateExisting: true, // Give ourselves a clean file when we start up, based on period
        threshold: '10m', // Rotate log files larger than 10 megabytes
        totalSize: '20m', // Don't keep more than 20mb of archived log files
        gzip: true, // Compress the archive log files to save space
      }),
    },
  ],
  serializers: {
    req: bunyan.stdSerializers.req,
    res: bunyan.stdSerializers.res,
  },
});
process.on('uncaughtException', (err) => {
  log.error(`Uncaught exception. ${err}`);
});
const debugmysql = require('debug')('mysql');
const debugserver = require('debug')('server');

const handlebars = require("handlebars");

const Sequelize = require('sequelize');
const schemajs = require('./schema');
let schema;

const moment = require('moment');

const chokidar = require('chokidar');
const mailParser = require('mailparser').simpleParser;
file.accesssyncdir(path.resolve(__dirname, config.mails_dir_spam), log);
file.accesssyncdir(path.resolve(__dirname, config.mails_dir_error), log);

const nodemailer = require('nodemailer');
let transporter;
let pools = [];

const sequelize = new Sequelize('finance', config.bd_login, config.bd_password, {
  dialect: config.bd_dialect,
  host: config.bd_host,
  port: config.bd_port,
  logging: debugmysql.bind(),
  define: {
    timestamps: false,
  },
});

async function connect() {
  function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
  }
  let count = 0;
  for (;;) {
    try {
        await sequelize.authenticate();
        schema = new schemajs.Mysqlcontainer(sequelize);
        log.info('Connection to BD has been established successfully.');
        setInterval(() => checkoutmail(), 5000);
        transporter = nodemailer.createTransport({
          host: config.imap_host,
          port: config.imap_port,
          secure: true, // use TLS
          auth: {
              user: config.imap_user,
              pass: config.imap_password
          }
        });
        checkoutmail();
        chokidar.watch(config.mails_dir_inbox).on('all', (event, filename) => {
          if (event === 'add'){
            mailParser(file.createReadStream(filename))
              .then(mail_object => {
                InmailHandler(filename, mail_object);
              })
              .catch(err => {
              log.error('Error mailparser :', err);
            });
          }else{
            if (event === 'unlink'){
            }
          }
        });
        break;
    } catch(err) {
      count = count + 1;
      if (count === 5){
        log.error('Unable to connect to the database:', err);
        debugserver(err);
        break;
      }
      await sleep(3000);
    }
  }
}
connect();

function coderegistration(language){
  const template = `${language.toLowerCase()}/coderegister`;
  let subject;
  switch (language) {
    case 'ru':
      subject = `${config.companyname}: Код подтверждения для регистрации учетной записи`;
      break;
    case 'en':
      subject = `${config.companyname}: Confirmation code for account registration`;
      break;
    default:  subject = `${config.companyname}: Confirmation code for account registration`;
  }
  return {template: template, subject: subject};
}

function codepartnerbecome(language){
  const template = `${language.toLowerCase()}/codepartnerbecome`;
  let subject;
  switch (language) {
    case 'ru':
      subject = `${config.companyname}: Код подтверждения для перехода в статус "ПАРТНЕР"`;
      break;
    case 'en':
      subject = `${config.companyname}: Confirmation code for transition to the "PARTNER" status`;
      break;
    default:  subject = `${config.companyname}: Confirmation code for transition to the "PARTNER" status`;
  }
  return {template: template, subject: subject};
}

function codeoperation(language){
  const template = `${language.toLowerCase()}/codeoperation`;
  let subject;
  switch (language) {
    case 'ru':
      subject = `${config.companyname}: Код подтверждения для перевода средств`;
      break;
    case 'en':
      subject = `${config.companyname}: Confirmation code for funds transfer`;
      break;
    default:  subject = `${config.companyname}: Confirmation code for funds transfer`;
  }
  return {template: template, subject: subject};
}

function passwordreseted(language){
  const template = `${language.toLowerCase()}/passwordreseted`;
  let subject;
  switch (language) {
    case 'ru':
      subject = `${config.companyname}: Пароль сброшен`;
      break;
    case 'en':
      subject = `${config.companyname}: Password is reseted`;
      break;
    default:  subject = `${config.companyname}: Password is reseted`;
  }
  return {template: template, subject: subject};
}

function changepassword(language){
  const template = `${language.toLowerCase()}/changepassword`;
  let subject;
  switch (language) {
    case 'ru':
      subject = `${config.companyname}: Пароль изменен`;
      break;
    case 'en':
      subject = `${config.companyname}: Password is changed`;
      break;
    default:  subject = `${config.companyname}: Password is changed`;
  }
  return {template: template, subject: subject};
}

function codeverify(language){
  const template = `${language.toLowerCase()}/codeverify`;
  let subject;
  switch (language) {
    case 'ru':
      subject = `${config.companyname}: Код подтверждения`;
      break;
    case 'en':
      subject = `${config.companyname}: Confirmation code`;
      break;
    default:  subject = `${config.companyname}: Confirmation code`;
  }
  return {template: template, subject: subject};
}

function newpassword(language){
  const template = `${language.toLowerCase()}/temporarypassword`;
  let subject;
  switch (language) {
    case 'ru':
      subject = `${config.companyname}: Пароль акаунта`;
      break;
    case 'en':
      subject = `${config.companyname}: Password account`;
      break;
    default:  subject = `${config.companyname}: Password account`;
  }
  return {template: template, subject: subject};
}

function reciepter(language){
  const template = `${language.toLowerCase()}/receipt`;
  let subject;
  switch (language) {
    case 'RU':
      subject = `${config.companyname}: Благодарим за обращение`;
      break;
    case 'EN':
      subject = `${config.companyname}: Thank you for contacting`;
      break;
    default:  `${config.companyname}: Thank you for contacting`;
  }
  return {template: template, subject: subject};
}

function quotedelay(language){
  const template = `${language.toLowerCase()}/quotedelay`;
  let subject;
  switch (language) {
    case 'ru':
      subject = `${config.companyname}: Активация акаунта`;
      break;
    case 'en':
      subject = `${config.companyname}: Activation account`;
      break;
    default:  subject = `${config.companyname}: Activation account`;
  }
  return {template: template, subject: subject};
}

function message(language){
  const template = `${language.toLowerCase()}/message`;
  let subject;
  switch (language) {
    case 'ru':
      subject = `${config.companyname}: Сообщение`;
      break;
    case 'en':
      subject = `${config.companyname}: Message`;
      break;
    default:  subject = `${config.companyname}: Message`;
  }
  return {template: template, subject: subject};
}

function looksLikeMail(str) {
  return !!str && typeof str === 'string'
         && (/^([a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/.test(str.trim()));
}

const datetimeformat = function (value) {
  return moment(value).format('YY-MM-DD HH:mm:ss');
};

function InmailHandler(filename, mail_object) {
  if (looksLikeMail(mail_object.from.value[0].address)){
    schema.Client.findOne({ where: { EMAIL: mail_object.from.value[0].address } })
    .then((user) => {
      if (user) {
        const subject = mail_object.subject.slice(0, 128);
        const text = mail_object.text.slice(0, 1024);
        schema.Inmail.create({
          STATUS: 0,
          EMAIL: user.EMAIL,
          CLIENTFROM_ID: user.ID,
          SUBJECT: subject,
          CONTENT: text,
          IDEMPOTENCYKEY: datetimeformat(mail_object.date),
          COMMENT: null
        })
        .then(() => {
          file.unlinkFile(filename)
          .then (() => {
            const data = reciepter('EN');
            const item = {
              EMAIL: user.EMAIL,
              SUBJECT: data.subject,
              TEMPLATE: data.template,
              CONTENT: {"companyname": config.companyname, "companyteam": config.companyteam},
            };
            OutmailHandler(item, config.server_email.noreply);
          })
          .catch((err) => {
            log.error(err);
          });
        })
        .catch((err) => {
          log.error('Error: ' + filename + ' : ' + err);
          const error = filename.split('\\').pop().split('/').pop();
          file.moveFile(filename, path.join(config.mails_dir_error, error))
          .then(() => {})
          .catch((err) => {
            log.error(err);
          });
        });
      }else{
        const spam = filename.split('\\').pop().split('/').pop();
        file.moveFile(filename, path.join(config.mails_dir_spam, spam))
        .then(() => {
        })
        .catch((err) => {
          log.error(err);
        });
      }
    })
    .catch((err) => {
      log.error(err);
    });
  }
}

function checkoutmail(){
  schema.Outmail.findAll({ where: { STATUS: 0 } })
  .then((items) => {
    if(items.length > 0 ){
      items.forEach( (item) => {
        try{
          item.CONTENT = JSON.parse(item.CONTENT);
          Object.assign(item.CONTENT, {"companyname": config.companyname, "companyteam": config.companyteam, "companyemail": config.companyemail});
          let template;
          switch (item.SUBJECT) {
            case 'Password Reseted':
              template = passwordreseted(item.LANGUAGE);
              break;
            case 'Code Registration':
              template = coderegistration(item.LANGUAGE);
              break;
            case 'Code Changepassword':
                template = changepassword(item.LANGUAGE);
                break;
            case 'Temporary password':
                template = newpassword(item.LANGUAGE);
                break;
            case 'Code Partner become':
              template = codepartnerbecome(item.LANGUAGE);
              break;
            case 'Code operation':
                template = codeoperation(item.LANGUAGE);
                break;
            case 'Code verify':
                template = codeverify(item.LANGUAGE);
                break;
            case 'quote delay':
                template = quotedelay(item.LANGUAGE);
                break;
            case 'Message':
                template = message(item.LANGUAGE);
                break;
            default:  template = '';
          }
          if (template === ''){
            throw new Error('Template is missing');
          }else{
            item.TEMPLATE = template.template;
            item.SUBJECT = template.subject;
            OutmailHandler(item, config.server_email.support);
          }
        }
        catch(err) {
          log.error('Error email: ID: ' + item.ID + ' text: '+ err.message);
          schema.Outmail.update({STATUS: 3, COMMENT: err.message},
              { where: { ID: item.ID }}
            )
            .then(() => {})
            .catch((err) => {
              log.error(err);
            });
        }
      });
    }
  })
  .catch((err) => {
    log.error(err);
  });
}

function OutmailHandler(item, server) {
  const filePath = path.join(__dirname, `./templates/${item.TEMPLATE}.html`);
  const source = file.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);
  const htmlToSend = template(item.CONTENT);

  schema.Outmail.update({STATUS: 2},
    { where: { ID: item.ID }}
  )
  .then (() => {
    pools.push({ ID: item.ID,
      mailoptions : {
        from: server,
        to: item.EMAIL,
        subject: item.SUBJECT,
        html: htmlToSend
      }
    });
    if (pools.length  === 1){
      sendmail();
    }
  })
  .catch((err) => {
    log.error(err);
  });
}

function sendmail(){
  transporter.sendMail(pools[0].mailoptions,  (err, info) => {
    if(err){
      const error = err.message.slice(0, 1024);
      schema.Outmail.update({STATUS: 3, COMMENT: error},
            { where: { ID: pools[0].ID }}
      )
      .catch((err) => {
        log.error(err);
      });
    } else {
      const messageId = info.messageId.slice(0, 1024);
      schema.Outmail.update({STATUS: 1, COMMENT: messageId},
        { where: { ID: pools[0].ID }}
      )
      .catch((err) => {
        log.error(err);
      });
    }
    pools.shift();
    if (pools.length  > 0){
      sendmail();
    }
  })
}
