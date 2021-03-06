//Get modules.
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var app = express();
var nodemailer = require('nodemailer');
var DocumentClient = require('documentdb').DocumentClient;

// config for azure
var config = {
  endpoint: process.env.dbEndpoint,
  primaryKey: process.env.primaryKey,
  database: {
    id: "tfm-subscribers"
  },
  collection: {
    id: "subscriber"
  }
};

// database initialization
var DBclient = new DocumentClient(config.endpoint, {masterKey: config.primaryKey});

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: process.env.userAccount,
    pass: process.env.userPassword
  }
});

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//GET home page.
app.get('/', routes.index);

//POST signup form.
app.post('/signup', function(req, res) {
  var nameField = req.body.name,
      emailField = req.body.email,
      previewBool = req.body.previewAccess;
  signup(nameField, emailField, previewBool);
  res.send(200);
});

//Add signup form data to database.
function signup (nameSubmitted, emailSubmitted, previewPreference) {

  var data = {
    email: emailSubmitted,
    name: nameSubmitted,
    preview: previewPreference
  };

  DBclient.createDocument(config.endpoint, data, function(err) {
    if (err) {
      console.log('Error adding item to database: ', err);
    }
    console.log('Form data added to database.');

    // setup e-mail data
    var mailOptions = {
      from: process.env.userAccount, // sender address
      to: process.env.userAccount, // list of receivers
      subject: 'Subscribed to TFM', // Subject line
      text: 'User ' + nameSubmitted + ' subscribed with email: ' + emailSubmitted + ' .'
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(err){
      if(err){
        return console.log('Error sending email: ' + err);
      }
      console.log('Message sent successfully!');
    });

  });
}

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
