const http = require("http");
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:example@example.com',
  'EXAMPLE',
  'EXAMPLE'
);

const host = '127.0.0.1';
const port = 5000;

const requestListener = function (req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method != 'POST' || req.url != '/_matrix/push/v1/notify') {
    res.writeHead(400);
    res.end();
    return;
  }

  var body = ''

  req.on('data', function(data) {
    body += data
    console.log('Partial body: ' + body)
  })
  req.on('end', function() {
    console.log('Body: ' + body)
    try {
      data = JSON.parse(body)
      pk = JSON.parse(data.notification.devices[0].pushkey)
      console.log(pk.endpoint)
      webpush.sendNotification(pk, JSON.stringify(data.notification), {
        contentEncoding: 'aesgcm'
      })
             .then(data => {
                 console.log("notification sent")
                 res.writeHead(200, {'Content-Type': 'application/json'})
                 res.end('[]')
             })
             .catch(err => {
                 console.log("notification error: " + err)
                 msg = { rejected: [] }
                 msg.rejected.push(data.notification.devices[0].pushkey)
                 res.writeHead(200, {'Content-Type': 'application/json'})
                 console.log(JSON.stringify(msg))
                 res.end(JSON.stringify(msg))
             })
    } catch (e) {
      console.log("Error: " + e)
      res.writeHead(500)
      res.end()
    }
  })
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

