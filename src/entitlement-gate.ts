try {
  const MODE = import.meta.env.MODE || 'production'
  const KEY = import.meta.env.VITE_ENTITLEMENT_KEY || ''

  function isDevelopment(): boolean {
    return MODE === 'development' || MODE === 'test'
  }

  function hasValidEntitlement(): boolean {
    if (isDevelopment()) return true
    if (KEY.length > 0) return true
    return false
  }

  function renderNotice(): void {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
    console.error(`
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                 ENTERPRISE LICENSE GATE                        |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                                                               |
  |  This software is protected by the Enterprise License         |
  |  and Intellectual Property Protection Framework v1.0.         |
  |                                                               |
  |  UNAUTHORIZED ACCESS DETECTED                                 |
  |                                                               |
  |  To obtain authorized access, please open an issue at:        |
  |  https://github.com/sanot-tech/RadioFlow/issues               |
  |                                                               |
  |  Timestamp: ${timestamp}             |
  |                                                               |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  `)
  }

  if (!hasValidEntitlement()) {
    renderNotice()
    throw new Error('ENTITLEMENT_GATE: Unauthorized build. Set NODE_ENV=development or VITE_ENTITLEMENT_KEY to proceed.')
  }
} catch (e) {
  throw e
}
