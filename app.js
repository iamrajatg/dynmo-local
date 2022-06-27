var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var AWS = require("aws-sdk");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();
AWS.config.update({
  region: "local",
  endpoint: "https://desolate-journey-13474.herokuapp.com",
});
const docClient = new AWS.DynamoDB.DocumentClient();
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// Get fingerprint record by id
app.get("/createfingerprint", (req, res, next) => {
  const params = {
    TableName: "BrowserFingerprint",
    KeySchema: [
      { AttributeName: "fingerprint", KeyType: "HASH" }, //Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: "fingerprint", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  var dynamodb = new AWS.DynamoDB();
  dynamodb.createTable(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to create table. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log(
        "Created table. Table description JSON:",
        JSON.stringify(data, null, 2)
      );
    }
  });
});

// Get fingerprint record by id
app.get("/fingerprint", (req, res, next) => {
  const fingerprint = req.query.id;
  const params = {
    TableName: "BrowserFingerprint",
    KeyConditionExpression: "fingerprint = :i",
    ExpressionAttributeValues: {
      ":i": fingerprint,
    },
  };
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  docClient.query(params, function (err, data) {
    if (err || !data.Items || !data.Items.length) {
      res.send({
        success: false,
        message: `Error: ${JSON.stringify(err)}`,
      });
    } else {
      console.log("data", data);
      const { Items } = data;
      res.send({
        success: true,
        data: Items[0],
      });
    }
  });
});

// Add new record
app.post("/fingerprint", (req, res, next) => {
  const { fingerprint, cid, usid, rememberMe_marked } = req.body;
  const params = {
    TableName: "BrowserFingerprint",
    Item: {
      fingerprint,
      cid,
      usid,
      rememberMe_marked,
    },
  };
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  docClient.put(params, function (err, data) {
    if (err) {
      res.send({
        success: false,
        message: `Error: ${JSON.stringify(err)}`,
      });
    } else {
      console.log("data", data);
      const { Items } = data;
      res.send({
        success: true,
        message: "BrowserFingerprint record added",
      });
    }
  });
});

// delete fingerprint by id
app.delete("/fingerprint", (req, res, next) => {
  const id = req.query.id;
  const params = {
    TableName: "BrowserFingerprint",
    Key: {
      fingerprint: id,
    },
  };
  console.log("deleting item");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  docClient.delete(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to delete item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
      res.send({
        success: false,
        message: `Error: ${JSON.stringify(err)}`,
      });
    } else {
      console.log("deleted");
      res.send({
        success: true,
        message: "Deleted Record",
      });
    }
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
