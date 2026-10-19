export type ResourceNodeKind =
  | 'Module'
  | 'McpServer'
  | 'DataSource'
  | 'StorageFile'
  | 'GitRepo'
  | 'Deployment'
  | 'Agent'
  | 'Workspace'

export type ResourceHealth = 'healthy' | 'degraded' | 'down' | 'unknown'

export type ResourceEdgeKind = 'uses' | 'reads' | 'deploys' | 'syncsFrom' | 'hostedOn' | 'memberOf'

export type ResourceNode = {
  id: string
  kind: ResourceNodeKind
  label: string
  health: ResourceHealth
  meta?: Record<string, string>
}

export type ResourceEdge = {
  id: string
  from: string
  to: string
  kind: ResourceEdgeKind
}

export type ResourceGraph = {
  nodes: ResourceNode[]
  edges: ResourceEdge[]
  updatedAt: string
}
