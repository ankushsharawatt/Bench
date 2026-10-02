const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Account must be associated with user"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status can be ACTIVE, FROZEN, or CLOSED",
      },
      default: "ACTIVE",
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "INR",
    },
  },
  {
    timestamps: true,
  },
);

accountSchema.index({ user: 1, status: 1 });

// ADDED: Optional 'session' parameter
accountSchema.methods.getBalance = async function (session = null) {
  // Fetch Ledger dynamically to avoid circular dependencies
  const Ledger = mongoose.model("ledger");

  const pipeline = [
    { $match: { account: this._id } },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: { $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0] },
        },
        totalCredit: {
          $sum: { $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        balance: { $subtract: ["$totalCredit", "$totalDebit"] },
      },
    },
  ];

  // Create the aggregate query
  let aggregateQuery = Ledger.aggregate(pipeline);

  // If a session was passed (e.g., from the transaction controller), attach it!
  if (session) {
    aggregateQuery = aggregateQuery.session(session);
  }

  const balanceData = await aggregateQuery;

  if (balanceData.length === 0) {
    return 0;
  }

  return balanceData[0].balance;
};

const accountModel = mongoose.model("account", accountSchema);
module.exports = accountModel;
