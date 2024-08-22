const express = require('express');
const app = express();
const con = require('./db');
const bcrypt = require('bcrypt');
app.use(express.json());


app.get('/password/:raw', (req,res)=>{
    const raw= req.params.raw;
    bcrypt.hash(raw, 10, (err, hash)=>{
        if(err){
            res.status(500).send('Hash error');
        }else{
            res.status(200).send(hash);
        }
    });
})

// Login
app.post('/login', (req, res)=>{
    const {username, password}= req.body;
    const sql= 'SELECt * FROM users WHERE username =?';
    con.query(sql, [username], (err, result)=>{
        if(err){
            res.status(500).send('DB error');
        }else if(result.length != 1){
            res.status(400).send('Wrong username');
        }else{
             const hash = result[0].password;
             bcrypt.compare(password, hash,(err, matched)=>{
                if(err){
                    res.status(500).send('Hashing error');
                }else if(!matched){
                    res.status(400).send('Wrong password');
                }else{
                    res.status(200).send(result);
                }
             })
        }
    })
})

// Show all expenses
app.post('/expenses', (req, res) => {
    const { userID } = req.body;

    // Query to get all expenses with formatted date and calculate total expenses
    const sql = `
    SELECT 
        id, 
        item, 
        paid, 
        DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.') AS date_part,
        LPAD(MICROSECOND(date) DIV 1000, 3, '0') AS milliseconds
    FROM expense ;
    `;

    const totalSql = `
    SELECT SUM(paid) AS total 
    FROM expense ;
    `;

    // Execute the first query to get expenses
    con.query(sql, [userID], (err, expensesResult) => {
        if (err) {
            res.status(500).send("Server error");
        } else if (expensesResult.length == 0) {
            res.status(400).send("No data to show");
        } else {
            // Combine date part and milliseconds
            expensesResult.forEach(expense => {
                expense.date = `${expense.date_part}${expense.milliseconds}`;
            });

            // Execute the second query to get the total expenses
            con.query(totalSql, [userID], (err, totalResult) => {
                if (err) {
                    res.status(500).send("Server error");
                } else {
                    // Send both the expenses and the total amount
                    res.status(200).send({
                        expenses: expensesResult,
                        total: totalResult[0].total || 0
                    });
                }
            });
        }
    });
});

// Today's expense
app.post('/expense', (req, res) => {
    const { userID } = req.body;

    // Query to get today's expenses with formatted date
    const expensesSql = `
    SELECT 
        id, 
        item, 
        paid, 
        DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.') AS date_part,
        LPAD(MICROSECOND(date) DIV 1000, 3, '0') AS milliseconds
    FROM expense 
    WHERE DATE(date) = CURDATE();
    `;

    // Query to get the total amount of today's expenses
    const totalSql = `
    SELECT SUM(paid) AS total 
    FROM expense 
    WHERE DATE(date) = CURDATE();
    `;

    // Execute the query to get today's expenses
    con.query(expensesSql, [userID], (err, expensesResult) => {
        if (err) {
            res.status(500).send("Server error");
        } else if (expensesResult.length == 0) {
            res.status(400).send("No data to show");
        } else {
            // Format the date correctly
            expensesResult.forEach(expense => {
                expense.date = `${expense.date_part}${expense.milliseconds}`;
            });

            // Execute the query to get the total amount spent today
            con.query(totalSql, [userID], (err, totalResult) => {
                if (err) {
                    res.status(500).send("Server error");
                } else {
                    // Send both the expenses and the total amount
                    res.status(200).send({
                        expenses: expensesResult,
                        total: totalResult[0].total || 0
                    });
                }
            });
        }
    });
});

// Search expense with formatted date and time including milliseconds
app.post('/searchExpense', (req, res) => {
    const { userID, toSearch } = req.body;
    // SQL query to format the date and time including milliseconds
    const sql = `
        SELECT 
            id, 
            item, 
            paid, 
            DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.') AS formatted_date_part,
            LPAD(MICROSECOND(date) DIV 1000, 3, '0') AS milliseconds
        FROM expense 
        WHERE user_id = ? 
        AND item LIKE ?;
    `;
    
    con.query(sql, [userID, `%${toSearch}%`], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Server error");
        } else if (result.length === 0) {
            res.status(400).send("No data to show");
        } else {
            // Format the date correctly including milliseconds
            result.forEach(expense => {
                expense.formatted_date = `${expense.formatted_date_part}${expense.milliseconds}`;
            });
            res.status(200).send(result);
        }
    });
});

// Add new expense
app.post('/addExpense', (req, res)=>{
    const {userID, item, paid} = req.body;
    let sql="INSERT INTO expense (user_id, item, paid, date) VALUES (?, ?, ?, now());";
    con.query(sql, [userID, item, paid ], (err, result)=>{
        if(err){
            console.log(err);
            res.status(500).send("Server error");
        }else{
            res.status(200).send(result);
        }
    })
})

// Delete an itme
app.delete("/expense", async (req, res) => {
    console.log(req.body);
    const { itemID, userID } = req.body;
    // check item
    const q1 = "SELECT id from expense WHERE id = ? AND user_id = ?";
    // delete itemId
    const q2 = "DELETE from expense WHERE id = ? AND user_id = ? ";
        con.query(q1, [itemID, userID], (err, result)=>{
            if(err){
                console.log(err);
                return res.status(500).json({
                    message: err.message,
                });
            }
            if(result.length!=1) {
                return res.status(401).json({
                    message: "Invalid item Id!",
                });
            }
            con.query(q2, [itemID, userID], (err, result)=>{
                if(err){
                    console.log(err);
                    return res.status(500).json({
                        message: err.message,
                    });
                }else{
                    return res.status(200).json({
                        message: "Deleted!",
                    });
                }
            });
        });
});


app.listen(3000, ()=>{
    console.log("Serveris running at port 3000");
})




