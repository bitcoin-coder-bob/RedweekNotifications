// Stephen A. Friedman
// friedmansemail@gmail.com

// This is a text message notification service that sends links
// to new postings for the Marriott Aruba on Redweek.com

// Twilio is used to send the text messages
// Heroku hosts the service
const ENV_PORT= process.env.PORT;
const ENV_ACCOUNT_SID = process.env.accountSid;
const ENV_AUTH_TOKEN = process.env.authToken;
const ENV_FROM = process.env.from;
const ENV_TO = process.env.to;
const ENV_TO2 = process.env.to2;
const ENV_APP_URL = process.env.appURL;
const SURF_CLUB_URL = 'https://www.redweek.com/resort/P4872-marriotts-aruba-surf-club/rentals?sort-rentals=newest&amp;type=rentals&amp;sort=newest';
const OCEAN_CLUB_URL = 'https://www.redweek.com/resort/P148-marriotts-aruba-ocean-club/rentals?sort-rentals=newest&amp;type=rentals&amp;sort=newest';
const client = require('twilio')(ENV_ACCOUNT_SID, ENV_AUTH_TOKEN);
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var unique = require('array-unique');
var express = require('express');
var server = express();
var server_port = ENV_PORT  || 80;
var server_host = '0.0.0.0';
server.listen(server_port, server_host, function() {
    console.log('Listening on port %d', server_port);
});
var sendTexts = false;
var globalPostingsSurf = [];
var globalPostingsOcean = [];

function makeHttpObject() {
  try {return new XMLHttpRequest();}
  catch (error) {}
  try {return new ActiveXObject("Msxml2.XMLHTTP");}
  catch (error) {}
  try {return new ActiveXObject("Microsoft.XMLHTTP");}
  catch (error) {}

  throw new Error("Could not create HTTP request object.");
}

//determines if there are new postings and sends text
function comparePostings(globalPosts, newPosts, resort) {
  let textMessage = "";
  newPosts.forEach(function(newPost) {
    if(!globalPosts.includes(newPost)) {
      if(resort === "SURF_CLUB"){
        console.log("ADDED SURF---",newPost);
        globalPostingsSurf.push(newPost);
      }
      else if(resort === "OCEAN_CLUB"){
        console.log("ADDED OCEAN---",newPost);
        globalPostingsOcean.push(newPost);
      }
      else{
        console.log("RESORT_ERROR")
      }
     textMessage=textMessage.concat("https://www.redweek.com"+newPost+" \r\n")
   }
  });
  if(textMessage!="" && sendTexts) {
    textMessage=textMessage.concat(" "+resort);
    console.log("SENDING TEXT: "+textMessage);
    client.messages.create(
      {
        body: textMessage,
        to: ENV_TO,
        from: ENV_FROM
      },
      (err, message) => {
        process.stdout.write(message.sid);
      }
    );
    // client.messages.create(
    //   {
    //     body: textMessage,
    //     to: ENV_TO2,
    //     from: ENV_FROM
    //   },
    //   (err, message) => {
    //     process.stdout.write(message.sid);
    //   }
    // );
  }
  else{
    console.log("no new listings, no text message sent");
  }
}

function runner(url, global, resort){
  console.log(new Date().toLocaleString());
  var request = makeHttpObject();
  request.open("GET", url, true);
  request.send(null);
  request.onreadystatechange = function() {
    //gets the regex: /posting/R
    let regex = /\/posting\/R....../g;
    if (request.readyState == 4){
      let rawPostings = request.responseText.match(regex);
      //this sizing could be a problem if I keep using .push()
      let filtered = new Array(rawPostings);
      filtered = unique(rawPostings);
      comparePostings(global, filtered, resort);
    }
  };
  console.log("shouldnt reach this")
}

runner(SURF_CLUB_URL, globalPostingsSurf, "SURF_CLUB");
runner(OCEAN_CLUB_URL, globalPostingsOcean, "OCEAN_CLUB");

//runs program every 3 minutes
setInterval(function() {
  sendTexts=true;
  runner(SURF_CLUB_URL, globalPostingsSurf, "SURF_CLUB");
  console.log("SURF: ", globalPostingsSurf);
}, 15000);

setInterval(function(){
  sendTexts=true;
  runner(OCEAN_CLUB_URL, globalPostingsOcean, "OCEAN_CLUB");
  console.log("OCEAN: ", globalPostingsOcean);
}, 20000);