import pkg from 'pg';
const { Client } = pkg;

export const db = new Client({
    host: "localhost",
    database: "to-do-list",
    user: "postgres",
    password: "casigay123",
    port: 5432,
});

db.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));






