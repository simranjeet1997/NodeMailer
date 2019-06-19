var express = require('express');
var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
const fs = require("fs");
var chartExporter = require("highcharts-export-server");

//
// Initialize the exporter
chartExporter.initPool();
const chartDetails = {
  type: "png",
  options: {
      chart: {
          type: "pie"
      },
      title: {
          text: "Heading of Chart"
      },
      plotOptions: {
          pie: {
              dataLabels: {
                  enabled: true,
                  format: "<b>{point.name}</b>: {point.y}"
              }
          }
      },
      series: [
          {
              data: [
                  {
                      name: "a",
                      y: 100
                  },
                  {
                      name: "b",
                      y: 20
                  },
                  {
                      name: "c",
                      y: 50
                  }
              ]
          }
      ]
  }
};

chartExporter.export(chartDetails, (err, res) => {
  // Get the image data (base64)
  let imageb64 = res.data;
  // Filename of the output
  let outputFile = "ajax.png";

  // Save the image to file
  fs.writeFileSync(outputFile, imageb64, "base64", function(err) {
      if (err) console.log(err);
  });

  console.log("Saved image!");
  chartExporter.killPool();
});

var app = express();
app.use(express.static('views/images')); 
var options = {
     viewEngine: {
         extname: '.hbs',
         layoutsDir: 'views/email/',
         defaultLayout : 'template',
         partialsDir : 'views/partials/'
     },
     viewPath: 'views/email/',
     extName: '.hbs'
 };

var dotenv = require('dotenv');
var cron = require('node-cron');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/MailingDbs';

dotenv.config();
var transporter = nodemailer.createTransport({
  service: 'gmail',
   auth: {
    user:  process.env.user ,
    pass:  process.env.pass
  }
});



MongoClient.connect(url, function(err, db){
  if (err) throw err;
   var dbo = db.db("MailerDetails");
   dbo.collection("MailingDbs").find({}).toArray(function(err, result) {
    if (err) throw err;
    //console.log(result);
    var maillist = [];
    for(var i=0; i<result.length;i++){
      maillist[i] = result[i].emailId;
    }




    cron.schedule('* * * * *', function(){
      console.log('Running');
      transporter.use('compile', hbs(options));
        var mailOptions = {
          from: process.env.from,
          to: maillist,
          cc: process.env.cc,
          subject: 'Trying To Send the Emails to all the email ids in database using Nodemailer',
          template: 'email.body',
          context: {
             variable1 : maillist.name,

            }
        };

       transporter.sendMail(mailOptions, function(error, info){
         if (error) {
           console.log(error);
         } else {
           console.log('Email sent: ');
           console.log(info);
         }
       });
     });

    db.close();

  });
});

