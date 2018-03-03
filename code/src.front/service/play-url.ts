import axios from 'axios'

export async function getPlayerUrl () {
  const res = await axios.get('/play-url')
  return res.data.data

}