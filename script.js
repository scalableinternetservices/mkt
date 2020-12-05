import http from 'k6/http'
import { Counter, Rate } from 'k6/metrics'

export const options = {
  scenarios: {
    example_scenario: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '60s', target: 10 },
        { duration: '60s', target: 0 },
      ],
      gracefulRampDown: '0s',
    },
  },
}
// export const options = {
//   scenarios: {
//     example_scenario: {
//       executor: 'constant-vus',
//       vus: 1000,
//       duration: '30s',
//     },
//   },
// }

export default function () {
  // recordRates(http.get('http://localhost:3000/app/'))
  // sleep(Math.random() * 3)
  // recordRates(
  //   http.post(
  //     'http://localhost:3000/graphql',
  //     '{"operationName":"CreatePost","variables":{"input":{"title":"oqwjd","description":"qowdija","goal":1231,"merchant":"qwoidj","ownerId":4,"initialContribution":123}},"query":"mutation CreatePost($input: CreatePostInput!) {  createPost(input: $input) {    id    __typename  }}"}',
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     }
  //   )
  // )
  recordRates(
    http.post(
      'http://localhost:3000/graphql',
      '{"operationName":"Posts","variables":{},"query":"query Posts {  posts {    id    title    description    goal    owner {      name      __typename    }    commits {      amount      user {        name        __typename      }      __typename    }    __typename  }}"}',
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  )
}

const count200 = new Counter('status_code_2xx')
const count300 = new Counter('status_code_3xx')
const count400 = new Counter('status_code_4xx')
const count500 = new Counter('status_code_5xx')

const rate200 = new Rate('rate_status_code_2xx')
const rate300 = new Rate('rate_status_code_3xx')
const rate400 = new Rate('rate_status_code_4xx')
const rate500 = new Rate('rate_status_code_5xx')

function recordRates(res) {
  if (res.status >= 200 && res.status < 300) {
    count200.add(1)
    rate200.add(1)
  } else if (res.status >= 300 && res.status < 400) {
    console.log(res.body)
    count300.add(1)
    rate300.add(1)
  } else if (res.status >= 400 && res.status < 500) {
    count400.add(1)
    rate400.add(1)
  } else if (res.status >= 500 && res.status < 600) {
    count500.add(1)
    rate500.add(1)
  }
}
