import FinanceAccount from "../models/FinanceAccount.js";

/*
|--------------------------------------------------------------------------
| Get All Accounts
|--------------------------------------------------------------------------
*/

export async function getAllAccounts() {
  return await FinanceAccount.find({
    archived: false,
  }).sort({
    createdAt: -1,
  });
}

/*
|--------------------------------------------------------------------------
| Get Account By ID
|--------------------------------------------------------------------------
*/

export async function getAccountById(id) {
  return await FinanceAccount.findById(id);
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

export async function updateAccount(id, data) {
  return await FinanceAccount.findByIdAndUpdate(
    id,
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

export async function archiveAccount(id) {
  return await FinanceAccount.findByIdAndUpdate(
    id,
    {
      archived: true,
    },
    {
      new: true,
    }
  );
}