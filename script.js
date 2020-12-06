import { sleep } from 'k6'
import http from 'k6/http'
import { Counter, Rate } from 'k6/metrics'

export const options = {
  scenarios: {
    ramp_vu: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '60s', target: 250 },
        { duration: '60s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    constant: {
      executor: 'constant-vus',
      vus: 100,
      duration: '60s',
    },
    shared: {
      executor: 'shared-iterations',
      startTime: '10s',
      gracefulStop: '5s',
      vus: 100,
      iterations: 500,
      maxDuration: '10s',
    },
  },
}
// export const options = {
//   scenarios: {
//
//   },
// }

export default function () {
  const probabilityToPost = 0.05
  const probabilityToCommit = 0.6
  const score = Math.random()

  // choose a random user to impersonate
  const userID = Math.round(Math.random() * 3) + 1

  // Count total number of posts (to be used later)
  const count = JSON.parse(
    http.post('http://localhost:3000/graphql', '{"operationName":null,"variables":{},"query":"{  numPosts}"}', {
      headers: {
        'Content-Type': 'application/json',
      },
    }).body
  ).data.numPosts

  // postID for committing/commenting
  const postID = Math.round(Math.random() * (count - 1) + 1)


  if (score < probabilityToPost) {
    // Generate some fake data
    const res = http.get('https://fakerapi.it/api/v1/products?_quantity=1&_taxes=12&_categories_type=uuid')
    const data = JSON.parse(res.body).data[0]

    // Call gql endpoint for creating post
    recordRates(
      http.post(
        'http://localhost:3000/graphql?createPost=1',
        `{"operationName":"CreatePost","variables":{"input":{"title":"${data.name}","description":"${
          data.description
        }","goal":${Math.round(
          Math.random() * 1000 + 100
        )},"merchant":"test merchant","ownerId":${userID}}},"query":"mutation CreatePost($input: CreatePostInput!) {  createPost(input: $input) {    id    __typename  }}"}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )
  } else if (score < probabilityToCommit) {
    // Generate some fake data
    const amt = Math.round(Math.random() * 90 + 10)

    // Call gql endpoint for committing to a post
    const query = JSON.stringify({
      operationName: null,
      variables: {},
      query: `mutation {commit(input: {amount: ${amt}, itemUrl: "google.com", postId: ${postID}, userId: ${userID}})}`,
    })
    recordRates(
    http.post('http://localhost:3000/graphql?commit=1', query, {
      headers: {
        'Content-Type': 'application/json',
      },
    }))
    // console.log(userId, 'committed', amt, 'to', post)
  } else {
    const query = JSON.stringify({
      operationName: null,
      variables: { input: {
        user: userID,
        post: postID,
        body: "CouGEqOJzh9JX0gXhnPzmcaBUekgLjvK7508utfFQVZp87n7ZEK2UClInhBxAVr40yo7KmpYMEaDuVosumXHbZpswNKzdBym1uhOXnbaIhsf8T1QkdgtRQvfdIZ3WXEkbO8wJu448eJ5Js3XwOjpjtbMkwotpsgSJ0fV69glJHZpmBwShS6Crv89sMKvHJTw1Jwzei6vLPPueqo4AqoHT8GOVEO4kpPpiv5XwKb2tv58USjXBHFA34xqiVnAdDNgNZxVVROwP1QEN0L9qEtKUWdTPHWoB4sMPukCjAPw5qIHlIGKrq7O7XKLT2ZORTwzyvqkvTATKYRv8fGdTIX6KLfTy0ZM3sh2wngII0dLvANTczf6AczUXPXl8DHohpDSrBLvLHUpl96J0f4GxFCxcD5Qazr6qiMU2snyDGPAbnQiw1fCNPxebBslCTz4tECV8cSN2Tms0DdB270AvpPgkTo6fRfifhj69yFEskypXMKQa56ccGQkrDJaYSRiBoy3RcNVB0OyVLpcC1utLIx2u1Xjw2XAzHpNfUkiXq6SMyvTzLKtzinsUoKYL46sNt538LVRyQDclNGFbDk5YFYOdGc5VzbpEJrynWCnNQ1SbO3Dn7re99iywCDKL5GyiDIzSEbs07F0CG7X5jE4OQUub5XR5M5vZx8CNKIHA06IeEpxiVLc5jD9taBkO9ilVF4qvR6AH8vPCqmZeeLx82Ay5g4lLY1U5ZKE0IjOeAl43fehAaIz108nOKvAsYwXZuMuWrQyh9eF19xjrAk3srVD7hARyJVyfcc6rLtMRVEUUZXsKRjAS2fiogRasJgBFpuFWVOZAKyn1SHCYPtObhWMiHuN9j9uImnU9oL3mjmPOyJu7ylo4FJAvF5JMS4K4Ymjxcq5aM3R90izmNTaSshvs2LZlrFMKUTGyjxTwAOmTOXHQ3Hf7qAErERuE3KZlzo3FMZttAvoYjiatNCBj6nwSah7W0DLaQieYAB9NbzB"
      }},
      query: "mutation { comment($input: CommentInput!) }"
    })
    recordRates(
    http.post(
      'http://localhost:3000/graphql?comment=1', query, {
        headers: {
          'Content-Type': 'application/json',
        },
    }))
  }

  // Simulate user browsing posts for a bit
  for (let i = 0; i < 10; i++) {
    const post = Math.round(Math.random() * count + 1)
    recordRates(http.get('http://localhost:3000/app/post/' + post))
    sleep(Math.random())
  }
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