import express from 'express';
import { db } from './db.js';

const app = express();
app.use(express.json())
const PORT = 3000;

// get user
app.get('/users',(req, res) => {
    const query = "SELECT * FROM accounts";
    db.query(query)
        .then(user => {
            res.status(200).json({user: user.rows});
        });
    
});


// get-titles
app.get('/get-titles',(req, res) => {
    const query = "SELECT * FROM titles";
    db.query(query)
        .then(titles => {
            res.status(200).json({titles: titles.rows});
        });
    
});

// get-list
app.get('/get-list',(req, res) => {
    const query = "SELECT * FROM lists";
    db.query(query)
        .then(lists => {
            res.status(200).json({lists: lists.rows});
        });
    
});

app.post('/check-user',(req, res) => {
    const { username, password } = req.body;

    const query = "SELECT * FROM accounts WHERE username=$1 AND password=$2 ";

    db.query(query,[username, password])
    .then(result => {
        if(result.rowCount > 0){
            res.status(200).json({ exist: true});
        }

        else{
            res.status(200).json({ exist: false});
        }
    })
})

//add register
app.post('/register', (req, res) => {
    const { username, password, fname, lname } = req.body;

    const query ="INSERT INTO accounts ( username, password, fname, lname) VALUES ($1,$2,$3,$4)";
    db.query(query, [username, password, fname, lname])
    .then(result => {
        res.status(200).json({ success: true});
    });
});

//index 
/*app.get('/',(req, res) => {
    res.send('hello world');
});

app.get('/to-do',(req, res) => {
    res.send('This is to-do homepage');
});*/

//add-titles
/* app.post('/add-titles',(req, res) => {
    const { id, username, title, date_modified, status } = req.body;

    const query ="INSERT INTO titles (id, username, title, date_modified, status) VALUES ($1,$2,$3,$4,$5)";
    db.query(query, [id, username, title,date_modified, status])
    .then(result => {
        res.status(200).json({ success: true});
    });
});
// add list
app.post('/add-lists',(req, res) => {
    const { id, title_id, list_desc, status } = req.body;

    const query ="INSERT INTO lists (id, title_id, list_desc, status) VALUES ($1,$2,$3,$4)";
    db.query(query, [id, title_id, list_desc, status])
    .then(result => {
        res.status(200).json({ success: true});
    });
}); */


// add-to-do
app.post('/add-to-do', async (req, res) => {
    const { username, title, lists } = req.body;

    try {
        // Insert the title with the current date (date only)
        const { rows } = await db.query(
            "INSERT INTO titles (username, title, status, date_modified) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING id",
            [username, title, true]
        );
        const titleId = rows[0].id;

        // Insert the lists for the given title
        const listQuery = "INSERT INTO lists (title_id, list_desc, status) VALUES ($1, $2, $3)";
        await Promise.all(lists.map(list => db.query(listQuery, [titleId, list.list_desc, true])));

        res.status(200).json({ success: true, message: "Data added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});


// update to do
app.post('/update-to-do', async (req, res) => {
    const { title_id, lists } = req.body;
    if (!title_id || !Array.isArray(lists) || !lists.length) 
        return res.status(400).json({ success: false, message: "Invalid request data" });

    try {
        await db.query("UPDATE titles SET date_modified = CURRENT_DATE WHERE id = $1", [title_id]);
        await db.query("DELETE FROM lists WHERE title_id = $1", [title_id]);
        await Promise.all(lists.map(list => db.query("INSERT INTO lists (title_id, list_desc, status) VALUES ($1, $2, $3)", [title_id, list, true])));
        
        res.json({ success: true, message: "To-do updated successfully" });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});



// delete to do
app.post('/delete-to-do', async (req, res) => {
    const { title_id } = req.body;
    if (!title_id) return res.status(400).json({ success: false, message: "Invalid request data" });

    try {
        await db.query("DELETE FROM lists WHERE title_id = $1", [title_id]);
        const result = await db.query("DELETE FROM titles WHERE id = $1 RETURNING id", [title_id]);

        if (!result.rowCount) return res.status(404).json({ success: false, message: "Title not found" });

        res.json({ success: true, message: "To-do deleted successfully" });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});




//update status
app.post('/update-status', async (req, res) => {
    const { title_id, id, status } = req.body;
    if (!title_id || !id || typeof status !== 'boolean') 
        return res.status(400).json({ success: false, message: "Invalid request data" });

    try {
        const result = await db.query(
            "UPDATE lists SET status = $1 WHERE title_id = $2 AND id = $3 RETURNING id, status",
            [status, title_id, id]
        );

        if (!result.rowCount) return res.status(404).json({ success: false, message: "List item not found" });

        res.json({ success: true, message: "list Status successfully updated", data: result.rows[0] });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});











//upadate-titles
app.get('/update',(req, res) => {
    res.send('This is to-do update');
});

//delete-titles
app.get('/delete',(req, res) => {
    res.send('This is to-do delete');
});

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`)
})