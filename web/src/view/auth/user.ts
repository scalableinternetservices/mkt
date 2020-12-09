import * as React from 'react'
import { FetchUserContext_self } from '../../graphql/query.gen'

export class UserCtx {
  constructor(public user: FetchUserContext_self | null) {}
  isAdmin() {
    return this.user
  }
}

export const UserContext = React.createContext<UserCtx>(new UserCtx(null))
