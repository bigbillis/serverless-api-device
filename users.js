const usersTable = process.env.USERS_TABLE;
class Users {
  constructor(db) {
    this.db = db;
  }

  async save(user) {
      await this.db.put({
        TableName: usersTable,
        Item: user,
        ConditionExpression: "attribute_not_exists(email)"
      }).promise();
  }
}
module.exports = Users;