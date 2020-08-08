'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10'});
const util = require('./utilityFunctions.js');
const Devices = require('./devices');


// Create a device
module.exports.createDevice = async (event, context) => {
  if (!event.requestContext.authorizer) {
    return util.response(500, { error: 'Authorization not configured', reference: context.awsRequestId });
  }

  // Get the authenticated userID from cognito
  const userID = event.requestContext.authorizer.claims['cognito:username'];
  const reqBody = JSON.parse(event.body); 
  
  // Get properties from JSON body and creating object device that includes userID
  const device = {
    user_id: userID,
    sn: reqBody.sn,
    model_name: reqBody.model_name,
    device_name: reqBody.device_name,
    mac_address: reqBody.mac_address,
    createdAt: new Date().toISOString()
  };
  let devices = new Devices(db);
   // Save device and return success response
  try {
      await devices.save(device);
      return util.response(201, device);
  }
  catch (err) {
    // If SN already exists, return informative message to user
    console.log("Error", err);
    if (err.code == 'ConditionalCheckFailedException') {
      return util.response(err.statusCode, "Item with this SN already exists");
    }
      return util.response(err.statusCode, err);
  }
};

module.exports.getAllDevices = async (event, context) => {
  if (!event.requestContext.authorizer) {
    return util.response(500, { error: 'Authorization not configured', reference: context.awsRequestId });
  }
  const userID = event.requestContext.authorizer.claims['cognito:username'];
  const devices = new Devices(db);
  try {
    const res = await devices.getAll(userID);
    return util.response(200, res.Items.sort(util.sortByDate));
  }
  catch (err) {
    console.log("Error", err);
    return util.response(err.statusCode, err);
  }
};

// Get a single device
module.exports.getDevice = async (event, context) => {
  const sn = event.pathParameters.sn;
  if (!event.requestContext.authorizer) {
    return util.response(500, { error: 'Authorization not configured', reference: context.awsRequestId });
  }
  const userID = event.requestContext.authorizer.claims['cognito:username'];
  const devices = new Devices(db);
  try {
    const res = await devices.get(userID, sn);
    if (res.Item) 
      return util.response(200, res.Item);
    else 
      return util.response(404, { error: 'Device not found' });
  }
  catch (err) {
    console.log("Error", err);
    return util.response(err.statusCode, err);
  }
};

// Update a device
module.exports.updateDevice = async (event, context) => {
  if (!event.requestContext.authorizer) {
    return util.response(500, { error: 'Authorization not configured', reference: context.awsRequestId });
  }
  const userID = event.requestContext.authorizer.claims['cognito:username'];

  const reqBody = JSON.parse(event.body); 
  const sn = event.pathParameters.sn;
  const device = {
    model_name: reqBody.model_name,
    device_name: reqBody.device_name,
    mac_address: reqBody.mac_address
  };
  const devices = new Devices(db);
  try {
    const res = await devices.update(sn, userID, device);
    return util.response(200, res.Attributes);
  }
  catch (err) {
    console.log("Error", err);
    return util.response(err.statusCode, err);
  }
};

// Delete a device
module.exports.deleteDevice = async (event, context) => {
  const sn = event.pathParameters.sn;
  if (!event.requestContext.authorizer) {
    return util.response(500, { error: 'Authorization not configured', reference: context.awsRequestId });
  }
  const userID = event.requestContext.authorizer.claims['cognito:username'];
  const devices = new Devices(db);
  try {
    const res = await devices.delete(userID, sn);
    if (res.Attributes) 
      return util.response(200, { message: 'Device deleted successfully' });
    else 
      return util.response(404, { error: 'Device not found' });
  }
  catch (err) {
    console.log("Error", err);
    return util.response(err.statusCode, err);
  }
};