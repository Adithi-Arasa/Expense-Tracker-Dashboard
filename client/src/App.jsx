import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api/expenses";

const categories = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
];

function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Food");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [period, setPeriod] = useState("All Time");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(API_URL);
      setExpenses(response.data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      showMessage("Could not load expenses.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async (e) => {
    e.preventDefault();

    if (!title.trim() || !amount) {
      showMessage("Please enter expense title and amount.", "error");
      return;
    }

    const numericAmount = Number(amount);

    if (numericAmount <= 0 || !Number.isFinite(numericAmount)) {
      showMessage("Please enter a valid amount.", "error");
      return;
    }

    try {
      const response = await axios.post(API_URL, {
        title: title.trim(),
        amount: numericAmount,
        category,
        date: new Date(),
      });

      setExpenses((prevExpenses) => [
        response.data,
        ...prevExpenses,
      ]);

      setTitle("");
      setAmount("");
      setCategory("Food");

      showMessage("Expense added successfully!");
    } catch (error) {
      console.error("Failed to add expense:", error);
      showMessage("Could not add expense.", "error");
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense._id);
    setEditTitle(expense.title);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditAmount("");
    setEditCategory("Food");
  };

  const updateExpense = async (id) => {
    if (!editTitle.trim() || !editAmount) {
      showMessage("Please enter expense title and amount.", "error");
      return;
    }

    const numericAmount = Number(editAmount);

    if (numericAmount <= 0 || !Number.isFinite(numericAmount)) {
      showMessage("Please enter a valid amount.", "error");
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/${id}`, {
        title: editTitle.trim(),
        amount: numericAmount,
        category: editCategory,
      });

      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense._id === id ? response.data : expense
        )
      );

      cancelEdit();
      showMessage("Expense updated successfully!");
    } catch (error) {
      console.error("Failed to update expense:", error);
      showMessage("Could not update expense.", "error");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);

      setExpenses((prevExpenses) =>
        prevExpenses.filter((expense) => expense._id !== id)
      );

      showMessage("Expense deleted successfully!");
    } catch (error) {
      console.error("Failed to delete expense:", error);
      showMessage("Could not delete expense.", "error");
    }
  };

  const getDateFromExpense = (expense) => {
    const date = new Date(expense.date);

    if (Number.isNaN(date.getTime())) {
      return new Date();
    }

    return date;
  };

  const isInSelectedPeriod = (expense) => {
    if (period === "All Time") {
      return true;
    }

    const expenseDate = getDateFromExpense(expense);
    const today = new Date();

    if (period === "This Month") {
      return (
        expenseDate.getMonth() === today.getMonth() &&
        expenseDate.getFullYear() === today.getFullYear()
      );
    }

    if (period === "Last 7 Days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      return expenseDate >= sevenDaysAgo;
    }

    return true;
  };

  const periodExpenses = expenses.filter(isInSelectedPeriod);

  const filteredExpenses = periodExpenses.filter((expense) => {
    const matchesSearch = expense.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "All" ||
      expense.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const totalExpense = periodExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  const highestExpense =
    periodExpenses.length > 0
      ? Math.max(
          ...periodExpenses.map((expense) =>
            Number(expense.amount)
          )
        )
      : 0;

  const averageExpense =
    periodExpenses.length > 0
      ? totalExpense / periodExpenses.length
      : 0;

  const categoryTotals = {};

  periodExpenses.forEach((expense) => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }

    categoryTotals[expense.category] += Number(expense.amount);
  });

  const categoryBreakdown = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const topCategory =
    categoryBreakdown.length > 0
      ? categoryBreakdown[0][0]
      : "None";

  const formatAmount = (value) => {
    return `₹${Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  const getCategoryIcon = (expenseCategory) => {
    switch (expenseCategory) {
      case "Food":
        return "🍔";
      case "Transport":
        return "🚌";
      case "Entertainment":
        return "🎬";
      case "Shopping":
        return "🛍️";
      case "Bills":
        return "💡";
      default:
        return "💰";
    }
  };

  return (
    <div className="app">

      {message && (
        <div className={`message ${messageType}`}>
          <span>
            {messageType === "success" ? "✓" : "!"}
          </span>
          {message}
        </div>
      )}

      <header className="header">
        <div>
          <h1>Expense Tracker</h1>
          <p>Manage and track your daily expenses</p>
        </div>

        <div className="total-box">
          <span>Total Expenses</span>
          <strong>{formatAmount(totalExpense)}</strong>
        </div>
      </header>

      <main className="dashboard">

        <section className="analytics-card">
          <div>
            <h2>Expense Analytics</h2>
            <p>
              View your spending based on a selected period
            </p>
          </div>

          <div className="period-control">
            <label>Period</label>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>All Time</option>
              <option>This Month</option>
              <option>Last 7 Days</option>
            </select>
          </div>
        </section>

        <section className="stats-container">

          <div className="stat-card">
            <div className="stat-icon stat-purple">💰</div>

            <div className="stat-content">
              <span>Total Expenses</span>
              <h2>{formatAmount(totalExpense)}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-blue">🧾</div>

            <div className="stat-content">
              <span>Transactions</span>
              <h2>{periodExpenses.length}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-red">🔥</div>

            <div className="stat-content">
              <span>Highest Expense</span>
              <h2>{formatAmount(highestExpense)}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-green">🗓️</div>

            <div className="stat-content">
              <span>{period}</span>
              <h2>{formatAmount(totalExpense)}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-cyan">📊</div>

            <div className="stat-content">
              <span>Average Expense</span>
              <h2>{formatAmount(averageExpense)}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-yellow">🏆</div>

            <div className="stat-content">
              <span>Top Category</span>
              <h2 className="category-value">
                {topCategory}
              </h2>
            </div>
          </div>

        </section>

        <section className="main-grid">

          <section className="card add-expense">

            <div className="card-heading">
              <h2>Add Expense</h2>
              <p>Add a new expense to your tracker</p>
            </div>

            <form onSubmit={addExpense}>

              <div className="form-group">
                <label>Expense Title</label>

                <input
                  type="text"
                  placeholder="e.g. Groceries"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Amount</label>

                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  min="0"
                  step="1"
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  onWheel={(e) => e.target.blur()}
                />
              </div>

              <div className="form-group">
                <label>Category</label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="add-btn"
              >
                + Add Expense
              </button>

            </form>

          </section>

          <section className="card expense-section">

            <div className="section-header">
              <div>
                <h2>Recent Expenses</h2>
                <p>
                  {filteredExpenses.length} transactions
                </p>
              </div>
            </div>

            <div className="filter-section">

              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />

              <select
                value={filterCategory}
                onChange={(e) =>
                  setFilterCategory(e.target.value)
                }
              >
                <option value="All">
                  All Categories
                </option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

            </div>

            {loading ? (
              <div className="empty">
                <h3>Loading expenses...</h3>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="empty">
                <h3>No matching expenses</h3>
                <p>
                  Try changing your search or category filter.
                </p>
              </div>
            ) : (
              <div className="expense-list">

                {filteredExpenses.map((expense) => (

                  <div
                    className="expense-item"
                    key={expense._id}
                  >

                    {editingId === expense._id ? (

                      <div className="edit-form">

                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) =>
                            setEditTitle(e.target.value)
                          }
                        />

                        <input
                          type="number"
                          value={editAmount}
                          min="0"
                          step="1"
                          onChange={(e) =>
                            setEditAmount(e.target.value)
                          }
                          onWheel={(e) =>
                            e.target.blur()
                          }
                        />

                        <select
                          value={editCategory}
                          onChange={(e) =>
                            setEditCategory(e.target.value)
                          }
                        >
                          {categories.map((item) => (
                            <option key={item}>
                              {item}
                            </option>
                          ))}
                        </select>

                        <div className="edit-actions">

                          <button
                            type="button"
                            className="save-btn"
                            onClick={() =>
                              updateExpense(expense._id)
                            }
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            className="cancel-btn"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>

                        </div>

                      </div>

                    ) : (

                      <>
                        <div className="expense-main">

                          <div className="expense-icon">
                            {getCategoryIcon(
                              expense.category
                            )}
                          </div>

                          <div className="expense-info">

                            <h3>{expense.title}</h3>

                            <p>
                              {expense.category}
                              <span>•</span>
                              {getDateFromExpense(
                                expense
                              ).toLocaleDateString("en-IN")}
                            </p>

                          </div>

                        </div>

                        <div className="expense-actions">

                          <strong>
                            {formatAmount(expense.amount)}
                          </strong>

                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() =>
                              startEdit(expense)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() =>
                              deleteExpense(expense._id)
                            }
                          >
                            Delete
                          </button>

                        </div>
                      </>

                    )}

                  </div>

                ))}

              </div>
            )}

          </section>

        </section>

        <section className="card category-section">

          <div className="category-heading">
            <h2>Category Breakdown</h2>
            <p>
              Spending breakdown for {period.toLowerCase()}
            </p>
          </div>

          {categoryBreakdown.length === 0 ? (

            <div className="empty">
              <h3>No category data available</h3>
              <p>
                Add some expenses to see your breakdown.
              </p>
            </div>

          ) : (

            <div className="category-list">

              {categoryBreakdown.map(
                ([categoryName, categoryAmount]) => {

                  const percentage =
                    totalExpense > 0
                      ? (categoryAmount / totalExpense) * 100
                      : 0;

                  return (
                    <div
                      className="category-item"
                      key={categoryName}
                    >

                      <div className="category-top">

                        <strong>
                          {categoryName}
                        </strong>

                        <strong>
                          {formatAmount(categoryAmount)}
                        </strong>

                      </div>

                      <div className="progress-bar">

                        <div
                          className="progress-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        ></div>

                      </div>

                      <div className="percentage">
                        {percentage.toFixed(1)}%
                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default App;