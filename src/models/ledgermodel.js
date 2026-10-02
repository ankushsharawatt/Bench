const mongoose = require("mongoose");

const LedgerSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "account is required"],
      index: true,
      immutable: true,
    },

    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transaction",
      required: [true, "transaction is required"],
      index: true,
      immutable: true,
    },

    amount: {
      type: Number,
      required: [true, "amount is required"],
      min: [0.01, "amount must be greater than zero"],
      immutable: true,
    },

    type: {
      type: String,
      enum: {
        values: ["CREDIT", "DEBIT"],
        message: "type must be CREDIT or DEBIT",
      },
      required: [true, "type is required"],
      immutable: true,
    },
  },
  {
    timestamps: true, // creates immutable createdAt audit log
  },
);
LedgerSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function () {
  throw new Error("Ledger entries are immutable and cannot be updated.");
});

// Prevent any delete operations
LedgerSchema.pre(
  ["findOneAndDelete", "deleteOne", "deleteMany", "findOneAndRemove"],
  function () {
    throw new Error("Ledger entries are immutable and cannot be deleted.");
  },
);

const ledgerModel = mongoose.model("ledger", LedgerSchema);

module.exports = ledgerModel;
