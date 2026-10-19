import { AsyncLocalStorage } from 'node:async_hooks'
import type { SessionContext } from '../shared/domain.ts'
import { resolveSession } from './db/store.ts'

const als = new AsyncLocalStorage<SessionContext>()

export function runWithSession<T>(session: SessionContext, fn: () => T): T {
  return als.run(session, fn)
}

export function getSession(): SessionContext {
  return als.getStore() ?? resolveSession()
}
