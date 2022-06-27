var AWS = require("aws-sdk");
AWS.config.update({
  region: "local",
  endpoint: "https://desolate-journey-13474.herokuapp.com",
});
var dynamodb = new AWS.DynamoDB();
var params = {
  TableName: "BrowserFingerprint",
  KeySchema: [
    { AttributeName: "fingerprint", KeyType: "HASH" }, //Partition key
  ],
  AttributeDefinitions: [{ AttributeName: "fingerprint", AttributeType: "S" }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};
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
