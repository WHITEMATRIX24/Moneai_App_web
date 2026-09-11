import FinanceAccount from "../models/FinanceAccount.js";

/*
|--------------------------------------------------------------------------
| Get All Accounts
|--------------------------------------------------------------------------
*/

export async function getAllAccounts(userId) {
  const query = { archived: false };
  if (userId) query.userId = userId;

  return await FinanceAccount.find(query).sort({
    createdAt: -1,
  });
}

/*
|--------------------------------------------------------------------------
| Get Account By ID
|--------------------------------------------------------------------------
*/

export async function getAccountById(id, userId) {
  const query = { _id: id };
  if (userId) query.userId = userId;

  return await FinanceAccount.findOne(query);
}

/*
|--------------------------------------------------------------------------
| Create Account
|--------------------------------------------------------------------------
*/

export async function createAccount(data) {
  return await FinanceAccount.create(data);
}

/*
|--------------------------------------------------------------------------
| Update Account
|--------------------------------------------------------------------------
*/

export async function updateAccount(id, data, userId) {
  const query = { _id: id };
  if (userId) query.userId = userId;

  return await FinanceAccount.findOneAndUpdate(
    query,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
}

/*
|--------------------------------------------------------------------------
| Archive Account
|--------------------------------------------------------------------------
*/

export async function archiveAccount(id, userId) {
  const query = { _id: id };
  if (userId) query.userId = userId;

  return await FinanceAccount.findOneAndUpdate(
    query,
    {
      archived: true,
    },
    {
      new: true,
    }
  );
}