// Helper function to generate UID from display name
export const generateUid = (displayName: string): string => {
  if (!displayName) return ''
  
  const normalized = displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim()
  
  return `api::${normalized}.${normalized}`
}

// Helper function to generate singular name from display name
export const generateSingularName = (displayName: string): string => {
  if (!displayName) return ''
  return displayName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '')
}

// Helper function to generate plural name from singular name
export const generatePluralName = (singularName: string): string => {
  if (!singularName) return ''
  
  // Simple pluralization rules
  if (singularName.endsWith('s') || singularName.endsWith('sh') || singularName.endsWith('ch') || singularName.endsWith('x') || singularName.endsWith('z')) {
    return singularName + 'es'
  } else if (singularName.endsWith('y') && singularName.length > 1 && !'aeiou'.includes(singularName[singularName.length - 2])) {
    return singularName.slice(0, -1) + 'ies'
  } else {
    return singularName + 's'
  }
}