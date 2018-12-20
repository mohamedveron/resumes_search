const express = require('express');
const app = express();
var elasticsearch = require('elasticsearch');
let fs = require('fs'),
PDFParser = require("pdf2json");
var formidable = require('formidable'); 
let pdfParser = new PDFParser(this,1);


app.listen(3000, function() {
  console.log('listening on 3000')
});

var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
});

client.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: 1000
}, function (error) {
  if (error) {
    console.trace('elasticsearch cluster is down!');
  } else {
    console.log('All is well');
  }
});

app.get('/', (req, res) => {
  console.log(__dirname);
  res.sendFile(__dirname + '/index.html')
  // Note: __dirname is directory that contains the JavaScript source code. Try logging it and see what you get!
  // Mine was '/Users/zellwk/Projects/demo-repos/crud-express-mongo' for this app.
})

app.post('/add', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.thumbnail.path;
      var newpath = __dirname + files.thumbnail.name ;

      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;
        // read cv and save it in txt file 
        pdfParser.on("pdfParser_dataError", errData => console.error("errData.parserError") );
        pdfParser.on("pdfParser_dataReady", pdfData => {
            fs.writeFile("file2.txt", pdfParser.getRawTextContent());
        });
    
        pdfParser.loadPDF(newpath);

        fs.readFile("file2.txt", 'utf8', function(err, data) {
            if (err) throw err;

            client.index({
              index: 'cvs',
              type: 'web',
              body: {
                name: 'samir',
                data: data
              }
            }, function (error, response) {

            });

          });

        res.write('File uploaded and moved!');
        res.end();
      });
 });
});
 
app.get('/searchAll', (req, res) => { 
  client.search({
      index: 'cvs',
      body: {
        query: {
          match_all: {} },
          size: 10
      }
    }).then(function (resp) {
        var hits = resp.hits.hits;
        console.log(hits);
        return res.json(hits);
    }, function (err) {
        console.trace(err.message);
    }); 
}) 
  

app.post('/search', (req, res) => { 
  var data = req;
  console.log(data.baseUrl);
  client.search({
      index: 'cvs',
      body: {
         query: { match: { "data": "srs" } }
      }
    }).then(function (resp) {
        var hits = resp.hits.hits;
        return res.json(hits);
    }, function (err) {
        console.trace(err.message);
    }); 
}) 

  