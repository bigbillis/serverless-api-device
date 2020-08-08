'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const util = require('./utilityFunctions.js');
const Users = require('./users');
// Create a user, from Cognito
module.exports.createUser = async (event, context) => {

  if (event.request.userAttributes.sub) {
    //we got the use data from Cognito, upon user registration, custom atrributes property starts with word custom:, We save the user in our DynamoDB table
  const user = {
    id: event.request.userAttributes.sub,
    email: event.request.userAttributes.email,
    address: event.request.userAttributes.address,
    phone_number: event.request.userAttributes.phone_number,
    country: event.request.userAttributes['custom:country'],
    company: event.request.userAttributes['custom:company'],
    createdAt: new Date().toISOString(),
  };
    let users = new Users(db);
    try {
      await users.save(user);
    }
    catch (err) {
      console.log("Error", err);
      return util.response(err.statusCode, err);
    }
    console.log("Success: Everything executed correctly");
    context.done(null, event);
  } else {
    // Nothing to do, the user's ID is unknown
    console.log("Error: Nothing was written to DDB or SQS, Please contact administrator");
    context.done(null, event);
  }
};