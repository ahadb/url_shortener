import express from 'express'
// import sqlite from 'node:sqlite'
import crypto from 'crypto'
import sqlite3 from 'sqlite3'
import * as sqlite from 'sqlite'

const setupDatabase = async function(response) {
  try {
    const db = await sqlite.open({
      filename: './urls.db',
      driver: sqlite3.Database
    })

    const create = await db.all(`
      CREATE TABLE IF NOT EXISTS urls(
        key INTEGER PRIMARY KEY,
        long_url TEXT,
        short_url TEXT
      ) STRICT
    `)

    await db.close()
    response.status(200).send(`database created successfully`)
  } catch(error) {
    response.status(500).send(`failed to create database`)
  }
}

const selectAllFromDb = async function(response) {
  try {
    const db = await sqlite.open({
      filename: './urls.db',
      driver: sqlite3.Database
    })

    const rows = await db.all(`SELECT * FROM urls`)

    await db.close()

    response.json(rows)
  }
}

const app = express()
// const database = new sqlite.DatabaseSync('./urls.db');

app.use(express.urlencoded({extended: true}))
app.use(express.json)

app.set('view engine', 'ejs')
app.set('views', 'src/public/views')

// database.exec(`
//   CREATE TABLE IF NOT EXISTS urls(
//     key INTEGER PRIMARY KEY,
//     long_url TEXT,
//     short_url TEXT
//   ) STRICT
// `);

setupDatabase()

app.get('/', (request, response) => {
  const query = database.prepare('SELECT * FROM urls');
  console.log(query.all())
  console.log(query.all().length)

  const debug = process.env.DEBUG.toString()

  response.status(200).render('shorten', { data: { sqlite: query.all(), debug: debug } })
})

app.post('/shorten_url', (request, response) => {
  const long_url = request.body.url_input

  const query = database.prepare(`SELECT * FROM urls WHERE long_url = ?`);

  if(query.all(long_url).length > 0) {
    console.log(`${long_url} already has a short version`)
  } else {
    const short_url = crypto.createHash('sha256').update(long_url + Date.now()).digest('base64url').substring(0, 8);

    const q2 = database.prepare('SELECT * FROM urls WHERE short_url = ?')
    const redirect = q2.get(short_url)
    if(redirect) {
      console.log(r)
      console.log(`shortURL already in database`)
    } else {
      const insert = database.prepare('INSERT INTO urls (long_url, short_url) VALUES (?, ?)');
      insert.run(long_url, short_url);
    
      console.log(`added ${long_url} to db as ${short_url}`)
  
      const query = database.prepare('SELECT * FROM urls WHERE short_url = ?')  
    }
  }
  response.status(200).redirect('/')
})

app.get('/expand/:shortened_url', (request, response) => {
  const shortened_url = request.params.shortened_url

  const query = database.prepare('SELECT * FROM urls WHERE short_url = ?')
  const r = query.get(shortened_url)
  console.log(r)

  if(r) {
    response.status(200).render('expand', { data: { short_url: r.short_url, long_url: r.long_url } } )
  } else {
    response.status(200).send(`${shortened_url} not found`)
  }
})

app.get('/delete', (request, response) => {
  database.exec(`DELETE FROM urls`)
  response.status(200).redirect('/')
})

app.listen(3000)