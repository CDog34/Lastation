import axios from 'axios'

export async function handleInput (nickName: string, cnt: string) {
  const res = await axios.post('/danmaku', {
    roomId: 57796,
    cnt: {
      userName: nickName,
      content: cnt
    }
  })
  console.log(res)
}