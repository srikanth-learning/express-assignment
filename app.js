const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const formatDate = require("date-fns/format");
var isValid = require("date-fns/isValid");
var toDate = require("date-fns/toDate");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

// connecting to bd
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertRequestsQueries = async (req, res, next) => {
  const { status, priority, category, search_q, date } = req.query;
  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const isStatusAvailable = statusArray.includes(status);
    if (isStatusAvailable === true) {
      req.status = status;
    } else {
      res.status(400);
      res.send("Invalid Todo Status");
      return;
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "LOW", "MEDIUM"];
    const isPriorityAvailable = priorityArray.includes(priority);
    if (isPriorityAvailable === true) {
      req.priority = priority;
    } else {
      res.status(400);
      res.send("Invalid Todo Priority");
      return;
    }
  }
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const isCategoryArray = categoryArray.includes(category);
    if (isCategoryArray === true) {
      req.category = category;
    } else {
      res.status(400);
      res.send("Invalid Todo Category");
      return;
    }
  }
  if (date !== undefined) {
    try {
      const newDate = formatDate(new Date(date), "yyyy-MM-dd");
      const isValidDate = await isValid(new Date(newDate));
      if (isValidDate === true) {
        req.date = newDate;
      } else {
        res.status(400);
        res.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      res.status(400);
      res.send("Invalid Due Date");
      return;
    }
  }

  req.search_q = search_q;
  next();
};

const convertRequestsBody = async (req, res, next) => {
  const { status, priority, category, todo, dueDate, id } = req.body;
  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const isStatusAvailable = statusArray.includes(status);
    if (isStatusAvailable === true) {
      req.status = status;
    } else {
      res.status(400);
      res.send("Invalid Todo Status");
      return;
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "LOW", "MEDIUM"];
    const isPriorityAvailable = priorityArray.includes(priority);
    if (isPriorityAvailable === true) {
      req.priority = priority;
    } else {
      res.status(400);
      res.send("Invalid Todo Priority");
      return;
    }
  }
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const isCategoryArray = categoryArray.includes(category);
    if (isCategoryArray === true) {
      req.category = category;
    } else {
      res.status(400);
      res.send("Invalid Todo Category");
      return;
    }
  }
  if (dueDate !== undefined) {
    try {
      const newDate = formatDate(new Date(dueDate), "yyyy-MM-dd");
      const isValidDate = await isValid(new Date(newDate));
      if (isValidDate === true) {
        req.dueDate = newDate;
      } else {
        res.status(400);
        res.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      res.status(400);
      res.send("Invalid Due Date");
      return;
    }
  }
  req.id = id;
  req.todo = todo;
  next();
};

//changing the keys
const convertKeys = (list) => {
  const changelist = list.map((element) => {
    return {
      id: element.id,
      todo: element.todo,
      priority: element.priority,
      status: element.status,
      category: element.status,
      dueDate: element.due_date,
    };
  });
  return changelist;
};

// API 1 GET List of todos
app.get("/todos/", convertRequestsQueries, async (req, res) => {
  const { category, priority, status, search_q = " " } = req;
  let getTodoQuery = null;
  switch (true) {
    case status !== undefined && priority !== undefined:
      getTodoQuery = `
        SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`;
      break;
    case category !== undefined && status !== undefined:
      getTodoQuery = `
        SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`;
      break;
    case category !== undefined && priority !== undefined:
      getTodoQuery = `
        SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
      break;
    case category !== undefined:
      getTodoQuery = `
        SELECT * FROM todo WHERE category = '${category}';`;
      break;
    case priority !== undefined:
      getTodoQuery = `
        SELECT * FROM todo WHERE priority = '${priority}';`;
      break;
    case status !== undefined:
      getTodoQuery = `
        SELECT * FROM todo WHERE status = '${status}';`;
      break;
    default:
      getTodoQuery = `
        SELECT * FROM todo WHERE todo = '${search_q}';`;
      break;
  }
  const todosList = await db.all(getTodoQuery);
  const todosListCon = convertKeys(todosList);
  res.send(todosListCon);
});

// API 2 GET TODO with id
app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const getTodoIDQuery = `
  SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE id = ${todoId};`;
  const todo = await db.get(getTodoIDQuery);
  res.send(todo);
});

// API #3 agenda
app.get("/agenda/", async (req, res) => {
  try {
    const { date } = req.query;
    let isDDValid = await isValid(new Date(date));
    if (isDDValid === true) {
      const newDate = formatDate(new Date(date), "yyyy-MM-dd");
      const getAgendaQuery = `
          SELECT * FROM todo WHERE due_date = '${newDate}';`;
      const agendaData = await db.all(getAgendaQuery);
      const agendaDataCon = convertKeys(agendaData);
      res.send(agendaDataCon);
    } else {
      res.status(400);
      res.send("Invalid Due Date");
    }
  } catch (e) {
    res.status(400);
    res.send("Invalid Due Date");
  }
});

//API 4 POST
app.post("/todos/", convertRequestsBody, async (req, res) => {
  const { id, todo, category, priority, status, dueDate } = req;
  const newDate = formatDate(new Date(dueDate), "yyyy-MM-dd");
  const insertDataQuery = `
    INSERT INTO todo (id, todo, category, priority, status, due_date)
    VALUES (${id}, '${todo}', '${category}', '${priority}', '${status}', '${newDate}');`;
  await db.run(insertDataQuery);
  res.send("Todo Successfully Added");
});

//API 5 PUT (Update) with id
app.put("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const { todo, priority, status, category, dueDate } = req.body;

  switch (true) {
    case todo !== undefined:
      const updateQuery = `
            UPDATE todo SET todo = '${todo}'WHERE id = ${todoId};`;
      await db.run(updateQuery);
      res.send("Todo Updated");
      break;
    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        const updateQuery = `
            UPDATE todo SET status = '${status}'WHERE id = ${todoId};`;
        await db.run(updateQuery);
        res.send("Status Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Status");
      }
      break;
    case priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        const updateQuery = `
            UPDATE todo SET priority = '${priority}'WHERE id = ${todoId};`;
        await db.run(updateQuery);
        res.send("Priority Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
      break;
    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const updateQuery = `
            UPDATE todo SET category = '${category}'WHERE id = ${todoId};`;
        await db.run(updateQuery);
        res.send("Category Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;
    case dueDate !== undefined:
      try {
        const newDate = formatDate(new Date(dueDate), "yyyy-MM-dd");
        if (await isValid(new Date(newDate))) {
          const updateQuery = `
            UPDATE todo SET due_date = '${newDate}'WHERE id = ${todoId};`;
          await db.run(updateQuery);
          res.send("Due Date Updated");
        } else {
          res.status(400);
          res.send("Invalid Due Date");
        }
      } catch (e) {
        res.status(400);
        res.send("Invalid Due Date");
      }
    default:
      break;
  }
});

//API 6 DELETE
app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const deleteQuery = `
    DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  res.send("Todo Deleted");
});

module.exports = app;
