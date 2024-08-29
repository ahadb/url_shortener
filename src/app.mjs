import express from 'express'
import { join } from 'node:path'
import sqlite from 'node:sqlite'
import crypto from 'crypto'

const app = express()
const database = new sqlite.DatabaseSync('./urls.db');

app.use(express.urlencoded({extended: true}))
app.use(express.static(join(process.cwd(),'src','public')))

app.set('view engine', 'ejs')
app.set('views', 'src/public/views')

database.exec(`
  CREATE TABLE IF NOT EXISTS urls(
    key INTEGER PRIMARY KEY,
    long_url TEXT,
    short_url TEXT
  ) STRICT
`);

app.get('/', (request, response) => {
  const query = database.prepare('SELECT * FROM urls');
  console.log(query.all())

  const debug = process.env.APP_DEBUG.toString()

  response.status(200).render('shorten', { data: { sqlite: query.all(), debug: debug } })
})

app.post('/shorten_url', (request, response) => {
  const long_url = request.body.url_input

  const select_all_urls = database.prepare(`SELECT * FROM urls WHERE long_url = ?`);

  if(select_all_urls.all(long_url).length > 0) {
    console.log(`${long_url} already has a short version`)
  } else {
    const short_url = crypto.createHash('sha256').update(long_url + Date.now()).digest('base64url').substring(0, 8);

    if(long_url.length == 0) {
      return response.status(400).send(`No URL entered.`)
    }

    const check_if_short_url_exists = database.prepare('SELECT * FROM urls WHERE short_url = ?')
    const short_url_exists = check_if_short_url_exists.get(short_url)

    if(short_url_exists) {
      console.log(short_url_exists)
      console.log(`shortURL already in database`)
    } else {
      const insert_short_url = database.prepare('INSERT INTO urls (long_url, short_url) VALUES (?, ?)');
      insert_short_url.run(long_url, short_url);
      console.log(`added ${long_url} to db as ${short_url}`)
    }
  }
  response.status(200).redirect('/')
})

app.get('/expand/:shortened_url', (request, response) => {
  const shortened_url = request.params.shortened_url

  const check_if_short_url_exists = database.prepare('SELECT * FROM urls WHERE short_url = ?')
  const short_url_exists = check_if_short_url_exists.get(shortened_url)
  
  console.log(short_url_exists)

  if(short_url_exists) {
    response.status(200).render('expand', { data: { short_url: short_url_exists.short_url, long_url: short_url_exists.long_url } } )
  } else {
    response.status(200).send(`${shortened_url} not found`)
  }
})

app.get('/delete', (request, response) => {
  database.exec(`DELETE FROM urls`)
  response.status(200).redirect('/')
})

app.listen(process.env.PORT)