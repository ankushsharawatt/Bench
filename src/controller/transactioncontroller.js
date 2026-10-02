const transactionModel = require("../models/transcationmodel");
const ledgerModel = require("../models/ledgermodel");
const accountModel = require("../models/accountmodel");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res
      .status(400)
      .json({
        message:
          "FromAccount, toAccount, amount and idempotencyKey are required",
      });
  }

  const fromUserAccount = await accountModel.findById(fromAccount);
  const toUserAccount = await accountModel.findById(toAccount);

  if (!fromUserAccount || !toUserAccount) {
    return res
      .status(400)
      .json({ message: "Invalid fromAccount or toAccount" });
  }

  // Validate idempotency key
  const existingTransaction = await transactionModel.findOne({
    idempotencyKey,
  });
  if (existingTransaction) {
    const statusMessages = {
      COMPLETED: "Transaction already processed",
      PENDING: "Transaction is still processing",
      FAILED: "Transaction processing failed, please retry",
      REVERSED: "Transaction was reversed, please retry",
    };

    return res
      .status(existingTransaction.status === "COMPLETED" ? 200 : 500)
      .json({
        message:
          statusMessages[existingTransaction.status] || "Transaction exists",
        transaction:
          existingTransaction.status === "COMPLETED"
            ? existingTransaction
            : undefined,
      });
  }

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res
      .status(400)
      .json({ message: "Both fromAccount and toAccount must be ACTIVE" });
  }

  let transaction;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Derive sender balance INSIDE the transaction session
    const balance = await fromUserAccount.getBalance(session);

    if (balance < amount) {
      throw new Error(`INSUFFICIENT_FUNDS:${balance}`);
    }

    // 5. Create transaction safely using 'new' instead of '.create()'
    transaction = new transactionModel({
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
      status: "COMPLETED", // Can mark completed instantly if we aren't waiting for external APIs
    });
    await transaction.save({ session });

    // 6. Create Debit
    const debitLedgerEntry = new ledgerModel({
      account: fromAccount,
      amount: amount,
      transaction: transaction._id,
      type: "DEBIT",
    });
    await debitLedgerEntry.save({ session });

    // 7. Create Credit
    const creditLedgerEntry = new ledgerModel({
      account: toAccount,
      amount: amount,
      transaction: transaction._id,
      type: "CREDIT",
    });
    await creditLedgerEntry.save({ session });

    // 9. Commit MongoDB session
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();

    console.error("🚨 Transaction Error Details:", error);

    if (error.message.startsWith("INSUFFICIENT_FUNDS")) {
      const balance = error.message.split(":")[1];
      return res
        .status(400)
        .json({
          message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`,
        });
    }

    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Transaction already processing" });
    }

    return res
      .status(500)
      .json({
        message: "Transaction failed and was rolled back",
        error: error.message,
      });
  } finally {
    session.endSession();
  }

  // 10. Send email notification
  try {
    await emailService.sendTransactionEmail(
      req.user.email,
      req.user.name,
      amount,
      toAccount,
    );
  } catch (emailError) {
    console.error("Email notification failed:", emailError);
  }

  return res.status(201).json({
    message: "Transaction completed successfully",
    transaction,
  });
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res
      .status(400)
      .json({ message: "toAccount, amount and idempotencyKey are required" });
  }

  const toUserAccount = await accountModel.findById(toAccount);
  const fromUserAccount = await accountModel.findOne({ user: req.user._id });

  if (!toUserAccount || !fromUserAccount) {
    return res
      .status(400)
      .json({ message: "Invalid system or target account" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const transaction = new transactionModel({
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status: "COMPLETED",
    });
    await transaction.save({ session });

    const debitLedger = new ledgerModel({
      account: fromUserAccount._id,
      amount: amount,
      transaction: transaction._id,
      type: "DEBIT",
    });
    await debitLedger.save({ session });

    const creditLedger = new ledgerModel({
      account: toAccount,
      amount: amount,
      transaction: transaction._id,
      type: "CREDIT",
    });
    await creditLedger.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      message: "Initial funds transaction completed successfully",
      transaction,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("🚨 System Funding Error Details:", error); // Logs actual DB errors

    if (error.code === 11000) {
      return res
        .status(409)
        .json({
          message: "Transaction with this idempotency key already exists",
        });
    }
    return res.status(500).json({
      message: "System funding failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
}

module.exports = {
  createTransaction,
  createInitialFundsTransaction,
};